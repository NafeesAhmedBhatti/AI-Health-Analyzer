'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Heart, Moon, Activity, Sun, Wind, Smile, AlertCircle, Coffee, Dumbbell, BookOpen, Users, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useActiveReport } from '@/hooks/useActiveReport';

export default function MentalHealthPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { report: activeReport } = useActiveReport();

  useEffect(() => {
    fetch('/api/mental-health').then(r => r.json()).then(d => {
      // API returns an array — take first item
      const item = Array.isArray(d) ? d[0] : d;
      if (item) setData(item);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-2 border-white/20 border-t-neon-blue rounded-full animate-spin" /></div>;

  if (!data) return (
    <div className="text-center py-20">
      <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">No Mental Health Assessment</h2>
      <p className="text-sm text-gray-500 max-w-md mx-auto">Upload a lab report to get an AI mental health assessment based on how your lab values affect mood, cognition, and stress.</p>
    </div>
  );

  const tags = (data.tags as any) || {};
  const isAiGenerated = tags.type === 'ai_generated';
  const exercise = tags.exercise || {};
  const exerciseObj = typeof exercise === 'string' ? { type: exercise, duration: '', frequency: '', notes: '' } : exercise;
  const relaxationTips = tags.relaxationTips || [];
  const cognitiveEffects = tags.cognitiveEffects || '';
  const professionalHelp = tags.professionalHelp || '';
  const anxietyRisk = tags.anxietyRisk || '';

  const stressColor = (data.anxietyScore ?? 0) >= 7 ? 'text-red-400' : (data.anxietyScore ?? 0) >= 4 ? 'text-amber-400' : 'text-green-400';
  const stressLabel = (data.anxietyScore ?? 0) >= 7 ? 'High' : (data.anxietyScore ?? 0) >= 4 ? 'Moderate' : 'Low';
  const moodEmoji = (data.moodScore ?? 3) <= 2 ? '😞' : (data.moodScore ?? 3) <= 3 ? '😐' : (data.moodScore ?? 3) <= 4 ? '🙂' : '😊';
  const energyColor = (data.energyScore ?? 5) >= 7 ? 'text-green-400' : (data.energyScore ?? 5) >= 4 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mental Health Assessment</h1>
        <p className="text-sm text-gray-500 mt-1">AI analysis based on how your lab values impact mental health</p>
        {activeReport && (
          <div className="flex items-center gap-1.5 mt-1">
            <FileText className="w-3 h-3 text-neon-purple/70" />
            <span className="text-[11px] text-neon-purple/80">Based on: {activeReport.fileName}</span>
          </div>
        )}
      </div>

      {/* Overview Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-surface/60 border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-3xl mb-1">{moodEmoji}</p>
          <p className="text-2xl font-bold text-white">{data.moodScore ?? 3}/5</p>
          <p className="text-[11px] text-gray-500">Mood</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-dark-surface/60 border border-white/[0.06] rounded-xl p-4 text-center">
          <Activity className={`w-6 h-6 mx-auto mb-2 ${stressColor}`} />
          <p className="text-2xl font-bold text-white">{data.anxietyScore ?? 5}/10</p>
          <p className="text-[11px] text-gray-500">Stress</p>
          <p className={`text-[10px] ${stressColor}`}>{stressLabel}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-dark-surface/60 border border-white/[0.06] rounded-xl p-4 text-center">
          <Sun className={`w-6 h-6 mx-auto mb-2 ${energyColor}`} />
          <p className="text-2xl font-bold text-white">{data.energyScore ?? 5}/10</p>
          <p className="text-[11px] text-gray-500">Energy</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-dark-surface/60 border border-white/[0.06] rounded-xl p-4 text-center">
          <Moon className="w-6 h-6 mx-auto mb-2 text-neon-purple" />
          <p className="text-2xl font-bold text-white">{data.sleepQuality ?? 7}h</p>
          <p className="text-[11px] text-gray-500">Sleep</p>
        </motion.div>
      </div>

      {/* Overall Assessment */}
      {data.notes && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-neon-purple/10 to-neon-blue/10 border border-neon-purple/20 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-neon-purple flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-neon-purple mb-2">Overall Assessment</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{data.notes}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Anxiety Risk */}
      {(anxietyRisk || data.notes) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border ${(data.anxietyScore ?? 5) >= 7 ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
          <p className="text-xs font-semibold text-amber-400 mb-1">Anxiety Risk</p>
          <p className="text-sm text-gray-300">{anxietyRisk || data.notes || ''}</p>
        </motion.div>
      )}

      {/* Cognitive Effects */}
      {cognitiveEffects && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-neon-blue flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Cognitive Effects</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{cognitiveEffects}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Exercise Recommendation */}
      {(exerciseObj.type || typeof exercise === 'string') && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-dark-surface/60 border border-green-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-semibold text-green-400">Exercise Recommendation</h3>
          </div>
          {typeof exercise === 'string' ? (
            <p className="text-sm text-gray-300 leading-relaxed">{exercise}</p>
          ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {exerciseObj.type && <div className="p-2.5 rounded-lg bg-green-500/5 border border-green-500/10">
              <p className="text-[10px] text-gray-500">Type</p>
              <p className="text-sm text-white">{exerciseObj.type}</p>
            </div>}
            {exerciseObj.duration && <div className="p-2.5 rounded-lg bg-green-500/5 border border-green-500/10">
              <p className="text-[10px] text-gray-500">Duration</p>
              <p className="text-sm text-white">{exerciseObj.duration}</p>
            </div>}
            {exerciseObj.frequency && <div className="p-2.5 rounded-lg bg-green-500/5 border border-green-500/10">
              <p className="text-[10px] text-gray-500">Frequency</p>
              <p className="text-sm text-white">{exerciseObj.frequency}</p>
            </div>}
            {exerciseObj.notes && <div className="p-2.5 rounded-lg bg-green-500/5 border border-green-500/10">
              <p className="text-[10px] text-gray-500">Notes</p>
              <p className="text-sm text-white">{exerciseObj.notes}</p>
            </div>}
          </div>
          )}
        </motion.div>
      )}

      {/* Relaxation Tips */}
      {relaxationTips.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-dark-surface/60 border border-neon-purple/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wind className="w-5 h-5 text-neon-purple" />
            <h3 className="text-sm font-semibold text-white">Relaxation & Coping Tips</h3>
          </div>
          <div className="space-y-2">
            {relaxationTips.map((tip: string, i: number) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-neon-purple/5 border border-neon-purple/10">
                <span className="text-neon-purple text-xs mt-0.5">●</span>
                <p className="text-sm text-gray-300">{tip}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Professional Help */}
      {professionalHelp && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-400 mb-2">Professional Help Recommendation</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{professionalHelp}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Crisis Resources — Always Show */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-400 mb-3">Crisis Resources & Helplines</h3>
            <p className="text-xs text-gray-400 mb-3">If you or someone you know is in crisis, reach out immediately:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                <span className="text-lg">🇺🇸</span>
                <div>
                  <p className="text-xs font-medium text-white">988 Suicide & Crisis Lifeline</p>
                  <p className="text-[11px] text-gray-400">Call or text <span className="text-white font-medium">988</span> — Available 24/7</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                <span className="text-lg">💬</span>
                <div>
                  <p className="text-xs font-medium text-white">Crisis Text Line</p>
                  <p className="text-[11px] text-gray-400">Text <span className="text-white font-medium">HOME</span> to <span className="text-white font-medium">741741</span></p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                <span className="text-lg">🌍</span>
                <div>
                  <p className="text-xs font-medium text-white">International Association for Suicide Prevention</p>
                  <p className="text-[11px] text-gray-400">Find a helpline: <span className="text-neon-blue">iasp.info/resources/Crisis_Centres</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <p className="text-[10px] text-gray-600 italic">⚠️ AI mental health assessment based on lab values. Not a substitute for professional mental health care.</p>
    </div>
  );
}