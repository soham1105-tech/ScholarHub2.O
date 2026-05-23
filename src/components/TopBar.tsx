import React from 'react';
import { SVGIcon } from './SVGIcon.tsx';
import { useApp } from '../AppContext.tsx';
import { useNavigate } from 'react-router-dom';

export const TopBar = ({ title }: { title: string }) => {
  const { setIsSidebarOpen, alerts, user, isFocusLocked } = useApp();
  const navigate = useNavigate();

  const unreadCount = alerts.length;

  return (
    <header className="fixed top-0 left-0 right-0 h-20 backdrop-blur-3xl bg-forest-bg/40 z-50 flex items-center px-6 border-b border-white/5">
      <div className="flex-1 flex items-center gap-4">
        {isFocusLocked ? (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-forest-accent/10 border border-forest-accent/20">
            <SVGIcon name="lock" className="w-5 h-5 text-forest-accent animate-pulse" />
          </div>
        ) : (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors ios-button overflow-hidden border border-white/10"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <SVGIcon name="hamburger" className="w-5 h-5 text-text-muted" />
            )}
          </button>
        )}
        <span className="font-display text-[22px] font-bold text-text-primary tracking-tight">
          {title}
        </span>
      </div>
      
      {!isFocusLocked && (
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors ios-button"
          >
            <SVGIcon name="settings" className="w-5 h-5 text-text-muted" />
          </button>
          <div className="relative">
            <button 
              onClick={() => navigate('/alerts')}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-forest-accent/10 hover:bg-forest-accent/20 transition-colors ios-button"
            >
              <SVGIcon name="bell" className="w-5 h-5 text-forest-accent" />
            </button>
            {unreadCount > 0 && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-forest-critical rounded-full border-2 border-forest-bg" />
            )}
          </div>
        </div>
      )}
    </header>
  );
};
