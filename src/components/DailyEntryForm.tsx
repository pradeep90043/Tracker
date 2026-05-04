// ============================================================
// DailyEntryForm — Log daily work
// ============================================================

'use client';

import { useState, useMemo } from 'react';
import type { DailyEntryFormData } from '@/types';
import { calculateScore, getPerformanceLevel } from '@/lib/scoring';

interface DailyEntryFormProps {
  onSubmit: (data: DailyEntryFormData) => void;
  existingDates: string[];
}

const INITIAL_FORM: DailyEntryFormData = {
  date: new Date().toISOString().slice(0, 10),
  dsaHours: 0,
  dsaProblemsSolved: 0,
  dsaTopic: '',
  backendHours: 0,
  backendTopic: '',
  aiHours: 0,
  aiTopic: '',
  projectWork: false,
  revision: false,
  deepWork: false,
};

export default function DailyEntryForm({ onSubmit, existingDates }: DailyEntryFormProps) {
  const [form, setForm] = useState<DailyEntryFormData>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);

  const totalHours = form.dsaHours + form.backendHours + form.aiHours;
  const score = useMemo(() => calculateScore(form), [form]);
  const level = getPerformanceLevel(score);
  const passed = totalHours >= 6;
  const isDuplicate = existingDates.includes(form.date);

  const levelColor = level === 'Excellent' ? 'text-emerald-400' : level === 'Average' ? 'text-amber-400' : 'text-red-400';

  function updateField<K extends keyof DailyEntryFormData>(key: K, value: DailyEntryFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setSubmitted(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
    setSubmitted(true);
    setForm(INITIAL_FORM);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date picker */}
      <div>
        <label htmlFor="entry-date" className="block text-xs text-zinc-400 uppercase tracking-wider mb-1">Date</label>
        <input
          id="entry-date"
          type="date"
          value={form.date}
          onChange={e => updateField('date', e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          required
        />
        {isDuplicate && (
          <p className="text-amber-400 text-xs mt-1">⚠ Entry exists for this date — it will be replaced.</p>
        )}
      </div>

      {/* DSA Section */}
      <fieldset className="border border-zinc-700/50 rounded-md p-4 space-y-3">
        <legend className="text-xs font-semibold text-blue-400 uppercase px-2">DSA</legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="dsa-hours" className="block text-xs text-zinc-400 mb-1">Hours</label>
            <input
              id="dsa-hours"
              type="number"
              min={0}
              max={12}
              step={0.5}
              value={form.dsaHours}
              onChange={e => updateField('dsaHours', parseFloat(e.target.value) || 0)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="dsa-problems" className="block text-xs text-zinc-400 mb-1">Problems Solved</label>
            <input
              id="dsa-problems"
              type="number"
              min={0}
              max={50}
              value={form.dsaProblemsSolved}
              onChange={e => updateField('dsaProblemsSolved', parseInt(e.target.value) || 0)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label htmlFor="dsa-topic" className="block text-xs text-zinc-400 mb-1">Topic</label>
          <input
            id="dsa-topic"
            type="text"
            value={form.dsaTopic}
            onChange={e => updateField('dsaTopic', e.target.value)}
            placeholder="e.g. Binary Search, DP, Graphs"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </fieldset>

      {/* Backend Section */}
      <fieldset className="border border-zinc-700/50 rounded-md p-4 space-y-3">
        <legend className="text-xs font-semibold text-purple-400 uppercase px-2">Backend</legend>
        <div>
          <label htmlFor="backend-hours" className="block text-xs text-zinc-400 mb-1">Hours</label>
          <input
            id="backend-hours"
            type="number"
            min={0}
            max={12}
            step={0.5}
            value={form.backendHours}
            onChange={e => updateField('backendHours', parseFloat(e.target.value) || 0)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="backend-topic" className="block text-xs text-zinc-400 mb-1">Topic</label>
          <input
            id="backend-topic"
            type="text"
            value={form.backendTopic}
            onChange={e => updateField('backendTopic', e.target.value)}
            placeholder="e.g. REST APIs, Auth, DB Design"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </fieldset>

      {/* AI Section */}
      <fieldset className="border border-zinc-700/50 rounded-md p-4 space-y-3">
        <legend className="text-xs font-semibold text-pink-400 uppercase px-2">AI / ML</legend>
        <div>
          <label htmlFor="ai-hours" className="block text-xs text-zinc-400 mb-1">Hours</label>
          <input
            id="ai-hours"
            type="number"
            min={0}
            max={12}
            step={0.5}
            value={form.aiHours}
            onChange={e => updateField('aiHours', parseFloat(e.target.value) || 0)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="ai-topic" className="block text-xs text-zinc-400 mb-1">Topic</label>
          <input
            id="ai-topic"
            type="text"
            value={form.aiTopic}
            onChange={e => updateField('aiTopic', e.target.value)}
            placeholder="e.g. Transformers, RAG, Fine-tuning"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </fieldset>

      {/* Toggles */}
      <div className="grid grid-cols-3 gap-3">
        {([
          ['projectWork', 'Project Work'] as const,
          ['revision', 'Revision'] as const,
          ['deepWork', 'Deep Work'] as const,
        ]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => updateField(key, !form[key])}
            className={`px-3 py-2.5 rounded-md text-sm font-medium border transition-colors ${
              form[key]
                ? 'bg-emerald-900/50 border-emerald-600 text-emerald-300'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            {form[key] ? '✓' : '○'} {label}
          </button>
        ))}
      </div>

      {/* Live Preview */}
      <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-md p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400">Total Hours: </span>
            <span className={`text-lg font-bold ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalHours}h {passed ? '✅' : '❌'}
            </span>
          </div>
          <div>
            <span className="text-xs text-zinc-400">Score: </span>
            <span className={`text-lg font-bold ${levelColor}`}>
              {score}/10
            </span>
          </div>
          <div>
            <span className={`text-sm font-semibold px-2 py-1 rounded ${
              level === 'Excellent' ? 'bg-emerald-900/40 text-emerald-400' :
              level === 'Average' ? 'bg-amber-900/40 text-amber-400' :
              'bg-red-900/40 text-red-400'
            }`}>
              {level}
            </span>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-md text-sm transition-colors disabled:opacity-50"
        disabled={totalHours === 0}
      >
        {isDuplicate ? 'Update Entry' : 'Log Entry'}
      </button>

      {submitted && (
        <p className="text-emerald-400 text-sm text-center">✓ Entry logged successfully.</p>
      )}
    </form>
  );
}
