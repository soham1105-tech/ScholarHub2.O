import React, { useState } from 'react';
import { TopBar } from '../components/TopBar.tsx';
import { BottomNav } from '../components/BottomNav.tsx';
import { SVGIcon } from '../components/SVGIcon.tsx';
import { useApp } from '../AppContext.tsx';

export default function Alerts() {
  const { alerts, setAlerts } = useApp();
  const [readAlerts, setReadAlerts] = useState<number[]>([]);

  const toggleRead = (id: number) => {
    setReadAlerts(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const clearAll = () => {
    setAlerts([]);
  };

  return (
    <div className="page-transition premium-gradient min-h-screen">
      <TopBar title="Alerts" />
      
      <main className="p-6 pt-[100px] pb-[120px] max-w-lg mx-auto">
        <div className="flex justify-between items-end mb-6 px-1">
          <h2 className="text-[14px] font-bold uppercase tracking-widest text-text-muted">Notification Center</h2>
          {alerts.length > 0 && (
            <button 
              onClick={clearAll}
              className="text-forest-critical text-[14px] font-bold"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="space-y-3">
          {alerts.map((alert) => {
            const isRead = readAlerts.includes(alert.id);
            return (
              <div 
                key={alert.id}
                onClick={() => toggleRead(alert.id)}
                className={`ios-card p-5 cursor-pointer relative group overflow-hidden transition-all duration-300 ${!isRead ? 'bg-white/[0.08] scale-[1.02]' : 'opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0'}`}
              >
                {!isRead && (
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-forest-accent shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
                )}
                
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                      alert.type === 'critical' ? 'bg-forest-critical/10 text-forest-critical' : 
                      alert.type === 'warning' ? 'bg-forest-amber/10 text-forest-amber' : 
                      'bg-forest-accent/10 text-forest-accent'
                    }`}>
                      <SVGIcon name={alert.type === 'critical' ? 'alert-triangle' : 'bell'} className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[12px] font-bold text-text-muted uppercase tracking-wider">{alert.type.toUpperCase()}</span>
                      <div className="text-[11px] text-text-faint">{alert.time}</div>
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 text-text-faint hover:text-text-primary transition-colors">
                    <SVGIcon name="hamburger" className="w-4 h-4 rotate-90" strokeWidth={3} />
                  </button>
                </div>

                <div className="pl-13">
                  <h3 className="text-[17px] font-bold text-text-primary mb-1">{alert.title}</h3>
                  <p className="text-[14px] text-text-muted leading-relaxed font-medium">{alert.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 rounded-[32px] bg-white/5 flex items-center justify-center">
              <SVGIcon name="bell" className="w-10 h-10 text-text-faint" />
            </div>
            <div>
              <h3 className="text-[20px] font-bold text-white tracking-tight">Everything is quiet</h3>
              <p className="text-[14px] text-text-muted max-w-[200px] mx-auto">You've reached notification nirvana.</p>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
