'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Sparkles, Calendar, Brain, Shield, Heart, AlertTriangle, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const toast = useToast();

  const loadReports = () => {
    fetch('/api/reports').then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d : [];
      setReports(list);
      if (list.length > 0 && !selected) setSelected(list[0]);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadReports(); }, []);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/reports', { method: 'POST' });
      const report = await res.json();
      if (report.pdfBase64) {
        const blob = Buffer.from(report.pdfBase64, 'base64');
        const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `health-report-${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
      loadReports();
      setSelected(report);
    } catch (e) {
      toast.error('Failed to generate report. Please try again.');
    }
    setGenerating(false);
  };

  const downloadReport = (report: any) => {
    if (report.pdfBase64) {
      const blob = Buffer.from(report.pdfBase64, 'base64');
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `health-report-${new Date(report.generatedAt || report.createdAt).toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      toast.info('PDF data not available for this report.');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-2 border-white/20 border-t-neon-blue rounded-full animate-spin" /></div>;

  const aiData = selected?.data?.ai || {};

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Health Reports</h1>
          <p className="text-xs text-gray-500 mt-0.5">AI-generated comprehensive health reports</p>
        </div>
        <button onClick={generateReport} disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-neon-blue/10 text-neon-blue border border-neon-blue/20 rounded-xl text-sm font-medium hover:bg-neon-blue/20 transition-colors disabled:opacity-50">
          {generating ? <><div className="w-4 h-4 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin" /> Generating...</> :
            <><Sparkles className="w-4 h-4" /> Generate AI Report</>}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Report List */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-2 space-y-1">
            {reports.length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No reports yet. Click Generate to create one.</p>
              </div>
            )}
            {reports.map(r => (
              <button key={r.id} onClick={() => setSelected(r)}
                className={`w-full text-left p-3 rounded-xl transition-colors ${selected?.id === r.id ? 'bg-white/[0.08]' : 'hover:bg-white/[0.03]'}`}>
                <p className={`text-sm ${selected?.id === r.id ? 'text-white font-medium' : 'text-gray-400'}`}>{r.title?.replace('Health Report — ', '') || 'Report'}</p>
                <p className="text-[10px] text-gray-600">{new Date(r.generatedAt || r.createdAt).toLocaleDateString()}</p>
                {r.data?.ai?.riskLevel && (
                  <span className={`text-[9px] mt-1 inline-block px-1.5 py-0.5 rounded-full ${
                    r.data.ai.riskLevel === 'high' ? 'bg-red-500/20 text-red-400' :
                    r.data.ai.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'
                  }`}>{r.data.ai.riskLevel.toUpperCase()}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 min-w-0">
          {selected ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">{selected.title || 'Health Report'}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Generated {new Date(selected.generatedAt || selected.createdAt).toLocaleString()}</p>
                  </div>
                  <button onClick={() => downloadReport(selected)} className="flex items-center gap-2 px-4 py-2 bg-neon-blue/10 text-neon-blue border border-neon-blue/20 rounded-xl text-sm hover:bg-neon-blue/20 transition-colors">
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                </div>
              </div>

              {/* AI Sections */}
              {aiData.executiveSummary && (
                <div className="bg-dark-surface/60 border border-neon-blue/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3"><Brain className="w-4 h-4 text-neon-blue" /><h3 className="text-sm font-semibold text-neon-blue">Executive Summary</h3></div>
                  <p className="text-sm text-gray-300 leading-relaxed">{aiData.executiveSummary}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiData.vitalsAnalysis && (
                  <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2"><Heart className="w-4 h-4 text-red-400" /><h3 className="text-xs font-semibold text-white">Vitals Analysis</h3></div>
                    <p className="text-xs text-gray-400 leading-relaxed">{aiData.vitalsAnalysis}</p>
                  </div>
                )}
                {aiData.medicationsAssessment && (
                  <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2"><Shield className="w-4 h-4 text-neon-purple" /><h3 className="text-xs font-semibold text-white">Medications</h3></div>
                    <p className="text-xs text-gray-400 leading-relaxed">{aiData.medicationsAssessment}</p>
                  </div>
                )}
                {aiData.labFindings && (
                  <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-neon-cyan" /><h3 className="text-xs font-semibold text-white">Lab Findings</h3></div>
                    <p className="text-xs text-gray-400 leading-relaxed">{aiData.labFindings}</p>
                  </div>
                )}
                {aiData.mentalHealth && (
                  <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2"><Brain className="w-4 h-4 text-neon-pink" /><h3 className="text-xs font-semibold text-white">Mental Health</h3></div>
                    <p className="text-xs text-gray-400 leading-relaxed">{aiData.mentalHealth}</p>
                  </div>
                )}
              </div>

              {aiData.recommendations?.length > 0 && (
                <div className="bg-dark-surface/60 border border-emerald-500/20 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-emerald-400 mb-3">Key Recommendations</h3>
                  <div className="space-y-2">
                    {aiData.recommendations.map((r: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aiData.riskLevel && (
                <div className={`rounded-2xl p-5 border ${
                  aiData.riskLevel === 'high' ? 'bg-red-500/[0.04] border-red-500/20' :
                  aiData.riskLevel === 'medium' ? 'bg-amber-500/[0.04] border-amber-500/20' :
                  'bg-green-500/[0.04] border-green-500/20'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className={`w-4 h-4 ${aiData.riskLevel === 'high' ? 'text-red-400' : aiData.riskLevel === 'medium' ? 'text-amber-400' : 'text-green-400'}`} />
                    <h3 className="text-sm font-semibold text-white">Risk Assessment: {aiData.riskLevel.toUpperCase()}</h3>
                  </div>
                  <p className="text-xs text-gray-400">{aiData.riskExplanation || 'No detailed risk assessment available.'}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-12 text-center">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-gray-400">No Report Selected</h2>
              <p className="text-sm text-gray-600 mt-2">Generate your first AI Health Report to see a comprehensive analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}