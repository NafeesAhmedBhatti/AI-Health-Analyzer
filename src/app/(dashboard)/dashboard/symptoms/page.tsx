'use client';

import { useState, useEffect } from 'react';
import { Heart, AlertTriangle, AlertCircle, CheckCircle, Sparkles, Plus, X, Clock, ChevronDown, ChevronUp, Activity, Lightbulb, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface SymptomCheck {
  id: string;
  symptomsInput: { description: string; severity: number; duration?: string; bodyRegion?: string };
  aiResponse: {
    conditionName?: string;
    description?: string;
    possibleCauses?: { name: string; probability: number }[];
    recommendations?: string[];
    redFlags?: string[];
    urgency?: string;
    when?: string;
    relatedCondition?: string;
    relatedLabValue?: string;
    followUpQuestions?: string[];
  };
  urgency: string;
  createdAt: string;
}

export default function SymptomsPage() {
  const toast = useToast();
  const [symptoms, setSymptoms] = useState<SymptomCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ description: '', severity: 5, duration: '', bodyRegion: '' });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadSymptoms = () => {
    fetch('/api/symptoms').then(r => r.json()).then(data => {
      setSymptoms(Array.isArray(data) ? data : []);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadSymptoms(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) { toast.error('Please describe your symptom'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('AI symptom analysis complete');
        if (data.aiResponse?.urgency === 'high' || data.aiResponse?.urgency === 'emergency') {
          toast.error(`⚠️ Urgency: ${data.aiResponse.urgency.toUpperCase()} — ${data.aiResponse.when || 'Seek medical attention'}`);
        }
        setShowForm(false);
        setForm({ description: '', severity: 5, duration: '', bodyRegion: '' });
        loadSymptoms();
      } else {
        toast.error('Analysis failed');
      }
    } catch { toast.error('Network error'); }
    setSubmitting(false);
  };

  const urgencyColor = (u: string) =>
    u === 'emergency' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
    u === 'high' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' :
    u === 'medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
    'text-green-400 bg-green-500/10 border-green-500/20';

  const severityBarColor = (s: number) =>
    s >= 8 ? 'bg-red-500' : s >= 5 ? 'bg-amber-500' : 'bg-green-500';

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-2 border-white/20 border-t-neon-blue rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Symptom Checker</h1>
            <p className="text-gray-400 text-sm">AI-powered symptom analysis with clinical insights</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-neon-blue/10 text-neon-blue border border-neon-blue/20 rounded-xl text-sm hover:bg-neon-blue/20 transition-colors">
          <Plus className="w-4 h-4" /> Check Symptom
        </button>
      </div>

      {/* Symptoms List */}
      {symptoms.length === 0 ? (
        <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-12 text-center">
          <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-400">No Symptoms Analyzed</h2>
          <p className="text-sm text-gray-600 mt-2">Click "Check Symptom" to get an AI-powered analysis of any health concern.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {symptoms.map((sym) => {
            const input = sym.symptomsInput || {};
            const response = sym.aiResponse || {};
            const isExpanded = expandedId === sym.id;
            const urgency = response.urgency || sym.urgency || 'low';

            return (
              <div key={sym.id}
                className={`bg-dark-surface/60 border rounded-2xl overflow-hidden transition-colors ${
                  urgency === 'emergency' || urgency === 'high' ? 'border-red-500/20' :
                  urgency === 'medium' ? 'border-amber-500/20' : 'border-white/[0.06]'
                }`}>
                {/* Summary Row */}
                <div className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => setExpandedId(isExpanded ? null : sym.id)}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      urgency === 'emergency' || urgency === 'high' ? 'bg-red-500/10' :
                      urgency === 'medium' ? 'bg-amber-500/10' : 'bg-green-500/10'
                    }`}>
                      <AlertTriangle className={`w-4 h-4 ${
                        urgency === 'emergency' || urgency === 'high' ? 'text-red-400' :
                        urgency === 'medium' ? 'text-amber-400' : 'text-green-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{input.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {response.conditionName && <span className="text-[10px] text-neon-blue">{response.conditionName}</span>}
                        <span className="text-[10px] text-gray-600">Severity: {input.severity}/10</span>
                        {input.duration && <span className="text-[10px] text-gray-600">· {input.duration}</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${urgencyColor(urgency)}`}>
                      {urgency.toUpperCase()}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/[0.04] pt-4 space-y-4">
                    {/* AI Description */}
                    {response.description && (
                      <div className="bg-neon-blue/[0.04] border border-neon-blue/10 rounded-xl p-3">
                        <p className="text-[10px] font-semibold text-neon-blue mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Analysis</p>
                        <p className="text-xs text-gray-300 leading-relaxed">{response.description}</p>
                      </div>
                    )}

                    {/* Possible Causes */}
                    {response.possibleCauses && response.possibleCauses.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 mb-2">Possible Causes</p>
                        <div className="space-y-1">
                          {response.possibleCauses.map((c, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                              <span className="text-xs text-white flex-1">{c.name}</span>
                              <div className="w-20 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                                <div className="h-full bg-neon-blue rounded-full" style={{ width: `${c.probability * 100}%` }} />
                              </div>
                              <span className="text-[10px] text-neon-cyan w-8">{Math.round(c.probability * 100)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {response.relatedCondition && (
                        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                          <p className="text-[10px] text-gray-500 mb-0.5">Related Condition</p>
                          <p className="text-xs text-amber-400">{response.relatedCondition}</p>
                        </div>
                      )}
                      {response.relatedLabValue && (
                        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                          <p className="text-[10px] text-gray-500 mb-0.5">Related Lab Test</p>
                          <p className="text-xs text-neon-blue">{response.relatedLabValue}</p>
                        </div>
                      )}
                      {response.when && (
                        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                          <p className="text-[10px] text-gray-500 mb-0.5 flex items-center gap-1"><Clock className="w-3 h-3" /> When to Seek Help</p>
                          <p className="text-xs text-gray-300">{response.when}</p>
                        </div>
                      )}
                    </div>

                    {/* Red Flags */}
                    {response.redFlags && response.redFlags.length > 0 && (
                      <div className="bg-red-500/[0.04] border border-red-500/20 rounded-xl p-3">
                        <p className="text-[10px] font-semibold text-red-400 mb-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Red Flags</p>
                        {response.redFlags.map((rf: string, i: number) => (
                          <p key={i} className="text-xs text-gray-300 flex items-start gap-1.5 mb-1">
                            <span className="text-red-400 mt-0.5">•</span>{rf}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Recommendations */}
                    {response.recommendations && response.recommendations.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 mb-1.5 flex items-center gap-1"><Lightbulb className="w-3 h-3 text-yellow-400" /> Recommendations</p>
                        <div className="space-y-1">
                          {response.recommendations.map((r: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                              <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                              <span>{r}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Follow-up Questions */}
                    {response.followUpQuestions && response.followUpQuestions.length > 0 && (
                      <div className="bg-purple-500/[0.04] border border-purple-500/20 rounded-xl p-3">
                        <p className="text-[10px] font-semibold text-purple-400 mb-1.5 flex items-center gap-1"><Shield className="w-3 h-3" /> Questions for Your Doctor</p>
                        {response.followUpQuestions.map((q: string, i: number) => (
                          <p key={i} className="text-xs text-gray-300 mb-1">{i + 1}. {q}</p>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-600">{new Date(sym.createdAt).toLocaleString()}</span>
                      <span className="text-[10px] text-gray-600">Severity: {input.severity}/10</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Symptom Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-surface border border-white/[0.06] rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-neon-blue" /> AI Symptom Checker</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Describe your symptom *</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  placeholder="e.g., I've been having frequent headaches in the morning, accompanied by blurred vision..."
                  className="w-full px-4 py-3 bg-dark-bg border border-white/[0.06] rounded-xl text-white placeholder:text-gray-600 focus:border-neon-blue/40 focus:outline-none resize-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Severity: {form.severity}/10</label>
                  <input type="range" min="1" max="10" value={form.severity} onChange={e => setForm({ ...form, severity: parseInt(e.target.value) })}
                    className="w-full accent-neon-blue" />
                  <div className="flex justify-between text-[9px] text-gray-600 mt-1">
                    <span>Mild</span><span>Moderate</span><span>Severe</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Duration</label>
                  <select value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
                    className="w-full bg-dark-bg border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white focus:border-neon-blue/40 focus:outline-none appearance-none">
                    <option value="" className="bg-dark-surface">Select...</option>
                    <option value="Just started" className="bg-dark-surface">Just started</option>
                    <option value="Few hours" className="bg-dark-surface">Few hours</option>
                    <option value="1-2 days" className="bg-dark-surface">1-2 days</option>
                    <option value="3-7 days" className="bg-dark-surface">3-7 days</option>
                    <option value="1-2 weeks" className="bg-dark-surface">1-2 weeks</option>
                    <option value="More than a month" className="bg-dark-surface">More than a month</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Body Region (optional)</label>
                <input type="text" value={form.bodyRegion} onChange={e => setForm({ ...form, bodyRegion: e.target.value })} placeholder="e.g., head, chest, lower back"
                  className="w-full px-4 py-2.5 bg-dark-bg border border-white/[0.06] rounded-xl text-white placeholder:text-gray-600 focus:border-neon-blue/40 focus:outline-none text-sm" />
              </div>
              <button type="submit" disabled={submitting || !form.description.trim()}
                className="w-full py-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold rounded-xl hover:shadow-[0_0_25px_rgba(0,212,255,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {submitting ? 'Analyzing with AI...' : 'Analyze Symptom'}
              </button>
            </form>
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-600 italic">⚠️ AI-powered analysis. Not medical advice. Always consult your healthcare provider.</p>
    </div>
  );
}