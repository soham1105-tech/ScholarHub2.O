// Focus History tracker utility for ScholarHub

export interface FocusSession {
  id: string;
  timestamp: number; // ms since epoch
  minutes: number;
}

const STORAGE_KEY = 'scholarhub_focus_history_v1';

// Initialize clean, real-data-only focus history
export function initializeFocusHistoryIfEmpty(): FocusSession[] {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    try {
      const parsed = JSON.parse(existing) as FocusSession[];
      // Filter out any legacy simulated mock sessions to ensure strictly real data
      const realOnly = parsed.filter(session => !session.id.startsWith('mock-'));
      if (realOnly.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(realOnly));
      }
      return realOnly;
    } catch {
      // JSON parsing error, regenerate
    }
  }

  const emptyHistory: FocusSession[] = [];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyHistory));
  return emptyHistory;
}

export function getRawFocusHistory(): FocusSession[] {
  return initializeFocusHistoryIfEmpty();
}

export function recordFocusSession(minutes: number): FocusSession[] {
  const history = getRawFocusHistory();
  const newSession: FocusSession = {
    id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: Date.now(),
    minutes
  };
  
  const updated = [...history, newSession];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export interface DayProgress {
  dayName: string;       // "Mon", "Tue" etc.
  dayShort: string;      // "M", "T" etc.
  hours: number;         // focus hours e.g. 1.5
  dateString: string;    // "May 23"
  isToday: boolean;
}

// Fetch computed progress for the last 7 calendar days ending today
export function getWeeklyFocusProgress(): DayProgress[] {
  const history = getRawFocusHistory();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysOfWeekShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const progress: DayProgress[] = [];
  const now = new Date();
  
  // Calculate stats for the last 7 days
  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() - i);
    
    // Reset hours, minutes etc. on targetDate to search the calendar day boundary
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
    
    // Sum minutes completed within this calendar day
    const dayMinutes = history
      .filter(s => s.timestamp >= startOfDay && s.timestamp < endOfDay)
      .reduce((sum, s) => sum + s.minutes, 0);
      
    const hours = Math.round((dayMinutes / 60) * 10) / 10; // 1 decimal place e.g., 2.5
    
    const dayIndex = targetDate.getDay();
    const isToday = i === 0;
    
    progress.push({
      dayName: daysOfWeek[dayIndex],
      dayShort: daysOfWeekShort[dayIndex],
      hours,
      dateString: `${months[targetDate.getMonth()]} ${targetDate.getDate()}`,
      isToday
    });
  }
  
  return progress;
}

export function getTotalWeeklyHours(): number {
  const progress = getWeeklyFocusProgress();
  const sum = progress.reduce((acc, p) => acc + p.hours, 0);
  return Math.round(sum * 10) / 10;
}

export interface DailyTrendProgress {
  dateString: string;    // "May 23"
  hours: number;
  isToday: boolean;
  dayOfMonth: number;
}

export function get30DayFocusProgress(): DailyTrendProgress[] {
  const history = getRawFocusHistory();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const progress: DailyTrendProgress[] = [];
  const now = new Date();
  
  // Calculate stats for the last 30 days (from 29 days ago until today)
  for (let i = 29; i >= 0; i--) {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() - i);
    
    // Reset hours, minutes etc. on targetDate to search the calendar day boundary
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
    
    // Sum minutes completed within this calendar day
    const dayMinutes = history
      .filter(s => s.timestamp >= startOfDay && s.timestamp < endOfDay)
      .reduce((sum, s) => sum + s.minutes, 0);
      
    const hours = Math.round((dayMinutes / 60) * 10) / 10; // decimal place e.g. 1.5
    
    progress.push({
      dateString: `${months[targetDate.getMonth()]} ${targetDate.getDate()}`,
      hours,
      isToday: i === 0,
      dayOfMonth: targetDate.getDate()
    });
  }
  
  return progress;
}

export function getTotalMonthlyHours(): number {
  const progress = get30DayFocusProgress();
  const sum = progress.reduce((acc, p) => acc + p.hours, 0);
  return Math.round(sum * 10) / 10;
}
