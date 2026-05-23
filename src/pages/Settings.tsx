import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar.tsx';
import { BottomNav } from '../components/BottomNav.tsx';
import { SVGIcon } from '../components/SVGIcon.tsx';
import { useApp } from '../AppContext.tsx';
import { logout } from '../lib/firebase.ts';

export default function Settings() {
  const { isDarkMode, setIsDarkMode } = useApp();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const settingsGroups = [
    {
      title: 'Preferences',
      items: [
        { label: 'Monk Mode Settings', icon: 'lock', color: 'text-forest-accent' },
        { label: 'Pomodoro Intervals', icon: 'timer', color: 'text-forest-amber' },
      ]
    },
    {
      title: 'App Settings',
      items: [
        { label: 'Notifications', icon: 'bell', color: 'text-blue-400' },
        { label: 'Privacy & Security', icon: 'lock', color: 'text-text-muted' },
      ]
    }
  ];

  return (
    <div className="page-transition premium-gradient min-h-screen">
      <TopBar title="Settings" />
      
      <main className="p-6 pt-[100px] pb-[120px] max-w-lg mx-auto space-y-8">
        {/* Appearance Toggle */}
        <section className="ios-card p-5">
           <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-forest-accent/10 flex items-center justify-center">
                <SVGIcon name="target" className="w-5 h-5 text-forest-accent" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-white">Dark Mode</h3>
                <p className="text-[12px] text-text-muted font-medium">Oversaturated forest theme</p>
              </div>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`w-14 h-7 rounded-full transition-all flex items-center px-1 ${
                isDarkMode ? 'bg-forest-accent' : 'bg-white/10'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-all transform ${isDarkMode ? 'translate-x-7' : 'translate-x-0'} shadow-md`} />
            </button>
          </div>
        </section>

        {/* settings lists */}
        {settingsGroups.map((group) => (
          <div key={group.title} className="space-y-3">
            <h2 className="text-[13px] font-bold text-text-muted uppercase tracking-widest pl-1">{group.title}</h2>
            <section className="ios-card overflow-hidden divide-y divide-white/5">
              {group.items.map((item) => (
                <button key={item.label} className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <SVGIcon name={item.icon as any} className={`w-5 h-5 ${item.color}`} />
                    <span className="text-[16px] font-semibold text-text-primary">{item.label}</span>
                  </div>
                  <SVGIcon name="hamburger" className="w-4 h-4 rotate-90 text-text-faint group-hover:text-white transition-colors" />
                </button>
              ))}
            </section>
          </div>
        ))}

        <div className="pt-4 space-y-4">
          <button 
            onClick={handleLogout}
            className="w-full h-14 bg-white/5 text-white font-bold rounded-2xl ios-button border border-white/10"
          >
            Sign Out
          </button>
          
          <button className="w-full h-14 bg-forest-crit-bg/40 text-forest-critical font-bold rounded-2xl ios-button border border-forest-critical/10">
            Reset Data Factory
          </button>
          <p className="text-center text-[11px] text-text-faint mt-4 font-bold tracking-widest">VERSION 1.0.4 • BUILD_STABLE</p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
