import React, { useState, useEffect } from 'react';
import { coursework as initialCoursework } from '../data/mockData.js';
import { TopBar } from '../components/TopBar.tsx';
import { BottomNav } from '../components/BottomNav.tsx';
import { SVGIcon } from '../components/SVGIcon.tsx';
import { useApp } from '../AppContext.tsx';
import { AddTaskModal } from '../components/AddTaskModal.tsx';
import { getAccessToken, loginWithGoogle } from '../lib/firebase.ts';
import { listMessages, getMessageDetails } from '../lib/gmail.ts';
import { syncRealClassroom } from '../lib/classroom.ts';

const SectionHeader = ({ label, rightLabel, rightAction, rightIcon, isSpinning }: { 
  label: string; 
  rightLabel?: string; 
  rightAction?: () => void; 
  rightIcon?: string;
  isSpinning?: boolean;
}) => (
  <div className="flex justify-between items-end mb-4 px-1">
    <span className="text-[14px] font-bold uppercase tracking-widest text-text-muted">{label}</span>
    {rightLabel && (
      <button 
        onClick={rightAction} 
        disabled={isSpinning}
        className="flex items-center gap-1.5 text-forest-accent text-[14px] font-bold disabled:opacity-50"
      >
        {rightIcon && <SVGIcon name={rightIcon} className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />}
        {rightLabel}
      </button>
    )}
  </div>
);

