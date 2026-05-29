import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/get-user';
import prisma from '@/lib/prisma';
import { writeFile, mkdir, readFile, unlink } from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL });

export async function GET() {
  try {
    const userId = await getUserId();
    const analyses = await prisma.skinAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return NextResponse.json(analyses);
  } catch (error) {
    console.error('GET /api/skin error:', error);
    return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();

    const formData = await req.formData();
    const description = formData.get('description') as string || '';
    const bodyRegion = formData.get('bodyRegion') as string || '';
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: 'Please upload an image for analysis' }, { status: 400 });
    }

    // Validate image
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Please upload a valid image file (JPG, PNG)' }, { status: 400 });
    }
    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 10MB' }, { status: 400 });
    }

    // Save image
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'skin');
    await mkdir(uploadDir, { recursive: true });
    const filename = `${userId}-${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);
    const imagePath = `/uploads/skin/${filename}`;

    // Convert image to base64 for AI vision
    const base64Image = buffer.toString('base64');
    const mimeType = imageFile.type;
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    // Call AI vision model for analysis
    let aiResult: any = {};
    try {
      const aiResponse = await openai.chat.completions.create({
        model: 'drytis/kimi-k2.5',
        temperature: 0.2,
        max_tokens: 1500,
        messages: [
          {
            role: 'system',
            content: `You are a board-certified dermatologist AI assistant. Analyze the skin image carefully and provide a thorough dermatological assessment. You MUST return ONLY valid JSON with this exact structure:
{
  "conditionName": "Primary condition name",
  "confidence": 0.0-1.0,
  "severity": "mild|moderate|severe",
  "description": "2-3 sentence clinical description of what you observe",
  "possibleConditions": [
    {"name": "Condition 1", "probability": 0.0-1.0, "description": "Brief explanation"},
    {"name": "Condition 2", "probability": 0.0-1.0, "description": "Brief explanation"},
    {"name": "Condition 3", "probability": 0.0-1.0, "description": "Brief explanation"}
  ],
  "recommendations": ["rec1", "rec2", "rec3"],
  "urgency": "low|medium|high",
  "whenToSeeDoctor": "When should they see a dermatologist",
  "homeRemedies": ["remedy1", "remedy2"],
  "skinType": "oily|dry|combination|normal|sensitive",
  "affectedArea": "Description of the area affected"
}
Be thorough but conservative. If uncertain, state so clearly. Never diagnose with 100% certainty.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: dataUrl, detail: 'high' },
              },
              {
                type: 'text',
                text: `Analyze this skin image.${description ? ` Patient description: "${description}".` : ''}${bodyRegion ? ` Body region: ${bodyRegion}.` : ''} Provide a detailed dermatological assessment.`,
              },
            ] as any,
          },
        ],
      });

      const text = aiResponse.choices?.[0]?.message?.content || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
      }
    } catch (aiError: any) {
      console.error('AI skin analysis error:', aiError.message);
      // If AI vision fails (e.g., model doesn't support images), use text-based analysis
      try {
        const fallbackResponse = await openai.chat.completions.create({
          model: 'drytis/kimi-k2.5',
          temperature: 0.2,
          max_tokens: 1000,
          messages: [
            {
              role: 'system',
              content: 'You are a dermatologist AI. A patient has described a skin concern. Provide analysis in JSON format with: conditionName, confidence (0-1), severity (mild/moderate/severe), description, possibleConditions array, recommendations array, urgency (low/medium/high), whenToSeeDoctor, homeRemedies array. Return ONLY valid JSON.'
            },
            {
              role: 'user',
              content: `Patient skin concern: "${description || 'Skin image uploaded'}". Body region: ${bodyRegion || 'not specified'}. Provide assessment.`
            }
          ]
        });
        const text = fallbackResponse.choices?.[0]?.message?.content || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiResult = JSON.parse(jsonMatch[0]);
          aiResult.confidence = Math.min((aiResult.confidence || 0.5) * 0.7, 0.7); // Lower confidence for text-only
        }
      } catch (e2) {
        console.error('Fallback AI error:', e2);
      }
    }

    // Ensure minimum viable result
    if (!aiResult.conditionName) {
      aiResult = {
        conditionName: 'Assessment Inconclusive',
        confidence: 0.3,
        severity: 'mild',
        description: 'The image quality or content does not allow for a definitive AI assessment. A dermatologist consultation is recommended for accurate diagnosis.',
        possibleConditions: [],
        recommendations: ['Consult a dermatologist for in-person evaluation', 'Monitor the area for any changes', 'Keep the affected area clean and moisturized'],
        urgency: 'low',
        whenToSeeDoctor: 'If the condition persists, worsens, or causes discomfort, see a dermatologist.',
        homeRemedies: ['Keep area clean', 'Avoid irritants'],
        skinType: 'unknown',
        affectedArea: bodyRegion || 'not specified',
      };
    }

    // Save to database
    const result = await prisma.skinAnalysis.create({
      data: {
        userId,
        imagePath,
        bodyRegion: bodyRegion || null,
        description: description || null,
        aiAssessment: aiResult,
        conditionName: aiResult.conditionName,
        confidence: aiResult.confidence || 0.5,
        severity: aiResult.severity || 'mild',
        recommendations: aiResult.recommendations?.join('\n') || null,
      },
    });

    return NextResponse.json({
      id: result.id,
      conditionName: aiResult.conditionName,
      confidence: Math.round((aiResult.confidence || 0.5) * 100),
      severity: aiResult.severity,
      description: aiResult.description,
      possibleConditions: aiResult.possibleConditions || [],
      recommendations: aiResult.recommendations || [],
      urgency: aiResult.urgency,
      whenToSeeDoctor: aiResult.whenToSeeDoctor,
      homeRemedies: aiResult.homeRemedies || [],
      skinType: aiResult.skinType,
      imagePath,
      createdAt: result.createdAt,
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/skin error:', error);
    return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const analysis = await prisma.skinAnalysis.findFirst({ where: { id, userId } });
    if (analysis?.imagePath) {
      try {
        const fullPath = path.join(process.cwd(), 'public', analysis.imagePath);
        await unlink(fullPath);
      } catch {}
    }

    await prisma.skinAnalysis.delete({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/skin error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}