'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Save, Mail, Calendar, Ruler, Weight, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface ProfileData {
  name: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  heightCm: number;
  weightKg: number;
  chronicConditions: string;
  medicationsList: string;
}

export default function ProfilePage() {
  const toast = useToast();
  const [profile, setProfile] = useState<ProfileData>({
    name: '', email: '', gender: '', dateOfBirth: '', heightCm: 0, weightKg: 0, chronicConditions: '', medicationsList: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile({
          name: data.name || '',
          email: data.email || '',
          gender: data.gender || '',
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
          heightCm: data.heightCm || 0,
          weightKg: data.weightKg || 0,
          chronicConditions: data.chronicConditions || '',
          medicationsList: data.medicationsList || '',
        });
      }
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) { toast.success('Profile updated successfully'); }
      else { toast.error('Failed to update profile'); }
    } catch { toast.error('Network error'); }
    setSaving(false);
  };

  const update = (key: keyof ProfileData, value: string | number) => setProfile((p) => ({ ...p, [key]: value }));

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.2)]">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Profile</h1>
            <p className="text-gray-400 text-sm">Manage your personal health information</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 relative">
        <div className="glass-highlight" />
        
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/[0.06]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-white text-xl font-bold shadow-[0_0_25px_rgba(0,212,255,0.2)]">
            {profile.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{profile.name || 'User'}</h2>
            <p className="text-gray-400 text-sm flex items-center gap-1"><Mail className="w-3 h-3" /> {profile.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 flex items-center gap-1"><User className="w-3 h-3" /> Full Name</label>
              <input type="text" value={profile.name} onChange={(e) => update('name', e.target.value)}
                className="w-full px-3 py-2.5 bg-dark-surface/80 border border-white/[0.06] rounded-xl text-white text-sm focus:border-neon-blue/40 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date of Birth</label>
              <input type="date" value={profile.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)}
                className="w-full px-3 py-2.5 bg-dark-surface/80 border border-white/[0.06] rounded-xl text-white text-sm focus:border-neon-blue/40 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Gender</label>
              <select value={profile.gender} onChange={(e) => update('gender', e.target.value)}
                className="w-full px-3 py-2.5 bg-dark-surface/80 border border-white/[0.06] rounded-xl text-white text-sm focus:border-neon-blue/40 focus:outline-none transition-all appearance-none">
                <option value="" className="bg-dark-surface">Prefer not to say</option>
                <option value="male" className="bg-dark-surface">Male</option>
                <option value="female" className="bg-dark-surface">Female</option>
                <option value="other" className="bg-dark-surface">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 flex items-center gap-1"><Ruler className="w-3 h-3" /> Height (cm)</label>
              <input type="number" value={profile.heightCm || ''} onChange={(e) => update('heightCm', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2.5 bg-dark-surface/80 border border-white/[0.06] rounded-xl text-white text-sm focus:border-neon-blue/40 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 flex items-center gap-1"><Weight className="w-3 h-3" /> Weight (kg)</label>
              <input type="number" value={profile.weightKg || ''} onChange={(e) => update('weightKg', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2.5 bg-dark-surface/80 border border-white/[0.06] rounded-xl text-white text-sm focus:border-neon-blue/40 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 flex items-center gap-1"><Shield className="w-3 h-3" /> Chronic Conditions</label>
              <input type="text" value={profile.chronicConditions} onChange={(e) => update('chronicConditions', e.target.value)} placeholder="e.g., Diabetes, Asthma"
                className="w-full px-3 py-2.5 bg-dark-surface/80 border border-white/[0.06] rounded-xl text-white text-sm placeholder:text-gray-600 focus:border-neon-blue/40 focus:outline-none transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Current Medications</label>
            <textarea value={profile.medicationsList} onChange={(e) => update('medicationsList', e.target.value)} rows={2} placeholder="List any medications you're currently taking..."
              className="w-full px-3 py-2.5 bg-dark-surface/80 border border-white/[0.06] rounded-xl text-white text-sm placeholder:text-gray-600 focus:border-neon-blue/40 focus:outline-none transition-all resize-none" />
          </div>

          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-medium text-sm rounded-xl hover:shadow-[0_0_25px_rgba(0,212,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </button>
        </form>
      </motion.div>
    </div>
  );
}