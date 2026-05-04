// ============================================================
// Mock Data Generator — Realistic 14-day seed data
// ============================================================

import type { DailyEntry, FailureLog, WeeklyGoal, FailureCategory } from '@/types';
import { createDailyEntry } from '@/lib/scoring';
import { v4 } from '@/lib/uuid';
import {
  seedDatabase, clearDatabase,
} from '@/app/actions/trackerActions';

/** Generate mock entries for the last N days */
function generateMockEntries(days = 14): any[] {
  const entries: any[] = [];
  const today = new Date();

  const topics = {
    dsa: ['Binary Search', 'DP', 'Graphs', 'Trees', 'Arrays', 'Sliding Window', 'Backtracking', 'Stack/Queue', 'Greedy', 'Two Pointers'],
    backend: ['REST APIs', 'Auth/JWT', 'PostgreSQL', 'Redis', 'Docker', 'System Design', 'Microservices', 'GraphQL', 'WebSockets', 'DB Indexing'],
    ai: ['Transformers', 'RAG Pipeline', 'Fine-tuning', 'LangChain', 'Embeddings', 'Prompt Engineering', 'Vector DBs', 'Neural Networks'],
  };

  const patterns = [
    { dsaH: 2.5, dsaP: 4, backH: 2, aiH: 1.5, proj: true, rev: true, deep: true },
    { dsaH: 2, dsaP: 3, backH: 1.5, aiH: 1, proj: true, rev: true, deep: true },
    { dsaH: 3, dsaP: 5, backH: 2, aiH: 1.5, proj: true, rev: true, deep: true },
    { dsaH: 2, dsaP: 3, backH: 2, aiH: 1, proj: false, rev: true, deep: true },
    { dsaH: 1.5, dsaP: 2, backH: 1.5, aiH: 1, proj: true, rev: false, deep: false },
    { dsaH: 1, dsaP: 1, backH: 0.5, aiH: 0, proj: false, rev: false, deep: false },
    { dsaH: 0.5, dsaP: 0, backH: 0, aiH: 0, proj: false, rev: false, deep: false },
    { dsaH: 2.5, dsaP: 3, backH: 2, aiH: 2, proj: true, rev: true, deep: true },
    { dsaH: 2.5, dsaP: 4, backH: 2, aiH: 1.5, proj: true, rev: true, deep: true },
    { dsaH: 3, dsaP: 6, backH: 2.5, aiH: 1.5, proj: true, rev: true, deep: true },
    { dsaH: 2.5, dsaP: 3, backH: 2, aiH: 2, proj: true, rev: true, deep: true },
    { dsaH: 2, dsaP: 2, backH: 2.5, aiH: 1.5, proj: false, rev: true, deep: true },
    { dsaH: 2, dsaP: 3, backH: 2.5, aiH: 2, proj: true, rev: false, deep: false },
  ];

  for (let i = 0; i < Math.min(days, patterns.length); i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - (patterns.length - 1 - i));
    const p = patterns[i];

    const entry = createDailyEntry({
      date: date.toISOString().slice(0, 10),
      dsaHours: p.dsaH,
      dsaProblemsSolved: p.dsaP,
      dsaTopic: topics.dsa[i % topics.dsa.length],
      backendHours: p.backH,
      backendTopic: topics.backend[i % topics.backend.length],
      aiHours: p.aiH,
      aiTopic: topics.ai[i % topics.ai.length],
      projectWork: p.proj,
      revision: p.rev,
      deepWork: p.deep,
    });

    // Remove id and timestamps for createMany
    const { id, ...rest } = entry;
    entries.push(rest);
  }

  return entries;
}

/** Generate mock failure logs */
function generateMockFailures(): any[] {
  const today = new Date();
  return [
    {
      date: new Date(today.getTime() - 8 * 86400000).toISOString().slice(0, 10),
      missedTask: 'AI Learning',
      reason: 'Got distracted by YouTube',
      rootCause: 'No time-blocking in schedule',
      fixAction: 'Use Focus Mode with Pomodoro for AI sessions',
      category: 'Distraction',
    },
    {
      date: new Date(today.getTime() - 7 * 86400000).toISOString().slice(0, 10),
      missedTask: 'DSA Practice',
      reason: 'Felt tired after work',
      rootCause: 'Poor sleep schedule',
      fixAction: 'Sleep by 11 PM, wake at 6 AM, DSA first thing',
      category: 'Low Energy',
    },
  ];
}

/** Generate mock weekly goals */
function generateMockGoals(): any[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const weekStart = monday.toISOString().slice(0, 10);
  const weekEnd = new Date(monday);
  weekEnd.setDate(monday.getDate() + 6);

  return [
    {
      weekStart,
      weekEnd: weekEnd.toISOString().slice(0, 10),
      dsaTopics: 'Trees, Sliding Window, Backtracking',
      backendTopics: 'Docker, System Design, Redis',
      aiTopics: 'LangChain, Embeddings, Fine-tuning',
      projectGoal: 'Build dashboard analytics',
      dsaTopicsCompleted: 'Trees, Sliding Window',
      backendTopicsCompleted: 'Docker',
      aiTopicsCompleted: 'LangChain',
      projectGoalCompleted: false,
    },
  ];
}

/** Seed all mock data into Database */
export async function seedMockData(): Promise<void> {
  const entries = generateMockEntries(13);
  const failures = generateMockFailures();
  const goals = generateMockGoals();

  await seedDatabase(entries, failures, goals);
}

/** Clear all data from Database */
export async function clearAllData(): Promise<void> {
  await clearDatabase();
}
