'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, Heart, FlaskConical, Pill, Apple,
  Brain, AlertTriangle, Sparkles, LogOut, Menu, X,
  ChevronRight, Settings, ChevronLeft, Search, Bell,
  ScanLine, Activity, FileText, User, Users, UsersRound,
  MessageCircle, TrendingUp, GitCompare
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-neon-blue' },
  { href: '/dashboard/chat', label: 'AI Chat', icon: MessageCircle, color: 'text-green-400' },
  { href: '/dashboard/lab-reports', label: 'Lab Reports', icon: FlaskConical, color: 'text-neon-purple' },
  { href: '/dashboard/trends', label: 'Trends', icon: TrendingUp, color: 'text-neon-cyan' },
  { href: '/dashboard/compare', label: 'Compare', icon: GitCompare, color: 'text-cyan-400' },
  { href: '/dashboard/medications', label: 'Medications', icon: Pill, color: 'text-neon-cyan' },
  { href: '/dashboard/nutrition', label: 'Nutrition', icon: Apple, color: 'text-orange-400' },
  { href: '/dashboard/symptoms', label: 'Symptoms', icon: Heart, color: 'text-red-400' },
  { href: '/dashboard/alerts', label: 'Alerts', icon: AlertTriangle, color: 'text-amber-400' },
  { href: '/dashboard/mental-health', label: 'Mental Health', icon: Brain, color: 'text-neon-pink' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userName, setUserName] = useState('Health User');

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  // Fetch user name on every navigation so it stays in sync with Settings changes
  useEffect(() => {
    fetch('/api/profile').then(r => r.ok ? r.json() : null).then(data => {
      if (data?.name) setUserName(data.name);
      else if (data?.user?.name) setUserName(data.user.name);
    }).catch(() => {});
  }, [pathname]);

  // Listen for immediate name changes from Settings page
  useEffect(() => {
    const handler = (e: Event) => {
      const newName = (e as CustomEvent).detail;
      if (newName) setUserName(newName);
    };
    window.addEventListener('user-name-changed', handler);
    return () => window.removeEventListener('user-name-changed', handler);
  }, []);

  const handleLogout = () => { signOut({ callbackUrl: '/' }); };
  const userInitial = userName.charAt(0).toUpperCase();

  const currentPage = navItems.find(item => pathname === item.href) ||
    (pathname === '/dashboard/settings' ? { label: 'Settings', icon: Settings, color: 'text-neon-blue' } : null);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* ── Sidebar Header ── */}
      <div className="p-4 flex items-center justify-between border-b border-white/[0.06] min-h-[60px]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(0,212,255,0.2)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent whitespace-nowrap">
              AI Health Analyzer
            </span>
          )}
        </div>
        {/* Collapse button INSIDE the sidebar header */}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} className="text-gray-500 hover:text-white hover:bg-white/[0.06] p-1.5 rounded-lg transition-colors" title="Collapse sidebar">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {collapsed && (
          <button onClick={() => setCollapsed(false)} className="text-gray-500 hover:text-white hover:bg-white/[0.06] p-1.5 rounded-lg transition-colors mt-1" title="Expand sidebar">
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto sidebar-scroll">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a key={item.href} href={item.href} className="block" title={collapsed ? item.label : undefined}>
              <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors duration-100 group relative ${
                isActive ? 'bg-white/[0.08] shadow-[0_0_15px_rgba(0,212,255,0.06)]' : 'hover:bg-white/[0.03]'
              }`}>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-neon-blue rounded-full shadow-[0_0_8px_rgba(0,212,255,0.5)]" />}
                <item.icon className={`w-[16px] h-[16px] flex-shrink-0 ${isActive ? item.color : 'text-gray-500 group-hover:text-gray-300'} transition-colors`} />
                {!collapsed && (
                  <span className={`text-[13px] whitespace-nowrap ${isActive ? 'text-white font-medium' : 'text-gray-400 group-hover:text-gray-200'} transition-colors`}>
                    {item.label}
                  </span>
                )}
              </div>
            </a>
          );
        })}
      </nav>

      <div className="p-2 border-t border-white/[0.06] space-y-0.5">
        <a href="/dashboard/settings" className="block" title={collapsed ? 'Settings' : undefined}>
          <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors duration-100 group ${
            pathname === '/dashboard/settings' ? 'bg-white/[0.08]' : 'hover:bg-white/[0.03]'
          }`}>
            <Settings className={`w-[16px] h-[16px] flex-shrink-0 ${pathname === '/dashboard/settings' ? 'text-neon-blue' : 'text-gray-500 group-hover:text-gray-300'} transition-colors`} />
            {!collapsed && (
              <span className={`text-[13px] ${pathname === '/dashboard/settings' ? 'text-white font-medium' : 'text-gray-400 group-hover:text-gray-200'} transition-colors`}>
                Settings
              </span>
            )}
          </div>
        </a>
<button onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors w-full" aria-label="Logout">
	          <LogOut className="w-[16px] h-[16px] flex-shrink-0" />
	          {!collapsed && <span className="text-[13px]">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-dark-bg overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        style={{ width: collapsed ? 64 : 240, transition: 'width 0.2s ease' }}
        className="hidden lg:flex flex-col bg-dark-surface/80 border-r border-white/[0.06] backdrop-blur-xl flex-shrink-0"
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <>
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
	          <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-dark-surface border-r border-white/[0.06] z-50 lg:hidden" role="navigation" aria-label="Mobile navigation">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Top Header Bar ── */}
        <header className="h-[56px] border-b border-white/[0.06] bg-dark-surface/40 backdrop-blur-xl flex items-center px-4 lg:px-6 gap-4 flex-shrink-0">
          {/* Left: Mobile menu + Breadcrumb */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
<button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white transition-colors p-1" aria-label="Open menu">
	              <Menu className="w-5 h-5" />
            </button>
            {currentPage && (
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-md bg-white/[0.04] flex items-center justify-center ${currentPage.color}`}>
                  <currentPage.icon className="w-3 h-3" />
                </div>
                <h1 className="text-sm font-semibold text-white truncate">{currentPage.label}</h1>
              </div>
            )}
          </div>

          {/* Right: User Profile */}
          <div className="flex items-center gap-3 flex-shrink-0">
<a href="/dashboard/alerts" className="text-gray-500 hover:text-white transition-colors p-1.5 hover:bg-white/[0.04] rounded-lg" title="Alerts" aria-label="View alerts">
	              <Bell className="w-4 h-4" />
            </a>
            <div className="w-px h-4 bg-white/[0.06]" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300 hidden sm:block font-medium">{userName}</span>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-white text-[10px] font-bold shadow-[0_0_12px_rgba(0,212,255,0.15)]">
                {userInitial}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}