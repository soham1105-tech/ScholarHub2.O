import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ForestBackground } from '../components/ForestBackground.tsx';
import { loginWithGoogle } from '../lib/firebase.ts';

export default function Login() {
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isInsideIframe, setIsInsideIframe] = useState(false);

  useEffect(() => {
    // Detect if we are inside an iframe
    try {
      setIsInsideIframe(window.self !== window.top);
    } catch (e) {
      setIsInsideIframe(true);
    }
  }, []);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await loginWithGoogle();
      navigate('/home');
    } catch (error: any) {
      console.error('Login error:', error);
      const errMsg = error?.message || String(error);
      setLoginError(errMsg);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-8 premium-gradient overflow-hidden">
      <ForestBackground />
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-forest-accent/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-forest-amber/5 rounded-full blur-[100px]" />

      <div className="w-full max-w-[380px] text-center z-10 page-transition">
        <div className="mb-12 inline-flex items-center justify-center w-20 h-20 rounded-[32px] bg-gradient-to-br from-forest-accent to-forest-dim shadow-xl shadow-forest-accent/20">
          <svg className="w-10 h-10 text-forest-bg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="text-[48px] font-bold text-white mb-4 tracking-tighter leading-none font-display">
          ScholarHub
        </h1>
        <p className="text-[17px] text-text-muted leading-relaxed mb-8 font-medium">
          Reclaim your focus. <br />
          <span className="text-forest-accent/80">One place for everything academic.</span>
        </p>

        {/* Dynamic Warning Banners or Troubleshooting Cards */}
        {loginError && (
          <div className="ios-card bg-forest-crit-bg/95 border border-forest-critical/30 p-5 rounded-[24px] mb-6 text-left space-y-3 shadow-lg">
            <h3 className="text-forest-critical font-bold text-[14px] flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Google Sign-In Popup Interrupted
            </h3>
            
            <p className="text-[13px] text-text-primary leading-relaxed">
              Browsers block Google popup authorization windows by default when apps run inside secure sandboxed iframes.
            </p>

            <div className="text-[11px] font-mono text-text-muted space-y-1">
              <div className="text-forest-critical/80">Details: {loginError}</div>
            </div>

            <button
              onClick={handleOpenInNewTab}
              className="w-full h-11 bg-forest-critical hover:bg-forest-critical/90 text-white ios-button text-[13px] font-bold shadow-md shadow-forest-critical/20"
            >
              Open in a New Tab ↗
            </button>
          </div>
        )}



        <div className="ios-card p-2 rounded-[32px] mb-8">
          <button 
            onClick={handleLogin}
            className="w-full h-14 bg-white rounded-[24px] flex items-center justify-center gap-4 ios-button shadow-xl shadow-black/20 hover:scale-[1.02] transform transition-all"
          >
            <svg className="w-6 h-6 shadow-sm" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="text-[17px] font-bold text-gray-900">Sign in with Google</span>
          </button>
        </div>

        <p className="text-[13px] text-text-faint px-8 leading-relaxed">
          By signing in, you agree to our <br />
          <span className="text-forest-accent font-semibold border-b border-forest-accent/30 cursor-pointer">Terms of Service</span> and <span className="text-forest-accent font-semibold border-b border-forest-accent/30 cursor-pointer">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}

