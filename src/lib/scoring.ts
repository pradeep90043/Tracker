// ============================================================
// Scoring Engine — Strict Discipline Scoring
// ============================================================

import type { DailyEntryFormData, DailyEntry, PerformanceLevel, DashboardStats, HoursTrendPoint, WeeklyConsistencyPoint, ScoreDistributionPoint } from '@/types';
import { v4 } from './uuid';

/**
 * Calculate daily score from form data.
 *
 * Scoring rules:
 *   DSA done (hours > 0)       → +2
 *   Backend done (hours > 0)   → +2
 *   AI done (hours > 0)        → +1
 *   Project work (yes)         → +2
 *   Revision (yes)             → +1
 *   6+ total hours             → +2
 *
 * Max possible: 10
 */
export function calculateScore(data: DailyEntryFormData): number {
  let score = 0;
  if (data.dsaHours > 0) score += 2;
  if (data.backendHours > 0) score += 2;
  if (data.aiHours > 0) score += 1;
  if (data.projectWork) score += 2;
  if (data.revision) score += 1;
  const totalHours = data.dsaHours + data.backendHours + data.aiHours;
  if (totalHours >= 6) score += 2;
  return score;
}

/** Determine performance level from score */
export function getPerformanceLevel(score: number): PerformanceLevel {
  if (score >= 8) return 'Excellent';
  if (score >= 5) return 'Average';
  return 'Poor';
}

/** Build a complete DailyEntry from form data */
export function createDailyEntry(formData: DailyEntryFormData): DailyEntry {
  const totalHours = formData.dsaHours + formData.backendHours + formData.aiHours;
  const score = calculateScore(formData);
  const performanceLevel = getPerformanceLevel(score);

  return {
    id: v4(),
    ...formData,
    totalHours,
    score,
    performanceLevel,
    passed: totalHours >= 6,
  };
}

/** Calculate aggregate dashboard stats from entries */
export function calculateDashboardStats(entries: DailyEntry[]): DashboardStats {
  if (entries.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalProblemsSolved: 0,
      totalBackendHours: 0,
      totalAIHours: 0,
      totalDSAHours: 0,
      totalEntries: 0,
      averageScore: 0,
      passedDays: 0,
      failedDays: 0,
    };
  }

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date)); // newest first

  // Streaks — count consecutive passed days from most recent
  let currentStreak = 0;
  for (const entry of sorted) {
    if (entry.passed) currentStreak++;
    else break;
  }

  // Longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  // Sort oldest first for longest streak calculation
  const oldestFirst = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  for (const entry of oldestFirst) {
    if (entry.passed) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  const totalProblemsSolved = entries.reduce((sum, e) => sum + e.dsaProblemsSolved, 0);
  const totalBackendHours = entries.reduce((sum, e) => sum + e.backendHours, 0);
  const totalAIHours = entries.reduce((sum, e) => sum + e.aiHours, 0);
  const totalDSAHours = entries.reduce((sum, e) => sum + e.dsaHours, 0);
  const averageScore = entries.reduce((sum, e) => sum + e.score, 0) / entries.length;
  const passedDays = entries.filter(e => e.passed).length;

  return {
    currentStreak,
    longestStreak,
    totalProblemsSolved,
    totalBackendHours,
    totalAIHours,
    totalDSAHours,
    totalEntries: entries.length,
    averageScore: Math.round(averageScore * 10) / 10,
    passedDays,
    failedDays: entries.length - passedDays,
  };
}

/** Generate data for daily hours trend chart */
export function getHoursTrendData(entries: DailyEntry[], days = 30): HoursTrendPoint[] {
  const sorted = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-days);

  return sorted.map(e => ({
    date: e.date.slice(5), // MM-DD
    totalHours: e.totalHours,
    dsaHours: e.dsaHours,
    backendHours: e.backendHours,
    aiHours: e.aiHours,
  }));
}

/** Generate weekly consistency data */
export function getWeeklyConsistencyData(entries: DailyEntry[]): WeeklyConsistencyPoint[] {
  const weekMap = new Map<string, DailyEntry[]>();

  for (const entry of entries) {
    const date = new Date(entry.date);
    const dayOfWeek = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((dayOfWeek + 6) % 7));
    const weekKey = monday.toISOString().slice(0, 10);

    if (!weekMap.has(weekKey)) weekMap.set(weekKey, []);
    weekMap.get(weekKey)!.push(entry);
  }

  const weeks = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8); // Last 8 weeks

  return weeks.map(([week, weekEntries]) => ({
    week: week.slice(5), // MM-DD
    passedDays: weekEntries.filter(e => e.passed).length,
    failedDays: weekEntries.filter(e => !e.passed).length,
    averageScore: Math.round(weekEntries.reduce((s, e) => s + e.score, 0) / weekEntries.length * 10) / 10,
  }));
}

/** Generate score distribution data */
export function getScoreDistributionData(entries: DailyEntry[]): ScoreDistributionPoint[] {
  const counts = { Excellent: 0, Average: 0, Poor: 0 };
  for (const entry of entries) {
    counts[entry.performanceLevel]++;
  }
  return [
    { level: 'Excellent', count: counts.Excellent },
    { level: 'Average', count: counts.Average },
    { level: 'Poor', count: counts.Poor },
  ];
}

/** Check if user missed yesterday's entry */
export function checkMissedEntry(entries: DailyEntry[]): boolean {
  if (entries.length === 0) return true;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const hasToday = entries.some(e => e.date === today);
  const hasYesterday = entries.some(e => e.date === yesterday);
  return !hasToday && !hasYesterday;
}

/** Count consecutive failed days from the end */
export function countRecentFailedDays(entries: DailyEntry[]): number {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  let count = 0;
  for (const entry of sorted) {
    if (!entry.passed) count++;
    else break;
  }
  return count;
}
