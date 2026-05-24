import React, { useState } from 'react';
import { TopBar } from '../components/TopBar.tsx';
import { BottomNav } from '../components/BottomNav.tsx';
import { SVGIcon } from '../components/SVGIcon.tsx';
import { useApp } from '../AppContext.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { getWeeklyFocusProgress, getTotalWeeklyHours, get30DayFocusProgress, getTotalMonthlyHours } from '../lib/focusHistory.ts';

export default function Profile() {
  const { tasks, user, profile, updateProfile } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [editForm, setEditForm] = useState({
    major: profile?.major || '',
    university: profile?.university || '',
    classOf: profile?.classOf || '',
    gpa: profile?.gpa || 0,
  });

  const completedTasks = tasks.filter(t => t.done).length;
  const weeklyProgress = getWeeklyFocusProgress();
  const totalHours = getTotalWeeklyHours();
  const monthlyProgress = get30DayFocusProgress();
  const totalMonthlyHours = getTotalMonthlyHours();

  const handleSave = async () => {
    await updateProfile(editForm);
    setIsEditing(false);
  };

  return (
    <div className="page-transition premium-gradient min-h-screen">
      <TopBar title="Academic Profile" />
      
      <main className="p-6 pt-[100px] pb-[120px] max-w-lg mx-auto space-y-6">
        {/* User Card */}
        <section className="ios-card p-8 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-forest-accent to-forest-dim flex items-center justify-center shadow-xl shadow-forest-accent/20 overflow-hidden border-4 border-white/10">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <SVGIcon name="person" className="w-12 h-12 text-forest-bg" />
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-forest-accent border-4 border-forest-bg flex items-center justify-center">
              <SVGIcon name="check" className="w-4 h-4 text-forest-bg" strokeWidth={4} />
            </div>
          </div>
          
          <h2 className="text-[28px] font-bold font-display text-white">{user?.displayName || 'Scholar'}</h2>
          <p className="text-[14px] text-forest-accent font-bold uppercase tracking-widest mt-1">
            {profile?.major || 'Academic Member'}
          </p>
          <p className="text-[13px] text-text-muted mt-2">
            {profile?.university || 'University Not Set'} • Class of {profile?.classOf || '20XX'}
          </p>
        </section>

        {/* Achievement Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="ios-card p-5">
            <div className="text-[24px] font-bold font-display text-forest-accent">{completedTasks}</div>
            <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Tasks Done</div>
          </div>
          <div className="ios-card p-5">
            <div className="text-[24px] font-bold font-display text-forest-amber">{profile?.gpa || '0.0'}</div>
            <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Current GPA</div>
          </div>
        </div>

        {/* Focus History Section */}
        <section className="ios-card p-6 space-y-5">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-[18px] font-bold text-white tracking-tight flex items-center gap-2">
                <SVGIcon name="lock" className="w-5 h-5 text-forest-accent animate-pulse" />
                <span>Focus History</span>
              </h3>
              <p className="text-[12px] text-text-muted">Daily deep focus distribution</p>
            </div>
            <div className="text-right">
              <div className="text-[26px] font-bold font-display text-forest-accent leading-none">
                {viewMode === 'weekly' ? totalHours : totalMonthlyHours}
                <span className="text-[13px] font-normal text-text-muted ml-0.5">hrs</span>
              </div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-1">
                {viewMode === 'weekly' ? 'This Week' : 'Last 30 Days'}
              </p>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="grid grid-cols-2 bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setViewMode('weekly')}
              className={`py-2 text-[12px] font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'weekly' 
                  ? 'bg-forest-accent text-forest-bg shadow-md' 
                  : 'text-text-muted hover:text-white'
              }`}
            >
              7 Days (Weekly Bars)
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`py-2 text-[12px] font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === 'monthly' 
                  ? 'bg-forest-accent text-forest-bg shadow-md' 
                  : 'text-text-muted hover:text-white'
              }`}
            >
              30 Days (Trend Line)
            </button>
          </div>

          <AnimatePresence mode="wait">
            {viewMode === 'weekly' ? (
              <motion.div
                key="weekly-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="pt-5 pb-3 px-3 bg-white/5 rounded-2xl border border-white/5"
              >
                <div className="flex justify-between items-end h-28 gap-2">
                  {weeklyProgress.map((day, idx) => {
                    const maxTargetHours = 6;
                    const percentage = Math.min(100, Math.max(5, (day.hours / maxTargetHours) * 100));
                    
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-help">
                        {/* Hover Stats Popup */}
                        <div className="absolute bottom-full mb-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none bg-forest-bg border border-forest-accent/30 text-white text-[10px] font-mono font-bold px-2 py-1 rounded-lg shadow-xl whitespace-nowrap z-20 flex flex-col items-center">
                          <span className="text-forest-accent font-sans">{day.hours} Focus Hrs</span>
                          <span className="text-[9px] text-text-muted font-normal">{day.dateString}</span>
                        </div>

                        {/* Styled Bar Pillar */}
                        <div className="w-full bg-white/5 rounded-t-lg h-20 flex items-end overflow-hidden">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${percentage}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.05, ease: "easeOut" }}
                            className={`w-full rounded-t-md transition-all duration-300 ${
                              day.isToday 
                                ? 'bg-gradient-to-t from-forest-accent/70 to-forest-accent shadow-[0_0_12px_rgba(74,222,128,0.3)]' 
                                : 'bg-gradient-to-t from-forest-dim to-forest-accent hover:brightness-110'
                            }`}
                          />
                        </div>

                        {/* Day shortcode label */}
                        <span className={`text-[11px] font-bold mt-2 ${day.isToday ? 'text-forest-accent' : 'text-text-muted'}`}>
                          {day.dayShort}
                        </span>

                        {/* High contrast centerdot for Today status */}
                        {day.isToday ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-forest-accent mt-0.5 animate-pulse" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-transparent mt-0.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="monthly-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="pt-5 pb-3 px-3 bg-white/5 rounded-2xl border border-white/5"
              >
                {/* SVG Line Graph */}
                <div className="w-full h-32 flex items-center justify-center relative">
                  {monthlyProgress.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-[12px] text-text-muted italic">No trend data recorded yet.</p>
                      <p className="text-[11px] text-forest-accent mt-1">Focus on study tasks to draw your progress line!</p>
                    </div>
                  ) : (() => {
                    const maxHours = Math.max(...monthlyProgress.map(d => d.hours), 4);
                    // generate SVG coordinates
                    const points = monthlyProgress.map((day, i) => {
                      const x = 20 + (i / 29) * 360;
                      const y = 95 - (day.hours / maxHours) * 75;
                      return { x, y, day };
                    });
                    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                    const areaD = `${pathD} L ${points[points.length - 1].x} 95 L ${points[0].x} 95 Z`;
                    const labelIndices = [0, 9, 19, 29];

                    return (
                      <svg viewBox="0 0 400 120" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#4ade80" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        
                        {/* Grid lines */}
                        <line x1="20" y1="95" x2="380" y2="95" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                        <line x1="20" y1="57.5" x2="380" y2="57.5" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="20" y1="20" x2="380" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3 3" />
                        
                        {/* Y-axis Labels */}
                        <text x="5" y="98" fill="rgba(255,255,255,0.25)" fontSize="8" fontFamily="monospace">0h</text>
                        <text x="5" y="60" fill="rgba(255,255,255,0.25)" fontSize="8" fontFamily="monospace">{Math.round((maxHours/2)*10)/10}h</text>
                        <text x="5" y="23" fill="rgba(255,255,255,0.25)" fontSize="8" fontFamily="monospace">{Math.round(maxHours*10)/10}h</text>

                        {/* Shaded Area under path */}
                        {points.length > 0 && (
                          <path d={areaD} fill="url(#chartGrad)" />
                        )}

                        {/* Line path */}
                        {points.length > 0 && (
                          <motion.path
                            d={pathD}
                            fill="none"
                            stroke="#4ade80"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        )}

                        {/* Interactive Dot triggers */}
                        {points.map((p, i) => {
                          const displayDot = p.day.hours > 0 || p.day.isToday;
                          return (
                            <g key={i} className="group/point">
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r="8"
                                fill="transparent"
                                className="cursor-pointer"
                              />
                              {displayDot && (
                                <circle
                                  cx={p.x}
                                  cy={p.y}
                                  r={p.day.isToday ? "4" : "3"}
                                  fill={p.day.isToday ? "#4ade80" : "rgba(74, 222, 128, 0.85)"}
                                  stroke={p.day.isToday ? "rgba(255,255,255,0.9)" : "rgba(74, 222, 128, 0.3)"}
                                  strokeWidth={p.day.isToday ? "1.5" : "3"}
                                  className="transition-all duration-200 group-hover/point:r-5 group-hover/point:fill-white group-hover/point:stroke-forest-accent"
                                />
                              )}
                              
                              {/* Hover text / value box */}
                              <g className="opacity-0 group-hover/point:opacity-100 pointer-events-none transition-all duration-150 relative z-30">
                                <rect
                                  x={Math.max(10, Math.min(310, p.x - 45))}
                                  y={Math.max(5, p.y - 38)}
                                  width="90"
                                  height="28"
                                  rx="8"
                                  fill="#112218"
                                  stroke="rgba(74,222,128,0.4)"
                                  strokeWidth="1.5"
                                  className="shadow-2xl"
                                />
                                <text
                                  x={Math.max(10, Math.min(310, p.x - 45)) + 45}
                                  y={Math.max(5, p.y - 38) + 12}
                                  textAnchor="middle"
                                  fill="#4ade80"
                                  fontSize="9"
                                  fontWeight="bold"
                                  fontFamily="sans-serif"
                                >
                                  {p.day.hours} Focus Hrs
                                </text>
                                <text
                                  x={Math.max(10, Math.min(310, p.x - 45)) + 45}
                                  y={Math.max(5, p.y - 38) + 23}
                                  textAnchor="middle"
                                  fill="rgba(255,255,255,0.5)"
                                  fontSize="7.5"
                                  fontFamily="sans-serif"
                                >
                                  {p.day.dateString}
                                </text>
                              </g>
                            </g>
                          );
                        })}

                        {/* X-Axis dates */}
                        {labelIndices.map(idx => {
                          const p = points[idx];
                          if (!p) return null;
                          return (
                            <text
                              key={idx}
                              x={p.x}
                              y="118"
                              textAnchor="middle"
                              fill="rgba(255,255,255,0.35)"
                              fontSize="8"
                              className="font-bold"
                            >
                              {p.day.dayOfMonth}
                            </text>
                          );
                        })}
                      </svg>
                    );
                  })()}
                </div>
                {/* Visual sub-label */}
                <div className="flex justify-between text-[9px] text-text-muted mt-2 px-1">
                  <span>30 Days Ago</span>
                  <span>Today</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Stats List */}
        <section className="ios-card divide-y divide-white/5 overflow-hidden">
          <div className="p-5 flex justify-between items-center bg-white/5">
                <span className="text-[14px] font-bold text-white">Email Integration</span>
                <span className="text-[12px] text-forest-accent font-bold">Active</span>
          </div>
          <div className="p-5 flex justify-between items-center">
            <span className="text-[14px] text-text-muted">Account Email</span>
            <span className="text-[14px] font-bold text-white truncate max-w-[200px]">{user?.email}</span>
          </div>
          <div className="p-5 flex justify-between items-center">
            <span className="text-[14px] text-text-muted">Academic Tasks</span>
            <span className="text-[14px] font-bold text-white">{tasks.length} Active</span>
          </div>
        </section>

        <button 
          onClick={() => {
            setEditForm({
              major: profile?.major || '',
              university: profile?.university || '',
              classOf: profile?.classOf || '',
              gpa: profile?.gpa || 0,
            });
            setIsEditing(true);
          }}
          className="w-full h-14 bg-white/5 text-white font-bold rounded-2xl ios-button border border-white/10"
        >
          Edit Academic Profile
        </button>
      </main>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed left-0 right-0 bottom-0 bg-forest-bg border-t border-white/5 z-[101] p-8 rounded-t-[40px] space-y-6"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white">Edit Academic Info</h3>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-text-muted uppercase pl-1">University</label>
                  <input
                    type="text"
                    value={editForm.university}
                    onChange={e => setEditForm({...editForm, university: e.target.value})}
                    placeholder="e.g. Stanford University"
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:border-forest-accent outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-text-muted uppercase pl-1">Major</label>
                  <input
                    type="text"
                    value={editForm.major}
                    onChange={e => setEditForm({...editForm, major: e.target.value})}
                    placeholder="e.g. Computer Science"
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:border-forest-accent outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-text-muted uppercase pl-1">Class Of</label>
                    <input
                      type="text"
                      value={editForm.classOf}
                      onChange={e => setEditForm({...editForm, classOf: e.target.value})}
                      placeholder="2027"
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:border-forest-accent outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-text-muted uppercase pl-1">GPA</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.gpa}
                      onChange={e => setEditForm({...editForm, gpa: parseFloat(e.target.value)})}
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:border-forest-accent outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 h-12 rounded-xl bg-white/5 text-white font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-[2] h-12 rounded-xl bg-forest-accent text-forest-bg font-bold shadow-lg shadow-forest-accent/20"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
