import React from 'react';
import { useApp } from '../AppContext.tsx';
import { SVGIcon } from './SVGIcon.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export const Sidebar = () => {
  const { isSidebarOpen, setIsSidebarOpen, isDarkMode, setIsDarkMode, user, profile } = useApp();
  const navigate = useNavigate();

  const menuItems = [
    { label: 'Profile', icon: 'person', path: '/profile' },
    { label: 'Settings', icon: 'settings', path: '/settings' },
    { label: 'Academic Help', icon: 'terminal', path: '/ai-help' },
    { label: 'Support', icon: 'comment', path: '/home' },
  ];

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] bg-forest-bg ios-glass border-r border-white/5 z-[101] p-6 pt-12 flex flex-col"
          >
            <div className="flex items-center gap-4 mb-10">
              <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-forest-accent to-forest-dim flex items-center justify-center shadow-lg overflow-hidden border-2 border-white/10">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <SVGIcon name="person" className="w-8 h-8 text-forest-bg" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[18px] font-bold text-white truncate">{user?.displayName || 'Scholar'}</h2>
                <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider truncate">
                  {profile?.major || 'Academic Member'}
                </p>
              </div>
            </div>

            <div className="space-y-2 flex-1">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setIsSidebarOpen(false);
                    navigate(item.path);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors text-text-primary group"
                >
                  <SVGIcon name={item.icon} className="w-5 h-5 text-text-muted group-hover:text-forest-accent transition-colors" />
                  <span className="text-[16px] font-semibold">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between p-2">
                <span className="text-[14px] font-bold text-text-muted uppercase tracking-widest">Appearance</span>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`w-14 h-7 rounded-full transition-all flex items-center px-1 ${
                    isDarkMode ? 'bg-forest-accent' : 'bg-white/10'
                  }`}
                >
                  <motion.div
                    animate={{ x: isDarkMode ? 28 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center"
                  >
                    <SVGIcon name={isDarkMode ? 'lock' : 'target'} className="w-3 h-3 text-black" />
                  </motion.div>
                </button>
              </div>
              
              <button
                onClick={() => navigate('/')}
                className="w-full py-4 bg-forest-crit-bg/40 text-forest-critical font-bold rounded-2xl ios-button border border-forest-critical/10"
              >
                Sign Out
              </button>
              
              <div className="text-center opacity-30 text-[10px] font-bold tracking-widest text-text-faint">
                SCHOLARHUB PRO V1.0.4
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
