// ============================================================
// Analytics Engine — Advanced pattern detection & insights
// ============================================================

import type { DailyEntry, FailureLog, Insight, Badge, TimeDistributionPoint, FailureCategory } from '@/types';

/** Find the best performing day */
export function getBestDay(entries: DailyEntry[]): DailyEntry | null {
  if (entries.length === 0) return null;
  return entries.reduce((best, e) => e.score > best.score ? e : best, entries[0]);
}

/** Find the worst performing day */
export function getWorstDay(entries: DailyEntry[]): DailyEntry | null {
  if (entries.length === 0) return null;
  return entries.reduce((worst, e) => e.score < worst.score ? e : worst, entries[0]);
}

/** Calculate consistency score for last N days (0-100) */
export function getConsistencyScore(entries: DailyEntry[], days = 7): number {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const recent = sorted.slice(0, days);
  if (recent.length === 0) return 0;

  const passed = recent.filter(e => e.passed).length;
  const avgScore = recent.reduce((s, e) => s + e.score, 0) / recent.length;

  // Weight: 60% pass rate + 40% avg score (normalized to 100)
  return Math.round((passed / days) * 60 + (avgScore / 10) * 40);
}

/** Detect skip patterns — "You skip X N out of last M days" */
export function detectSkipPatterns(entries: DailyEntry[], days = 7): Insight[] {
  const insights: Insight[] = [];
  const sorted = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, days);

  if (sorted.length < 3) return insights;

  // Check DSA skips
  const dsaSkips = sorted.filter(e => e.dsaHours === 0).length;
  if (dsaSkips >= Math.ceil(days * 0.5)) {
    insights.push({
      id: 'skip-dsa',
      type: 'warning',
      title: 'DSA Neglected',
      description: `You skipped DSA ${dsaSkips} out of last ${sorted.length} days. This will hurt in interviews.`,
      metric: `${dsaSkips}/${sorted.length} days missed`,
    });
  }

  // Check Backend skips
  const backendSkips = sorted.filter(e => e.backendHours === 0).length;
  if (backendSkips >= Math.ceil(days * 0.5)) {
    insights.push({
      id: 'skip-backend',
      type: 'warning',
      title: 'Backend Neglected',
      description: `You skipped Backend ${backendSkips} out of last ${sorted.length} days.`,
      metric: `${backendSkips}/${sorted.length} days missed`,
    });
  }

  // Check AI skips
  const aiSkips = sorted.filter(e => e.aiHours === 0).length;
  if (aiSkips >= Math.ceil(days * 0.6)) {
    insights.push({
      id: 'skip-ai',
      type: 'warning',
      title: 'AI Learning Stalled',
      description: `You skipped AI ${aiSkips} out of last ${sorted.length} days.`,
      metric: `${aiSkips}/${sorted.length} days missed`,
    });
  }

  // Check project work
  const projectSkips = sorted.filter(e => !e.projectWork).length;
  if (projectSkips >= Math.ceil(days * 0.6)) {
    insights.push({
      id: 'skip-project',
      type: 'warning',
      title: 'No Project Work',
      description: `No project work on ${projectSkips} of last ${sorted.length} days. Projects are your resume proof.`,
      metric: `${projectSkips}/${sorted.length} days missed`,
    });
  }

  // Check revision
  const revisionSkips = sorted.filter(e => !e.revision).length;
  if (revisionSkips >= Math.ceil(days * 0.7)) {
    insights.push({
      id: 'skip-revision',
      type: 'warning',
      title: 'Revision Ignored',
      description: `No revision on ${revisionSkips} of last ${sorted.length} days. Without revision, learning decays.`,
      metric: `${revisionSkips}/${sorted.length} days missed`,
    });
  }

  return insights;
}

/** Detect weekend performance patterns */
export function detectWeekendPattern(entries: DailyEntry[]): Insight | null {
  const weekdays = entries.filter(e => {
    const day = new Date(e.date).getDay();
    return day >= 1 && day <= 5;
  });
  const weekends = entries.filter(e => {
    const day = new Date(e.date).getDay();
    return day === 0 || day === 6;
  });

  if (weekdays.length < 5 || weekends.length < 2) return null;

  const weekdayAvg = weekdays.reduce((s, e) => s + e.score, 0) / weekdays.length;
  const weekendAvg = weekends.reduce((s, e) => s + e.score, 0) / weekends.length;

  if (weekendAvg < weekdayAvg * 0.7) {
    return {
      id: 'weekend-drop',
      type: 'warning',
      title: 'Weekend Performance Drop',
      description: `Your weekend avg score (${weekendAvg.toFixed(1)}) is significantly lower than weekdays (${weekdayAvg.toFixed(1)}). Weekends are free time — use them.`,
      metric: `Weekend: ${weekendAvg.toFixed(1)} vs Weekday: ${weekdayAvg.toFixed(1)}`,
    };
  }

  if (weekendAvg >= weekdayAvg * 1.1) {
    return {
      id: 'weekend-strong',
      type: 'positive',
      title: 'Strong Weekends',
      description: `You perform better on weekends (${weekendAvg.toFixed(1)} avg) than weekdays (${weekdayAvg.toFixed(1)}). Consider scheduling harder topics for weekends.`,
    };
  }

  return null;
}

