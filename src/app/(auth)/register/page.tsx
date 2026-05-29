'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      // Register the user
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'Email already registered') {
          setError('This email is already registered. Please sign in instead.');
        } else if (typeof data.error === 'object') {
          // Zod validation errors
          const firstError = Object.values(data.error).flat()[0] as string;
          setError(firstError || 'Please check your input.');
        } else {
          setError(data.error || 'Registration failed. Please try again.');
        }
        return;
      }

      // Auto sign in after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Left side — Decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 via-transparent to-neon-blue/5" />
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-neon-purple/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-neon-blue/10 rounded-full blur-[100px]" />

        <div className="relative z-10 text-center px-12 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Start Your Health Journey</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Create your free account and unlock the power of AI-driven health analysis.
              Upload your first lab report and get personalized insights in minutes.
            </p>
            <div className="mt-8 space-y-3">
              {[
                '✅ Free account — no credit card required',
                '✅ Upload unlimited lab reports',
                '✅ AI-powered health analysis',
                '✅ Personalized diet & medication plans',
              ].map((item) => (
                <p key={item} className="text-sm text-gray-400">{item}</p>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side — Register Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
              AI Health Analyzer
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-sm text-gray-500 mb-8">Join thousands of users improving their health with AI</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-6"
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm text-gray-400 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  minLength={2}
                  aria-label="Full name"
                  className="w-full bg-dark-surface/60 border border-white/[0.08] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-neon-blue/40 focus:outline-none focus:ring-1 focus:ring-neon-blue/20 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm text-gray-400 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  aria-label="Email address"
                  className="w-full bg-dark-surface/60 border border-white/[0.08] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-neon-blue/40 focus:outline-none focus:ring-1 focus:ring-neon-blue/20 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-gray-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  aria-label="Password"
                  className="w-full bg-dark-surface/60 border border-white/[0.08] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-neon-blue/40 focus:outline-none focus:ring-1 focus:ring-neon-blue/20 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm text-gray-400 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  minLength={8}
                  aria-label="Confirm password"
                  className="w-full bg-dark-surface/60 border border-white/[0.08] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-neon-blue/40 focus:outline-none focus:ring-1 focus:ring-neon-blue/20 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm transition-all duration-300 bg-gradient-to-r from-neon-purple to-neon-blue hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-neon-blue hover:text-neon-blue/80 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-white/[0.06] text-center">
            <Link href="/" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              ← Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}