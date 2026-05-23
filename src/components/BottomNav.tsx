import React from 'react';
import { NavLink } from 'react-router-dom';
import { SVGIcon } from './SVGIcon.tsx';
import { useApp } from '../AppContext.tsx';

export const BottomNav = () => {
  const { isFocusLocked } = useApp();
  
  if (isFocusLocked) return null;

  const tabs = [
    { label: 'Home', path: '/home', icon: 'house' },
    { label: 'Tasks', path: '/tasks', icon: 'checkbox' },
    { label: 'Focus', path: '/focus', icon: 'timer' },
    { label: 'Alerts', path: '/alerts', icon: 'bell' },
  ];

  return (
    <div className="fixed bottom-6 left-6 right-6 h-16 ios-glass rounded-[32px] z-50 flex items-center justify-around px-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) => 
            `relative flex flex-col items-center justify-center flex-1 h-12 transition-all duration-300 ${
              isActive ? 'text-forest-accent' : 'text-text-muted hover:text-text-primary'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <div className="absolute inset-0 bg-forest-accent/10 rounded-2xl scale-90" />
              )}
              <SVGIcon name={tab.icon} className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} />
              <span className={`text-[10px] font-bold mt-1 tracking-wider uppercase ${isActive ? 'opacity-100' : 'opacity-60 text-[8px]'}`}>
                {tab.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
};
