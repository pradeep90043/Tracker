// ============================================================
// WeeklyGoals — Set targets and track progress
// ============================================================

'use client';

import { useState, useMemo } from 'react';
import type { WeeklyGoal, DailyEntry } from '@/types';
import { v4 } from '@/lib/uuid';

interface WeeklyGoalsProps {
  goals: WeeklyGoal[];
  entries: DailyEntry[];
  onUpsert: (goal: WeeklyGoal) => void;
}

function getWeekBounds(): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

const INITIAL_GOAL = (): WeeklyGoal => {
  const { start, end } = getWeekBounds();
  return {
    id: v4(),
    weekStart: start,
    weekEnd: end,
    dsaTopics: '',
    backendTopics: '',
    aiTopics: '',
    projectGoal: '',
    dsaTopicsCompleted: '',
    backendTopicsCompleted: '',
    aiTopicsCompleted: '',
    projectGoalCompleted: false,
  };
};

export default function WeeklyGoals({ goals, entries, onUpsert }: WeeklyGoalsProps) {
  const { start, end } = getWeekBounds();

  // Find or create current week goal
  const currentGoal = goals.find(g => g.weekStart === start);
  const [form, setForm] = useState<WeeklyGoal>(currentGoal || INITIAL_GOAL());
  const [editing, setEditing] = useState(!currentGoal);

  // Weekly stats from entries
  const weekStats = useMemo(() => {
    const weekEntries = entries.filter(e => e.date >= start && e.date <= end);
    return {
      totalHours: weekEntries.reduce((s, e) => s + e.totalHours, 0),
      dsaHours: weekEntries.reduce((s, e) => s + e.dsaHours, 0),
      backendHours: weekEntries.reduce((s, e) => s + e.backendHours, 0),
      aiHours: weekEntries.reduce((s, e) => s + e.aiHours, 0),
      problemsSolved: weekEntries.reduce((s, e) => s + e.dsaProblemsSolved, 0),
      daysLogged: weekEntries.length,
      passedDays: weekEntries.filter(e => e.passed).length,
      avgScore: weekEntries.length > 0
        ? Math.round(weekEntries.reduce((s, e) => s + e.score, 0) / weekEntries.length * 10) / 10
        : 0,
    };
  }, [entries, start, end]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onUpsert(form);
    setEditing(false);
  }

  // Calculate progress bars
  function progressPercent(target: string, completed: string): number {
    if (!target) return 0;
    const targetItems = target.split(',').map(s => s.trim()).filter(Boolean);
    const completedItems = completed.split(',').map(s => s.trim()).filter(Boolean);
    if (targetItems.length === 0) return 0;
    return Math.min(100, Math.round((completedItems.length / targetItems.length) * 100));
  }

  // Sorted goals - newest first
  const sortedGoals = [...goals].sort((a, b) => b.weekStart.localeCompare(a.weekStart));

  return (
    <div className="space-y-6">
      {/* Current Week Overview */}
      <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            This Week: {start} → {end}
          </h3>
          <div className="flex gap-2 text-xs">
            <span className="text-zinc-400">{weekStats.daysLogged}/7 logged</span>
            <span className="text-emerald-400">{weekStats.passedDays}✅</span>
            <span className="text-zinc-400">Avg: {weekStats.avgScore}/10</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{weekStats.dsaHours}h</p>
            <p className="text-xs text-zinc-500">DSA Hours</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">{weekStats.backendHours}h</p>
            <p className="text-xs text-zinc-500">Backend Hours</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-pink-400">{weekStats.aiHours}h</p>
            <p className="text-xs text-zinc-500">AI Hours</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-teal-400">{weekStats.problemsSolved}</p>
            <p className="text-xs text-zinc-500">Problems Solved</p>
          </div>
        </div>
      </div>

      {/* Set / Edit Goals */}
      {editing ? (
        <form onSubmit={handleSubmit} className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            Set Weekly Goals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="goal-dsa" className="block text-xs text-zinc-400 mb-1">DSA Topics (comma separated)</label>
              <input
                id="goal-dsa"
                type="text"
                value={form.dsaTopics}
                onChange={e => setForm(f => ({ ...f, dsaTopics: e.target.value }))}
                placeholder="e.g. Arrays, Trees, DP"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="goal-dsa-done" className="block text-xs text-zinc-400 mb-1">DSA Completed</label>
              <input
                id="goal-dsa-done"
                type="text"
                value={form.dsaTopicsCompleted}
                onChange={e => setForm(f => ({ ...f, dsaTopicsCompleted: e.target.value }))}
                placeholder="Topics you've covered"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="goal-backend" className="block text-xs text-zinc-400 mb-1">Backend Topics</label>
              <input
                id="goal-backend"
                type="text"
                value={form.backendTopics}
                onChange={e => setForm(f => ({ ...f, backendTopics: e.target.value }))}
                placeholder="e.g. REST, Auth, PostgreSQL"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="goal-backend-done" className="block text-xs text-zinc-400 mb-1">Backend Completed</label>
              <input
                id="goal-backend-done"
                type="text"
                value={form.backendTopicsCompleted}
                onChange={e => setForm(f => ({ ...f, backendTopicsCompleted: e.target.value }))}
                placeholder="Topics you've covered"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="goal-ai" className="block text-xs text-zinc-400 mb-1">AI Topics</label>
              <input
                id="goal-ai"
                type="text"
                value={form.aiTopics}
                onChange={e => setForm(f => ({ ...f, aiTopics: e.target.value }))}
                placeholder="e.g. LLMs, RAG, Fine-tuning"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="goal-ai-done" className="block text-xs text-zinc-400 mb-1">AI Completed</label>
              <input
                id="goal-ai-done"
                type="text"
                value={form.aiTopicsCompleted}
                onChange={e => setForm(f => ({ ...f, aiTopicsCompleted: e.target.value }))}
                placeholder="Topics you've covered"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="goal-project" className="block text-xs text-zinc-400 mb-1">Project Goal</label>
              <input
                id="goal-project"
                type="text"
                value={form.projectGoal}
                onChange={e => setForm(f => ({ ...f, projectGoal: e.target.value }))}
                placeholder="e.g. Complete auth system"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, projectGoalCompleted: !f.projectGoalCompleted }))}
                className={`w-full px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                  form.projectGoalCompleted
                    ? 'bg-emerald-900/50 border-emerald-600 text-emerald-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                {form.projectGoalCompleted ? '✓ Project Done' : '○ Project Incomplete'}
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded-md text-sm transition-colors"
            >
              Save Goals
            </button>
            {currentGoal && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-zinc-400 hover:text-zinc-300 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-sm bg-zinc-800 border border-zinc-700 text-zinc-300 px-4 py-2 rounded-md hover:bg-zinc-700 transition-colors"
        >
          ✎ Edit Weekly Goals
        </button>
      )}

      {/* Progress Bars (when goal exists and not editing) */}
      {currentGoal && !editing && (
        <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Progress vs Target</h3>
          {([
            { label: 'DSA Topics', target: currentGoal.dsaTopics, completed: currentGoal.dsaTopicsCompleted, color: 'bg-blue-500' },
            { label: 'Backend Topics', target: currentGoal.backendTopics, completed: currentGoal.backendTopicsCompleted, color: 'bg-purple-500' },
            { label: 'AI Topics', target: currentGoal.aiTopics, completed: currentGoal.aiTopicsCompleted, color: 'bg-pink-500' },
          ] as const).map(({ label, target, completed, color }) => {
            const pct = progressPercent(target, completed);
            return (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">{label}</span>
                  <span className="text-zinc-500">{pct}%</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <div
                    className={`${color} h-2 rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-600 mt-1">
                  Target: {target || '—'} | Done: {completed || '—'}
                </p>
              </div>
            );
          })}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">Project Goal</span>
              <span className={currentGoal.projectGoalCompleted ? 'text-emerald-400' : 'text-red-400'}>
                {currentGoal.projectGoalCompleted ? '✅ Complete' : '❌ Incomplete'}
              </span>
            </div>
            <p className="text-xs text-zinc-500">{currentGoal.projectGoal || '—'}</p>
          </div>
        </div>
      )}

      {/* Past Weeks */}
      {sortedGoals.filter(g => g.weekStart !== start).length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Past Weeks</h3>
          <div className="space-y-2">
            {sortedGoals.filter(g => g.weekStart !== start).slice(0, 5).map(g => (
              <div key={g.id} className="bg-zinc-800/40 border border-zinc-700/30 rounded-md p-3 text-xs">
                <span className="text-zinc-500 font-mono">{g.weekStart} → {g.weekEnd}</span>
                <div className="grid grid-cols-4 gap-2 mt-2 text-zinc-400">
                  <span>DSA: {progressPercent(g.dsaTopics, g.dsaTopicsCompleted)}%</span>
                  <span>Backend: {progressPercent(g.backendTopics, g.backendTopicsCompleted)}%</span>
                  <span>AI: {progressPercent(g.aiTopics, g.aiTopicsCompleted)}%</span>
                  <span>Project: {g.projectGoalCompleted ? '✅' : '❌'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
