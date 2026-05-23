/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login.tsx';
import Home from './pages/Home.tsx';
import Focus from './pages/Focus.tsx';
import Tasks from './pages/Tasks.tsx';
import Alerts from './pages/Alerts.tsx';
import AcademicHelp from './pages/AcademicHelp.tsx';
import Profile from './pages/Profile.tsx';
import Settings from './pages/Settings.tsx';
import { ForestBackground } from './components/ForestBackground.tsx';
import { AppProvider, useApp } from './AppContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';

function Layout({ children }: { children: React.ReactNode }) {
  const { isDarkMode, isFocusLocked } = useApp();
  const location = useLocation();

  if (isFocusLocked && location.pathname !== '/focus') {
    return <Navigate to="/focus" replace />;
  }
  
  return (
    <div className={`min-h-screen pb-20 relative transition-all duration-700 ${isDarkMode ? 'dark brightness-100' : 'brightness-125 saturate-110'}`}>
      <ForestBackground />
      <Sidebar />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Layout><Home /></Layout>} />
          <Route path="/focus" element={<Layout><Focus /></Layout>} />
          <Route path="/tasks" element={<Layout><Tasks /></Layout>} />
          <Route path="/alerts" element={<Layout><Alerts /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          <Route path="/ai-help" element={<Layout><AcademicHelp /></Layout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}
