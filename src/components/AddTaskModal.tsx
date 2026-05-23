import React, { useState } from 'react';
import { useApp } from '../AppContext.tsx';
import { SVGIcon } from './SVGIcon.tsx';
import { motion, AnimatePresence } from 'motion/react';

export const AddTaskModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { addTask } = useApp();
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [priority, setPriority] = useState('standard');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title,
      course: course.trim() ? course.trim() : 'General',
      priority,
      dueIn: 'TODAY',
    });
    
    setTitle('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 right-0 bottom-0 bg-forest-bg ios-glass border-t border-white/5 z-[101] p-8 rounded-t-[40px] shadow-2xl"
          >
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-8" />
            
            <h2 className="text-[24px] font-bold text-white font-display mb-6">New Academic Task</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-text-muted uppercase tracking-widest pl-1">Task Title</label>
                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Finish Calculus Homework"
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-white focus:outline-none focus:border-forest-accent transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-text-muted uppercase tracking-widest pl-1">Course</label>
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="e.g. Physics, Math"
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-white focus:outline-none focus:border-forest-accent transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-text-muted uppercase tracking-widest pl-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-white focus:outline-none focus:border-forest-accent appearance-none font-medium"
                  >
                    <option value="standard">Standard</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-14 bg-white/5 text-white font-bold rounded-2xl ios-button border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="flex-[2] h-14 bg-forest-accent text-forest-bg font-bold rounded-2xl ios-button shadow-lg shadow-forest-accent/20 disabled:opacity-50 disabled:grayscale"
                >
                  Create Task
                </button>
              </div>
            </form>
            
            <div className="mt-8 text-center text-[11px] text-text-faint font-medium">
              Task will be synced with your Timeline Matrix automatically.
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
