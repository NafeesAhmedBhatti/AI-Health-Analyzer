'use client';

import { useState, useRef } from 'react';
import { ScanLine, Upload, Sparkles, X, ImageIcon, Clock, Trash2, ChevronRight, AlertTriangle, Shield, CheckCircle, Heart, Lightbulb, Activity } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';

interface AnalysisResult {
  id: string;
  conditionName: string;
  confidence: number;
  severity: string;
  description: string;
  possibleConditions: { name: string; probability: number; description: string }[];
  recommendations: string[];
  urgency: string;
  whenToSeeDoctor: string;
  homeRemedies: string[];
  skinType?: string;
  imagePath: string;
  createdAt: string;
}

export default function SkinPage() {
  const toast = useToast();
  const confirmAction = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState('');
  const [bodyRegion, setBodyRegion] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return; }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/skin');
      if (res.ok) setHistory(await res.json());
    } catch {}
    setLoadingHistory(false);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) { toast.error('Upload an image for analysis'); return; }
    setAnalyzing(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      if (description.trim()) formData.append('description', description);
      if (bodyRegion) formData.append('bodyRegion', bodyRegion);

      const res = await fetch('/api/skin', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        toast.success('AI skin analysis complete');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Analysis failed');
      }
    } catch {
      toast.error('Network error');
    }
    setAnalyzing(false);
  };

  const selectHistory = (item: any) => {
    const assessment = item.aiAssessment || {};
    setResult({
      id: item.id,
      conditionName: item.conditionName || assessment.conditionName || 'Unknown',
      confidence: Math.round((item.confidence || assessment.confidence || 0.5) * 100),
      severity: item.severity || assessment.severity || 'mild',
      description: assessment.description || '',
      possibleConditions: assessment.possibleConditions || [],
      recommendations: item.recommendations ? item.recommendations.split('\n') : (assessment.recommendations || []),
      urgency: assessment.urgency || 'low',
      whenToSeeDoctor: assessment.whenToSeeDoctor || '',
      homeRemedies: assessment.homeRemedies || [],
      skinType: assessment.skinType || '',
      imagePath: item.imagePath,
      createdAt: item.createdAt,
    });
    setShowHistory(false);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmAction.confirm({ title: 'Delete Analysis', message: 'Delete this skin analysis? This cannot be undone.', confirmText: 'Delete', variant: 'danger' });
    if (!ok) return;
    try {
      await fetch(`/api/skin?id=${id}`, { method: 'DELETE' });
      if (result?.id === id) setResult(null);
      loadHistory();
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const severityColor = (s: string) =>
    s === 'severe' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
    s === 'moderate' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
    'text-green-400 bg-green-500/10 border-green-500/20';

  const urgencyIcon = (u: string) =>
    u === 'high' ? <AlertTriangle className="w-4 h-4 text-red-400" /> :
    u === 'medium' ? <Shield className="w-4 h-4 text-amber-400" /> :
    <CheckCircle className="w-4 h-4 text-green-400" />;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            <ScanLine className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Skin Analysis</h1>
            <p className="text-gray-400 text-sm">AI-powered dermatological assessment</p>
          </div>
        </div>
        <button onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadHistory(); }}
          className="flex items-center gap-2 px-4 py-2 bg-dark-surface/60 border border-white/[0.06] rounded-xl text-sm text-gray-400 hover:text-white transition-colors">
          <Clock className="w-4 h-4" /> History
        </button>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Previous Analyses</h3>
          {loadingHistory ? (
            <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" /></div>
          ) : history.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No previous analyses</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {history.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/10 transition-colors">
                  {item.imagePath && (
                    <img src={item.imagePath} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{item.conditionName || item.aiAssessment?.conditionName || 'Analysis'}</p>
                    <p className="text-[10px] text-gray-500">{new Date(item.createdAt).toLocaleString()} · Confidence: {Math.round((item.confidence || 0) * 100)}%</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${severityColor(item.severity || 'mild')}`}>
                      {(item.severity || 'mild').charAt(0).toUpperCase() + (item.severity || 'mild').slice(1)}
                    </span>
                    <button onClick={() => selectHistory(item)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Upload className="w-4 h-4 text-yellow-400" /> Upload & Describe</h3>
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              {previewUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-white/[0.08]">
                  <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                  <button type="button" onClick={clearImage}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500/80 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-white/[0.08] rounded-xl flex flex-col items-center justify-center gap-2 hover:border-yellow-400/30 hover:bg-yellow-400/[0.02] transition-all">
                  <ImageIcon className="w-8 h-8 text-gray-600" />
                  <span className="text-gray-500 text-xs">Click to upload an image</span>
                  <span className="text-gray-600 text-[10px]">JPG, PNG — max 10MB</span>
                </button>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Body Region</label>
              <select value={bodyRegion} onChange={e => setBodyRegion(e.target.value)}
                className="w-full px-3 py-2.5 bg-dark-bg border border-white/[0.06] rounded-xl text-white text-sm focus:border-yellow-400/40 focus:outline-none appearance-none">
                <option value="" className="bg-dark-surface">Select area...</option>
                <option value="face" className="bg-dark-surface">Face</option>
                <option value="neck" className="bg-dark-surface">Neck</option>
                <option value="arms" className="bg-dark-surface">Arms</option>
                <option value="hands" className="bg-dark-surface">Hands</option>
                <option value="chest" className="bg-dark-surface">Chest</option>
                <option value="back" className="bg-dark-surface">Back</option>
                <option value="abdomen" className="bg-dark-surface">Abdomen</option>
                <option value="legs" className="bg-dark-surface">Legs</option>
                <option value="feet" className="bg-dark-surface">Feet</option>
                <option value="scalp" className="bg-dark-surface">Scalp</option>
                <option value="other" className="bg-dark-surface">Other</option>
              </select>
            </div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="Describe the affected area, symptoms, duration, and any relevant history..."
              className="w-full px-4 py-3 bg-dark-bg border border-white/[0.06] rounded-xl text-white placeholder:text-gray-600 focus:border-yellow-400/40 focus:outline-none resize-none text-sm" />
            <button type="submit" disabled={analyzing || !selectedFile}
              className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-semibold rounded-xl hover:shadow-[0_0_25px_rgba(234,179,8,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {analyzing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {analyzing ? 'Analyzing with AI...' : 'Run AI Analysis'}
            </button>
          </form>
        </div>

        {/* Result */}
        <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6 flex flex-col">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-neon-blue" /> AI Assessment</h3>
          {result ? (
            <div className="flex-1 space-y-4 overflow-y-auto">
              {/* Primary Condition */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold text-sm">Primary Assessment</span>
                  {result.urgency && urgencyIcon(result.urgency)}
                </div>
                <p className="text-white text-lg font-bold">{result.conditionName}</p>
                {result.description && <p className="text-gray-300 text-sm mt-1">{result.description}</p>}
              </div>

              {/* Confidence + Severity */}
              <div className="flex gap-3">
                <div className="flex-1 bg-dark-bg/50 rounded-xl p-3 border border-white/[0.04]">
                  <p className="text-[10px] text-gray-500 mb-1">Confidence</p>
                  <p className="text-2xl font-bold text-white">{result.confidence}%</p>
                  <div className="h-1.5 bg-white/[0.04] rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-yellow-500 to-neon-cyan rounded-full" style={{ width: `${result.confidence}%` }} />
                  </div>
                </div>
                <div className="flex-1 bg-dark-bg/50 rounded-xl p-3 border border-white/[0.04]">
                  <p className="text-[10px] text-gray-500 mb-1">Severity</p>
                  <span className={`text-sm font-semibold px-2 py-1 rounded-lg border inline-block mt-1 ${severityColor(result.severity)}`}>
                    {result.severity.charAt(0).toUpperCase() + result.severity.slice(1)}
                  </span>
                  {result.skinType && (
                    <>
                      <p className="text-[10px] text-gray-500 mt-2">Skin Type</p>
                      <p className="text-xs text-gray-300 capitalize">{result.skinType}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Possible Conditions */}
              {result.possibleConditions?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-2">Possible Conditions</p>
                  <div className="space-y-1.5">
                    {result.possibleConditions.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                        <span className="text-xs text-white font-medium flex-1">{c.name}</span>
                        <span className="text-[10px] text-neon-cyan">{Math.round(c.probability * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1"><Lightbulb className="w-3 h-3 text-yellow-400" /> Recommendations</p>
                  <div className="space-y-1.5">
                    {result.recommendations.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                        <span className="w-1 h-1 rounded-full bg-yellow-400 mt-1.5 shrink-0" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Home Remedies */}
              {result.homeRemedies?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1"><Heart className="w-3 h-3 text-green-400" /> Home Care</p>
                  <div className="space-y-1.5">
                    {result.homeRemedies.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                        <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* When to See Doctor */}
              {result.whenToSeeDoctor && (
                <div className="bg-blue-500/[0.06] border border-blue-500/20 rounded-xl p-3">
                  <p className="text-xs font-semibold text-blue-400 mb-1 flex items-center gap-1"><Shield className="w-3 h-3" /> When to See a Doctor</p>
                  <p className="text-xs text-gray-300">{result.whenToSeeDoctor}</p>
                </div>
              )}

              <p className="text-[10px] text-gray-600 leading-relaxed">
                ⚠️ This AI assessment is for informational purposes only and does not replace professional medical advice.
                Please consult a dermatologist for accurate diagnosis.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ScanLine className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Upload an image to get an<br />AI-powered skin assessment</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}