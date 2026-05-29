'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Activity, Thermometer, Droplets, Scale, Wind, Trash2, Edit3, Check, X, Plus, AlertTriangle, TrendingDown, TrendingUp, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { useActiveReport } from '@/hooks/useActiveReport';

const VITAL_TYPES = [
  { value: 'heart_rate', label: 'Heart Rate', unit: 'bpm', icon: Heart, color: 'text-red-400' },
  { value: 'blood_pressure_systolic', label: 'BP Systolic', unit: 'mmHg', icon: Activity, color: 'text-neon-blue' },
  { value: 'blood_pressure_diastolic', label: 'BP Diastolic', unit: 'mmHg', icon: Activity, color: 'text-neon-cyan' },
  { value: 'temperature', label: 'Temperature', unit: '°C', icon: Thermometer, color: 'text-orange-400' },
  { value: 'oxygen', label: 'Oxygen', unit: '%', icon: Droplets, color: 'text-cyan-400' },
  { value: 'weight', label: 'Weight', unit: 'kg', icon: Scale, color: 'text-emerald-400' },
  { value: 'bmi', label: 'BMI', unit: '', icon: Scale, color: 'text-neon-purple' },
  { value: 'glucose', label: 'Glucose', unit: 'mg/dL', icon: Droplets, color: 'text-amber-400' },
  { value: 'respiratory_rate', label: 'Respiratory Rate', unit: '/min', icon: Wind, color: 'text-blue-400' },
];

const NORMAL_RANGES: Record<string, { min: number; max: number }> = {
  heart_rate: { min: 60, max: 100 },
  blood_pressure_systolic: { min: 90, max: 140 },
  blood_pressure_diastolic: { min: 60, max: 90 },
  temperature: { min: 36.1, max: 37.2 },
  oxygen: { min: 95, max: 100 },
  weight: { min: 40, max: 200 },
  bmi: { min: 18.5, max: 30 },
  glucose: { min: 70, max: 140 },
  respiratory_rate: { min: 12, max: 20 },
};

function getStatusColor(type: string, value: number) {
  const r = NORMAL_RANGES[type];
  if (!r) return 'text-gray-400';
  if (value < r.min * 0.7 || value > r.max * 1.3) return 'text-red-400';
  if (value < r.min || value > r.max) return 'text-amber-400';
  return 'text-green-400';
}

function getStatusBg(type: string, value: number) {
  const r = NORMAL_RANGES[type];
  if (!r) return 'bg-white/[0.03] border-white/[0.04]';
  if (value < r.min * 0.7 || value > r.max * 1.3) return 'bg-red-500/[0.06] border-red-500/20';
  if (value < r.min || value > r.max) return 'bg-amber-500/[0.06] border-amber-500/20';
  return 'bg-green-500/[0.04] border-green-500/10';
}

