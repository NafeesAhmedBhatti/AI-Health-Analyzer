'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Heart, Activity, Droplets, Moon, Wind, Thermometer,
  Sparkles, ArrowRight, Menu, X, Play,
  Shield, Zap, Brain, UserCheck,
  Upload, FileCheck, TrendingUp,
  Flame,
} from 'lucide-react';
import Link from 'next/link';
import VideoModal from '@/components/video-modal';

/* ── Animated Health Score Ring (inside phone) ── */
function PhoneHealthRing({ score, size = 90 }: { score: number; size?: number }) {
  const [current, setCurrent] = useState(0);
  const sw = 5;
  const radius = (size - sw) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (current / 100) * circ;

  useEffect(() => {
    let c = 0;
    const t = setInterval(() => {
      c += 2;
      if (c >= score) { setCurrent(score); clearInterval(t); } else setCurrent(c);
    }, 25);
    return () => clearInterval(t);
  }, [score]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full" style={{ transform: 'rotate(-90deg)' }} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="url(#phoneGrad)" strokeWidth={sw}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.15s ease', filter: 'drop-shadow(0 0 6px rgba(0,194,255,0.5))' }} />
        <defs>
          <linearGradient id="phoneGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[28px] font-bold text-white leading-none">{current}</span>
        <span className="text-[8px] text-white/40 uppercase tracking-widest">Score</span>
      </div>
    </div>
  );
}

/* ── ECG Pulse (inside phone) ── */
function MiniPulse() {
  return (
    <svg viewBox="0 0 120 30" className="w-full h-6" preserveAspectRatio="none">
      <path d="M0,15 L20,15 L28,6 L36,24 L44,10 L52,20 L58,15 L120,15" fill="none" stroke="rgba(16,185,129,0.4)" strokeWidth="1" />
      <path d="M0,15 L20,15 L28,6 L36,24 L44,10 L52,20 L58,15 L120,15" fill="none" stroke="url(#miniPulse)" strokeWidth="1.5" strokeDasharray="80">
        <animate attributeName="stroke-dashoffset" from="80" to="0" dur="1.8s" repeatCount="indefinite" />
      </path>
      <defs>
        <linearGradient id="miniPulse" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Floating Glass Card ── */
function FloatCard({ icon: Icon, title, sub, color, bgTint, style }: {
  icon: any; title: string; sub: string; color: string; bgTint: string; style?: React.CSSProperties;
}) {
  return (
    <div className="rounded-2xl p-4 backdrop-blur-md" style={{
      background: bgTint,
      border: `1px solid ${color}30`,
      boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 20px ${color}15`,
      ...style,
    }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
          background: `${color}20`, boxShadow: `0 0 12px ${color}25`,
        }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-[13px] font-semibold text-white">{title}</span>
      </div>
      <p className="text-[11px] text-white/40">{sub}</p>
    </div>
  );
}

/* ── Feature Card ── */
function FeatureCard({ icon: Icon, title, desc, color, delay }: {
  icon: any; title: string; desc: string; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-2xl p-6 backdrop-blur-md group cursor-pointer transition-all duration-500 hover:-translate-y-2"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110"
        style={{ background: `${color}15`, boxShadow: `0 0 24px ${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <h3 className="text-[16px] font-bold text-white mb-2">{title}</h3>
      <p className="text-[13px] text-white/40 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

/* ── Particle system ── */
function Particles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 2.5 + 1,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.3 + 0.1,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full particle-float"
          style={{
            width: p.size, height: p.size,
            left: p.left, top: p.top,
            background: `radial-gradient(circle, rgba(0,194,255,${p.opacity + 0.2}), rgba(123,97,255,${p.opacity}))`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }} />
      ))}
    </div>
  );
}

/* ── Realistic Plant SVG ── */
function Plant({ mirror = false }: { mirror?: boolean }) {
  return (
    <svg width="60" height="100" viewBox="0 0 60 100" fill="none" style={mirror ? { transform: 'scaleX(-1)' } : {}}>
      {/* Pot */}
      <path d="M14 62 L12 90 Q12 96 18 96 L42 96 Q48 96 48 90 L46 62 Z" fill="#1a1a2e" stroke="#2d2b55" strokeWidth="1" />
      <rect x="10" y="58" width="40" height="6" rx="2" fill="#2d2b55" />
      {/* Pot rim glow */}
      <rect x="10" y="58" width="40" height="6" rx="2" fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="0.5" />

      {/* Soil */}
      <ellipse cx="30" cy="63" rx="14" ry="3" fill="#1a0e2e" />

      {/* Main stem */}
      <path d="M30 62 Q29 45 30 30" stroke="#0d5e2e" strokeWidth="2" fill="none" />

      {/* Left leaf cluster */}
      <path d="M30 50 Q18 42 12 48 Q18 38 28 46 Z" fill="#0d5e2e" />
      <path d="M30 50 Q18 42 12 48 Q18 38 28 46 Z" fill="none" stroke="rgba(16,185,129,0.15)" strokeWidth="0.5" />

      <path d="M30 42 Q16 30 10 36 Q18 26 28 38 Z" fill="#0a4d25" />
      <path d="M30 42 Q16 30 10 36 Q18 26 28 38 Z" fill="none" stroke="rgba(16,185,129,0.12)" strokeWidth="0.5" />

      {/* Right leaf cluster */}
      <path d="M30 48 Q42 40 48 46 Q42 36 32 44 Z" fill="#0d5e2e" />
      <path d="M30 48 Q42 40 48 46 Q42 36 32 44 Z" fill="none" stroke="rgba(16,185,129,0.15)" strokeWidth="0.5" />

      <path d="M30 38 Q44 26 50 32 Q44 22 32 34 Z" fill="#0a4d25" />
      <path d="M30 38 Q44 26 50 32 Q44 22 32 34 Z" fill="none" stroke="rgba(16,185,129,0.12)" strokeWidth="0.5" />

      {/* Top leaf */}
      <path d="M30 30 Q24 18 22 22 Q26 14 30 26 Z" fill="#10B981" opacity="0.7" />
      <path d="M30 30 Q36 18 38 22 Q34 14 30 26 Z" fill="#10B981" opacity="0.6" />

      {/* Neon reflection on leaves */}
      <ellipse cx="22" cy="42" rx="3" ry="1.5" fill="rgba(0,194,255,0.08)" />
      <ellipse cx="40" cy="36" rx="2.5" ry="1" fill="rgba(0,194,255,0.06)" />
    </svg>
  );
}

/* ════════════════════════════════════════
   LANDING PAGE
   ════════════════════════════════════════ */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#050816' }}>

      {/* ══ PARTICLES ══ */}
      <Particles />

      {/* ══ NAVBAR ══ */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(5,8,22,0.6)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(0,194,255,0.06)',
          boxShadow: '0 1px 0 rgba(0,194,255,0.05)',
        }}
      >
        <div className="max-w-7xl mx-auto w-full px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              boxShadow: '0 0 16px rgba(99,102,241,0.3)',
            }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="leading-tight">
              <span className="text-[16px] font-bold text-white block leading-none">AI Health Analyzer</span>
              <span className="text-[10px] text-white/30 tracking-wider">HEALTH ANALYZER</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {['Home', 'Features', 'About'].map((item, i) => (
              <a key={item} href={i === 1 ? '#features' : '#'}
                className={`text-[13px] transition-colors ${i === 0 ? 'text-white' : 'text-white/40 hover:text-white/80'}`}
              >
                {item}
              </a>
            ))}
          </div>

          <div className="hidden md:block">
            <Link href="/login" className="text-[13px] font-semibold text-white px-5 py-2 rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,194,255,0.3)]"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #00C2FF)' }}>
              Get Started
            </Link>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-white/50">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="md:hidden px-6 py-5 space-y-4"
            style={{ background: 'rgba(5,8,22,0.95)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {['Home', 'Features', 'About'].map((item) => (
              <a key={item} href="#" onClick={() => setMenuOpen(false)}
                className="block text-[14px] text-white/60">{item}</a>
            ))}
            <Link href="/login" className="block text-[14px] font-semibold text-cyan-400">Get Started →</Link>
          </motion.div>
        )}
      </motion.nav>

      {/* ══ HERO SECTION ══ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-20 pb-24" style={{ overflow: 'hidden' }}>
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[700px] pointer-events-none" style={{
          background: 'radial-gradient(ellipse, rgba(109,91,255,0.08) 0%, rgba(0,194,255,0.03) 35%, transparent 60%)',
        }} />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 w-full max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

            {/* ════ LEFT: Text ════ */}
            <div className="text-center lg:text-left">
              {/* AI Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
                style={{
                  background: 'rgba(109,91,255,0.1)',
                  border: '1px solid rgba(109,91,255,0.2)',
                  boxShadow: '0 0 16px rgba(109,91,255,0.1)',
                }}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[12px] font-medium text-purple-300">Powered by Advanced AI</span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-[44px] sm:text-[56px] lg:text-[68px] font-extrabold tracking-tight leading-[1.05] mb-2"
              >
                <span className="text-white">AI Health</span>
                <br />
                <span className="text-white">Analyzer</span>
              </motion.h1>

              {/* Subheading */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="text-[28px] sm:text-[36px] font-bold mb-6"
                style={{
                  background: 'linear-gradient(135deg, #00C2FF, #7B61FF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Smart. Fast. Reliable.
              </motion.p>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-[16px] text-[#B8C0D4] max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed"
              >
                Upload your reports, describe your symptoms, and get accurate health insights in seconds using advanced AI technology.
              </motion.p>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.6 }}
                className="flex flex-col sm:flex-row items-center lg:items-start gap-4"
              >
                <Link href="/login" className="group flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold text-[15px] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,194,255,0.4)] hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #4F46E5, #00C2FF)' }}>
                  Analyze Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
<button onClick={() => setVideoOpen(true)} className="group flex items-center gap-2 px-7 py-3.5 rounded-xl text-white/70 font-semibold text-[15px] transition-all duration-300 hover:text-white hover:border-white/30"
	                  style={{ border: '2px solid rgba(255,255,255,0.15)' }}>
	                  <Play className="w-4 h-4" />
	                  Watch Demo
	                </button>
              </motion.div>
            </div>

            {/* ════ RIGHT: 3D Phone on Ring Stage + Plants ════ */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative flex justify-center items-end"
              style={{ perspective: '1200px', minHeight: '500px' }}
            >
              {/* ── GLOWING CIRCULAR RING / STAGE ── */}
              {/* Wide ambient glow under ring */}
              <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-[400px] h-[120px] pointer-events-none" style={{
                background: 'radial-gradient(ellipse, rgba(0,194,255,0.2) 0%, rgba(123,97,255,0.1) 40%, transparent 65%)',
                filter: 'blur(30px)',
                animation: 'platform-pulse 4s ease-in-out infinite',
              }} />

              {/* The ring itself — horizontal elliptical platform */}
              <div className="absolute bottom-[24%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] pointer-events-none" style={{
                animation: 'ring-rotate 20s linear infinite',
              }}>
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-full" style={{
                  border: '3px solid rgba(123,97,255,0.3)',
                  boxShadow: '0 0 30px rgba(123,97,255,0.2), 0 0 60px rgba(0,194,255,0.1), inset 0 0 30px rgba(123,97,255,0.08)',
                  transform: 'rotateX(75deg)',
                }} />
                {/* Inner glow ring */}
                <div className="absolute inset-[8px] rounded-full" style={{
                  border: '2px solid rgba(0,194,255,0.15)',
                  boxShadow: '0 0 20px rgba(0,194,255,0.1), inset 0 0 15px rgba(0,194,255,0.05)',
                  transform: 'rotateX(75deg)',
                }} />
              </div>

              {/* Solid platform surface (elliptical from perspective) */}
              <div className="absolute bottom-[22%] left-1/2 -translate-x-1/2 w-[280px] h-[16px] pointer-events-none" style={{
                background: 'radial-gradient(ellipse, rgba(123,97,255,0.12) 0%, rgba(0,194,255,0.06) 50%, transparent 80%)',
                borderRadius: '50%',
                boxShadow: '0 0 40px rgba(123,97,255,0.15), 0 0 80px rgba(0,194,255,0.06)',
              }} />

              {/* ── 3D SMARTPHONE ── */}
              <div className="relative z-10" style={{ transform: 'rotateY(-5deg) rotateX(2deg)', transformStyle: 'preserve-3d' }}>
                {/* Phone body */}
                <div className="relative w-[250px] sm:w-[270px] rounded-[36px] p-[7px]" style={{
                  background: 'linear-gradient(145deg, #1e1e3a, #0d0d1a, #16162e)',
                  border: '2px solid rgba(255,255,255,0.08)',
                  boxShadow: `
                    0 30px 80px rgba(0,0,0,0.5),
                    0 0 60px rgba(0,194,255,0.1),
                    0 0 120px rgba(123,97,255,0.05),
                    inset 0 1px 0 rgba(255,255,255,0.12),
                    inset 0 -1px 0 rgba(0,0,0,0.3)
                  `,
                }}>
                  {/* Screen */}
                  <div className="rounded-[28px] overflow-hidden" style={{
                    background: 'linear-gradient(180deg, #0B1023, #0a0f1e)',
                  }}>
                    {/* Notch */}
                    <div className="flex justify-center pt-2 pb-1">
                      <div className="w-20 h-5 rounded-full" style={{ background: '#000', border: '1px solid rgba(255,255,255,0.04)' }} />
                    </div>

                    {/* Screen Content */}
                    <div className="px-4 pb-5 pt-2">
                      {/* Status bar */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[9px] text-white/30">9:41</span>
                        <div className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[8px] text-white/30">Live</span>
                        </div>
                      </div>

                      {/* Health Score */}
                      <div className="flex items-center gap-4 mb-4">
                        <PhoneHealthRing score={85} size={80} />
                        <div>
                          <p className="text-[14px] font-bold text-emerald-400 mb-0.5">Good</p>
                          <p className="text-[9px] text-white/30 leading-snug max-w-[100px]">Your overall health looks good!</p>
                        </div>
                      </div>

                      {/* Vitals */}
                      <div className="space-y-2 mb-3">
                        {[
                          { icon: Heart, label: 'Heart Rate', value: '72 bpm', status: 'Normal', color: '#8B5CF6' },
                          { icon: Droplets, label: 'Blood Pressure', value: '120/80', status: 'Normal', color: '#3B82F6' },
                          { icon: Flame, label: 'Blood Sugar', value: '98 mg/dL', status: 'Normal', color: '#F59E0B' },
                        ].map(v => (
                          <div key={v.label} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg" style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.04)',
                          }}>
                            <div className="flex items-center gap-2">
                              <v.icon className="w-3 h-3" style={{ color: v.color }} />
                              <span className="text-[10px] text-white/50">{v.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-semibold text-white">{v.value}</span>
                              <span className="text-[8px] text-emerald-400">{v.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Mini chart */}
                      <div className="rounded-lg p-2.5" style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[8px] text-white/25 uppercase tracking-wider">Health Trend</span>
                          <span className="text-[8px] text-emerald-400/60">+12%</span>
                        </div>
                        <MiniPulse />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phone reflection on stage */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[60%] h-12 pointer-events-none" style={{
                  background: 'radial-gradient(ellipse, rgba(0,194,255,0.06), rgba(123,97,255,0.03), transparent)',
                  filter: 'blur(12px)',
                }} />
              </div>

              {/* ── LEFT PLANT ── */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.5, duration: 0.7 }}
                className="absolute bottom-[4%] left-[2%] sm:left-[8%] plant-float z-0"
                style={{ animationDelay: '0s' }}
              >
                <Plant />
              </motion.div>

              {/* ── RIGHT PLANT ── */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.7, duration: 0.7 }}
                className="absolute bottom-[4%] right-[2%] sm:right-[8%] plant-float z-0"
                style={{ animationDelay: '1.5s' }}
              >
                <Plant mirror />
              </motion.div>

              {/* ── FLOATING CARDS ── */}
              {/* Upload Reports — top left */}
              <motion.div
                initial={{ opacity: 0, x: -30, y: -20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 1.0, duration: 0.7 }}
                className="absolute top-[4%] left-[-4%] sm:left-[-10%] float-card-1 z-20"
              >
                <FloatCard icon={Upload} title="Upload Reports" sub="PDF, JPG, PNG" color="#3B82F6"
                  bgTint="rgba(59,130,246,0.08)" />
              </motion.div>

              {/* AI Analysis — bottom left */}
              <motion.div
                initial={{ opacity: 0, x: -20, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 1.2, duration: 0.7 }}
                className="absolute bottom-[28%] left-[-4%] sm:left-[-12%] float-card-2 z-20"
              >
                <FloatCard icon={Brain} title="AI Analysis" sub="Advanced AI Processing" color="#8B5CF6"
                  bgTint="rgba(139,92,246,0.08)" />
              </motion.div>

              {/* Accurate Results — top right */}
              <motion.div
                initial={{ opacity: 0, x: 30, y: -10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 1.4, duration: 0.7 }}
                className="absolute top-[12%] right-[-4%] sm:right-[-10%] float-card-3 z-20"
              >
                <FloatCard icon={FileCheck} title="Accurate Results" sub="Reliable Health Insights" color="#10B981"
                  bgTint="rgba(16,185,129,0.08)" />
              </motion.div>

              {/* AI Cube — bottom right */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6, duration: 0.7 }}
                className="absolute bottom-[12%] right-[-2%] sm:right-[-8%] float-card-1 z-20"
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center backdrop-blur-md ai-cube" style={{
                  background: 'rgba(139,92,246,0.12)',
                  border: '1px solid rgba(139,92,246,0.25)',
                  boxShadow: '0 0 30px rgba(139,92,246,0.15), inset 0 0 20px rgba(139,92,246,0.05)',
                }}>
                  <span className="text-[16px] font-black" style={{
                    background: 'linear-gradient(135deg, #00C2FF, #7B61FF)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>AI</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ══ FEATURES SECTION ══ */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-[32px] sm:text-[40px] font-bold text-white mb-3">
              Why Choose <span style={{
                background: 'linear-gradient(135deg, #00C2FF, #7B61FF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>AI Health Analyzer</span>
            </h2>
            <p className="text-[15px] text-[#B8C0D4] max-w-md mx-auto">
              Advanced AI technology for accurate, instant, and personalized health analysis.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <FeatureCard icon={Shield} title="100% Secure" desc="Your data is encrypted and always protected with enterprise-grade security." color="#3B82F6" delay={0} />
            <FeatureCard icon={Zap} title="Instant Results" desc="Get health insights within seconds using our powerful AI engine." color="#8B5CF6" delay={0.1} />
            <FeatureCard icon={Brain} title="AI Powered" desc="Advanced AI models trained on millions of health records for accuracy." color="#7B61FF" delay={0.2} />
            <FeatureCard icon={UserCheck} title="Personalized" desc="Get health recommendations tailored specifically to your profile." color="#10B981" delay={0.3} />
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="py-8" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4F46E5, #00C2FF)' }}>
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-[13px] font-bold text-white">Nafexa<span style={{ color: '#00C2FF' }}> AI</span></span>
          </div>
          <p className="text-[11px] text-white/20">© {new Date().getFullYear()} AI Health Analyzer. For informational purposes only.</p>
          <div className="flex items-center gap-5 text-[11px] text-white/20">
            <a href="#" className="hover:text-white/40 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/40 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
      <VideoModal isOpen={videoOpen} onClose={() => setVideoOpen(false)} />
    </div>
  );
}