'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, Info, CheckCircle, Bell, FileText } from 'lucide-react';
import { useActiveReport } from '@/hooks/useActiveReport';

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const { report: activeReport } = useActiveReport();

  useEffect(() => {
    fetch('/api/alerts').then(r => r.json()).then(data => {
      setAlerts(Array.isArray(data) ? data : data.alerts || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    await fetch(`/api/alerts/${id}`, { method: 'PATCH', body: JSON.stringify({ read: true }), headers: { 'Content-Type': 'application/json' } });
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const dismissAll = async () => {
    for (const a of alerts.filter(a => !a.read)) await markRead(a.id);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-2 border-white/20 border-t-neon-blue rounded-full animate-spin" /></div>;

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter || a.type === filter);
  const critical = alerts.filter(a => a.severity === 'critical' || a.type === 'critical');
  const warnings = alerts.filter(a => a.severity === 'warning' || a.type === 'warning');
  const unread = alerts.filter(a => !a.read);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Health Alerts</h1>
          <p className="text-sm text-gray-500 mt-1">Based on your latest lab report analysis</p>
          {activeReport && (
            <div className="flex items-center gap-1.5 mt-1">
              <FileText className="w-3 h-3 text-neon-purple/70" />
              <span className="text-[11px] text-neon-purple/80">Based on: {activeReport.fileName}</span>
            </div>
          )}
        </div>
        {unread.length > 0 && (
          <button onClick={dismissAll} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white">
            Mark all read
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border cursor-pointer ${filter === 'critical' ? 'border-red-500/30 bg-red-500/5' : 'border-white/[0.06] bg-dark-surface/60'}`}
          onClick={() => setFilter(filter === 'critical' ? 'all' : 'critical')}>
          <p className="text-2xl font-bold text-red-400">{critical.length}</p>
          <p className="text-[11px] text-gray-500">Critical</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className={`p-4 rounded-xl border cursor-pointer ${filter === 'warning' ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/[0.06] bg-dark-surface/60'}`}
          onClick={() => setFilter(filter === 'warning' ? 'all' : 'warning')}>
          <p className="text-2xl font-bold text-amber-400">{warnings.length}</p>
          <p className="text-[11px] text-gray-500">Warnings</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`p-4 rounded-xl border cursor-pointer ${filter === 'info' ? 'border-blue-500/30 bg-blue-500/5' : 'border-white/[0.06] bg-dark-surface/60'}`}
          onClick={() => setFilter(filter === 'info' ? 'all' : 'info')}>
          <p className="text-2xl font-bold text-blue-400">{alerts.length - critical.length - warnings.length}</p>
          <p className="text-[11px] text-gray-500">Info</p>
        </motion.div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filtered.map((alert, i) => {
          const isCritical = alert.severity === 'critical' || alert.type === 'critical';
          const isWarning = alert.severity === 'warning' || alert.type === 'warning';
          const borderColor = isCritical ? 'border-red-500/20' : isWarning ? 'border-amber-500/20' : 'border-blue-500/20';
          const bgColor = isCritical ? 'bg-red-500/5' : isWarning ? 'bg-amber-500/5' : 'bg-blue-500/5';
          const iconColor = isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-blue-400';
          const Icon = isCritical ? AlertTriangle : isWarning ? Shield : Info;

          return (
            <motion.div key={alert.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`${bgColor} border ${borderColor} rounded-xl p-4 ${!alert.read ? 'ring-1 ring-white/5' : 'opacity-60'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{alert.title}</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{alert.message}</p>
                    <p className="text-[10px] text-gray-600 mt-1.5">{new Date(alert.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {!alert.read && (
                  <button onClick={() => markRead(alert.id)} className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-white flex-shrink-0">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-sm text-gray-500">{filter === 'all' ? 'No alerts yet' : `No ${filter} alerts`}</p>
          </div>
        )}
      </div>

      <p className="text-[10px] text-gray-600 italic">⚠️ AI-generated alerts based on lab values. Consult your doctor for medical decisions.</p>
    </div>
  );
}