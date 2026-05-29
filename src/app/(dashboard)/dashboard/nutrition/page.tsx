'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Apple, Flame, Beef, Wheat, Droplets, Plus, X, Shield, Clock, Calendar, Utensils, ChevronDown, ChevronUp, Pill, AlertCircle, CheckCircle, FileText, Send, Bot, User, Sparkles, Trash2, MessageCircle } from 'lucide-react';

import { useActiveReport } from '@/hooks/useActiveReport';

interface NutritionPlan {
  dailyCalories: number;
  macroSplit: { protein: string; carbs: string; fats: string };
  meals: { name: string; time: string; calories: number; foods: string[] }[];
  weeklyPlan: Record<string, string[]>;
  foodsToAdd: { name: string; reason: string; servingSize: string }[];
  foodsToAvoid: { name: string; reason: string; alternative: string }[];
  supplements: { name: string; dosage: string; reason: string }[];
}

interface ChatMessage { role: 'user' | 'assistant'; content: string; }

function normalizeFoodItems(items: any[]): { name: string; reason: string; servingSize?: string; alternative?: string }[] {
  if (!Array.isArray(items)) return [];
  return items.map(item => {
    if (typeof item === 'string') {
      const parts = item.split(' - ');
      return { name: parts[0] || item, reason: parts.slice(1).join(' - ') || '', servingSize: '' };
    }
    return { name: item.name || '', reason: item.reason || '', servingSize: item.servingSize || '', alternative: item.alternative || '' };
  });
}

function normalizeSupplements(items: any[]): { name: string; dosage: string; reason: string }[] {
  if (!Array.isArray(items)) return [];
  return items.map(item => {
    if (typeof item === 'string') {
      const parts = item.split(' - ');
      return { name: parts[0] || item, dosage: '', reason: parts.slice(1).join(' - ') || '' };
    }
    return { name: item.name || '', dosage: item.dosage || '', reason: item.reason || '' };
  });
}

