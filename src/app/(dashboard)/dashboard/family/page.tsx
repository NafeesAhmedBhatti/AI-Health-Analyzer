'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UsersRound, Plus, Mail, Crown, Shield, User, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: string;
  relationship: string;
}

export default function FamilyPage() {
  const toast = useToast();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [form, setForm] = useState({ name: '', email: '', relationship: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/family');
      if (res.ok) setMembers(await res.json());
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error('Name and email required'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { toast.success('Invitation sent'); setForm({ name: '', email: '', relationship: '' }); fetchMembers(); }
      else { toast.error('Failed to send invite'); }
    } catch { toast.error('Network error'); }
    setSubmitting(false);
  };

  const roleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'admin': return <Shield className="w-4 h-4 text-neon-blue" />;
      default: return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.2)]">
            <UsersRound className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Family</h1>
            <p className="text-gray-400 text-sm">Manage family access and shared health data</p>
          </div>
        </div>
      </motion.div>

      {/* Invite form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 relative">
        <div className="glass-highlight" />
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-neon-purple" /> Invite Family Member</h3>
        <form onSubmit={handleInvite} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-gray-400 mb-1.5">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Family member name"
              className="w-full px-3 py-2.5 bg-dark-surface/80 border border-white/[0.06] rounded-xl text-white text-sm placeholder:text-gray-600 focus:border-neon-purple/40 focus:outline-none transition-all" />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-gray-400 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com"
              className="w-full px-3 py-2.5 bg-dark-surface/80 border border-white/[0.06] rounded-xl text-white text-sm placeholder:text-gray-600 focus:border-neon-purple/40 focus:outline-none transition-all" />
          </div>
          <div className="w-40">
            <label className="block text-xs text-gray-400 mb-1.5">Relationship</label>
            <select value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })}
              className="w-full px-3 py-2.5 bg-dark-surface/80 border border-white/[0.06] rounded-xl text-white text-sm focus:border-neon-purple/40 focus:outline-none transition-all appearance-none">
              <option value="spouse" className="bg-dark-surface">Spouse</option>
              <option value="parent" className="bg-dark-surface">Parent</option>
              <option value="child" className="bg-dark-surface">Child</option>
              <option value="sibling" className="bg-dark-surface">Sibling</option>
              <option value="other" className="bg-dark-surface">Other</option>
            </select>
          </div>
          <button type="submit" disabled={submitting}
            className="px-5 py-2.5 bg-gradient-to-r from-neon-purple to-violet-500 text-white font-medium text-sm rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2">
            {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Mail className="w-4 h-4" />}
            Invite
          </button>
        </form>
      </motion.div>

      {/* Members */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-lg font-semibold text-white mb-3">Members</h2>
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin" /></div>
        ) : members.length === 0 ? (
          <div className="glass-card p-8 text-center"><AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" /><p className="text-gray-400 text-sm">No family members yet</p></div>
        ) : (
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="glass-card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {m.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{m.name}</p>
                  <p className="text-gray-500 text-xs">{m.email} · {m.relationship}</p>
                </div>
                {roleIcon(m.role)}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}