export default function Tasks() {
  const { tasks, addTask, toggleTaskDone, user } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All Tasks');
  
  // Gmail & Classroom Sync States
  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedCoursework, setSyncedCoursework] = useState<any[]>(() => {
    const sessionData = sessionStorage.getItem('scholarhub_session_classroom_data');
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {}
    }
    return initialCoursework;
  });
  const [addedCourseworkIds, setAddedCourseworkIds] = useState<Record<string, boolean>>({});
  const [showAllCoursework, setShowAllCoursework] = useState(false);
  const [syncNotFound, setSyncNotFound] = useState(() => {
    return sessionStorage.getItem('scholarhub_session_classroom_notfound') === 'true';
  });

  // Trigger token check on load
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setGmailToken(token);
    }
  }, [user]);

  // Handle connecting Google Account
  const handleConnectGmail = async () => {
    setIsConnecting(true);
    setConnectError(null);
    setSyncNotFound(false);
    try {
      const result = await loginWithGoogle();
      const token = getAccessToken();
      if (token) {
        setGmailToken(token);
        syncClassroomLive(token, true);
      }
    } catch (err: any) {
      console.error('Google authorization error on Tasks page:', err);
      setConnectError(err?.message || String(err));
    } finally {
      setIsConnecting(false);
    }
  };

  // Perform Live Google Classroom Sync with fallback to Gemini-based Gmail scanning
  const syncClassroomLive = async (tokenToUse: string, isManualRefresh = false) => {
    if (!isManualRefresh) {
      const isSynced = sessionStorage.getItem('scholarhub_session_classroom_synced') === 'true';
      const sessionData = sessionStorage.getItem('scholarhub_session_classroom_data');
      if (isSynced && sessionData) {
        console.log('Serving coursework data from active session storage (once-per-session constraint).');
        try {
          const parsed = JSON.parse(sessionData);
          setSyncedCoursework(parsed);
          const wasNotFound = sessionStorage.getItem('scholarhub_session_classroom_notfound') === 'true';
          setSyncNotFound(wasNotFound);
          return;
        } catch (e) {
          console.warn('Failed restoring classroom session from cache, starting live sync:', e);
        }
      }
    }

    setIsSyncing(true);
    setConnectError(null);
    setSyncNotFound(false);
    try {
      // 1. Attempt Google Classroom Core API sync first (seamless primary integration)
      console.log('Attempting live course & coursework sync via Google Classroom API...');
      const realClassroomItems = await syncRealClassroom(tokenToUse);
      if (realClassroomItems && realClassroomItems.length > 0) {
        const mapped = realClassroomItems.map(item => ({ ...item, syncSource: 'Classroom' }));
        setSyncedCoursework(mapped);
        
        // Save to sessionStorage
        sessionStorage.setItem('scholarhub_session_classroom_synced', 'true');
        sessionStorage.setItem('scholarhub_session_classroom_data', JSON.stringify(mapped));
        sessionStorage.setItem('scholarhub_session_classroom_notfound', 'false');
        return;
      }

      // 2. Fall back to Gmail School Notification scanning if Classroom courses list is empty or returns no pending updates
      console.log('No direct Classroom courses found. Falling back to Gmail AI Scanner...');
      const list = await listMessages(tokenToUse, 'subject:(Classroom OR assignment OR grade OR exam OR syllabus OR homework) OR classroom');
      if (!list || list.length === 0) {
        // Broaden search parameters
        const generalList = await listMessages(tokenToUse, 'assignment OR exam OR school');
        if (!generalList || generalList.length === 0) {
          // If no matching sources, fallback to empty layout or not found state
          setSyncedCoursework([]);
          setSyncNotFound(true);
          
          sessionStorage.setItem('scholarhub_session_classroom_synced', 'true');
          sessionStorage.setItem('scholarhub_session_classroom_data', JSON.stringify([]));
          sessionStorage.setItem('scholarhub_session_classroom_notfound', 'true');
          return;
        }
        await processEmailsAndSync(tokenToUse, generalList.slice(0, 5), isManualRefresh);
        return;
      }
      await processEmailsAndSync(tokenToUse, list.slice(0, 6), isManualRefresh);
    } catch (err: any) {
      console.error('Failed to sync academic classroom notices:', err);
      setConnectError(err?.message || String(err));
      setSyncNotFound(true);
    } finally {
      setIsSyncing(false);
    }
  };

  const processEmailsAndSync = async (token: string, messageList: any[], isManualRefresh = false) => {
    const detailedMails: any[] = [];
    for (const msg of messageList) {
      const details = await getMessageDetails(token, msg.id);
      if (details) {
        detailedMails.push(details);
      }
    }

    if (detailedMails.length === 0) {
      setSyncedCoursework([]);
      setSyncNotFound(true);
      return;
    }

    // Try to restore from local clientside cache first
    const cacheKey = `scholarhub_classroom_${detailedMails.map(m => m.id).sort().join('_')}`;
    const cached = !isManualRefresh ? localStorage.getItem(cacheKey) : null;
    if (cached) {
      try {
        const parsedCached = JSON.parse(cached);
        if (parsedCached && Array.isArray(parsedCached)) {
          console.log('Serving coursework data from local clientside cache.');
          if (parsedCached.length > 0) {
            setSyncedCoursework(parsedCached);
            setSyncNotFound(false);
            sessionStorage.setItem('scholarhub_session_classroom_synced', 'true');
            sessionStorage.setItem('scholarhub_session_classroom_data', JSON.stringify(parsedCached));
            sessionStorage.setItem('scholarhub_session_classroom_notfound', 'false');
          } else {
            setSyncedCoursework([]);
            setSyncNotFound(true);
            sessionStorage.setItem('scholarhub_session_classroom_synced', 'true');
            sessionStorage.setItem('scholarhub_session_classroom_data', JSON.stringify([]));
            sessionStorage.setItem('scholarhub_session_classroom_notfound', 'true');
          }
          return;
        }
      } catch (e) {
        console.warn('Stale or invalid coursework cache entry. Invalidating:', e);
        localStorage.removeItem(cacheKey);
      }
    }

    // Process using server-side Gemini 3.5-flash
    const response = await fetch('/api/sync-classroom', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ emails: detailedMails })
    });

    if (!response.ok) {
      setSyncedCoursework([]);
      setSyncNotFound(true);
      throw new Error('Server Classroom Syncer failed to compile details');
    }

    const data = await response.json();
    if (data.coursework && Array.isArray(data.coursework) && data.coursework.length > 0) {
      const mapped = data.coursework.map((item: any) => ({ ...item, syncSource: 'Gmail AI' }));
      setSyncedCoursework(mapped);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(mapped));
      } catch (cacheErr) {
        console.error('Failed to update local classroom cache:', cacheErr);
      }
      try {
        sessionStorage.setItem('scholarhub_session_classroom_synced', 'true');
        sessionStorage.setItem('scholarhub_session_classroom_data', JSON.stringify(mapped));
        sessionStorage.setItem('scholarhub_session_classroom_notfound', 'false');
      } catch (e) {}
    } else {
      setSyncedCoursework([]);
      setSyncNotFound(true);
      try {
        localStorage.setItem(cacheKey, JSON.stringify([]));
      } catch (cacheErr) {}
      try {
        sessionStorage.setItem('scholarhub_session_classroom_synced', 'true');
        sessionStorage.setItem('scholarhub_session_classroom_data', JSON.stringify([]));
        sessionStorage.setItem('scholarhub_session_classroom_notfound', 'true');
      } catch (e) {}
    }
  };

  // Trigger sync if token exists and coursework is still mocked
  useEffect(() => {
    if (gmailToken && syncedCoursework === initialCoursework) {
      const isSynced = sessionStorage.getItem('scholarhub_session_classroom_synced') === 'true';
      if (!isSynced) {
        syncClassroomLive(gmailToken, false);
      } else {
        const wasNotFound = sessionStorage.getItem('scholarhub_session_classroom_notfound') === 'true';
        setSyncNotFound(wasNotFound);
      }
    }
  }, [gmailToken, syncedCoursework]);

  // Classroom item to Priority task converter
  const handleAddToPriorities = async (item: any) => {
    try {
      await addTask({
        title: item.title,
        course: item.course || 'Academic Class',
        dueIn: item.meta || '3 days',
        priority: item.color === 'red' ? 'critical' : item.color === 'amber' ? 'high' : 'standard',
        done: false
      });
      setAddedCourseworkIds(prev => ({ ...prev, [item.id]: true }));
    } catch (err) {
      console.error('Failed to add coursework into priority lists:', err);
    }
  };

  // Categorize a priority task
  const getTaskCategory = (task: any): 'due' | 'overdue' | 'noduedate' => {
    const due = (task.dueIn || '').toLowerCase();
    if (due.includes('overdue') || due.includes('past due') || due.includes('expired')) {
      return 'overdue';
    }
    if (!due || due.includes('no due') || due.includes('none') || due.includes('undated')) {
      return 'noduedate';
    }
    return 'due';
  };

  // Categorize a Classroom coursework/announcement item
  const getCourseworkCategory = (item: any): 'due' | 'overdue' | 'noduedate' => {
    const meta = (item.meta || '').toLowerCase();
    
    // Explicit Overdue
    if (meta.includes('overdue')) {
      return 'overdue';
    }
    
    // Explicit No Due Date
    if (meta.includes('no due') || meta.includes('none')) {
      return 'noduedate';
    }
    
    // Explicit Due
    if (meta.includes('due') || meta.includes('days') || meta.includes('today') || meta.includes('tomorrow') || meta.includes('hour')) {
      return 'due';
    }
    
    // Fallbacks based on other values
    if (item.metaIcon === 'comment' || meta.includes('comment') || meta.includes('posted') || meta.includes('file')) {
      return 'noduedate';
    }
    
    return 'due'; // default fallback for assignments/tasks without explicit dates
  };

  // State-based Tab Filter Logic
  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'All Tasks') return true;
    
    const taskCat = getTaskCategory(task);
    if (activeTab === 'Due') return taskCat === 'due';
    if (activeTab === 'Overdue') return taskCat === 'overdue';
    if (activeTab === 'No Due Date') return taskCat === 'noduedate';
    
    return true;
  });

  const filteredCoursework = syncedCoursework.filter(course => {
    if (activeTab === 'All Tasks') return true;
    
    const courseCat = getCourseworkCategory(course);
    if (activeTab === 'Due') return courseCat === 'due';
    if (activeTab === 'Overdue') return courseCat === 'overdue';
    if (activeTab === 'No Due Date') return courseCat === 'noduedate';
    
    return true;
  });

  return (
    <div className="page-transition premium-gradient min-h-screen">
      <TopBar title="Academic" />
      
      <main className="p-6 pt-[100px] pb-[120px] max-w-lg mx-auto space-y-8">
        {/* Course Overview Pill Scroll */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none px-1">
          {['All Tasks', 'Due', 'Overdue', 'No Due Date'].map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-[13px] font-bold whitespace-nowrap transition-all ${
                  isSelected 
                    ? 'bg-forest-accent text-forest-bg shadow-lg shadow-forest-accent/20 scale-105' 
                    : 'bg-white/5 text-text-muted hover:bg-white/10'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Upcoming Deadlines / Priorities */}
        <section>
          <SectionHeader label="Active Priorities" />
          <div className="space-y-4">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => {
                const isChecked = task.done;
                let priorityStyles = "bg-forest-card";
                let badgeColor = "bg-forest-accent/10 text-forest-accent";
                let dotColor = "bg-forest-accent";

                if (task.priority === 'critical') {
                  priorityStyles = "bg-forest-crit-bg/40 border-forest-critical/10";
                  badgeColor = "bg-forest-critical/10 text-forest-critical";
                  dotColor = "bg-forest-critical";
                } else if (task.priority === 'high') {
                  priorityStyles = "bg-forest-high-bg/40 border-forest-amber/10";
                  badgeColor = "bg-forest-amber/10 text-forest-amber";
                  dotColor = "bg-forest-amber";
                }

                return (
                  <div 
                    key={task.id} 
                    className={`ios-card p-5 group transition-all duration-500 overflow-hidden relative ${isChecked ? 'opacity-40 scale-[0.98]' : 'hover:scale-[1.02]'} ${priorityStyles}`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                          <span className={`text-[11px] font-bold tracking-widest uppercase ${badgeColor} px-2 py-0.5 rounded-md`}>
                            {task.dueIn || 'Upcoming'} REMAINING
                          </span>
                        </div>
                        <h3 className={`text-[19px] font-bold text-white transition-all ${isChecked ? 'line-through decoration-forest-accent decoration-2' : ''}`}>
                          {task.title}
                        </h3>
                        <p className="text-[13px] text-text-muted font-medium">{task.course.split(' - ')[0]}</p>
                      </div>
                      
                      <button 
                        onClick={() => toggleTaskDone(task.id, task.done)}
                        className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          isChecked 
                          ? 'bg-forest-accent border-forest-accent scale-110' 
                          : 'border-white/10 bg-white/5 hover:border-forest-accent/30'
                        }`}
                      >
                        {isChecked && <SVGIcon name="check" className="w-5 h-5 text-forest-bg" strokeWidth={3} />}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="ios-card p-6 text-center text-text-faint text-[14px]">
                No pending priorities found for selected subject.
              </div>
            )}
          </div>
        </section>

        {/* Synced Coursework via Google Classroom Smart Sync */}
        <section className="space-y-4">
          <SectionHeader 
            label="Classroom Smart Sync" 
            rightLabel={gmailToken ? (isSyncing ? "Syncing..." : "Sync Live") : undefined} 
            rightIcon={gmailToken ? "sync" : undefined}
            rightAction={() => gmailToken && syncClassroomLive(gmailToken, true)}
            isSpinning={isSyncing}
          />

          {!gmailToken && (
            <div className="ios-card p-6 text-center space-y-4 border border-dashed border-white/15 bg-white/5">
              <div className="w-12 h-12 rounded-2xl bg-forest-accent/15 flex items-center justify-center mx-auto text-forest-accent text-[20px]">
                🔑
              </div>
              <div className="space-y-1">
                <h4 className="text-[15px] font-bold text-white">Live Classroom Sync</h4>
                <p className="text-[13px] text-text-muted max-w-sm mx-auto leading-relaxed">
                  Connect your school Gmail to turn real calendar deadlines, syllabus emails, and Google Classroom updates into dynamic filtered coursework blocks.
                </p>
              </div>
              <button 
                onClick={handleConnectGmail}
                disabled={isConnecting}
                className="px-6 h-11 bg-white text-gray-900 font-bold rounded-xl transition-all hover:bg-zinc-100 disabled:opacity-50 text-[13px]"
              >
                {isConnecting ? "Authorizing..." : "Connect School Account ↗"}
              </button>

              {connectError && (
                <div className="bg-forest-crit-bg/90 border border-forest-critical/30 p-4 rounded-xl text-left space-y-1 text-[12px] truncate max-w-sm mx-auto select-all">
                  <span className="text-forest-critical font-bold">Error:</span> {connectError}
                </div>
              )}
            </div>
          )}

          {isSyncing && (
            <div className="ios-card p-12 text-center text-text-muted animate-pulse font-medium text-[14px] flex flex-col items-center gap-3">
              <SVGIcon name="sync" className="w-8 h-8 text-forest-accent animate-spin" />
              <span>Analyzing school correspondence with Classroom...</span>
            </div>
          )}

          {!isSyncing && (
            <div className="space-y-4">
              {filteredCoursework.length > 0 ? (
                <>
                  {(showAllCoursework ? filteredCoursework : filteredCoursework.slice(0, 3)).map(course => {
                    const wasAdded = !!addedCourseworkIds[course.id];
                    return (
                      <div 
                        key={course.id} 
                        className={`ios-card p-5 border-l-4 transition-all ${
                          course.color === 'red' ? 'border-l-forest-critical' :
                          course.color === 'amber' ? 'border-l-forest-amber' :
                          'border-l-forest-accent'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                              course.color === 'red' ? 'bg-forest-critical/15 text-forest-critical border border-forest-critical/30' :
                              course.color === 'amber' ? 'bg-forest-amber/15 text-forest-amber border border-forest-amber/30' :
                              'bg-forest-accent/15 text-forest-accent border border-forest-accent/30'
                            }`}>
                              {course.course}
                            </span>
                            <span className="text-[11px] text-forest-accent bg-forest-accent/15 px-2 py-0.5 rounded border border-forest-accent/20 font-mono">
                              {course.syncSource || 'Classroom'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-text-muted bg-white/5 px-2 py-1 rounded-lg">
                            <SVGIcon name={course.metaIcon === 'comment' ? 'comment' : 'file'} className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold">{course.meta.toUpperCase()}</span>
                          </div>
                        </div>

                        <h4 className="text-[17px] font-bold text-white mb-2">{course.title}</h4>
                        <p className="text-[13px] text-text-muted leading-relaxed font-medium mb-4">{course.desc}</p>

                        <div className="flex justify-end pt-3 border-t border-white/5">
                          <button
                            onClick={() => handleAddToPriorities(course)}
                            disabled={wasAdded}
                            className={`h-9 px-4 rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-all ${
                              wasAdded 
                                ? 'bg-white/5 text-text-faint cursor-default' 
                                : 'bg-forest-accent/10 hover:bg-forest-accent/20 text-forest-accent'
                            }`}
                          >
                            {wasAdded ? (
                              <>
                                <SVGIcon name="check" className="w-3.5 h-3.5" />
                                Added to Priorities
                              </>
                            ) : (
                              <>
                                <SVGIcon name="plus" className="w-3.5 h-3.5" />
                                Track as Priority Task
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {filteredCoursework.length > 3 && (
                    <div className="flex justify-center pt-2">
                      <button
                        onClick={() => setShowAllCoursework(!showAllCoursework)}
                        className="text-forest-accent text-[13px] font-bold bg-forest-accent/10 hover:bg-forest-accent/20 px-5 py-2.5 rounded-xl transition-all tracking-wide"
                      >
                        {showAllCoursework ? "Show Less" : `Show More (+${filteredCoursework.length - 3} items)`}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="ios-card p-6 text-center text-text-muted text-[14px] space-y-3">
                  {syncNotFound ? (
                    <div className="space-y-2">
                      <div className="text-xl">⚠️</div>
                      <h4 className="text-[15px] font-bold text-white">Classroom Not Found</h4>
                      <p className="text-[12px] text-text-muted leading-relaxed max-w-sm mx-auto">
                        We scanned your Google Calendar, Google Classroom API registrations, and Gmail inbox emails but could not detect any active coursework or pending classes.
                      </p>
                    </div>
                  ) : (
                    <span>No synced classroom coursework items match current filter.</span>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Floating Add Button - Premium Styled */}
      <div className="fixed bottom-28 right-6 flex items-center justify-center">
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-16 h-16 bg-forest-accent text-forest-bg rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(74,222,128,0.4)] active:scale-90 transition-all hover:scale-105"
        >
          <SVGIcon name="plus" className="w-8 h-8" strokeWidth={2.5} />
        </button>
      </div>

      <AddTaskModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      <BottomNav />
    </div>
  );
}
