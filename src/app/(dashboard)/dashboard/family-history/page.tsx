'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, AlertCircle, Trash2, Sparkles, Shield, CheckCircle, Activity } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';

interface RiskFactor {
  condition: string;
  risk: string;
  explanation: string;
  screeningRecommendation: string;
}

interface RiskAnalysis {
  riskFactors: RiskFactor[];
  overallRisk: string;
  summary: string;
  preventiveMeasures: string[];
}

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  conditions: string;
  side?: string;
  createdAt: string;
}

export default function FamilyHistoryPage() {
  const toast = useToast();
  const confirmAction = useConfirm();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [form, setForm] = useState({ name: '', relation: '', conditions: '', side: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/family-history');
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        setRiskAnalysis(data.riskAnalysis || null);
      }
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.relation) { toast.error('Name and relation required'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/family-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Family member added');
        setForm({ name: '', relation: '', conditions: '', side: '' });
        fetchMembers();
      } else { toast.error('Failed to add'); }
    } catch { toast.error('Network error'); }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmAction.confirm({ title: 'Remove Family Member', message: 'Remove this family member from your history?', confirmText: 'Remove', variant: 'danger' });
    if (!ok) return;
    try {
      const res = await fetch(`/api/family-history?id=${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Removed'); fetchMembers(); }
      else toast.error('Failed to delete');
    } catch { toast.error('Network error'); }
  };

  const riskColor = (risk: string) =>
    risk === 'high' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
    risk === 'moderate' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
    'text-green-400 bg-green-500/10 border-green-500/20';

  const overallRiskColor = riskAnalysis?.overallRisk === 'high' ? 'from-red-500 to-orange-500' :
    riskAnalysis?.overallRisk === 'moderate' ? 'from-amber-500 to-yellow-500' :
    'from-green-500 to-emerald-500';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.2)]">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Family History</h1>
          <p className="text-gray-400 text-sm">Track hereditary conditions and AI risk analysis</p>
        </div>
      </div>

      {/* AI Risk Analysis */}
      {riskAnalysis && (
        <div className={`bg-gradient-to-r ${overallRiskColor} bg-opacity-10 border border-white/[0.06] rounded-2xl p-6`}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-white" />
            <h3 className="text-sm font-semibold text-white">AI Hereditary Risk Analysis</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${riskColor(riskAnalysis.overallRisk)}`}>
              {riskAnalysis.overallRisk.toUpperCase()} RISK
            </span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed mb-4">{riskAnalysis.summary}</p>

          {riskAnalysis.riskFactors?.length > 0 && (
            <div className="space-y-2 mb-4">
              {riskAnalysis.riskFactors.map((rf, i) => (
                <div key={i} className="bg-black/20 rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-3.5 h-3.5 text-white/70" />
                    <span className="text-sm font-medium text-white">{rf.condition}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ml-auto ${riskColor(rf.risk)}`}>
                      {rf.risk.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-white/60">{rf.explanation}</p>
                  {rf.screeningRecommendation && (
                    <p className="text-[10px] text-white/50 mt-1 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Screening: {rf.screeningRecommendation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {riskAnalysis.preventiveMeasures?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-white/70 mb-1.5 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Preventive Measures
              </p>
              <div className="flex flex-wrap gap-2">
                {riskAnalysis.preventiveMeasures.map((m, i) => (
                  <span key={i} className="text-[10px] px-2 py-1 bg-black/20 rounded-lg text-white/70 border border-white/10">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Form */}
      <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-teal-400" /> Add Family Member</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., John Smith"
              className="w-full px-3 py-2.5 bg-dark-bg border border-white/[0.06] rounded-xl text-white text-sm placeholder:text-gray-600 focus:border-teal-400/40 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Relation *</label>
            <select value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })}
              className="w-full px-3 py-2.5 bg-dark-bg border border-white/[0.06] rounded-xl text-white text-sm focus:border-teal-400/40 focus:outline-none appearance-none">
              <option value="" className="bg-dark-surface">Select...</option>
              <option value="father" className="bg-dark-surface">Father</option>
              <option value="mother" className="bg-dark-surface">Mother</option>
              <option value="brother" className="bg-dark-surface">Brother</option>
              <option value="sister" className="bg-dark-surface">Sister</option>
              <option value="grandfather" className="bg-dark-surface">Grandfather</option>
              <option value="grandmother" className="bg-dark-surface">Grandmother</option>
              <option value="uncle" className="bg-dark-surface">Uncle</option>
              <option value="aunt" className="bg-dark-surface">Aunt</option>
              <option value="other" className="bg-dark-surface">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Known Conditions</label>
            <input type="text" value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} placeholder="e.g., Diabetes, Hypertension (comma separated)"
              className="w-full px-3 py-2.5 bg-dark-bg border border-white/[0.06] rounded-xl text-white text-sm placeholder:text-gray-600 focus:border-teal-400/40 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Side</label>
            <select value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value })}
              className="w-full px-3 py-2.5 bg-dark-bg border border-white/[0.06] rounded-xl text-white text-sm focus:border-teal-400/40 focus:outline-none appearance-none">
              <option value="" className="bg-dark-surface">Select...</option>
              <option value="maternal" className="bg-dark-surface">Maternal</option>
              <option value="paternal" className="bg-dark-surface">Paternal</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium text-sm rounded-xl hover:shadow-[0_0_25px_rgba(20,184,166,0.3)] transition-all disabled:opacity-50 flex items-center gap-2">
              {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Member
            </button>
          </div>
        </form>
      </div>

      {/* Members List */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Family Members</h2>
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" /></div>
        ) : members.length === 0 ? (
          <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-8 text-center">
            <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No family members added yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {members.map((m) => (
              <div key={m.id} className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-4 group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{m.name}</p>
                    <p className="text-gray-500 text-xs capitalize">{m.relation}{m.side ? ` · ${m.side}` : ''}</p>
                    {m.conditions && m.conditions !== '[]' && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(typeof m.conditions === 'string' ? m.conditions.replace(/[\[\]"]/g, '').split(',') : []).map((c: string, i: number) => c.trim() && (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded-md">{c.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleDelete(m.id)}
                    className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}