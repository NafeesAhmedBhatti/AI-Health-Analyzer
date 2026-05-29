'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Trash2, AlertCircle } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; }

const SUGGESTIONS = [
  'What do my lab results mean?',
  'Explain my current medications',
  'How can I improve my health score?',
  'What lifestyle changes do you recommend?',
  'Tell me about my active health alerts',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streamText]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setStreaming(true);
    setStreamText('');

    try {
      abortRef.current = new AbortController();
      const history = newMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), history }),
        signal: abortRef.current.signal,
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
          setStreamText(full);
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: full }]);
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
      }
    } finally {
      setStreaming(false);
      setStreamText('');
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const clearChat = () => { setMessages([]); setStreamText(''); };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.2)]">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">AI Health Assistant</h1>
            <p className="text-xs text-gray-500">Powered by your lab data • Real-time responses</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-red-400 hover:bg-red-500/[0.08] rounded-lg transition-colors">
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0 sidebar-scroll">
        {messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-neon-blue" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Ask me anything about your health</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">I have access to your lab reports, vitals, medications, and health alerts. Try one of these:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)}
                  className="text-left p-3 bg-dark-surface/60 border border-white/[0.06] rounded-xl text-xs text-gray-400 hover:text-white hover:border-neon-blue/30 hover:bg-neon-blue/5 transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-neon-blue/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5 text-neon-blue" />
                </div>
              )}
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-neon-blue/10 text-white border border-neon-blue/20 rounded-br-md'
                  : 'bg-dark-surface/60 text-gray-300 border border-white/[0.06] rounded-bl-md'
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-neon-purple/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-3.5 h-3.5 text-neon-purple" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Streaming response */}
        {streaming && streamText && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-neon-blue/10 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-3.5 h-3.5 text-neon-blue" />
            </div>
            <div className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed bg-dark-surface/60 text-gray-300 border border-white/[0.06] rounded-bl-md">
              <div className="whitespace-pre-wrap">{streamText}<span className="inline-block w-1.5 h-4 bg-neon-blue/60 ml-0.5 animate-pulse" /></div>
            </div>
          </div>
        )}
        {streaming && !streamText && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-neon-blue/10 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-3.5 h-3.5 text-neon-blue animate-pulse" />
            </div>
            <div className="px-4 py-3 rounded-2xl text-sm bg-dark-surface/60 border border-white/[0.06] rounded-bl-md text-gray-500">
              Thinking<span className="animate-pulse">...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Disclaimer */}
      <div className="flex items-center gap-1.5 py-2 px-1">
        <AlertCircle className="w-3 h-3 text-amber-500/60" />
        <p className="text-[10px] text-gray-600">AI-generated responses. Not medical advice. Always consult your healthcare provider.</p>
      </div>

      {/* Input */}
      <div className="flex gap-2 pb-1">
        <div className="flex-1 relative">
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown} rows={1} placeholder="Ask about your health, lab results, medications..."
                  aria-label="Type your health question"
            className="w-full bg-dark-surface/80 border border-white/[0.06] rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder:text-gray-600 focus:border-neon-blue/40 focus:outline-none resize-none transition-colors"
            style={{ maxHeight: '120px' }} onInput={e => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 120) + 'px'; }}
          />
        </div>
        <button onClick={() => sendMessage(input)} disabled={streaming || !input.trim()}
          className={`px-4 rounded-xl transition-all flex items-center justify-center ${
            streaming || !input.trim() ? 'bg-white/5 text-gray-600' : 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20 hover:bg-neon-blue/20'
          }`}>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}