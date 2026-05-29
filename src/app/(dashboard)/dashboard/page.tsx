'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Heart, Brain, Apple, TrendingUp, Shield, Sparkles,
  ArrowRight, Zap, Eye, Thermometer, Droplets, Moon,
  FlaskConical, Pill, AlertTriangle, RefreshCw, Stethoscope, Clock,
  Calendar, Ambulance, FileWarning, Scale, TrendingDown, Minus
} from 'lucide-react';

function HealthScoreRing({ score, label }: { score: number; label: string }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#00d4ff' : score >= 60 ? '#fbbf24' : score >= 40 ? '#f97316' : '#ef4444';
  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" className="transform -rotate-90">
        <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle cx="70" cy="70" r="54" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, unit, color, sub }: {
  icon: React.ElementType; label: string; value: string | number | null; unit: string; color: string; sub?: string;
}) {
  return (
    <div className="bg-dark-surface/60 border border-white/[0.06] rounded-xl p-4 hover:border-white/10 transition-all">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-[10px] text-gray-600">{unit}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
      <p className="text-[11px] text-gray-500">{label}</p>
      {sub && <p className="text-[10px] text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [scoreTrend, setScoreTrend] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) setData(await res.json());
    } catch (err) { console.error('Dashboard fetch error:', err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  const fetchScoreTrend = useCallback(async () => {
    try {
      const res = await fetch('/api/health-score');
      if (res.ok) setScoreTrend(await res.json());
    } catch {}
  }, []);

  useEffect(() => { fetchDashboard(); fetchScoreTrend(); }, [fetchDashboard, fetchScoreTrend]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-2 border-white/20 border-t-neon-blue rounded-full animate-spin" /></div>;

  const stats = data?.stats || {};
  const healthScore = scoreTrend?.currentScore ?? data?.healthScore ?? 75;
  const aiInsight = data?.aiInsight || 'Upload a lab report for personalized AI analysis.';
  const recommendations = data?.recommendations || [];
  const latestLabReports = data?.labReports || [];
  const unreadAlerts = data?.alerts || [];
  const conditions = data?.conditions || [];
  const activeReport = data?.activeReport;
  const scoreHistory = scoreTrend?.scores || [];
  const scoreTrendVal = scoreTrend?.trend || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeReport ? `Based on: ${activeReport.fileName}` : 'Your health at a glance'}
          </p>
        </div>
        <button onClick={() => { setRefreshing(true); fetchDashboard(); fetchScoreTrend(); }} disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-surface/60 border border-white/[0.06] text-gray-400 hover:text-white text-xs">
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* AI Insight + Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 border border-neon-blue/20 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-neon-blue/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-neon-blue" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-neon-blue mb-2">AI Clinical Analysis</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{aiInsight}</p>
              {data?.confidence && <p className="text-[10px] text-gray-600 mt-2">Confidence: {Math.round(data.confidence * 100)}%</p>}
            </div>
          </div>
        </div>
        <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6 flex flex-col items-center justify-center">
          <HealthScoreRing score={healthScore} label={healthScore >= 80 ? 'Healthy' : healthScore >= 60 ? 'Fair' : healthScore >= 40 ? 'At Risk' : 'Critical'} />
          {/* Score trend indicator */}
          <div className="flex items-center gap-1 mt-2">
            {scoreTrendVal > 0 ? (
              <><TrendingUp className="w-3 h-3 text-green-400" /><span className="text-[10px] text-green-400">+{scoreTrendVal} from last report</span></>
            ) : scoreTrendVal < 0 ? (
              <><TrendingDown className="w-3 h-3 text-red-400" /><span className="text-[10px] text-red-400">{scoreTrendVal} from last report</span></>
            ) : (
              <><Minus className="w-3 h-3 text-gray-500" /><span className="text-[10px] text-gray-500">No change</span></>
            )}
          </div>
        </div>
      </div>

      {/* Health Score Trend Chart */}
      {scoreHistory.length >= 2 && (
        <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-neon-blue" /> Health Score Trend</h3>
            <span className="text-xs text-gray-500">{scoreHistory.length} reports</span>
          </div>
          <div className="relative h-32">
            <svg className="w-full h-full" viewBox={`0 0 ${(scoreHistory.length - 1) * 80} 100`} preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="0" y1="20" x2={(scoreHistory.length - 1) * 80} y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="50" x2={(scoreHistory.length - 1) * 80} y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="80" x2={(scoreHistory.length - 1) * 80} y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              {/* Area fill */}
              <polygon fill="url(#scoreGradient)" opacity="0.15"
                points={`0,100 ${scoreHistory.map((s: any, i: number) => `${i * 80},${100 - s.score}`).join(' ')} ${(scoreHistory.length - 1) * 80},100`} />
              {/* Line */}
              <polyline fill="none" stroke="#00d4ff" strokeWidth="2.5" strokeLinejoin="round"
                points={scoreHistory.map((s: any, i: number) => `${i * 80},${100 - s.score}`).join(' ')} />
              {/* Points */}
              {scoreHistory.map((s: any, i: number) => (
                <g key={i}>
                  <circle cx={i * 80} cy={100 - s.score} r="5" fill="#0d0d1a" stroke="#00d4ff" strokeWidth="2" />
                  <text x={i * 80} y={100 - s.score - 10} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{s.score}</text>
                </g>
              ))}
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex justify-between mt-2">
            {scoreHistory.map((s: any, i: number) => (
              <div key={i} className="text-center">
                <span className="text-[9px] text-gray-600 block">{new Date(s.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                <span className="text-[8px] text-gray-700 truncate block max-w-[60px]">{s.fileName?.substring(0, 12)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detected Conditions */}
      {conditions.length > 0 ? (
        <div className="bg-dark-surface/60 border border-amber-500/20 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
            <FileWarning className="w-4 h-4" /> Detected Conditions
          </h3>
          <div className="flex flex-wrap gap-2">
            {conditions.map((cond: any, i: number) => {
              const name = typeof cond === 'string' ? cond : cond.name;
              const sev = typeof cond === 'string' ? 'moderate' : cond.severity;
              const sevColor = sev === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                sev === 'severe' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                sev === 'moderate' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                'bg-blue-500/10 text-blue-400 border-blue-500/20';
              return (
                <span key={i} className={`text-xs px-3 py-1.5 rounded-lg border ${sevColor}`}>
                  {name}
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
            <FileWarning className="w-4 h-4" /> Detected Conditions
          </h3>
          <p className="text-sm text-gray-600">No conditions detected. Upload a lab report for AI analysis.</p>
        </div>
      )}

      {/* Vitals */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={Heart} label="Heart Rate" value={stats.heartRate} unit="bpm" color="text-red-400" />
        <StatCard icon={Activity} label="Blood Pressure" value={stats.bloodPressure} unit="mmHg" color="text-neon-blue" />
        <StatCard icon={Droplets} label="Oxygen" value={stats.oxygenLevel} unit="%" color="text-cyan-400" />
        <StatCard icon={Thermometer} label="Weight" value={stats.weight} unit="kg" color="text-orange-400" />
        <StatCard icon={Scale} label="BMI" value={stats.bmi} unit="" color="text-neon-purple" />
      </div>

      {/* Module Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/dashboard/nutrition', label: 'Diet Plan', icon: Apple, color: 'text-orange-400', count: stats.totalLabReports, tag: 'AI' },
          { href: '/dashboard/medications', label: 'Medicines', icon: Pill, color: 'text-neon-cyan', count: stats.activeMedications, tag: 'AI' },
          { href: '/dashboard/alerts', label: 'Alerts', icon: AlertTriangle, color: 'text-amber-400', count: stats.unreadAlerts, tag: '' },
          { href: '/dashboard/lab-reports', label: 'Lab Reports', icon: FlaskConical, color: 'text-neon-purple', count: stats.totalLabReports, tag: '' },
        ].map((item, i) => (
          <a key={item.href} href={item.href}>
            <div className="bg-dark-surface/60 border border-white/[0.06] rounded-xl p-4 hover:border-white/20 transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-2">
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <ArrowRight className="w-3 h-3 text-gray-600 group-hover:text-white transition-colors" />
              </div>
              <p className="text-sm font-medium text-white">{item.label}</p>
              <div className="flex items-center gap-2">
                <p className="text-[11px] text-gray-500">{item.count ?? 0} items</p>
                {item.tag && <span className="text-[9px] px-1.5 py-0.5 rounded bg-neon-blue/10 text-neon-blue">{item.tag}</span>}
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Clinical Recommendations */}
      {recommendations.length > 0 ? (
        <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-neon-blue" /> Clinical Recommendations
          </h3>
          <div className="space-y-2">
            {recommendations.slice(0, 6).map((rec: any, i: number) => {
              const text = typeof rec === 'string' ? rec : rec.text;
              const urgency = typeof rec === 'string' ? 'routine' : rec.urgency;
              const category = typeof rec === 'string' ? '' : rec.category;
              const evidence = typeof rec === 'string' ? '' : rec.evidence;
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${urgency === 'immediate' ? 'bg-red-500/5 border-red-500/10' : urgency === 'soon' ? 'bg-amber-500/5 border-amber-500/10' : 'bg-dark-surface/40 border-white/[0.03]'}`}>
                  <span className={`text-[10px] font-bold mt-1 ${urgency === 'immediate' ? 'text-red-400' : urgency === 'soon' ? 'text-amber-400' : 'text-neon-blue'}`}>
                    {urgency === 'immediate' ? '🔴' : urgency === 'soon' ? '🟡' : '🔵'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-300">{text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {category && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500">{category}</span>}
                      {evidence && <span className="text-[10px] text-gray-600">Based on: {evidence}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
            <Stethoscope className="w-4 h-4" /> Clinical Recommendations
          </h3>
          <p className="text-sm text-gray-600">No recommendations available. Upload a lab report for AI-generated clinical recommendations.</p>
        </div>
      )}

      {/* Active Alerts */}
      {unreadAlerts.length > 0 ? (
        <div className="bg-dark-surface/60 border border-amber-500/20 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Active Health Alerts
          </h3>
          <div className="space-y-2">
            {unreadAlerts.slice(0, 5).map((alert: any, i: number) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
                alert.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' :
                alert.severity === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                'bg-blue-500/5 border-blue-500/20'}`}>
                <span className={`text-xs font-bold mt-0.5 ${alert.severity === 'critical' ? 'text-red-400' : alert.severity === 'warning' ? 'text-amber-400' : 'text-blue-400'}`}>●</span>
                <div>
                  <p className="text-sm font-medium text-white">{alert.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
          <a href="/dashboard/alerts" className="text-xs text-neon-blue hover:underline mt-3 inline-block">View all alerts →</a>
        </div>
      ) : (
        <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Active Health Alerts
          </h3>
          <p className="text-sm text-gray-600">No active alerts. Upload a lab report to generate health alerts.</p>
        </div>
      )}

      {/* Recent Lab Reports */}
      {latestLabReports.length > 0 && (
        <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><FlaskConical className="w-4 h-4 text-neon-purple" /> Reports</h3>
            <a href="/dashboard/lab-reports" className="text-xs text-neon-blue hover:underline">Manage</a>
          </div>
          <div className="space-y-2">
            {latestLabReports.slice(0, 3).map((r: any) => (
              <div key={r.id} className={`flex items-center justify-between p-3 rounded-lg border ${r.id === activeReport?.id ? 'border-neon-blue/30 bg-neon-blue/5' : 'border-white/[0.03] bg-dark-surface/40'}`}>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{r.fileName}</p>
                  <p className="text-[11px] text-gray-500">{r.fileType} · {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${r.status === 'reviewed' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {r.status === 'reviewed' ? 'Analyzed' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-600 italic">⚠️ AI-generated analysis. Not medical advice. Always consult your healthcare provider.</p>
    </div>
  );
}