/** Detect deep work frequency */
export function detectDeepWorkPattern(entries: DailyEntry[]): Insight | null {
  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  if (recent.length < 5) return null;

  const deepWorkDays = recent.filter(e => e.deepWork).length;
  const ratio = deepWorkDays / recent.length;

  if (ratio < 0.3) {
    return {
      id: 'deep-work-low',
      type: 'warning',
      title: 'Deep Work Missing',
      description: `Only ${deepWorkDays} of last ${recent.length} days had deep work. Shallow work won't move the needle.`,
      metric: `${Math.round(ratio * 100)}% deep work rate`,
    };
  }

  if (ratio >= 0.7) {
    return {
      id: 'deep-work-high',
      type: 'positive',
      title: 'Excellent Deep Work',
      description: `${deepWorkDays} of last ${recent.length} days had focused deep work. This is where real learning happens.`,
      metric: `${Math.round(ratio * 100)}% deep work rate`,
    };
  }

  return null;
}

/** Get all auto-generated insights */
export function generateAllInsights(entries: DailyEntry[]): Insight[] {
  const insights: Insight[] = [];

  // Best/worst day insights
  const best = getBestDay(entries);
  const worst = getWorstDay(entries);

  if (best && entries.length >= 3) {
    insights.push({
      id: 'best-day',
      type: 'positive',
      title: 'Best Day',
      description: `${best.date} — Score: ${best.score}/10, ${best.totalHours}h total.`,
      metric: `${best.score}/10`,
    });
  }

  if (worst && entries.length >= 3) {
    insights.push({
      id: 'worst-day',
      type: 'warning',
      title: 'Worst Day',
      description: `${worst.date} — Score: ${worst.score}/10, ${worst.totalHours}h total. What went wrong?`,
      metric: `${worst.score}/10`,
    });
  }

  // Consistency
  const consistency = getConsistencyScore(entries);
  if (entries.length >= 3) {
    insights.push({
      id: 'consistency',
      type: consistency >= 70 ? 'positive' : consistency >= 40 ? 'neutral' : 'warning',
      title: 'Consistency Score',
      description: consistency >= 70
        ? `${consistency}/100 — Solid consistency. Keep it up.`
        : consistency >= 40
          ? `${consistency}/100 — Average consistency. Push harder.`
          : `${consistency}/100 — Poor consistency. You need a strict routine NOW.`,
      metric: `${consistency}/100`,
    });
  }

  // Skip patterns
  insights.push(...detectSkipPatterns(entries));

  // Weekend pattern
  const weekend = detectWeekendPattern(entries);
  if (weekend) insights.push(weekend);

  // Deep work
  const deepWork = detectDeepWorkPattern(entries);
  if (deepWork) insights.push(deepWork);

  // Hours trend insight
  if (entries.length >= 7) {
    const recent7 = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
    const avgHours = recent7.reduce((s, e) => s + e.totalHours, 0) / recent7.length;
    if (avgHours < 4) {
      insights.push({
        id: 'low-hours',
        type: 'warning',
        title: 'Dangerously Low Hours',
        description: `Averaging only ${avgHours.toFixed(1)}h/day over last 7 days. You need 6+ hours minimum.`,
        metric: `${avgHours.toFixed(1)}h avg`,
      });
    }
  }

  return insights;
}

/** Calculate time distribution for pie chart */
export function getTimeDistribution(entries: DailyEntry[]): TimeDistributionPoint[] {
  const totalDSA = entries.reduce((s, e) => s + e.dsaHours, 0);
  const totalBackend = entries.reduce((s, e) => s + e.backendHours, 0);
  const totalAI = entries.reduce((s, e) => s + e.aiHours, 0);

  return [
    { name: 'DSA', hours: Math.round(totalDSA * 10) / 10, fill: '#60a5fa' },
    { name: 'Backend', hours: Math.round(totalBackend * 10) / 10, fill: '#a78bfa' },
    { name: 'AI', hours: Math.round(totalAI * 10) / 10, fill: '#f472b6' },
  ];
}

