'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pill, Clock, AlertTriangle, CheckCircle, Activity, Shield, Eye, Trash2, ChevronDown, ChevronUp, FileWarning, Stethoscope, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { useActiveReport } from '@/hooks/useActiveReport';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  notes: string;
  active: boolean;
}

function parseNotes(notesStr: string) {
  try { return JSON.parse(notesStr); } catch { return { reason: notesStr }; }
}

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { report: activeReport } = useActiveReport();
  const toast = useToast();
  const confirmAction = useConfirm();

  useEffect(() => {
    fetch('/api/medications').then(r => r.json()).then(data => {
      setMedications(Array.isArray(data) ? data : data.medications || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    const ok = await confirmAction.confirm({ title: 'Remove Medication', message: 'Remove this medication from your list?', confirmText: 'Remove', variant: 'danger' });
    if (!ok) return;
    await fetch(`/api/medications/${id}`, { method: 'DELETE' });
    setMedications(prev => prev.filter(m => m.id !== id));
    toast.success('Medication removed');
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-2 border-white/20 border-t-neon-blue rounded-full animate-spin" /></div>;

  const activeMeds = medications.filter(m => m.active);

  if (activeMeds.length === 0) return (
    <div className="text-center py-20">
      <Pill className="w-12 h-12 text-gray-600 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">No AI-Recommended Medications</h2>
      <p className="text-sm text-gray-500 max-w-md mx-auto">Upload a lab report to get AI-recommended medications based on your specific conditions and lab values.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">AI-Recommended Medications</h1>
        <p className="text-sm text-gray-500 mt-1">Based on your latest lab report analysis</p>
        {activeReport && (
          <div className="flex items-center gap-1.5 mt-1">
            <FileText className="w-3 h-3 text-neon-purple/70" />
            <span className="text-[11px] text-neon-purple/80">Based on: {activeReport.fileName}</span>
          </div>
        )}
      </div>

      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 border border-neon-blue/20 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-blue/20 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-neon-blue" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{activeMeds.length} Medication{activeMeds.length > 1 ? 's' : ''} Recommended</p>
            <p className="text-xs text-gray-500">Based on abnormal lab values and detected conditions</p>
          </div>
        </div>
      </motion.div>

      {/* Medication Cards */}
      <div className="space-y-3">
        {activeMeds.map((med, i) => {
          const notes = parseNotes(med.notes || '{}');
          const isExpanded = expanded === med.id;

          return (
            <motion.div key={med.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl overflow-hidden">
              {/* Main Card */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 flex items-center justify-center flex-shrink-0">
                      <Pill className="w-5 h-5 text-neon-cyan" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-white">{med.name}</p>
                      {notes.brandName && <p className="text-[11px] text-gray-500">Brand: {notes.brandName}</p>}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded bg-neon-blue/10 text-neon-blue">{med.dosage}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-neon-purple/10 text-neon-purple">{med.frequency}</span>
                        {notes.category && <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-500">{notes.category}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setExpanded(isExpanded ? null : med.id)}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(med.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Reason */}
                {notes.reason && (
                  <div className="mt-3 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <p className="text-[11px] text-amber-400 font-medium">Clinical Reason</p>
                    <p className="text-xs text-gray-400 mt-0.5">{notes.reason}</p>
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-5 pb-5 space-y-3 border-t border-white/[0.04] pt-4">
                  {/* Side Effects */}
                  {notes.sideEffects && notes.sideEffects.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-red-400 mb-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Side Effects to Watch</p>
                      <div className="flex flex-wrap gap-1.5">
                        {notes.sideEffects.map((se: string, si: number) => (
                          <span key={si} className="text-[10px] px-2 py-0.5 rounded bg-red-500/5 text-red-400/80 border border-red-500/10">{se}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contraindications */}
                  {notes.contraindications && notes.contraindications.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-orange-400 mb-1.5 flex items-center gap-1"><Shield className="w-3 h-3" /> Contraindications</p>
                      <div className="flex flex-wrap gap-1.5">
                        {notes.contraindications.map((ci: string, ci2: number) => (
                          <span key={ci2} className="text-[10px] px-2 py-0.5 rounded bg-orange-500/5 text-orange-400/80 border border-orange-500/10">{ci}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Monitoring */}
                  {notes.monitoring && (
                    <div className="p-2.5 rounded-lg bg-neon-blue/5 border border-neon-blue/10">
                      <p className="text-[11px] font-semibold text-neon-blue mb-1 flex items-center gap-1"><Eye className="w-3 h-3" /> Monitoring</p>
                      <p className="text-xs text-gray-400">{notes.monitoring}</p>
                    </div>
                  )}

                  {/* Duration */}
                  {notes.durationWeeks && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      Recommended duration: {notes.durationWeeks} weeks
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-600 italic">⚠️ AI-recommended medications. These are NOT prescriptions. Always consult your doctor before starting any medication.</p>
    </div>
  );
}