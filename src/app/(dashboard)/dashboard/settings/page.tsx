'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, User, Heart, Bell, Shield, Download, Trash2, ChevronRight,
  Save, Check, Globe, Ruler, Moon, Brain, Mail, AlertTriangle, Share2,
  Clock, Activity, Phone, Calendar, Droplets, Stethoscope, X
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

const SECTIONS = [
  { id: 'account', label: 'Account', icon: User, color: 'text-neon-blue', desc: 'Personal info & contact' },
  { id: 'health', label: 'Health Profile', icon: Heart, color: 'text-red-400', desc: 'Medical details & vitals' },
  { id: 'preferences', label: 'Preferences', icon: Settings, color: 'text-neon-purple', desc: 'Units, language & theme' },
  { id: 'notifications', label: 'Notifications', icon: Bell, color: 'text-amber-400', desc: 'Alerts & email settings' },
  { id: 'privacy', label: 'Privacy & Data', icon: Shield, color: 'text-neon-cyan', desc: 'Data sharing & export' },
];

export default function SettingsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('account');
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [exporting, setExporting] = useState(false);
  const toast = useToast();

  // Form state
  const [account, setAccount] = useState({ name: '', phone: '', dateOfBirth: '', gender: '' });
  const [health, setHealth] = useState({ bloodType: '', heightCm: '', weightKg: '', allergies: '', emergencyName: '', emergencyPhone: '', emergencyRelation: '' });
  const [prefs, setPrefs] = useState({ units: 'metric', language: 'en', theme: 'dark', aiModelPreference: 'balanced' });
  const [notifs, setNotifs] = useState({ emailNotifications: true, pushNotifications: true, weeklyReportEmail: true, criticalAlertsOnly: false });
  const [privacy, setPrivacy] = useState({ shareDataWithDoctor: false, dataRetentionDays: 365 });

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      setData(d);
      setAccount({
        name: d.user?.name || '',
        phone: d.user?.phone || '',
        dateOfBirth: d.user?.dateOfBirth ? d.user.dateOfBirth.split('T')[0] : '',
        gender: d.user?.gender || '',
      });
      const ec = d.healthProfile?.emergencyContact || {};
      setHealth({
        bloodType: d.healthProfile?.bloodType || '',
        heightCm: d.healthProfile?.heightCm?.toString() || '',
        weightKg: d.healthProfile?.weightKg?.toString() || '',
        allergies: Array.isArray(d.healthProfile?.allergies) ? (d.healthProfile.allergies as string[]).join(', ') : '',
        emergencyName: ec.name || '',
        emergencyPhone: ec.phone || '',
        emergencyRelation: ec.relation || '',
      });
      setPrefs({
        units: d.settings?.units || 'metric',
        language: d.settings?.language || 'en',
        theme: d.settings?.theme || 'dark',
        aiModelPreference: d.settings?.aiModelPreference || 'balanced',
      });
      setNotifs({
        emailNotifications: d.settings?.emailNotifications ?? true,
        pushNotifications: d.settings?.pushNotifications ?? true,
        weeklyReportEmail: d.settings?.weeklyReportEmail ?? true,
        criticalAlertsOnly: d.settings?.criticalAlertsOnly ?? false,
      });
      setPrivacy({
        shareDataWithDoctor: d.settings?.shareDataWithDoctor ?? false,
        dataRetentionDays: d.settings?.dataRetentionDays ?? 365,
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const save = async (section: string, payload: any) => {
    setSaving(section);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, data: payload }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(section);
      // Dispatch event so layout header updates immediately
      if (section === 'account' && payload.name) {
        window.dispatchEvent(new CustomEvent('user-name-changed', { detail: payload.name }));
      }
      setTimeout(() => setSaved(null), 2000);
    } catch (e) {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  const saveAccount = () => save('account', account);
  const saveHealth = () => save('healthProfile', {
    ...health,
    allergies: health.allergies ? health.allergies.split(',').map(a => a.trim()).filter(Boolean) : [],
    emergencyContact: { name: health.emergencyName, phone: health.emergencyPhone, relation: health.emergencyRelation },
  });
  const savePrefs = () => save('preferences', prefs);
  const saveNotifs = () => save('notifications', notifs);
  const savePrivacy = () => save('privacy', privacy);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'exportData' }),
      });
      const blob = await res.json();
      const blobStr = JSON.stringify(blob, null, 2);
      const url = URL.createObjectURL(new Blob([blobStr], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url; a.download = `health-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click(); URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleClearData = async () => {
    setConfirmClear(false);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'clearData' }),
      });
      window.location.href = '/dashboard';
    } catch (e) {
      toast.error('Failed to clear data.');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-2 border-white/20 border-t-neon-blue rounded-full animate-spin" /></div>;

  const field = (label: string, value: string, onChange: (v: string) => void, type = 'text', placeholder = '') => (
    <div>
      <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-dark-surface/80 border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-neon-blue/40 focus:outline-none transition-colors" />
    </div>
  );

  const toggle = (label: string, desc: string, value: boolean, onChange: (v: boolean) => void) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm text-white">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <button onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition-colors relative ${value ? 'bg-neon-blue' : 'bg-white/10'}`}>
        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${value ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );

  const selectOpt = (label: string, value: string, onChange: (v: string) => void, options: { v: string; l: string }[]) => (
    <div>
      <label className="text-xs text-gray-400 mb-1.5 block">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-dark-surface/80 border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white focus:border-neon-blue/40 focus:outline-none transition-colors appearance-none">
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );

  const SaveBtn = ({ section, onSave }: { section: string; onSave: () => void }) => (
    <button onClick={onSave} disabled={saving === section}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
        saved === section ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
        'bg-neon-blue/10 text-neon-blue border border-neon-blue/20 hover:bg-neon-blue/20'}`}>
      {saved === section ? <><Check className="w-4 h-4" /> Saved!</> :
       saving === section ? <><div className="w-4 h-4 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin" /> Saving...</> :
       <><Save className="w-4 h-4" /> Save Changes</>}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center border border-white/[0.06]">
          <Settings className="w-5 h-5 text-neon-blue" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-xs text-gray-500">Manage your account, preferences, and privacy</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Section Nav */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-2 space-y-0.5">
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
                  activeSection === s.id ? 'bg-white/[0.08]' : 'hover:bg-white/[0.03]'
                }`}>
                <s.icon className={`w-4 h-4 flex-shrink-0 ${activeSection === s.id ? s.color : 'text-gray-500'}`} />
                <div className="min-w-0">
                  <p className={`text-sm ${activeSection === s.id ? 'text-white font-medium' : 'text-gray-400'}`}>{s.label}</p>
                  <p className="text-[10px] text-gray-600 truncate">{s.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeSection === 'account' && (
              <motion.div key="account" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-neon-blue" />
                  <h2 className="text-sm font-semibold text-white">Account Settings</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {field('Full Name', account.name, v => setAccount({ ...account, name: v }), 'text', 'Enter your name')}
                  {field('Email', data?.user?.email || '', () => {}, 'email', 'Email cannot be changed')}
                  {field('Phone', account.phone, v => setAccount({ ...account, phone: v }), 'tel', '+1 (555) 123-4567')}
                  {field('Date of Birth', account.dateOfBirth, v => setAccount({ ...account, dateOfBirth: v }), 'date')}
                </div>

                {selectOpt('Gender', account.gender, v => setAccount({ ...account, gender: v }), [
                  { v: '', l: 'Prefer not to say' },
                  { v: 'male', l: 'Male' },
                  { v: 'female', l: 'Female' },
                  { v: 'non-binary', l: 'Non-binary' },
                  { v: 'other', l: 'Other' },
                ])}

                <div className="flex justify-end pt-2">
                  <SaveBtn section="account" onSave={saveAccount} />
                </div>
              </motion.div>
            )}

            {activeSection === 'health' && (
              <motion.div key="health" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4">
                <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-4 h-4 text-red-400" />
                    <h2 className="text-sm font-semibold text-white">Health Profile</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectOpt('Blood Type', health.bloodType, v => setHealth({ ...health, bloodType: v }), [
                      { v: '', l: 'Unknown' }, { v: 'A+', l: 'A+' }, { v: 'A-', l: 'A-' },
                      { v: 'B+', l: 'B+' }, { v: 'B-', l: 'B-' }, { v: 'AB+', l: 'AB+' },
                      { v: 'AB-', l: 'AB-' }, { v: 'O+', l: 'O+' }, { v: 'O-', l: 'O-' },
                    ])}
                    {field(prefs.units === 'imperial' ? 'Height (in)' : 'Height (cm)', health.heightCm, v => setHealth({ ...health, heightCm: v }), 'number', prefs.units === 'imperial' ? '68' : '173')}
                    {field(prefs.units === 'imperial' ? 'Weight (lbs)' : 'Weight (kg)', health.weightKg, v => setHealth({ ...health, weightKg: v }), 'number', prefs.units === 'imperial' ? '150' : '70')}
                  </div>

                  {field('Allergies (comma-separated)', health.allergies, v => setHealth({ ...health, allergies: v }), 'text', 'Penicillin, Peanuts, Latex...')}
                </div>

                <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="w-4 h-4 text-amber-400" />
                    <h2 className="text-sm font-semibold text-white">Emergency Contact</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {field('Name', health.emergencyName, v => setHealth({ ...health, emergencyName: v }), 'text', 'Jane Doe')}
                    {field('Phone', health.emergencyPhone, v => setHealth({ ...health, emergencyPhone: v }), 'tel', '+1 (555) 123-4567')}
                    {field('Relationship', health.emergencyRelation, v => setHealth({ ...health, emergencyRelation: v }), 'text', 'Spouse, Parent, Sibling...')}
                  </div>

                  <div className="flex justify-end pt-2">
                    <SaveBtn section="health" onSave={saveHealth} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'preferences' && (
              <motion.div key="preferences" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <Settings className="w-4 h-4 text-neon-purple" />
                  <h2 className="text-sm font-semibold text-white">Preferences</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {selectOpt('Measurement Units', prefs.units, v => setPrefs({ ...prefs, units: v }), [
                    { v: 'metric', l: '🇺🇳 Metric (kg, cm, °C)' },
                    { v: 'imperial', l: '🇺🇸 Imperial (lbs, in, °F)' },
                  ])}
                  {selectOpt('Language', prefs.language, v => setPrefs({ ...prefs, language: v }), [
                    { v: 'en', l: '🇬🇧 English' },
                    { v: 'hi', l: '🇮🇳 Hindi' },
                    { v: 'es', l: '🇪🇸 Spanish' },
                    { v: 'fr', l: '🇫🇷 French' },
                    { v: 'de', l: '🇩🇪 German' },
                    { v: 'ar', l: '🇸🇦 Arabic' },
                    { v: 'zh', l: '🇨🇳 Chinese' },
                    { v: 'ja', l: '🇯🇵 Japanese' },
                  ])}
                  {selectOpt('AI Analysis Style', prefs.aiModelPreference, v => setPrefs({ ...prefs, aiModelPreference: v }), [
                    { v: 'balanced', l: '⚖️ Balanced — Standard detail' },
                    { v: 'conservative', l: '🛡️ Conservative — Cautious flags' },
                    { v: 'aggressive', l: 'Aggressive — More findings' },
                  ])}
                  {selectOpt('Theme', prefs.theme, v => setPrefs({ ...prefs, theme: v }), [
                    { v: 'dark', l: '🌙 Dark Mode' },
                    { v: 'light', l: '☀️ Light Mode (Coming Soon)' },
                  ])}
                </div>

                <div className="bg-neon-blue/5 border border-neon-blue/20 rounded-xl p-3 mt-4">
                  <p className="text-xs text-gray-400">💡 <span className="text-neon-blue">Tip:</span> Measurement units affect how your vitals, nutrition, and lab reports are displayed throughout the app.</p>
                </div>

                <div className="flex justify-end pt-2">
                  <SaveBtn section="preferences" onSave={savePrefs} />
                </div>
              </motion.div>
            )}

            {activeSection === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6 space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-semibold text-white">Notification Preferences</h2>
                </div>

                {toggle('Email Notifications', 'Receive health alerts and report updates via email', notifs.emailNotifications, v => setNotifs({ ...notifs, emailNotifications: v }))}
                <div className="border-t border-white/[0.04]" />
                {toggle('Push Notifications', 'Get real-time browser notifications for critical alerts', notifs.pushNotifications, v => setNotifs({ ...notifs, pushNotifications: v }))}
                <div className="border-t border-white/[0.04]" />
                {toggle('Weekly Health Report', 'Receive a weekly email summary of your health trends and lab results', notifs.weeklyReportEmail, v => setNotifs({ ...notifs, weeklyReportEmail: v }))}
                <div className="border-t border-white/[0.04]" />
                {toggle('Critical Alerts Only', 'Only notify for critical-severity alerts (skip warnings and info)', notifs.criticalAlertsOnly, v => setNotifs({ ...notifs, criticalAlertsOnly: v }))}

                <div className="flex justify-end pt-4">
                  <SaveBtn section="notifications" onSave={saveNotifs} />
                </div>
              </motion.div>
            )}

            {activeSection === 'privacy' && (
              <motion.div key="privacy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-4">
                <div className="bg-dark-surface/60 border border-white/[0.06] rounded-2xl p-6 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-neon-cyan" />
                    <h2 className="text-sm font-semibold text-white">Privacy & Data</h2>
                  </div>

                  {toggle('Share Data with Doctor', 'Allow your healthcare provider to view your health analysis and lab reports', privacy.shareDataWithDoctor, v => setPrivacy({ ...privacy, shareDataWithDoctor: v }))}
                  <div className="border-t border-white/[0.04]" />

                  <div className="py-3">
                    <p className="text-sm text-white">Data Retention Period</p>
                    <p className="text-xs text-gray-500 mt-0.5 mb-2">How long your health data is stored before auto-deletion</p>
                    {selectOpt('Retention Period', privacy.dataRetentionDays.toString(), v => setPrivacy({ ...privacy, dataRetentionDays: parseInt(v) }), [
                      { v: '30', l: '30 Days' },
                      { v: '90', l: '90 Days' },
                      { v: '180', l: '180 Days' },
                      { v: '365', l: '1 Year (Default)' },
                      { v: '730', l: '2 Years' },
                      { v: '0', l: 'Keep Forever' },
                    ])}
                  </div>

                  <div className="flex justify-end pt-4">
                    <SaveBtn section="privacy" onSave={savePrivacy} />
                  </div>
                </div>

                {/* Export Data */}
                <div className="bg-dark-surface/60 border border-neon-blue/20 rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neon-blue/10 flex items-center justify-center">
                      <Download className="w-5 h-5 text-neon-blue" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white">Export Your Data</h3>
                      <p className="text-xs text-gray-500">Download all your health data as a JSON file</p>
                    </div>
                    <button onClick={handleExport} disabled={exporting}
                      className="flex items-center gap-2 px-4 py-2 bg-neon-blue/10 text-neon-blue border border-neon-blue/20 rounded-xl text-sm hover:bg-neon-blue/20 transition-colors disabled:opacity-50">
                      {exporting ? <div className="w-4 h-4 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                      {exporting ? 'Exporting...' : 'Export'}
                    </button>
                  </div>
                </div>

                {/* Clear Data */}
                <div className="bg-red-500/[0.04] border border-red-500/20 rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-red-400">Clear All Health Data</h3>
                      <p className="text-xs text-gray-500">Permanently delete all your vitals, lab reports, medications, and analysis data</p>
                    </div>
                    <button onClick={() => setConfirmClear(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm hover:bg-red-500/20 transition-colors">
                      <Trash2 className="w-4 h-4" /> Clear Data
                    </button>
                  </div>
                </div>

                {/* Confirmation Modal */}
                {confirmClear && (
                  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="bg-dark-surface border border-red-500/30 rounded-2xl p-6 max-w-md w-full">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Delete All Data?</h3>
                      </div>
                      <p className="text-sm text-gray-400 mb-6">This will permanently delete all your lab reports, vitals, medications, alerts, symptoms, nutrition plans, and mental health records. <span className="text-red-400 font-medium">This action cannot be undone.</span></p>
                      <div className="flex gap-3 justify-end">
                        <button onClick={() => setConfirmClear(false)}
                          className="px-4 py-2 bg-white/5 text-gray-300 rounded-xl text-sm hover:bg-white/10 transition-colors">Cancel</button>
                        <button onClick={handleClearData}
                          className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm hover:bg-red-500/30 transition-colors">Yes, Delete Everything</button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <p className="text-[10px] text-gray-600 italic text-center">⚙️ Settings are saved per account. Changes take effect immediately.</p>
    </div>
  );
}