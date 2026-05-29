'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Heart, Brain, Activity, FlaskConical, Calendar, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useActiveReport } from '@/hooks/useActiveReport';

const TYPE_LABELS: Record<string, { label: string; color: string; unit: string }> = {
  heart_rate: { label: 'Heart Rate', color: '#ef4444', unit: 'bpm' },
  blood_pressure_systolic: { label: 'Systolic BP', color: '#00d4ff', unit: 'mmHg' },
  blood_pressure_diastolic: { label: 'Diastolic BP', color: '#8b5cf6', unit: 'mmHg' },
  weight: { label: 'Weight', color: '#f97316', unit: 'kg' },
  bmi: { label: 'BMI', color: '#06ffd2', unit: '' },
  oxygen: { label: 'Oxygen', color: '#3b82f6', unit: '%' },
  temperature: { label: 'Temperature', color: '#ef4444', unit: '°C' },
};

const PERIODS = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
  { label: 'All Time', value: 365 },
];

export default function TrendsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const { report: activeReport } = useActiveReport();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/trends?days=${days}`).then(r => r.json()).then(d => setData(d)).catch(console.error).finally(() => setLoading(false));
  }, [days]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-2 border-white/20 border-t-neon-blue rounded-full animate-spin" /></div>;

  if (!data) return (
    <div className="text-center py-20">
      <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">No Trend Data</h2>
      <p className="text-sm text-gray-500">Upload lab reports to start tracking your health trends.</p>
    </div>
  );

  const { vitalsByType, moodData, healthScores } = data;
  const vitalTypes = Object.keys(vitalsByType).filter(t => vitalsByType[t].length > 0);
  const hasVitals = vitalTypes.length > 0;
  const hasMood = moodData.length > 0;
  const hasScores = healthScores.length > 0;
  const hasAnything = hasVitals || hasMood || hasScores;

  if (!hasAnything) return (
    <div className="text-center py-20">
      <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">No Trend Data Yet</h2>
      <p className="text-sm text-gray-500 max-w-md mx-auto">Upload lab reports and track your vitals to see health trends over time.</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center border border-white/[0.06]">
            <TrendingUp className="w-5 h-5 text-neon-blue" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Health Trends</h1>
            <p className="text-xs text-gray-500">Track your vitals, mood, and health score over time</p>
            {activeReport && (
              <div className="flex items-center gap-1.5 mt-1">
                <FileText className="w-3 h-3 text-neon-purple/70" />
                <span className="text-[11px] text-neon-purple/80">Based on: {activeReport.fileName}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 bg-dark-surface/60 border border-white/[0.06] rounded-xl p-1">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setDays(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${days === p.value ? 'bg-neon-blue/10 text-neon-blue font-medium' : 'text-gray-500 hover:text-gray-300'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Health Score Trend */}
      {hasScores && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical className="w-4 h-4 text-neon-purple" />
            <h3 className="text-sm font-semibold text-white">Health Score Over Time</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healthScores}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#666" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: 12 }}
                  labelStyle={{ color: '#999' }} itemStyle={{ color: '#8b5cf6' }}
                  labelFormatter={(label: any, payload: readonly any[]) => {
                    if (payload?.[0]?.payload?.reportName) {
                      return `${label} — ${payload[0].payload.reportName}`;
                    }
                    return `${label}`;
                  }} />
                <Area type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} fill="url(#scoreGrad)" dot={{ fill: '#8b5cf6', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Vitals Charts */}
      {hasVitals && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vitalTypes.map(type => {
            const info = TYPE_LABELS[type] || { label: type, color: '#999', unit: '' };
            const chartData = vitalsByType[type];
            return (
              <motion.div key={type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: info.color }} />
                    <h3 className="text-sm font-semibold text-white">{info.label}</h3>
                  </div>
                  <span className="text-xs text-gray-500">{chartData[chartData.length - 1]?.value} {info.unit}</span>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#666" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: 12 }}
                        labelStyle={{ color: '#999' }} />
                      <Line type="monotone" dataKey="value" stroke={info.color} strokeWidth={2} dot={{ fill: info.color, r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Mood Trends */}
      {hasMood && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-neon-pink" />
            <h3 className="text-sm font-semibold text-white">Mental Health Trends</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} stroke="#666" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: 12 }}
                  labelStyle={{ color: '#999' }} />
                <Line type="monotone" dataKey="moodScore" stroke="#22c55e" strokeWidth={2} name="Mood" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="anxietyScore" stroke="#ef4444" strokeWidth={2} name="Anxiety" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="energyScore" stroke="#f97316" strokeWidth={2} name="Energy" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="sleepQuality" stroke="#8b5cf6" strokeWidth={2} name="Sleep" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-green-500" /> Mood</span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-red-500" /> Anxiety</span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-orange-500" /> Energy</span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-purple-500" /> Sleep</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}