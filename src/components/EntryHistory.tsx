// ============================================================
// EntryHistory — Table of past daily entries
// ============================================================

'use client';

import type { DailyEntry } from '@/types';

interface EntryHistoryProps {
  entries: DailyEntry[];
  onDelete: (id: string) => void;
}

export default function EntryHistory({ entries, onDelete }: EntryHistoryProps) {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) {
    return (
      <p className="text-zinc-500 text-sm text-center py-8">No entries yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-700 text-zinc-400 text-xs uppercase">
            <th className="text-left py-2 px-2">Date</th>
            <th className="text-center py-2 px-2">Status</th>
            <th className="text-center py-2 px-2">Hours</th>
            <th className="text-center py-2 px-2">Score</th>
            <th className="text-center py-2 px-2">Level</th>
            <th className="text-left py-2 px-2 hidden md:table-cell">DSA</th>
            <th className="text-left py-2 px-2 hidden md:table-cell">Backend</th>
            <th className="text-left py-2 px-2 hidden lg:table-cell">AI</th>
            <th className="text-center py-2 px-2">Proj</th>
            <th className="text-center py-2 px-2">Rev</th>
            <th className="text-center py-2 px-2">Deep</th>
            <th className="py-2 px-2"></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(entry => (
            <tr key={entry.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
              <td className="py-2.5 px-2 text-zinc-300 font-mono text-xs">{entry.date}</td>
              <td className="py-2.5 px-2 text-center text-lg">{entry.passed ? '✅' : '❌'}</td>
              <td className={`py-2.5 px-2 text-center font-medium ${entry.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                {entry.totalHours}h
              </td>
              <td className="py-2.5 px-2 text-center font-bold text-zinc-200">{entry.score}</td>
              <td className="py-2.5 px-2 text-center">
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  entry.performanceLevel === 'Excellent' ? 'bg-emerald-900/40 text-emerald-400' :
                  entry.performanceLevel === 'Average' ? 'bg-amber-900/40 text-amber-400' :
                  'bg-red-900/40 text-red-400'
                }`}>
                  {entry.performanceLevel}
                </span>
              </td>
              <td className="py-2.5 px-2 text-zinc-400 text-xs hidden md:table-cell">
                {entry.dsaHours}h / {entry.dsaProblemsSolved}p
                {entry.dsaTopic && <span className="block text-zinc-500">{entry.dsaTopic}</span>}
              </td>
              <td className="py-2.5 px-2 text-zinc-400 text-xs hidden md:table-cell">
                {entry.backendHours}h
                {entry.backendTopic && <span className="block text-zinc-500">{entry.backendTopic}</span>}
              </td>
              <td className="py-2.5 px-2 text-zinc-400 text-xs hidden lg:table-cell">
                {entry.aiHours}h
                {entry.aiTopic && <span className="block text-zinc-500">{entry.aiTopic}</span>}
              </td>
              <td className="py-2.5 px-2 text-center">{entry.projectWork ? '✓' : '—'}</td>
              <td className="py-2.5 px-2 text-center">{entry.revision ? '✓' : '—'}</td>
              <td className="py-2.5 px-2 text-center">{entry.deepWork ? '✓' : '—'}</td>
              <td className="py-2.5 px-2 text-center">
                <button
                  onClick={() => onDelete(entry.id)}
                  className="text-zinc-600 hover:text-red-400 text-xs transition-colors"
                  title="Delete entry"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