export default function VitalsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState('heart_rate');
  const [addValue, setAddValue] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const { report: activeReport } = useActiveReport();
  const toast = useToast();
  const confirmAction = useConfirm();

  const loadData = () => {
    fetch('/api/vitals').then(r => r.json()).then(d => setData(d)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = async () => {
    if (!addValue) return;
    const vt = VITAL_TYPES.find(t => t.value === addType);
    setSaving(true);
    try {
      const res = await fetch('/api/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: addType, value: parseFloat(addValue), unit: vt?.unit || '' }),
      });
      const result = await res.json();
      if (result.anomaly?.isAbnormal) {
        toast.warning(`${result.anomaly.message}. An alert has been created.`);
      }
      setShowAdd(false);
      setAddValue('');
      loadData();
    } catch { toast.error('Failed to save vital reading'); }
    setSaving(false);
  };

  const handleEdit = async (id: string) => {
    setSaving(true);
    try {
      await fetch('/api/vitals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, value: parseFloat(editValue) }),
      });
      setEditing(null);
      loadData();
    } catch { toast.error('Failed to update vital reading'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmAction.confirm({ title: 'Delete Reading', message: 'Delete this vital reading? This cannot be undone.', confirmText: 'Delete', variant: 'danger' });
    if (!ok) return;
    try {
      await fetch(`/api/vitals?id=${id}`, { method: 'DELETE' });
      loadData();
      toast.success('Vital reading deleted');
    } catch { toast.error('Failed to delete vital reading'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-2 border-white/20 border-t-neon-blue rounded-full animate-spin" /></div>;
  if (!data) return <div className="text-center py-20 text-gray-500">No vitals data</div>;

  const { vitals, summary, ranges } = data;

  // Build trend data per type
  const trendData: Record<string, any[]> = {};
  vitals.forEach((v: any) => {
    if (!trendData[v.type]) trendData[v.type] = [];
    trendData[v.type].unshift({ date: new Date(v.recordedAt).toLocaleDateString(), value: v.value, id: v.id });
  });

  const abnormalSummary = summary.filter((s: any) => s.anomaly?.isAbnormal);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Vitals Tracker</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track and monitor your health measurements</p>
          {activeReport && (
            <div className="flex items-center gap-1.5 mt-1">
              <FileText className="w-3 h-3 text-neon-purple/70" />
              <span className="text-[11px] text-neon-purple/80">Based on: {activeReport.fileName}</span>
            </div>
          )}
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-neon-blue/10 text-neon-blue border border-neon-blue/20 rounded-xl text-sm hover:bg-neon-blue/20 transition-colors">
          <Plus className="w-4 h-4" /> Add Vital
        </button>
      </div>

      {/* Abnormal Alerts */}
      {abnormalSummary.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/[0.04] border border-red-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-red-400">Abnormal Readings Detected</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {abnormalSummary.map((s: any, i: number) => (
              <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg border ${s.anomaly.severity === 'critical' ? 'bg-red-500/[0.06] border-red-500/20' : 'bg-amber-500/[0.06] border-amber-500/20'}`}>
                {s.anomaly.severity === 'critical' ? <AlertTriangle className="w-4 h-4 text-red-400" /> :
                  s.value < NORMAL_RANGES[s.type]?.min ? <TrendingDown className="w-4 h-4 text-amber-400" /> : <TrendingUp className="w-4 h-4 text-amber-400" />}
                <div>
                  <p className="text-xs text-white font-medium">{ranges[s.type]?.label || s.type}: {s.value} {s.unit}</p>
                  <p className="text-[10px] text-gray-400">Normal: {NORMAL_RANGES[s.type]?.min}–{NORMAL_RANGES[s.type]?.max} {s.unit}</p>
                </div>
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ${s.anomaly.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {s.anomaly.severity === 'critical' ? 'CRITICAL' : 'WARNING'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Latest Vitals Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {summary.map((s: any) => {
          const vt = VITAL_TYPES.find(t => t.value === s.type);
          if (!vt || !s.value) return null;
          const Icon = vt.icon;
          const statusColor = getStatusColor(s.type, s.value);
          const statusBg = getStatusBg(s.type, s.value);
          const range = NORMAL_RANGES[s.type];
          return (
            <motion.div key={s.type} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className={`${statusBg} border rounded-2xl p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${vt.color}`} />
                <span className="text-xs text-gray-400">{vt.label}</span>
                {s.anomaly?.isAbnormal && <AlertTriangle className={`w-3 h-3 ml-auto ${s.anomaly.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />}
              </div>
              <p className={`text-2xl font-bold ${statusColor}`}>{s.value}</p>
              <p className="text-[10px] text-gray-600">{vt.unit} · Normal: {range?.min}–{range?.max}</p>
              <p className="text-[10px] text-gray-600 mt-1">{new Date(s.recordedAt).toLocaleDateString()}</p>
              {/* Mini sparkline */}
              {trendData[s.type]?.length > 1 && (
                <div className="flex items-end gap-[2px] mt-2 h-8">
                  {trendData[s.type].slice(-10).map((d: any, i: number) => {
                    const max = Math.max(...trendData[s.type].slice(-10).map((x: any) => x.value));
                    const min = Math.min(...trendData[s.type].slice(-10).map((x: any) => x.value));
                    const range2 = max - min || 1;
                    const h = Math.max(4, ((d.value - min) / range2) * 28);
                    return <div key={i} className={`flex-1 rounded-sm min-w-[3px] ${getStatusColor(s.type, d.value) === 'text-green-400' ? 'bg-green-400/40' : getStatusColor(s.type, d.value) === 'text-amber-400' ? 'bg-amber-400/40' : 'bg-red-400/40'}`} style={{ height: h }} />;
                  })}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Trend Chart per Vital Type */}
      {Object.entries(trendData).filter(([, vals]) => (vals as any[]).length >= 2).map(([type, values]) => {
        const vt = VITAL_TYPES.find(t => t.value === type);
        if (!vt) return null;
        const range = NORMAL_RANGES[type];
        const vals = values as any[];
        const maxVal = Math.max(...vals.map((v: any) => v.value));
        const minVal = Math.min(...vals.map((v: any) => v.value));
        const chartMax = Math.max(maxVal, range?.max || maxVal) * 1.1;
        const chartMin = Math.min(minVal, range?.min || minVal) * 0.9;
        const chartRange = chartMax - chartMin || 1;
        return (
          <motion.div key={type} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <vt.icon className={`w-4 h-4 ${vt.color}`} />
              <h3 className="text-sm font-semibold text-white">{vt.label} Trend</h3>
              <span className="text-xs text-gray-500 ml-auto">{vals.length} readings</span>
            </div>
            {/* SVG Chart */}
            <div className="relative h-32">
              {/* Normal range band */}
              {range && (
                <div className="absolute left-0 right-0 border-y border-green-500/20 bg-green-500/[0.04]"
                  style={{ bottom: `${((range.min - chartMin) / chartRange) * 100}%`, top: `${100 - ((range.max - chartMin) / chartRange) * 100}%` }} />
              )}
              {/* Data points + line */}
              <svg className="w-full h-full" viewBox={`0 0 ${Math.max(vals.length - 1, 1) * 60} 100`} preserveAspectRatio="none">
                <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
                  className={vt.color}
                  points={vals.map((v: any, i: number) => `${i * 60},${100 - ((v.value - chartMin) / chartRange) * 100}`).join(' ')} />
                {vals.map((v: any, i: number) => {
                  const y = 100 - ((v.value - chartMin) / chartRange) * 100;
                  const isAbnormal = range && (v.value < range.min || v.value > range.max);
                  return <circle key={i} cx={i * 60} cy={y} r="4" className={isAbnormal ? 'fill-red-400' : `${vt.color}`} />;
                })}
              </svg>
            </div>
            {/* X-axis labels */}
            <div className="flex justify-between mt-1">
              {vals.slice(0, 6).map((v: any, i: number) => (
                <span key={i} className="text-[9px] text-gray-600">{new Date(v.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
              ))}
            </div>
            {range && (
              <p className="text-[10px] text-green-400/60 mt-2">🟢 Normal range: {range.min}–{range.max} {vt.unit}</p>
            )}
          </motion.div>
        );
      })}

      {/* History Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">History</h3>
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {vitals.slice(0, 50).map((v: any) => {
            const vt = VITAL_TYPES.find(t => t.value === v.type);
            const isAbnormal = v.anomaly?.isAbnormal;
            return (
              <div key={v.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm ${
                isAbnormal ? (v.anomaly.severity === 'critical' ? 'bg-red-500/[0.04] border-red-500/10' : 'bg-amber-500/[0.04] border-amber-500/10') : 'bg-white/[0.02] border-white/[0.03]'
              }`}>
                {vt && <vt.icon className={`w-3.5 h-3.5 flex-shrink-0 ${vt.color}`} />}
                <span className="text-gray-400 min-w-[100px]">{vt?.label || v.type}</span>
                {editing === v.id ? (
                  <div className="flex items-center gap-1">
                    <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)}
                      className="w-20 bg-dark-surface border border-neon-blue/30 rounded px-2 py-0.5 text-white text-xs" />
                    <button onClick={() => handleEdit(v.id)} className="p-1 text-green-400 hover:bg-green-400/10 rounded"><Check className="w-3 h-3" /></button>
                    <button onClick={() => setEditing(null)} className="p-1 text-gray-400 hover:bg-white/5 rounded"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <span className={`font-medium ${getStatusColor(v.type, v.value)}`}>{v.value} {v.unit}</span>
                )}
                <span className="text-[10px] text-gray-600 ml-auto">{new Date(v.recordedAt).toLocaleString()}</span>
                {isAbnormal && <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${v.anomaly.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>{v.anomaly.severity}</span>}
                {editing !== v.id && (
                  <div className="flex items-center gap-1 ml-1">
                    <button onClick={() => { setEditing(v.id); setEditValue(v.value.toString()); }} className="p-1 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"><Edit3 className="w-3 h-3" /></button>
                    <button onClick={() => handleDelete(v.id)} className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"><Trash2 className="w-3 h-3" /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Add Vital Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-dark-surface border border-white/[0.06] rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Add Vital Reading</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Vital Type</label>
                <select value={addType} onChange={e => setAddType(e.target.value)}
                  className="w-full bg-dark-bg border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white focus:border-neon-blue/40 focus:outline-none">
                  {VITAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label} ({t.unit})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Value {VITAL_TYPES.find(t => t.value === addType)?.unit ? `(${VITAL_TYPES.find(t => t.value === addType)?.unit})` : ''}</label>
                <input type="number" step="0.1" value={addValue} onChange={e => setAddValue(e.target.value)} placeholder={`Enter ${VITAL_TYPES.find(t => t.value === addType)?.label}`}
                  className="w-full bg-dark-bg border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-neon-blue/40 focus:outline-none" />
                {NORMAL_RANGES[addType] && (
                  <p className="text-[10px] text-gray-500 mt-1">Normal range: {NORMAL_RANGES[addType].min}–{NORMAL_RANGES[addType].max} {VITAL_TYPES.find(t => t.value === addType)?.unit}</p>
                )}
              </div>
              <button onClick={handleAdd} disabled={saving || !addValue}
                className="w-full py-2.5 bg-neon-blue/10 text-neon-blue border border-neon-blue/20 rounded-xl text-sm font-medium hover:bg-neon-blue/20 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Reading'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}