import OpenAI from 'openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateAIResponse(
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const { temperature = 0.7, maxTokens = 1000 } = options;

  // 1. Try OpenAI-compatible provider if configured
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && !openaiKey.includes('your-openai-api-key')) {
    try {
      const openai = new OpenAI({
        apiKey: openaiKey,
        baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      });
      const res = await openai.chat.completions.create({
        model: 'drytis/kimi-k2.5',
        messages,
        temperature,
        max_tokens: maxTokens,
      });
      const text = res.choices?.[0]?.message?.content;
      if (text) return text;
    } catch (err) {
      console.warn('[AI Client] Primary OpenAI provider failed, falling back to Gemini:', err);
    }
  }

  // 2. Fallback to Google Gemini API
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    let systemInstruction = '';
    const contents: { role: string; parts: { text: string }[] }[] = [];

    for (const m of messages) {
      if (m.role === 'system') {
        systemInstruction += (systemInstruction ? '\n\n' : '') + (m.content || '');
      } else {
        contents.push({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(m.content || '') }],
        });
      }
    }

    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: systemInstruction || 'Hello' }] });
      systemInstruction = '';
    }

    const payload: Record<string, unknown> = {
      contents,
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    };
    if (systemInstruction) {
      payload.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    for (const model of ['gemini-3.5-flash-lite', 'gemini-3.8-flash']) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`;
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await r.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (r.ok && text) return text;
      } catch (e) {
        console.warn(`[AI Client] Gemini ${model} error:`, e);
      }
    }
  }

  throw new Error('AI service is currently unavailable. Please check API keys.');
}