/** Failure category grouping */
export function getFailureCategoryStats(failures: FailureLog[]): { category: FailureCategory; count: number }[] {
  const map = new Map<FailureCategory, number>();
  failures.forEach(f => {
    const cat = f.category || 'Other';
    map.set(cat, (map.get(cat) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

/** Calculate streak milestone badges */
export function calculateBadges(entries: DailyEntry[]): Badge[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  let longestStreakEndDate = '';
  for (const entry of sorted) {
    if (entry.passed) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
        longestStreakEndDate = entry.date;
      }
    } else {
      tempStreak = 0;
    }
  }

  // Total problems solved
  const totalProblems = entries.reduce((s, e) => s + e.dsaProblemsSolved, 0);
  const totalHours = entries.reduce((s, e) => s + e.totalHours, 0);
  const excellentDays = entries.filter(e => e.performanceLevel === 'Excellent').length;

  const badges: Badge[] = [
    {
      id: 'streak-3', name: 'Ignition', description: '3-day streak',
      icon: '🔥', earned: longestStreak >= 3, threshold: 3,
      earnedDate: longestStreak >= 3 ? longestStreakEndDate : undefined,
    },
    {
      id: 'streak-7', name: 'On Fire', description: '7-day streak',
      icon: '⚡', earned: longestStreak >= 7, threshold: 7,
      earnedDate: longestStreak >= 7 ? longestStreakEndDate : undefined,
    },
    {
      id: 'streak-14', name: 'Unstoppable', description: '14-day streak',
      icon: '💎', earned: longestStreak >= 14, threshold: 14,
      earnedDate: longestStreak >= 14 ? longestStreakEndDate : undefined,
    },
    {
      id: 'streak-30', name: 'Iron Discipline', description: '30-day streak',
      icon: '🏆', earned: longestStreak >= 30, threshold: 30,
      earnedDate: longestStreak >= 30 ? longestStreakEndDate : undefined,
    },
    {
      id: 'streak-60', name: 'Legendary', description: '60-day streak',
      icon: '👑', earned: longestStreak >= 60, threshold: 60,
      earnedDate: longestStreak >= 60 ? longestStreakEndDate : undefined,
    },
    {
      id: 'problems-50', name: 'Problem Solver', description: '50 problems solved',
      icon: '🧩', earned: totalProblems >= 50, threshold: 50,
    },
    {
      id: 'problems-100', name: 'DSA Machine', description: '100 problems solved',
      icon: '🤖', earned: totalProblems >= 100, threshold: 100,
    },
    {
      id: 'problems-200', name: 'Algorithm Master', description: '200 problems solved',
      icon: '🎯', earned: totalProblems >= 200, threshold: 200,
    },
    {
      id: 'hours-100', name: 'Centurion', description: '100 total hours',
      icon: '⏱️', earned: totalHours >= 100, threshold: 100,
    },
    {
      id: 'hours-300', name: 'Marathon Runner', description: '300 total hours',
      icon: '🏃', earned: totalHours >= 300, threshold: 300,
    },
    {
      id: 'excellent-10', name: 'Perfectionist', description: '10 Excellent days',
      icon: '⭐', earned: excellentDays >= 10, threshold: 10,
    },
    {
      id: 'excellent-30', name: 'Elite Performer', description: '30 Excellent days',
      icon: '🌟', earned: excellentDays >= 30, threshold: 30,
    },
  ];

  return badges;
}

/** Generate mock AI analysis from last 7 days data */
export function generateAIAnalysis(entries: DailyEntry[], failures: FailureLog[]): {
  weaknesses: string[];
  suggestions: string[];
  nextDayPlan: string[];
  overallAssessment: string;
} {
  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);

  const weaknesses: string[] = [];
  const suggestions: string[] = [];
  const nextDayPlan: string[] = [];

  if (recent.length === 0) {
    return {
      weaknesses: ['No data to analyze. Start logging entries.'],
      suggestions: ['Begin with at least 6 hours of focused work today.'],
      nextDayPlan: ['2h DSA', '2h Backend', '1h AI', '1h Project'],
      overallAssessment: 'Insufficient data for analysis.',
    };
  }

  const avgScore = recent.reduce((s, e) => s + e.score, 0) / recent.length;
  const avgHours = recent.reduce((s, e) => s + e.totalHours, 0) / recent.length;
  const dsaDays = recent.filter(e => e.dsaHours > 0).length;
  const backendDays = recent.filter(e => e.backendHours > 0).length;
  const aiDays = recent.filter(e => e.aiHours > 0).length;
  const projectDays = recent.filter(e => e.projectWork).length;
  const revisionDays = recent.filter(e => e.revision).length;
  const deepWorkDays = recent.filter(e => e.deepWork).length;

  // Weaknesses
  if (avgHours < 6) weaknesses.push(`Low daily hours (${avgHours.toFixed(1)}h avg). Target is 6+.`);
  if (dsaDays < 5) weaknesses.push(`DSA only practiced ${dsaDays}/7 days. Coding rounds need daily practice.`);
  if (backendDays < 4) weaknesses.push(`Backend only covered ${backendDays}/7 days. System design matters.`);
  if (aiDays < 3) weaknesses.push(`AI studied only ${aiDays}/7 days. Market demands AI skills.`);
  if (projectDays < 3) weaknesses.push(`Project work only ${projectDays}/7 days. Projects prove your skills.`);
  if (revisionDays < 3) weaknesses.push(`Revision only ${revisionDays}/7 days. Without revision you lose 80% in a week.`);
  if (deepWorkDays < 4) weaknesses.push(`Deep work only ${deepWorkDays}/7 days. Shallow work is wasted time.`);
  if (weaknesses.length === 0) weaknesses.push('No major weaknesses detected. Maintain this level.');

  // Suggestions
  if (avgScore < 5) suggestions.push('CRITICAL: Score below 5. Follow a strict daily schedule with no deviation.');
  if (avgScore >= 5 && avgScore < 8) suggestions.push('Aim for score 8+ daily. Add project work and revision to hit max points.');
  if (avgScore >= 8) suggestions.push('Excellent scores. Focus on depth over breadth now — harder problems, advanced topics.');

  const recentFailures = failures.filter(f => recent.some(e => e.date === f.date));
  if (recentFailures.length > 0) {
    const categories = recentFailures.map(f => f.category).filter(Boolean);
    const topCategory = categories.sort((a, b) =>
      categories.filter(v => v === b).length - categories.filter(v => v === a).length
    )[0];
    if (topCategory) suggestions.push(`Address "${topCategory}" — it's your most common failure category this week.`);
  }

  suggestions.push(
    dsaDays < 7 ? 'Make DSA non-negotiable — 2h minimum daily, no exceptions.' : 'DSA consistency is good. Push to harder problems.',
  );
  suggestions.push(
    deepWorkDays < 5 ? 'Use the Focus Mode with Pomodoro to enforce deep work sessions.' : 'Deep work frequency is solid. Protect these sessions.',
  );

  // Next day plan
  const avgDSA = recent.reduce((s, e) => s + e.dsaHours, 0) / recent.length;
  const avgBackend = recent.reduce((s, e) => s + e.backendHours, 0) / recent.length;
  const avgAI = recent.reduce((s, e) => s + e.aiHours, 0) / recent.length;

  nextDayPlan.push(`DSA: ${Math.max(2, Math.ceil(avgDSA + 0.5))}h — ${dsaDays < 5 ? 'PRIORITY: practice daily' : 'continue current pace'}`);
  nextDayPlan.push(`Backend: ${Math.max(1.5, Math.ceil(avgBackend + 0.5))}h — ${backendDays < 4 ? 'increase frequency' : 'maintain depth'}`);
  nextDayPlan.push(`AI: ${Math.max(1, Math.ceil(avgAI + 0.5))}h — ${aiDays < 3 ? 'start allocating time' : 'keep consistent'}`);
  nextDayPlan.push(`Project: ${projectDays < 3 ? 'YES — mandatory today' : 'Continue current project'}`);
  nextDayPlan.push(`Revision: ${revisionDays < 3 ? 'YES — review yesterday\'s topics' : '30min spaced repetition'}`);

  // Overall assessment
  let overallAssessment: string;
  if (avgScore >= 8 && avgHours >= 6) {
    overallAssessment = `Strong week (${avgScore.toFixed(1)} avg, ${avgHours.toFixed(1)}h/day). You're on track for interviews. Don't get complacent.`;
  } else if (avgScore >= 5) {
    overallAssessment = `Average week (${avgScore.toFixed(1)} avg, ${avgHours.toFixed(1)}h/day). Average doesn't get offers. Push to 8+.`;
  } else {
    overallAssessment = `Poor week (${avgScore.toFixed(1)} avg, ${avgHours.toFixed(1)}h/day). At this rate, you won't be ready. Radical change needed NOW.`;
  }

  return { weaknesses, suggestions, nextDayPlan, overallAssessment };
}
