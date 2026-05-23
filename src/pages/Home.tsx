import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar.tsx';
import { BottomNav } from '../components/BottomNav.tsx';
import { SVGIcon } from '../components/SVGIcon.tsx';
import { useApp } from '../AppContext.tsx';
import { getAccessToken, loginWithGoogle } from '../lib/firebase.ts';
import { listMessages, getMessageDetails, GmailMessage } from '../lib/gmail.ts';

export default function Home() {
  const navigate = useNavigate();
  const { tasks, user } = useApp();

  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [gmailUserEmail, setGmailUserEmail] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [emails, setEmails] = useState<GmailMessage[]>(() => {
    const sessionEmails = sessionStorage.getItem('scholarhub_session_briefing_emails');
    if (sessionEmails) {
      try { return JSON.parse(sessionEmails); } catch (e) {}
    }
    return [];
  });
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  
  const [aiBriefing, setAiBriefing] = useState<string | null>(() => {
    return sessionStorage.getItem('scholarhub_session_briefing_text');
  });
  const [emailSummaries, setEmailSummaries] = useState<Record<string, { summary: string; actionItem: string; isUrgent: boolean }>>(() => {
    const sessionSummaries = sessionStorage.getItem('scholarhub_session_briefing_summaries');
    if (sessionSummaries) {
      try { return JSON.parse(sessionSummaries); } catch (e) {}
    }
    return {};
  });
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(null);

  // Today's formatted date
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  // Check on mount for existing token
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setGmailToken(token);
      setGmailUserEmail(user?.email || 'Scholar Gmail');
    }
  }, [user]);

  // Connect Gmail button click handler
  const handleConnectGmail = async () => {
    setIsConnecting(true);
    setConnectError(null);
    try {
      const result = await loginWithGoogle();
      const token = getAccessToken();
      if (token) {
        setGmailToken(token);
        setGmailUserEmail(result.user?.email || user?.email || 'Scholar Gmail');
      }
    } catch (err: any) {
      console.error('Failed to authorize Google Workspace API on Home page:', err);
      setConnectError(err?.message || String(err));
    } finally {
      setIsConnecting(false);
    }
  };

  // Fetch emails & call Gemini API route to summarize
  const loadAndSummarizeInbox = async (tokenToUse: string, isManualRefresh = false) => {
    if (!isManualRefresh) {
      const isSynced = sessionStorage.getItem('scholarhub_session_briefing_synced') === 'true';
      const sessionBriefing = sessionStorage.getItem('scholarhub_session_briefing_text');
      const sessionEmails = sessionStorage.getItem('scholarhub_session_briefing_emails');
      const sessionSummaries = sessionStorage.getItem('scholarhub_session_briefing_summaries');
      
      if (isSynced && sessionBriefing && sessionEmails && sessionSummaries) {
        console.log('Restoring briefing from active session storage (once-per-session constraint).');
        try {
          setAiBriefing(sessionBriefing);
          setEmails(JSON.parse(sessionEmails));
          setEmailSummaries(JSON.parse(sessionSummaries));
          setIsLoadingEmails(false);
          setIsBriefingLoading(false);
          return;
        } catch (e) {
          console.warn('Failed restoring active session briefing values, falling back to load:', e);
        }
      }
    }

    setIsLoadingEmails(true);
    setIsBriefingLoading(true);
    try {
      // 1. Fetch unread messages from Gmail
      let list = await listMessages(tokenToUse, 'is:unread'); 
      if (!list || list.length === 0) {
        // Fallback: list recent messages instead of unread to ensure user gets a real preview
        const recentList = await listMessages(tokenToUse, 'category:primary');
        list = recentList || [];
      }

      const msgsToParse = list.slice(0, 5);
      const detailedMsgs: GmailMessage[] = [];
      for (const item of msgsToParse) {
        const details = await getMessageDetails(tokenToUse, item.id);
        if (details) {
          detailedMsgs.push(details);
        }
      }

      setEmails(detailedMsgs);

      // Try reading from local cache first to avoid repeating requests and triggering 429 quota exceptions
      const cacheKey = `scholarhub_briefing_${detailedMsgs.map(m => m.id).sort().join('_')}`;
      const cached = !isManualRefresh ? localStorage.getItem(cacheKey) : null;
      if (cached) {
        try {
          const parsedCached = JSON.parse(cached);
          if (parsedCached && parsedCached.briefing && parsedCached.summariesMap) {
            console.log('Serving email summaries and briefing from custom client cache.');
            setAiBriefing(parsedCached.briefing);
            setEmailSummaries(parsedCached.summariesMap);
            
            // Populate sessionStorage as well
            sessionStorage.setItem('scholarhub_session_briefing_synced', 'true');
            sessionStorage.setItem('scholarhub_session_briefing_text', parsedCached.briefing);
            sessionStorage.setItem('scholarhub_session_briefing_emails', JSON.stringify(detailedMsgs));
            sessionStorage.setItem('scholarhub_session_briefing_summaries', JSON.stringify(parsedCached.summariesMap));

            setIsLoadingEmails(false);
            setIsBriefingLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Stale or malformed cache, clearing cache entry:', e);
          localStorage.removeItem(cacheKey);
        }
      }

      // 2. Call the server-side Gemini route to get structured briefing + summaries
      const response = await fetch('/api/summarize-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emails: detailedMsgs,
          displayName: user?.displayName || 'Scholar'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Gemini summaries');
      }

      const resData = await response.json();
      setAiBriefing(resData.briefing);

      if (resData.summaries && Array.isArray(resData.summaries)) {
        const summariesMap: Record<string, { summary: string; actionItem: string; isUrgent: boolean }> = {};
        resData.summaries.forEach((s: any) => {
          summariesMap[s.id] = {
            summary: s.summary,
            actionItem: s.actionItem,
            isUrgent: s.isUrgent
          };
        });
        setEmailSummaries(summariesMap);

        // Save into local storage cache
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            briefing: resData.briefing,
            summariesMap
          }));
        } catch (cacheErr) {
          console.error('Failed to update local cache storage:', cacheErr);
        }

        // Save into active session storage
        try {
          sessionStorage.setItem('scholarhub_session_briefing_synced', 'true');
          sessionStorage.setItem('scholarhub_session_briefing_text', resData.briefing);
          sessionStorage.setItem('scholarhub_session_briefing_emails', JSON.stringify(detailedMsgs));
          sessionStorage.setItem('scholarhub_session_briefing_summaries', JSON.stringify(summariesMap));
        } catch (sessionErr) {
          console.error('Failed to update session storage:', sessionErr);
        }
      }
    } catch (err) {
      console.error('Error in loading or summarizing inbox:', err);
    } finally {
      setIsLoadingEmails(false);
      setIsBriefingLoading(false);
    }
  };

  // Trigger when gmailToken is set
  useEffect(() => {
    if (gmailToken) {
      loadAndSummarizeInbox(gmailToken);
    }
  }, [gmailToken]);

  return (
    <div className="page-transition premium-gradient min-h-screen">
      <TopBar title="ScholarHub" />
      
      <main className="p-6 pt-[100px] pb-[120px] max-w-lg mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="space-y-1">
          <h2 className="text-text-muted text-[15px] font-medium">{todayStr}</h2>
          <h1 className="text-[32px] font-bold font-display tracking-tight text-white leading-tight">
            Focus on your <span className="text-forest-accent">Lab Report</span>
          </h1>
        </div>

        {/* AI Briefing Segment */}
        {gmailToken ? (
          <section className="ios-card overflow-hidden group">
            <div className="bg-forest-accent/5 p-5 border-b border-white/5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-forest-accent/20 flex items-center justify-center">
                    <SVGIcon name="terminal" className="w-4 h-4 text-forest-accent" />
                  </div>
                  <span className="text-[12px] font-bold text-forest-accent uppercase tracking-widest">
                    Briefing
                  </span>
                </div>
                <span className="font-mono text-[10px] text-text-faint bg-white/5 px-2 py-1 rounded">
                  SYS_ACTIVE
                </span>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              {isBriefingLoading ? (
                <div className="space-y-3 py-2 animate-pulse">
                  <div className="h-4 bg-white/10 rounded-full w-3/4"></div>
                  <div className="h-4 bg-white/10 rounded-full"></div>
                  <div className="h-4 bg-white/10 rounded-full w-5/6"></div>
                </div>
              ) : (
                <p className="text-[15px] leading-relaxed text-text-primary font-medium">
                  {aiBriefing || `Syncing briefing for ${user?.displayName?.split(' ')[0] || 'Scholar'}...`}
                </p>
              )}
              <div className="flex gap-2 pt-1 border-t border-white/5">
                <button 
                  onClick={() => navigate('/focus')}
                  className="flex-1 h-12 bg-forest-accent text-forest-bg ios-button hover:shadow-[0_0_20px_rgba(74,222,128,0.3)] text-[14px] font-bold"
                >
                  Start Focus Session
                </button>
                <button 
                  onClick={() => gmailToken && loadAndSummarizeInbox(gmailToken, true)}
                  disabled={isLoadingEmails}
                  className="w-12 h-12 bg-white/5 hover:bg-white/10 flex items-center justify-center rounded-2xl transition-colors disabled:opacity-55"
                  title="Reload & Summarize"
                >
                  <SVGIcon name="sync" className={`w-5 h-5 text-forest-accent ${isLoadingEmails ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="ios-card overflow-hidden group border border-forest-accent/25 bg-gradient-to-br from-forest-bg to-forest-card">
            <div className="bg-forest-accent/5 p-5 border-b border-white/5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-forest-accent/20 flex items-center justify-center">
                    <SVGIcon name="terminal" className="w-4 h-4 text-forest-accent" />
                  </div>
                  <span className="text-[12px] font-bold text-forest-accent uppercase tracking-widest">
                    AI Briefing
                  </span>
                </div>
                <span className="font-mono text-[10px] text-text-faint bg-white/5 px-2 py-1 rounded">
                  OFFLINE
                </span>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-[15px] leading-relaxed text-text-muted font-medium">
                Good morning, {user?.displayName?.split(' ')[0] || 'Scholar'}. Connect your Gmail to get a personalized study briefing, urgent notifications, and direct mail summarization.
              </p>
              <button 
                onClick={handleConnectGmail}
                disabled={isConnecting}
                className="w-full h-12 bg-white text-gray-900 font-bold rounded-2xl flex items-center justify-center gap-3 ios-button hover:scale-[1.01] transform transition-all shadow-lg active:scale-95 animate-pulse"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                <span>{isConnecting ? 'Authorizing...' : 'Connect Gmail Account'}</span>
              </button>

              {connectError && (
                <div className="bg-forest-crit-bg/95 border border-forest-critical/30 p-4 rounded-xl text-left space-y-2">
                  <h4 className="text-[12px] font-bold text-forest-critical flex items-center gap-1.5 uppercase tracking-wider font-mono">
                     Authorization Blocked
                  </h4>
                  <p className="text-[12px] text-text-primary leading-relaxed">
                    Google Auth popups are blocked inside secure sandboxed iframes. Please open this app in a standalone tab to authorize Gmail safely.
                  </p>
                  <p className="text-[10px] font-mono text-text-muted select-text break-words">
                    Details: {connectError}
                  </p>
                  <button
                    onClick={() => window.open(window.location.href, '_blank')}
                    className="w-full h-10 bg-forest-critical hover:bg-forest-critical/90 text-white ios-button text-[12px] font-bold mt-1 shadow-md shadow-forest-critical/20"
                  >
                    Open in Standalone Tab ↗
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Stats Grid - Bento Style */}
        <div className="grid grid-cols-2 gap-4">
          <div className="ios-card p-5 space-y-3 bg-gradient-to-br from-forest-card to-forest-card/40">
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
              <SVGIcon name="calendar" className="w-5 h-5 text-text-muted" />
            </div>
            <div>
              <div className="text-[28px] font-bold font-display">{tasks.length}</div>
              <div className="text-[12px] text-text-muted font-semibold uppercase tracking-wider">Active Tasks</div>
            </div>
          </div>
          <div className="ios-card p-5 space-y-3 border-forest-critical/20 bg-forest-crit-bg/40">
            <div className="w-10 h-10 rounded-2xl bg-forest-critical/10 flex items-center justify-center">
              <SVGIcon name="alert-triangle" className="w-5 h-5 text-forest-critical" />
            </div>
            <div>
              <div className="text-[28px] font-bold font-display text-forest-critical">
                {Object.values(emailSummaries).filter((s: any) => s.isUrgent).length || '0'}
              </div>
              <div className="text-[12px] text-forest-critical/70 font-semibold uppercase tracking-wider">Urgent Mails</div>
            </div>
          </div>
        </div>

        {/* Timeline Matrix */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[20px] font-bold font-display text-white">Timeline Matrix</h3>
            <button onClick={() => navigate('/tasks')} className="text-forest-accent text-[14px] font-bold">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {tasks.length > 0 ? (
              tasks.slice(0, 3).map((task) => (
                <div 
                  key={task.id} 
                  className="ios-card p-4 flex items-center gap-4 group cursor-pointer hover:bg-white/5"
                  onClick={() => navigate('/tasks')}
                >
                  <div className={`w-1 shadow-[0_0_15px_rgba(0,0,0,0.5)] h-12 rounded-full ${
                    task.priority === 'critical' ? 'bg-forest-critical' : 
                    task.priority === 'high' ? 'bg-forest-amber' : 'bg-forest-accent'
                  }`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[12px] font-bold text-text-muted uppercase tracking-wider">{task.course?.split(' - ')[0] || 'CLASS'}</span>
                      <span className="text-[11px] text-text-faint font-medium">{task.dueIn || 'Soon'}</span>
                    </div>
                    <h4 className="text-[16px] font-bold text-text-primary">{task.title}</h4>
                  </div>
                  <SVGIcon name="check" className={`w-5 h-5 ${task.done ? 'text-forest-accent' : 'text-text-faint'} group-hover:text-forest-accent transition-colors`} />
                </div>
              ))
            ) : (
              <div className="ios-card p-5 text-center text-text-faint text-[14px]">
                No pending tasks found.
              </div>
            )}
          </div>
        </section>

        {/* Comms Hub / Gmail Summarizer */}
        <section className="ios-card overflow-hidden">
          <div className="p-5 border-b border-white/5 flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
                <SVGIcon name="mail" className="w-4 h-4 text-forest-accent" />
                Comms Hub
              </h3>
              {gmailToken ? (
                <span className="text-[10px] font-mono text-forest-accent bg-forest-accent/10 border border-forest-accent/25 px-2 py-0.5 rounded-full uppercase">
                  Connected
                </span>
              ) : (
                <span className="text-[10px] font-mono text-text-faint px-2 py-0.5 rounded-full uppercase">
                  Offline
                </span>
              )}
            </div>
            {gmailToken && gmailUserEmail && (
              <span className="font-mono text-[11px] text-text-muted truncate mt-0.5" id="user-email-id">
                Email ID: <span className="text-forest-accent">{gmailUserEmail}</span>
              </span>
            )}
          </div>

          <div className="divide-y divide-white/5">
            {gmailToken ? (
              isLoadingEmails ? (
                <div className="p-8 text-center text-text-muted animate-pulse font-medium text-[14px]">
                  Connecting secure API and summarizing messages...
                </div>
              ) : emails.length > 0 ? (
                emails.map((email) => {
                  const hasSummary = !!emailSummaries[email.id];
                  const summaryData = emailSummaries[email.id];
                  return (
                    <div 
                      key={email.id} 
                      onClick={() => setSelectedEmail(email)}
                      className="p-5 hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-forest-accent/15 border border-forest-accent/20 flex items-center justify-center text-[12px] font-bold text-forest-accent">
                            {email.from[0]?.toUpperCase() || 'S'}
                          </div>
                          <div>
                            <div className="text-[14px] font-bold text-white flex items-center gap-2">
                              <span className="truncate max-w-[140px] text-white group-hover:text-forest-accent transition-colors">{email.from}</span>
                              {(summaryData?.isUrgent || email.isUrgent) && (
                                <span className="text-[10px] bg-forest-critical/15 text-forest-critical border border-forest-critical/30 font-bold px-1.5 py-0.5 rounded-full uppercase font-mono tracking-wider">
                                  URGENT
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-text-muted">{email.date}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-[14px] font-semibold text-white mb-1 truncate group-hover:text-forest-accent transition-colors">
                        {email.subject}
                      </div>
                      <p className="text-[13px] text-text-muted line-clamp-1">
                        {email.snippet}
                      </p>

                      {/* AI Structured Summary Insertion */}
                      {hasSummary && summaryData && (
                        <div className="mt-3 text-[13px] bg-forest-accent/5 border border-forest-accent/15 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <SVGIcon name="terminal" className="w-3.5 h-3.5 text-forest-accent" />
                            <span className="text-[10px] font-bold text-forest-accent uppercase tracking-wider font-mono animate-pulse">
                              Gemini Quick Summary
                            </span>
                          </div>
                          <p className="text-text-primary leading-relaxed font-medium">
                            {summaryData.summary}
                          </p>
                          {summaryData.actionItem && (
                            <div className="pt-2 border-t border-white/5 text-[12px] text-forest-amber flex items-start gap-1.5 font-semibold">
                              <span className="flex-shrink-0 text-orange-400">→ Recommendation:</span>
                              <span className="text-white/90">{summaryData.actionItem}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-text-muted text-[14px]">
                  No unread or recent messages to compile briefing from.
                </div>
              )
            ) : (
              <div className="p-6 text-center space-y-4">
                <p className="text-[14px] text-text-muted leading-relaxed">
                  Gmail is presently offline. Authorize Gmail to fetch live inbox updates, compile AI motivational briefings daily, and run automatic inline summarization.
                </p>
                <button 
                  onClick={handleConnectGmail}
                  disabled={isConnecting}
                  className="px-4 py-2 bg-white text-gray-950 hover:bg-zinc-100 disabled:opacity-50 rounded-xl text-[13px] font-bold transition-all"
                >
                  {isConnecting ? 'Authorizing...' : 'Enable Summarizer Connect'}
                </button>

                {connectError && (
                  <div className="bg-forest-crit-bg/95 border border-forest-critical/30 p-4 rounded-xl text-left space-y-2 max-w-sm mx-auto">
                    <h4 className="text-[11px] font-bold text-forest-critical flex items-center gap-1 uppercase tracking-wider font-mono">
                      Connection Delayed
                    </h4>
                    <p className="text-[12px] text-text-primary leading-relaxed">
                      Google Auth requires opening the app in a standalone window rather than an embedded sandbox preview.
                    </p>
                    <button
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="w-full h-9 bg-forest-critical hover:bg-forest-critical/90 text-white ios-button text-[11px] font-bold mt-1"
                    >
                      Open in New Tab & Connect ↗
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Detail Overlay Modal when an Email is clicked */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-fade-in" id="email-detail-modal">
          <div className="ios-card bg-forest-bg w-full max-w-md overflow-hidden max-h-[80vh] flex flex-col border border-white/10 shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-white/5 bg-white/5 flex justify-between items-start">
              <div>
                <h4 className="text-[12px] font-bold text-forest-accent uppercase tracking-wider font-mono mb-1">
                  Gmail Node View
                </h4>
                <div className="text-[16px] font-bold text-white line-clamp-1 leading-tight">
                  {selectedEmail.subject}
                </div>
              </div>
              <button 
                onClick={() => setSelectedEmail(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content info wrapper */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div>
                <div className="text-[12px] text-text-muted font-semibold uppercase tracking-wider mb-1">From</div>
                <div className="text-[14px] text-text-primary bg-white/5 rounded-lg px-3 py-2 font-medium break-all">{selectedEmail.from}</div>
              </div>

              <div>
                <div className="text-[12px] text-text-muted font-semibold uppercase tracking-wider mb-1">Received Time</div>
                <div className="text-[14px] text-text-primary bg-white/5 rounded-lg px-3 py-2 font-medium">{selectedEmail.date}</div>
              </div>

              <div>
                <div className="text-[12px] text-text-muted font-semibold uppercase tracking-wider mb-1">Inbox Snippet</div>
                <p className="text-[14px] text-text-primary leading-relaxed bg-white/5 rounded-lg px-4 py-3 font-medium whitespace-pre-wrap">
                  {selectedEmail.snippet}
                </p>
              </div>

              {/* Gemini Analytics */}
              {emailSummaries[selectedEmail.id] && (
                <div className="bg-forest-accent/5 border border-forest-accent/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-forest-accent/25 flex items-center justify-center">
                      <SVGIcon name="terminal" className="w-3.5 h-3.5 text-forest-accent" />
                    </div>
                    <span className="text-[11px] font-bold text-forest-accent uppercase tracking-widest font-mono">
                      Gemini Analysis
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-text-faint font-bold uppercase tracking-wider">A.I. Summary</span>
                    <p className="text-[13px] text-text-primary font-medium leading-relaxed">
                      {emailSummaries[selectedEmail.id].summary}
                    </p>
                  </div>

                  {emailSummaries[selectedEmail.id].actionItem && (
                    <div className="space-y-1 border-t border-white/5 pt-2">
                      <span className="text-[11px] text-forest-amber font-bold uppercase tracking-wider">Recommended Action</span>
                      <p className="text-[13px] text-white font-semibold leading-relaxed">
                        {emailSummaries[selectedEmail.id].actionItem}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="p-4 bg-white/5 border-t border-white/5 flex gap-2">
              <button 
                onClick={() => setSelectedEmail(null)}
                className="flex-1 h-11 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[14px] font-bold transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
