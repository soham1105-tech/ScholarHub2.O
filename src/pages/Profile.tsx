import React, { useState } from 'react';
import { TopBar } from '../components/TopBar.tsx';
import { BottomNav } from '../components/BottomNav.tsx';
import { SVGIcon } from '../components/SVGIcon.tsx';
import { useApp } from '../AppContext.tsx';
import { motion, AnimatePresence } from 'motion/react';

export default function Profile() {
  const { tasks, user, profile, updateProfile } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    major: profile?.major || '',
    university: profile?.university || '',
    classOf: profile?.classOf || '',
    gpa: profile?.gpa || 0,
  });

  const completedTasks = tasks.filter(t => t.done).length;

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
