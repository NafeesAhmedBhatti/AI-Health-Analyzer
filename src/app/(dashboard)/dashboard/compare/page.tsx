'use client';

import { useState, useEffect } from 'react';
import { GitCompare, ArrowRight, TrendingUp, TrendingDown, Minus, FlaskConical } from 'lucide-react';

interface CompareReport {
  fileName: string;
  healthScore: number | null;
  conditions: { name: string; severity: string; description?: string }[];
  abnormalValues: { name: string; value: string; normalRange: string; status: string }[];
  recommendations: { text: string }[];
  aiSummary?: string;
}

interface CompareData {
  report1: CompareReport;
  report2: CompareReport;
}

export default function ComparePage() {
  const [reports, setReports] = useState<{id: string; fileName: string; status: string; title?: string; date?: string; createdAt?: string}[]>([]);
  const [selected1, setSelected1] = useState('');
  const [selected2, setSelected2] = useState('');
  const [comparison, setComparison] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/lab-reports').then(r => r.json()).then(d => {
      const reviewed = (Array.isArray(d) ? d : []).filter((r: {id: string; fileName: string; status: string; title?: string; date?: string; createdAt?: string}) => r.status === 'reviewed');
      setReports(reviewed);
      if (reviewed.length >= 2) {
        setSelected1(reviewed[0].id);
        setSelected2(reviewed[1].id);
      }
    }).catch(console.error);
  }, []);

  const compare = async () => {
    if (!selected1 || !selected2 || selected1 === selected2) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/compare?id1=${selected1}&id2=${selected2}`);
      const data = await res.json();
      setComparison(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const ScoreDiff = ({ v1, v2 }: { v1: number | null; v2: number | null }) => {
    if (v1 == null || v2 == null) return null;
    const diff = v2 - v1;
    if (Math.abs(diff) < 1) return <span className="flex items-center gap-1 text-xs text-gray-500"><Minus className="w-3 h-3" /> No change</span>;
    return diff > 0
      ? <span className="flex items-center gap-1 text-xs text-green-400"><TrendingUp className="w-3 h-3" /> +{diff}</span>
      : <span className="flex items-center gap-1 text-xs text-red-400"><TrendingDown className="w-3 h-3" /> {diff}</span>;
  };

  if (reports.length < 2) return (
    <div className="text-center py-20">
      <GitCompare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">Not Enough Reports</h2>
      <p className="text-sm text-gray-500">Upload at least 2 lab reports to compare them side by side.</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-cyan/20 flex items-center justify-center border border-white/[0.06]">
          <GitCompare className="w-5 h-5 text-neon-cyan" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Report Comparison</h1>
          <p className="text-xs text-gray-500">Compare two lab reports side by side to track changes</p>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Report A (Earlier)</label>
            <select value={selected1} onChange={e => setSelected1(e.target.value)}
              className="w-full bg-dark-surface/80 border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white focus:border-neon-blue/40 focus:outline-none appearance-none">
              {reports.map(r => <option key={r.id} value={r.id}>{r.title || r.fileName} — {new Date(r.date || r.createdAt || '').toLocaleDateString()}</option>)}
            </select>
          </div>
          <button onClick={compare} disabled={loading || selected1 === selected2}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              loading || selected1 === selected2 ? 'bg-white/5 text-gray-600' : 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20 hover:bg-neon-blue/20'
            }`}>
            {loading ? <div className="w-4 h-4 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin" /> : <GitCompare className="w-4 h-4" />}
            {loading ? 'Comparing...' : 'Compare'}
          </button>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Report B (Later)</label>
            <select value={selected2} onChange={e => setSelected2(e.target.value)}
              className="w-full bg-dark-surface/80 border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white focus:border-neon-blue/40 focus:outline-none appearance-none">
              {reports.map(r => <option key={r.id} value={r.id}>{r.title || r.fileName} — {new Date(r.date || r.createdAt || '').toLocaleDateString()}</option>)}
            </select>
          </div>
        </div>
        {selected1 && selected2 && selected1 === selected2 && (
          <p className="text-xs text-amber-400 mt-2">Please select two different reports to compare.</p>
        )}
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-4">
          {(() => {
            const r1 = comparison.report1;
            const r2 = comparison.report2;
            const c1 = r1.conditions || [];
            const c2 = r2.conditions || [];
            const av1 = r1.abnormalValues || [];
            const av2 = r2.abnormalValues || [];

            return (
              <>
                {/* Score Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-5 text-center">
                    <p className="text-xs text-gray-500 mb-1">{r1.fileName}</p>
                    <p className="text-4xl font-bold text-white">{r1.healthScore ?? '—'}</p>
                    <p className="text-xs text-gray-500 mt-1">Health Score</p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ScoreDiff v1={r1.healthScore} v2={r2.healthScore} />
                    <ArrowRight className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-5 text-center">
                    <p className="text-xs text-gray-500 mb-1">{r2.fileName}</p>
                    <p className="text-4xl font-bold text-white">{r2.healthScore ?? '—'}</p>
                    <p className="text-xs text-gray-500 mt-1">Health Score</p>
                  </div>
                </div>

                {/* Conditions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-dark-surface/60 border border-amber-500/20 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-amber-400 mb-3">Conditions — {r1.fileName}</h3>
                    {c1.length > 0 ? c1.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 py-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${c.severity === 'severe' ? 'bg-red-400' : 'bg-amber-400'}`} />
                        <span className="text-sm text-gray-300">{c.name}</span>
                      </div>
                    )) : <p className="text-sm text-gray-600">No conditions detected</p>}
                  </div>
                  <div className="bg-dark-surface/60 border border-amber-500/20 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-amber-400 mb-3">Conditions — {r2.fileName}</h3>
                    {c2.length > 0 ? c2.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 py-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${c.severity === 'severe' ? 'bg-red-400' : 'bg-amber-400'}`} />
                        <span className="text-sm text-gray-300">{c.name}</span>
                      </div>
                    )) : <p className="text-sm text-gray-600">No conditions detected</p>}
                  </div>
                </div>

                {/* Abnormal Values */}
                <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><FlaskConical className="w-4 h-4 text-neon-blue" /> Abnormal Lab Values</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-gray-500 mb-2 font-medium">{r1.fileName}</p>
                      {av1.length > 0 ? av1.map((v, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-0">
                          <span className="text-xs text-gray-400">{v.name}</span>
                          <span className={`text-xs font-medium ${v.status === 'critical' || v.status === 'high' ? 'text-red-400' : 'text-amber-400'}`}>{v.value} ({v.normalRange})</span>
                        </div>
                      )) : <p className="text-xs text-gray-600">None</p>}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2 font-medium">{r2.fileName}</p>
                      {av2.length > 0 ? av2.map((v, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-0">
                          <span className="text-xs text-gray-400">{v.name}</span>
                          <span className={`text-xs font-medium ${v.status === 'critical' || v.status === 'high' ? 'text-red-400' : 'text-amber-400'}`}>{v.value} ({v.normalRange})</span>
                        </div>
                      )) : <p className="text-xs text-gray-600">None</p>}
                    </div>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[r1, r2].map((r, idx) => (
                    <div key={idx} className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-5">
                      <h3 className="text-sm font-semibold text-neon-blue mb-2">AI Analysis — {r.fileName}</h3>
                      <p className="text-xs text-gray-400 leading-relaxed">{r.aiSummary || 'No analysis available'}</p>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}