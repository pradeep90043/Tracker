// ============================================================
// localStorage persistence layer — v2
// ============================================================

import type { DailyEntry, FailureLog, WeeklyGoal, WeeklyReview, FocusSession } from '@/types';

const KEYS = {
  ENTRIES: 'discipline_tracker_entries',
  FAILURES: 'discipline_tracker_failures',
  GOALS: 'discipline_tracker_goals',
  REVIEWS: 'discipline_tracker_reviews',
  FOCUS_SESSIONS: 'discipline_tracker_focus_sessions',
  DARK_MODE: 'discipline_tracker_dark_mode',
  LOCKDOWN_DISMISSED: 'discipline_tracker_lockdown_dismissed',
} as const;

// --------------- Generic helpers ---------------

function loadData<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// --------------- Daily Entries ---------------

export function loadEntries(): DailyEntry[] {
  return loadData<DailyEntry>(KEYS.ENTRIES);
}

export function saveEntries(entries: DailyEntry[]): void {
  saveData(KEYS.ENTRIES, entries);
}

export function addEntry(entry: DailyEntry): DailyEntry[] {
  const entries = loadEntries();
  // Prevent duplicate date entries — replace if same date exists
  const filtered = entries.filter(e => e.date !== entry.date);
  filtered.push(entry);
  saveEntries(filtered);
  return filtered;
}

export function deleteEntry(id: string): DailyEntry[] {
  const entries = loadEntries().filter(e => e.id !== id);
  saveEntries(entries);
  return entries;
}

// --------------- Failure Logs ---------------

export function loadFailures(): FailureLog[] {
  return loadData<FailureLog>(KEYS.FAILURES);
}

export function saveFailures(failures: FailureLog[]): void {
  saveData(KEYS.FAILURES, failures);
}

export function addFailure(failure: FailureLog): FailureLog[] {
  const failures = loadFailures();
  failures.push(failure);
  saveFailures(failures);
  return failures;
}

export function deleteFailure(id: string): FailureLog[] {
  const failures = loadFailures().filter(f => f.id !== id);
  saveFailures(failures);
  return failures;
}

// --------------- Weekly Goals ---------------

export function loadGoals(): WeeklyGoal[] {
  return loadData<WeeklyGoal>(KEYS.GOALS);
}

export function saveGoals(goals: WeeklyGoal[]): void {
  saveData(KEYS.GOALS, goals);
}

export function upsertGoal(goal: WeeklyGoal): WeeklyGoal[] {
  const goals = loadGoals();
  const idx = goals.findIndex(g => g.weekStart === goal.weekStart);
  if (idx >= 0) {
    goals[idx] = goal;
  } else {
    goals.push(goal);
  }
  saveGoals(goals);
  return goals;
}

// --------------- Weekly Reviews ---------------

export function loadReviews(): WeeklyReview[] {
  return loadData<WeeklyReview>(KEYS.REVIEWS);
}

export function saveReviews(reviews: WeeklyReview[]): void {
  saveData(KEYS.REVIEWS, reviews);
}

export function addReview(review: WeeklyReview): WeeklyReview[] {
  const reviews = loadReviews();
  // Upsert by week
  const idx = reviews.findIndex(r => r.weekStart === review.weekStart);
  if (idx >= 0) {
    reviews[idx] = review;
  } else {
    reviews.push(review);
  }
  saveReviews(reviews);
  return reviews;
}

// --------------- Focus Sessions ---------------

export function loadFocusSessions(): FocusSession[] {
  return loadData<FocusSession>(KEYS.FOCUS_SESSIONS);
}

export function saveFocusSessions(sessions: FocusSession[]): void {
  saveData(KEYS.FOCUS_SESSIONS, sessions);
}

export function addFocusSession(session: FocusSession): FocusSession[] {
  const sessions = loadFocusSessions();
  sessions.push(session);
  saveFocusSessions(sessions);
  return sessions;
}

// --------------- Dark Mode ---------------

export function loadDarkMode(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(KEYS.DARK_MODE);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

export function saveDarkMode(dark: boolean): void {
  localStorage.setItem(KEYS.DARK_MODE, String(dark));
}

// --------------- Lockdown State ---------------

export function isLockdownDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(KEYS.LOCKDOWN_DISMISSED) === 'true';
}

export function setLockdownDismissed(dismissed: boolean): void {
  localStorage.setItem(KEYS.LOCKDOWN_DISMISSED, String(dismissed));
}

// --------------- CSV Export ---------------

export function exportToCSV(entries: DailyEntry[]): void {
  const headers = [
    'Date', 'DSA Hours', 'Problems Solved', 'DSA Topic',
    'Backend Hours', 'Backend Topic', 'AI Hours', 'AI Topic',
    'Project Work', 'Revision', 'Deep Work',
    'Total Hours', 'Score', 'Performance', 'Passed',
  ];

  const rows = entries
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(e => [
      e.date, e.dsaHours, e.dsaProblemsSolved, `"${e.dsaTopic}"`,
      e.backendHours, `"${e.backendTopic}"`, e.aiHours, `"${e.aiTopic}"`,
      e.projectWork ? 'Yes' : 'No', e.revision ? 'Yes' : 'No', e.deepWork ? 'Yes' : 'No',
      e.totalHours, e.score, e.performanceLevel, e.passed ? '✅' : '❌',
    ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `discipline-tracker-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
