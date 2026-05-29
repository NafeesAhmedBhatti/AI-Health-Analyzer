'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Upload, FileText, Eye, Trash2, RefreshCw, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';

interface LabReport {
  id: string;
  fileName: string;
  fileType: string;
  status: string;
  createdAt: string;
  aiSummary?: string;
  extractedData?: {
    healthScore?: number;
    abnormalValues?: { name: string; value: string; normalRange: string; status: string; clinicalSignificance?: string }[];
    conditions?: { name: string; severity: string }[];
  };
  flags?: {
    recommendations?: { text: string; urgency: string }[];
  };
}

export default function LabReportsPage() {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [activating, setActivating] = useState<string | null>(null);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const toast = useToast();
  const confirmAction = useConfirm();

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch('/api/lab-reports');
      if (res.ok) {
        const data = await res.json();
        setReports(Array.isArray(data) ? data : data.reports || []);
      }
      // Get active report
      const dashRes = await fetch('/api/dashboard');
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        if (dashData.activeReport) setActiveReportId(dashData.activeReport.id);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    const file = selectedFile;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'txt', 'doc', 'docx'].includes(ext || '')) {
      setUploadError('Please upload a PDF, TXT, or DOC file');
      return;
    }
    setUploading(true);
    setUploadError('');
    setUploadProgress('Reading file...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      setUploadProgress('Sending to AI for analysis...');
      const res = await fetch('/api/lab-reports/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUploadProgress('Analysis complete! Redirecting...');
      setActiveReportId(data.reportId);
      await fetchReports();
      router.push('/dashboard');
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleActivate = async (reportId: string) => {
    setActivating(reportId);
    try {
      const res = await fetch(`/api/lab-reports/${reportId}/activate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Activation failed');
      setActiveReportId(reportId);
      await fetchReports();
      router.push('/dashboard');
    } catch (err: unknown) {
      toast.error('Activation failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setActivating(null);
    }
  };

  const handleDelete = async (reportId: string) => {
    const ok = await confirmAction.confirm({ title: 'Delete Report', message: 'Delete this report and all its data? This cannot be undone.', confirmText: 'Delete', variant: 'danger' });
    if (!ok) return;
    try {
      await fetch(`/api/lab-reports/${reportId}`, { method: 'DELETE' });
      if (activeReportId === reportId) setActiveReportId(null);
      setReports(prev => prev.filter(r => r.id !== reportId));
      toast.success('Report deleted');
    } catch { toast.error('Failed to delete report'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-2 border-white/20 border-t-neon-blue rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Lab Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Upload medical reports for AI analysis</p>
        </div>
      </div>

      {/* Upload Zone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-dark-surface/60 border-2 border-dashed border-white/[0.1] rounded-2xl p-8 hover:border-neon-blue/30 transition-all">
        <div className="text-center">
          <Upload className={`w-10 h-10 mx-auto mb-3 ${uploading ? 'text-neon-blue animate-bounce' : 'text-gray-600'}`} />
          <p className="text-sm text-gray-400 mb-1">{uploading ? uploadProgress || 'Analyzing with AI...' : selectedFile ? `Selected: ${selectedFile.name}` : 'Upload a medical lab report (PDF or TXT)'}</p>
          {uploading && <p className="text-[11px] text-gray-600 mb-3">This takes about 30 seconds</p>}
          <div className="flex items-center justify-center gap-3">
            <input ref={fileInputRef} type="file" accept=".pdf,.txt,.doc,.docx" className="hidden" 
                onChange={(e) => { setSelectedFile(e.target.files?.[0] || null); setUploadError(''); }} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-50">
              Choose File
            </button>
            <button onClick={handleUpload} disabled={uploading || !selectedFile}
              className="px-4 py-2 rounded-lg bg-neon-blue text-sm text-white font-medium hover:bg-neon-blue/80 transition-all disabled:opacity-50 flex items-center gap-2">
              {uploading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing...</> : <><Zap className="w-3.5 h-3.5" /> Upload & Analyze</>}
            </button>
          </div>
          {uploadError && <p className="text-xs text-red-400 mt-3">{uploadError}</p>}
        </div>
      </motion.div>

      {/* Reports List */}
      <div className="space-y-3">
        <AnimatePresence>
          {reports.map((report, i) => {
            const isActive = report.id === activeReportId;
            const isExpanded = expandedReport === report.id;
            const extractedData = report.extractedData || {};
            const abnormalValues = extractedData.abnormalValues || [];
            const conditions = extractedData.conditions || [];
            const flags = report.flags || {};

            return (
              <motion.div key={report.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className={`bg-dark-surface/60 border rounded-2xl overflow-hidden ${isActive ? 'border-neon-blue/30 shadow-lg shadow-neon-blue/5' : 'border-white/[0.06]'}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-neon-blue/20' : 'bg-white/5'}`}>
                        <FileText className={`w-5 h-5 ${isActive ? 'text-neon-blue' : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{report.fileName}</p>
                          {isActive && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-neon-blue/20 text-neon-blue font-medium">ACTIVE</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-600">{report.fileType}</span>
                          <span className="text-[10px] text-gray-700">•</span>
                          <span className="text-[10px] text-gray-600">{new Date(report.createdAt).toLocaleDateString()} {new Date(report.createdAt).toLocaleTimeString()}</span>
                          <span className="text-[10px] text-gray-700">•</span>
                          <span className={`text-[10px] ${report.status === 'reviewed' ? 'text-green-400' : 'text-amber-400'}`}>
                            {report.status === 'reviewed' ? '✓ Analyzed' : '⏳ Pending'}
                          </span>
                        </div>
                        {/* Quick Stats */}
                        {report.status === 'reviewed' && (
                          <div className="flex items-center gap-3 mt-2">
                            {abnormalValues.length > 0 && <span className="text-[10px] text-red-400">{abnormalValues.length} abnormal</span>}
                            {conditions.length > 0 && <span className="text-[10px] text-amber-400">{conditions.length} conditions</span>}
                            {extractedData.healthScore && <span className="text-[10px] text-neon-blue">Score: {extractedData.healthScore}</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isActive && report.status === 'reviewed' && (
                        <button onClick={() => handleActivate(report.id)} disabled={!!activating}
                          className="px-3 py-1.5 rounded-lg bg-neon-blue/10 text-neon-blue text-xs font-medium hover:bg-neon-blue/20 transition-all disabled:opacity-50 flex items-center gap-1.5">
                          {activating === report.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                          {activating === report.id ? 'Loading...' : 'Activate'}
                        </button>
                      )}
                      <button onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDelete(report.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/[0.04] overflow-hidden">
                      <div className="p-5 space-y-4">
                        {/* AI Summary */}
                        {report.aiSummary && (
                          <div className="p-3 rounded-lg bg-neon-blue/5 border border-neon-blue/10">
                            <p className="text-[11px] font-semibold text-neon-blue mb-1">AI Clinical Summary</p>
                            <p className="text-xs text-gray-300 leading-relaxed">{report.aiSummary}</p>
                          </div>
                        )}

                        {/* Abnormal Values */}
                        {abnormalValues.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold text-red-400 mb-2">Abnormal Values</p>
                            <div className="space-y-1.5">
                              {abnormalValues.map((av: { name: string; value: string; normalRange: string; status: string; clinicalSignificance?: string }, ai: number) => (
                                <div key={ai} className={`p-2.5 rounded-lg border ${av.status === 'critical' ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-white">{av.name}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${av.status === 'critical' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>{av.status}</span>
                                  </div>
                                  <p className="text-[11px] text-gray-400 mt-0.5">Value: <span className="text-white">{av.value}</span> (Normal: {av.normalRange})</p>
                                  {av.clinicalSignificance && <p className="text-[10px] text-gray-500 mt-1">{av.clinicalSignificance}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Detected Conditions */}
                        {conditions.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold text-amber-400 mb-2">Detected Conditions</p>
                            <div className="flex flex-wrap gap-1.5">
                              {conditions.map((c: string | { name: string; severity: string }, ci: number) => {
                                const name = typeof c === 'string' ? c : c.name;
                                return <span key={ci} className="text-[10px] px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">{name}</span>;
                              })}
                            </div>
                          </div>
                        )}

                        {/* Navigate buttons */}
                        <div className="flex items-center gap-2 pt-2">
                          {!isActive && (
                            <a href="/dashboard" onClick={() => handleActivate(report.id)}
                              className="text-xs text-neon-blue hover:underline flex items-center gap-1">
                              <Eye className="w-3 h-3" /> View Full Analysis
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {reports.length === 0 && (
          <div className="text-center py-16">
            <FlaskConical className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No lab reports yet. Upload your first report above.</p>
          </div>
        )}
      </div>

      <p className="text-[10px] text-gray-600 italic">⚠️ AI analysis is for informational purposes only. Always verify with your healthcare provider.</p>
    </div>
  );
}