function MacroBar({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  const pct = parseInt(value) || 0;
  return (
    <div className="bg-dark-surface/40 border border-white/[0.04] rounded-xl p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-xs text-gray-400"><Icon className={`w-3.5 h-3.5 ${color}`} />{label}</span>
        <span className="text-sm font-semibold text-white">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5">
        <div className={`h-1.5 rounded-full ${color === 'text-red-400' ? 'bg-red-400' : color === 'text-amber-400' ? 'bg-amber-400' : 'bg-neon-blue'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const NUTRITION_SUGGESTIONS = [
  'Make me a full weekly diet plan 🥗',
  'What foods should I avoid based on my report?',
  'Suggest a high-protein meal plan for me',
  'I want to gain weight, what should I eat?',
  'Create a low-sugar diet plan for me',
  'What supplements do I need based on my lab values?',
];

export default function NutritionPage() {
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [conditions, setConditions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const { report: activeReport } = useActiveReport();

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatStreaming, setChatStreaming] = useState(false);
  const [chatStreamText, setChatStreamText] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch('/api/nutrition').then(r => r.json()).then(data => {
      const item = Array.isArray(data) ? data[0] : data;
      if (item?.planData) setPlan(item.planData);
      if (item?.goals?.conditions) setConditions(item.goals.conditions);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, chatStreamText]);

  const sendChatMessage = async (text: string) => {
    if (!text.trim() || chatStreaming) return;
    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput('');
    setChatStreaming(true);
    setChatStreamText('');

    try {
      chatAbortRef.current = new AbortController();
      const history = newMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/nutrition-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), history }),
        signal: chatAbortRef.current.signal,
      });

      if (!res.ok) throw new Error('Chat failed');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          full += chunk;
          setChatStreamText(full);
        }
      }

      setChatMessages(prev => [...prev, { role: 'assistant', content: full }]);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again. 😔' }]);
      }
    } finally {
      setChatStreaming(false);
      setChatStreamText('');
      chatAbortRef.current = null;
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(chatInput); }
  };

  const clearChat = () => { setChatMessages([]); setChatStreamText(''); };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-2 border-white/20 border-t-neon-blue rounded-full animate-spin" /></div>;

  if (!plan) return (
    <div className="text-center py-20">
      <Apple className="w-12 h-12 text-gray-600 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-white mb-2">No AI Diet Plan Yet</h2>
      <p className="text-sm text-gray-500 max-w-md mx-auto">Upload a lab report to get a personalized AI nutrition plan based on your specific health conditions and lab values.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Nutrition Plan</h1>
        <p className="text-sm text-gray-500 mt-1">Personalized diet based on your lab report analysis</p>
        {activeReport && (
          <div className="flex items-center gap-1.5 mt-1">
            <FileText className="w-3 h-3 text-neon-purple/70" />
            <span className="text-[11px] text-neon-purple/80">Based on: {activeReport.fileName}</span>
          </div>
        )}
        {conditions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {conditions.map((c, i) => <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">{c}</span>)}
          </div>
        )}
      </div>

      {/* Calorie + Macros */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-orange-400" />
          <h3 className="text-sm font-semibold text-white">Daily Caloric Target</h3>
        </div>
        <div className="text-4xl font-bold text-white mb-1">{plan.dailyCalories} <span className="text-lg text-gray-500">kcal</span></div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <MacroBar label="Protein" value={plan.macroSplit?.protein || '25%'} icon={Beef} color="text-red-400" />
          <MacroBar label="Carbs" value={plan.macroSplit?.carbs || '45%'} icon={Wheat} color="text-amber-400" />
          <MacroBar label="Fats" value={plan.macroSplit?.fats || '30%'} icon={Droplets} color="text-neon-blue" />
        </div>
      </motion.div>

      {/* Daily Meals */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Utensils className="w-5 h-5 text-neon-blue" />
          <h3 className="text-sm font-semibold text-white">Daily Meal Plan</h3>
        </div>
        <div className="space-y-3">
          {(plan.meals || []).map((meal, i) => (
            <div key={i} className="bg-dark-surface/40 border border-white/[0.04] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-sm font-medium text-white">{meal.name}</span>
                  <span className="text-[10px] text-gray-600">{meal.time}</span>
                </div>
                <span className="text-xs text-neon-blue font-medium">{meal.calories} kcal</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {meal.foods?.map((food, fi) => (
                  <span key={fi} className="text-[11px] px-2 py-1 rounded-lg bg-white/[0.03] text-gray-400 border border-white/[0.04]">{food}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Weekly Plan */}
      {plan.weeklyPlan && Object.keys(plan.weeklyPlan).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-neon-purple" />
            <h3 className="text-sm font-semibold text-white">7-Day Weekly Plan</h3>
          </div>
          <div className="space-y-2">
            {Object.entries(plan.weeklyPlan).map(([day, meals]) => (
              <div key={day} className="border border-white/[0.04] rounded-xl overflow-hidden">
                <button onClick={() => setExpandedDay(expandedDay === day ? null : day)}
                  className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors">
                  <span className="text-sm font-medium text-white capitalize">{day}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-600">{(meals as string[]).length} meals</span>
                    {expandedDay === day ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
                  </div>
                </button>
                {expandedDay === day && (
                  <div className="px-3 pb-3 space-y-1.5">
                    {(meals as string[]).map((meal, mi) => (
                      <div key={mi} className="text-xs text-gray-400 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-neon-blue" />
                        {meal}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Foods to Add / Avoid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-dark-surface/60 border border-green-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-semibold text-green-400">Foods to Add</h3>
          </div>
          <div className="space-y-3">
            {(normalizeFoodItems(plan.foodsToAdd || [])).map((food, i) => (
              <div key={i} className="bg-green-500/5 border border-green-500/10 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-white">{food.name}</p>
                  <span className="text-[10px] text-green-400/70 shrink-0 ml-2">{food.servingSize}</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">{food.reason}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-dark-surface/60 border border-red-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <X className="w-5 h-5 text-red-400" />
            <h3 className="text-sm font-semibold text-red-400">Foods to Avoid</h3>
          </div>
          <div className="space-y-3">
            {(normalizeFoodItems(plan.foodsToAvoid || [])).map((food, i) => (
              <div key={i} className="bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                <p className="text-sm font-medium text-white">{food.name}</p>
                {food.reason && <p className="text-[11px] text-gray-500 mt-1">❌ {food.reason}</p>}
                {food.alternative && <p className="text-[11px] text-green-500/70 mt-0.5">✅ Alternative: {food.alternative}</p>}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Supplements */}
      {plan.supplements && plan.supplements.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-dark-surface/60 border border-neon-purple/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Pill className="w-5 h-5 text-neon-purple" />
            <h3 className="text-sm font-semibold text-white">Recommended Supplements</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(normalizeSupplements(plan.supplements)).map((supp, i) => (
              <div key={i} className="bg-neon-purple/5 border border-neon-purple/10 rounded-xl p-4">
                <p className="text-sm font-medium text-white">{supp.name}</p>
                {supp.dosage && <p className="text-xs text-neon-purple mt-1">{supp.dosage}</p>}
                {supp.reason && <p className="text-[11px] text-gray-500 mt-1">{supp.reason}</p>}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══════════ NAFEXA AI — Nutrition Chat Section ═══════════ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-900/20 via-dark-surface/60 to-neon-blue/10 border border-emerald-500/20 rounded-2xl overflow-hidden">

        {/* Chat Header */}
        <button onClick={() => setChatOpen(!chatOpen)}
          className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-neon-blue/20 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Nafexa AI</h3>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">NUTRITION EXPERT</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">Ask me anything about your diet plan • Powered by your lab data</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {chatMessages.length > 0 && (
              <button onClick={(e) => { e.stopPropagation(); clearChat(); }}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${chatOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Chat Body */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden">
              <div className="px-5 pb-5">

                {/* Messages Area */}
                <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1 mb-4 sidebar-scroll">
                  {chatMessages.length === 0 && !chatStreaming && (
                    <div className="flex flex-col items-center py-6 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-neon-blue/10 flex items-center justify-center mb-3 border border-emerald-500/10">
                        <MessageCircle className="w-6 h-6 text-emerald-400" />
                      </div>
                      <p className="text-sm text-gray-400 mb-1">Hi! I'm <span className="text-emerald-400 font-semibold">Nafexa AI</span> 🌿</p>
                      <p className="text-xs text-gray-600 mb-4 max-w-sm">Your personal nutrition expert. I know your lab results and can create custom diet plans for you.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                        {NUTRITION_SUGGESTIONS.map((s, i) => (
                          <button key={i} onClick={() => sendChatMessage(s)}
                            className="text-left p-3 bg-dark-surface/40 border border-white/[0.04] rounded-xl text-xs text-gray-400 hover:text-white hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {chatMessages.map((msg, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-1 border border-emerald-500/10">
                            <Bot className="w-3 h-3 text-emerald-400" />
                          </div>
                        )}
                        <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-neon-blue/10 text-white border border-neon-blue/20 rounded-br-md'
                            : 'bg-dark-surface/60 text-gray-300 border border-white/[0.06] rounded-bl-md'
                        }`}>
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-6 h-6 rounded-lg bg-neon-purple/10 flex items-center justify-center flex-shrink-0 mt-1">
                            <User className="w-3 h-3 text-neon-purple" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Streaming response */}
                  {chatStreaming && chatStreamText && (
                    <div className="flex gap-2.5 justify-start">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-1 border border-emerald-500/10">
                        <Bot className="w-3 h-3 text-emerald-400" />
                      </div>
                      <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed bg-dark-surface/60 text-gray-300 border border-white/[0.06] rounded-bl-md">
                        <div className="whitespace-pre-wrap">{chatStreamText}<span className="inline-block w-1.5 h-4 bg-emerald-400/60 ml-0.5 animate-pulse" /></div>
                      </div>
                    </div>
                  )}
                  {chatStreaming && !chatStreamText && (
                    <div className="flex gap-2.5 justify-start">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-1 border border-emerald-500/10">
                        <Bot className="w-3 h-3 text-emerald-400 animate-pulse" />
                      </div>
                      <div className="px-3.5 py-2.5 rounded-2xl text-sm bg-dark-surface/60 border border-white/[0.06] rounded-bl-md text-gray-500">
                        Nafexa is thinking<span className="animate-pulse">...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Disclaimer */}
                <div className="flex items-center gap-1.5 mb-3 px-1">
                  <AlertCircle className="w-3 h-3 text-amber-500/60" />
                  <p className="text-[10px] text-gray-600">AI-generated nutrition advice by Nafexa AI. Consult a dietitian for professional guidance.</p>
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <textarea value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={handleChatKeyDown} rows={1} placeholder="Ask Nafexa about your diet plan..."
                      aria-label="Type your nutrition question"
                      className="w-full bg-dark-surface/80 border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-emerald-500/40 focus:outline-none resize-none transition-colors"
                      style={{ maxHeight: '100px' }}
                      onInput={e => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 100) + 'px'; }}
                    />
                  </div>
                  <button onClick={() => sendChatMessage(chatInput)} disabled={chatStreaming || !chatInput.trim()}
                    aria-label="Send message"
                    className={`px-4 rounded-xl transition-all flex items-center justify-center ${
                      chatStreaming || !chatInput.trim()
                        ? 'bg-white/5 text-gray-600'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                    }`}>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <p className="text-[10px] text-gray-600 italic">⚠️ AI-generated nutrition plan based on lab values. Consult a dietitian before making dietary changes.</p>
    </div>
  );
}