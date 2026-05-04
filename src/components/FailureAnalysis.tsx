// ============================================================
// FailureAnalysis — Enhanced with categorization
// ============================================================

'use client';

import { useState, useMemo } from 'react';
import type { FailureLog, FailureCategory } from '@/types';
import { FAILURE_CATEGORIES } from '@/types';

interface FailureAnalysisProps {
  failures: FailureLog[];
  onAdd: (data: Omit<FailureLog, 'id' | 'userId'>) => void;
  onDelete: (id: string) => void;
}

const INITIAL_FORM: Omit<FailureLog, 'id' | 'userId'> = {
  date: new Date().toISOString().slice(0, 10),
  missedTask: '',
  reason: '',
  rootCause: '',
  fixAction: '',
  category: 'Other',
};

const CATEGORY_COLORS: Record<FailureCategory, string> = {
  Distraction: 'bg-orange-900/30 text-orange-400 border-orange-800/50',
  'Low Energy': 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50',
  'No Plan': 'bg-red-900/30 text-red-400 border-red-800/50',
  Overcommitted: 'bg-purple-900/30 text-purple-400 border-purple-800/50',
  'Personal Issues': 'bg-blue-900/30 text-blue-400 border-blue-800/50',
  Procrastination: 'bg-pink-900/30 text-pink-400 border-pink-800/50',
  Health: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50',
  Other: 'bg-zinc-800/30 text-zinc-400 border-zinc-700/50',
};

export default function FailureAnalysis({ failures, onAdd, onDelete }: FailureAnalysisProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [showForm, setShowForm] = useState(false);

  // Pattern analysis — find most common root causes
  const patterns = useMemo(() => {
    const causeMap = new Map<string, number>();
    const taskMap = new Map<string, number>();
    const categoryMap = new Map<FailureCategory, number>();

    failures.forEach(f => {
      if (f.rootCause) {
        const key = f.rootCause.toLowerCase().trim();
        causeMap.set(key, (causeMap.get(key) || 0) + 1);
      }
      if (f.missedTask) {
        const key = f.missedTask.toLowerCase().trim();
        taskMap.set(key, (taskMap.get(key) || 0) + 1);
      }
      const cat = f.category || 'Other';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });

    const topCauses = Array.from(causeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topMissed = Array.from(taskMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topCategories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { topCauses, topMissed, topCategories };
  }, [failures]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onAdd(form);
    setForm(INITIAL_FORM);
    setShowForm(false);
  }

  const sorted = [...failures].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      {/* Pattern Analysis */}
      {failures.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">
              Top Root Causes
            </h3>
            {patterns.topCauses.length > 0 ? (
              <ul className="space-y-2">
                {patterns.topCauses.map(([cause, count]) => (
                  <li key={cause} className="flex justify-between text-sm">
                    <span className="text-zinc-300 capitalize">{cause}</span>
                    <span className="text-red-400 font-mono">{count}×</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-zinc-500 text-sm">No patterns yet.</p>
            )}
          </div>
          <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
              Most Missed Tasks
            </h3>
            {patterns.topMissed.length > 0 ? (
              <ul className="space-y-2">
                {patterns.topMissed.map(([task, count]) => (
                  <li key={task} className="flex justify-between text-sm">
                    <span className="text-zinc-300 capitalize">{task}</span>
                    <span className="text-amber-400 font-mono">{count}×</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-zinc-500 text-sm">No patterns yet.</p>
            )}
          </div>
          <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">
              Top Categories
            </h3>
            {patterns.topCategories.length > 0 ? (
              <ul className="space-y-2">
                {patterns.topCategories.map(([cat, count]) => (
                  <li key={cat} className="flex justify-between text-sm">
                    <span className={`text-xs px-2 py-0.5 rounded border ${CATEGORY_COLORS[cat]}`}>
                      {cat}
                    </span>
                    <span className="text-purple-400 font-mono">{count}×</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-zinc-500 text-sm">No patterns yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Add Failure Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="text-sm bg-red-900/30 border border-red-800/50 text-red-300 px-4 py-2 rounded-md hover:bg-red-900/50 transition-colors"
      >
        {showForm ? '— Cancel' : '+ Log Failure'}
      </button>

      {/* Failure Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="failure-date" className="block text-xs text-zinc-400 mb-1">Date</label>
              <input
                id="failure-date"
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                required
              />
            </div>
            <div>
              <label htmlFor="failure-category" className="block text-xs text-zinc-400 mb-1">Category</label>
              <select
                id="failure-category"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as FailureCategory }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                {FAILURE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="missed-task" className="block text-xs text-zinc-400 mb-1">Missed Task</label>
            <input
              id="missed-task"
              type="text"
              value={form.missedTask}
              onChange={e => setForm(f => ({ ...f, missedTask: e.target.value }))}
              placeholder="e.g. DSA practice, Backend learning"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-red-500"
              required
            />
          </div>
          <div>
            <label htmlFor="failure-reason" className="block text-xs text-zinc-400 mb-1">Reason</label>
            <input
              id="failure-reason"
              type="text"
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="What happened?"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-red-500"
              required
            />
          </div>
          <div>
            <label htmlFor="root-cause" className="block text-xs text-zinc-400 mb-1">Root Cause</label>
            <input
              id="root-cause"
              type="text"
              value={form.rootCause}
              onChange={e => setForm(f => ({ ...f, rootCause: e.target.value }))}
              placeholder="Why did it actually happen?"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-red-500"
              required
            />
          </div>
          <div>
            <label htmlFor="fix-action" className="block text-xs text-zinc-400 mb-1">Fix Action</label>
            <input
              id="fix-action"
              type="text"
              value={form.fixAction}
              onChange={e => setForm(f => ({ ...f, fixAction: e.target.value }))}
              placeholder="What will you change?"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-red-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-red-700 hover:bg-red-600 text-white font-medium py-2 rounded-md text-sm transition-colors"
          >
            Log Failure
          </button>
        </form>
      )}

      {/* Failure History */}
      {sorted.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Recent Failures</h3>
          {sorted.slice(0, 20).map(f => (
            <div key={f.id} className="bg-zinc-800/40 border border-zinc-700/30 rounded-md p-3 text-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-zinc-500">{f.date}</span>
                  {f.category && (
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[f.category]}`}>
                      {f.category}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onDelete(f.id)}
                  className="text-zinc-600 hover:text-red-400 text-xs"
                >
                  ✕
                </button>
              </div>
              <p className="text-zinc-300"><span className="text-zinc-500">Missed:</span> {f.missedTask}</p>
              <p className="text-zinc-400 text-xs mt-1"><span className="text-zinc-500">Reason:</span> {f.reason}</p>
              <p className="text-zinc-400 text-xs"><span className="text-zinc-500">Root Cause:</span> {f.rootCause}</p>
              <p className="text-emerald-400/80 text-xs"><span className="text-zinc-500">Fix:</span> {f.fixAction}</p>
            </div>
          ))}
        </div>
      )}

      {failures.length === 0 && !showForm && (
        <p className="text-zinc-500 text-sm text-center py-8">No failures logged. Keep it that way.</p>
      )}
    </div>
  );
}
