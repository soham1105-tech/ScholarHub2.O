import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { tasks as initialTasks, alerts as initialAlerts } from './data/mockData.js';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase.ts';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';

interface AppContextType {
  user: User | null;
  loading: boolean;
  profile: any;
  updateProfile: (profile: any) => Promise<void>;
  tasks: any[];
  setTasks: React.Dispatch<React.SetStateAction<any[]>>;
  alerts: any[];
  setAlerts: React.Dispatch<React.SetStateAction<any[]>>;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  isFocusLocked: boolean;
  setIsFocusLocked: React.Dispatch<React.SetStateAction<boolean>>;
  addTask: (task: any) => Promise<void>;
  toggleTaskDone: (id: string, currentDone: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isFocusLocked, setIsFocusLocked] = useState<boolean>(() => {
    const savedEndTime = localStorage.getItem('focus_end_time');
    if (savedEndTime) {
      const timeLeft = Math.ceil((Number(savedEndTime) - Date.now()) / 1000);
      return timeLeft > 0;
    }
    return false;
  });

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Profile syncing
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const profilePath = `users/${user.uid}/profile/info`;
    const unsubscribe = onSnapshot(doc(db, profilePath), (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.data());
      } else {
        setProfile({
          major: 'Not set',
          university: 'Not set',
          classOf: '20XX',
          gpa: 0,
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, profilePath);
    });

    return () => unsubscribe();
  }, [user]);

  // Tasks syncing
  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }

    const tasksPath = `users/${user.uid}/tasks`;
    const q = query(collection(db, tasksPath), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(taskData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, tasksPath);
    });

    return () => unsubscribe();
  }, [user]);

  // Alerts syncing
  useEffect(() => {
    if (!user) {
      setAlerts([]);
      return;
    }

    const alertsPath = `users/${user.uid}/alerts`;
    const q = query(collection(db, alertsPath), orderBy('time', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAlerts(alertData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, alertsPath);
    });

    return () => unsubscribe();
  }, [user]);

  const addTask = async (task: any) => {
    if (!user) return;
    const path = `users/${user.uid}/tasks`;
    try {
      await addDoc(collection(db, path), {
        ...task,
        userId: user.uid,
        done: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const toggleTaskDone = async (id: string, currentDone: boolean) => {
    if (!user) return;
    const path = `users/${user.uid}/tasks/${id}`;
    try {
      await updateDoc(doc(db, path), {
        done: !currentDone
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const updateProfile = async (newProfile: any) => {
    if (!user) return;
    const path = `users/${user.uid}/profile/info`;
    try {
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, path), {
        ...newProfile,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        profile,
        updateProfile,
        tasks,
        setTasks,
        alerts,
        setAlerts,
        isSidebarOpen,
        setIsSidebarOpen,
        isDarkMode,
        setIsDarkMode,
        isFocusLocked,
        setIsFocusLocked,
        addTask,
        toggleTaskDone,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
