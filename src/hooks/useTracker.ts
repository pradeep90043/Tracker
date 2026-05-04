// ============================================================
// useTracker — Central state management hook v2
// ============================================================

'use client';

import { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import type {
  DailyEntry, FailureLog, WeeklyGoal, WeeklyReview, FocusSession,
  DashboardStats, DisciplineAlert, DisciplineLevel, DailyEntryFormData,
} from '@/types';
import {
  calculateDashboardStats,
  checkMissedEntry,
  countRecentFailedDays,
} from '@/lib/scoring';
import {
  getEntries, upsertEntry, deleteEntry as serverDeleteEntry,
  getFailures, addFailure as serverAddFailure, deleteFailure as serverDeleteFailure,
  getGoals, upsertGoal as serverUpsertGoal,
  getReviews, addReview as serverAddReview,
  getFocusSessions, addFocusSession as serverAddFocusSession,
} from '@/app/actions/trackerActions';
import { loadDarkMode, saveDarkMode, setLockdownDismissed } from '@/lib/storage'; // Kept for UI state

export function useTracker() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [failures, setFailures] = useState<FailureLog[]>([]);
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [darkMode, setDarkMode] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Load from Database on mount
  useEffect(() => {
    async function init() {
      try {
        console.log('🔄 Initializing tracker data from Supabase...');
        const [dbEntries, dbFailures, dbGoals, dbReviews, dbFocus] = await Promise.all([
          getEntries(),
          getFailures(),
          getGoals(),
          getReviews(),
          getFocusSessions(),
        ]);
        
        setEntries(dbEntries || []);
        setFailures(dbFailures || []);
        setGoals(dbGoals || []);
        setReviews(dbReviews || []);
        setFocusSessions(dbFocus || []);
        setDarkMode(loadDarkMode());
        console.log('✅ Tracker data loaded successfully.');
      } catch (error) {
        console.error('❌ Failed to load tracker data:', error);
        setEntries([]);
        setDarkMode(loadDarkMode());
      } finally {
        setLoaded(true);
      }
    }
    init();
  }, []);

  // Sync dark mode class
  useEffect(() => {
    if (!loaded) return;
    document.documentElement.classList.toggle('dark', darkMode);
    saveDarkMode(darkMode);
  }, [darkMode, loaded]);

  // --------------- Daily Entry actions ---------------

  const addDailyEntry = useCallback(async (formData: DailyEntryFormData) => {
    console.log('📝 addDailyEntry called on client with:', formData.date);
    setSyncing(true);
    
    startTransition(async () => {
      try {
        const result = await upsertEntry(formData);
        console.log('📡 upsertEntry result:', result);
        if (result.success) {
          const updated = await getEntries();
          console.log('📥 Fetched updated entries:', updated.length);
          setEntries(updated);
          setLockdownDismissed(false);
        } else {
          console.error('❌ upsertEntry failed:', result.error);
          alert('Failed to save entry: ' + result.error);
        }
      } catch (err) {
        console.error('💥 Fatal error in addDailyEntry:', err);
        alert('A fatal error occurred.');
      } finally {
        setSyncing(false);
      }
    });
  }, []);

  const removeDailyEntry = useCallback(async (id: string) => {
    setSyncing(true);
    const result = await serverDeleteEntry(id);
    if (result.success) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
    setSyncing(false);
  }, []);

  // --------------- Failure actions ---------------

  const addFailureLog = useCallback(async (data: Omit<FailureLog, 'id' | 'userId'>) => {
    setSyncing(true);
    const result = await serverAddFailure(data);
    if (result.success && result.failure) {
      setFailures(prev => [result.failure as unknown as FailureLog, ...prev]);
    }
    setSyncing(false);
  }, []);

  const removeFailure = useCallback(async (id: string) => {
    setSyncing(true);
    const result = await serverDeleteFailure(id);
    if (result.success) {
      setFailures(prev => prev.filter(f => f.id !== id));
    }
    setSyncing(false);
  }, []);

  // --------------- Goals actions ---------------

  const upsertGoal = useCallback(async (goal: Omit<WeeklyGoal, 'userId'>) => {
    setSyncing(true);
    const result = await serverUpsertGoal(goal);
    if (result.success) {
      setGoals(await getGoals());
    }
    setSyncing(false);
  }, []);

  // --------------- Reviews actions ---------------

  const addReview = useCallback(async (data: Omit<WeeklyReview, 'id' | 'createdAt' | 'userId'>) => {
    setSyncing(true);
    const result = await serverAddReview(data);
    if (result.success) {
      setReviews(await getReviews());
    }
    setSyncing(false);
  }, []);

  // --------------- Focus Session actions ---------------

  const logFocusSession = useCallback(async (data: Omit<FocusSession, 'id' | 'userId'>) => {
    setSyncing(true);
    const result = await serverAddFocusSession(data);
    if (result.success && result.session) {
      setFocusSessions(prev => [result.session as unknown as FocusSession, ...prev]);
    }
    setSyncing(false);
  }, []);

  // --------------- Toggle dark mode ---------------

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  // --------------- Computed values ---------------

  const stats: DashboardStats = useMemo(() => calculateDashboardStats(entries), [entries]);

  const consecutiveFailedDays = useMemo(() => countRecentFailedDays(entries), [entries]);

  const hasTodayEntry = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return entries.some(e => e.date === today);
  }, [entries]);

  /** Discipline enforcement level */
  const disciplineLevel: DisciplineLevel = useMemo(() => {
    if (!loaded) return 'normal';
    if (consecutiveFailedDays >= 3) return 'lockdown';
    if (consecutiveFailedDays >= 2) return 'drifting';
    if (checkMissedEntry(entries)) return 'warning';
    return 'normal';
  }, [entries, consecutiveFailedDays, loaded]);

  /** Check if weekly review is due (every 7th entry or on Sundays) */
  const isWeeklyReviewDue = useMemo(() => {
    if (!loaded || entries.length < 7) return false;
    const today = new Date();
    const dayOfWeek = today.getDay();
    // Get current week start (Monday)
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    const weekStart = monday.toISOString().slice(0, 10);

    // Check if review exists for this week
    const hasReview = reviews.some(r => r.weekStart === weekStart);
    // Trigger on Sunday (day 0) or Saturday (day 6)
    return !hasReview && (dayOfWeek === 0 || dayOfWeek === 6);
  }, [loaded, entries, reviews]);

  const alerts: DisciplineAlert[] = useMemo(() => {
    const result: DisciplineAlert[] = [];

    if (!loaded) return result;

    // Lockdown mode — 3+ consecutive fails
    if (disciplineLevel === 'lockdown') {
      result.push({
        type: 'lockdown',
        message: '🔒 LOCKDOWN — 3+ consecutive failed days. Dashboard locked. Log a passing entry to unlock.',
        show: true,
      });
    }

    // Drifting — 2 consecutive fails
    if (disciplineLevel === 'drifting') {
      result.push({
        type: 'danger',
        message: '🚨 You are drifting. Fix your routine NOW. 2 consecutive failed days detected.',
        show: true,
      });
    }

    // No entry warning
    if (disciplineLevel === 'warning') {
      result.push({
        type: 'warning',
        message: '⚠️ You are breaking discipline — no entry logged recently.',
        show: true,
      });
    }

    // Today not logged
    if (!hasTodayEntry && disciplineLevel !== 'lockdown') {
      result.push({
        type: 'warning',
        message: '📝 Today\'s entry not logged yet. Don\'t let the day pass without tracking.',
        show: true,
      });
    }

    // Weekly review reminder
    if (isWeeklyReviewDue) {
      result.push({
        type: 'warning',
        message: '📋 Weekly review is due. Reflect on your performance.',
        show: true,
      });
    }

    // Positive reinforcement for 5+ streak
    if (stats.currentStreak >= 5) {
      result.push({
        type: 'success',
        message: `🔥 ${stats.currentStreak}-day streak! Keep the momentum going.`,
        show: true,
      });
    }

    return result;
  }, [entries, stats, loaded, disciplineLevel, hasTodayEntry, isWeeklyReviewDue]);

  return {
    // State
    entries,
    failures,
    goals,
    reviews,
    focusSessions,
    darkMode,
    loaded,
    syncing: syncing || isPending,
    stats,
    alerts,
    disciplineLevel,
    hasTodayEntry,
    isWeeklyReviewDue,
    consecutiveFailedDays,

    // Actions
    addDailyEntry,
    removeDailyEntry,
    addFailureLog,
    removeFailure,
    upsertGoal,
    addReview,
    logFocusSession,
    toggleDarkMode,
  };
}
