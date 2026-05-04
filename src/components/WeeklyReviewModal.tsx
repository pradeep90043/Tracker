// ============================================================
// WeeklyReviewModal — Auto-triggered self-reflection
// ============================================================

'use client';

import { useState } from 'react';
import type { WeeklyReview } from '@/types';

interface WeeklyReviewModalProps {
  weekStart: string;
  weekEnd: string;
  pastReviews: WeeklyReview[];
  onSubmit: (data: Omit<WeeklyReview, 'id' | 'createdAt'>) => void;
  onDismiss: () => void;
}

export default function WeeklyReviewModal({
  weekStart,
  weekEnd,
  pastReviews,
  onSubmit,
  onDismiss,
}: WeeklyReviewModalProps) {
  const [form, setForm] = useState({
    metGoals: false,
    whatWentWrong: '',
    whatToImprove: '',
    rating: 5,
  });
  const [showPast, setShowPast] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      weekStart,
      weekEnd,
      ...form,
    });
  }

  const sortedPast = [...pastReviews].sort((a, b) => b.weekStart.localeCompare(a.weekStart));

  return (
    <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-lg w-full p-6 space-y-5 my-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Weekly Review</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Week: {weekStart} → {weekEnd}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-zinc-500 hover:text-zinc-300 text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Met Goals */}
          <div>
            <label className="block text-xs text-zinc-400 mb-2">Did you meet your weekly goals?</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, metGoals: true }))}
                className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                  form.metGoals
                    ? 'bg-emerald-900/50 border-emerald-600 text-emerald-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}
              >
                ✓ Yes
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, metGoals: false }))}
                className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                  !form.metGoals
                    ? 'bg-red-900/50 border-red-600 text-red-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}
              >
                ✕ No
              </button>
            </div>
          </div>

          {/* What went wrong */}
          <div>
            <label htmlFor="review-wrong" className="block text-xs text-zinc-400 mb-1">
              What went wrong this week?
            </label>
            <textarea
              id="review-wrong"
              value={form.whatWentWrong}
              onChange={e => setForm(f => ({ ...f, whatWentWrong: e.target.value }))}
              placeholder="Be brutally honest with yourself..."
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          {/* What to improve */}
          <div>
            <label htmlFor="review-improve" className="block text-xs text-zinc-400 mb-1">
              What will you improve next week?
            </label>
            <textarea
              id="review-improve"
              value={form.whatToImprove}
              onChange={e => setForm(f => ({ ...f, whatToImprove: e.target.value }))}
              placeholder="Specific, actionable changes only..."
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          {/* Self-rating */}
          <div>
            <label className="block text-xs text-zinc-400 mb-2">
              Rate your week (1-10): <span className={`font-bold ${
                form.rating >= 8 ? 'text-emerald-400' : form.rating >= 5 ? 'text-amber-400' : 'text-red-400'
              }`}>{form.rating}</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={form.rating}
              onChange={e => setForm(f => ({ ...f, rating: parseInt(e.target.value) }))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-zinc-600 mt-1">
              <span>Terrible</span>
              <span>Average</span>
              <span>Excellent</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-md text-sm transition-colors"
          >
            Submit Review
          </button>
        </form>

        {/* Past Reviews */}
        {sortedPast.length > 0 && (
          <div>
            <button
              onClick={() => setShowPast(!showPast)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              {showPast ? '— Hide past reviews' : `+ View past reviews (${sortedPast.length})`}
            </button>

            {showPast && (
              <div className="mt-3 space-y-3 max-h-60 overflow-y-auto">
                {sortedPast.map(r => (
                  <div key={r.id} className="bg-zinc-800/40 border border-zinc-700/30 rounded-md p-3 text-xs">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-zinc-500 font-mono">{r.weekStart} → {r.weekEnd}</span>
                      <span className={`font-bold ${
                        r.rating >= 8 ? 'text-emerald-400' : r.rating >= 5 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {r.rating}/10
                      </span>
                    </div>
                    <p className="text-zinc-400">
                      <span className="text-zinc-500">Goals met:</span>{' '}
                      <span className={r.metGoals ? 'text-emerald-400' : 'text-red-400'}>
                        {r.metGoals ? 'Yes' : 'No'}
                      </span>
                    </p>
                    {r.whatWentWrong && (
                      <p className="text-zinc-400 mt-1"><span className="text-zinc-500">Wrong:</span> {r.whatWentWrong}</p>
                    )}
                    {r.whatToImprove && (
                      <p className="text-zinc-400"><span className="text-zinc-500">Improve:</span> {r.whatToImprove}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
