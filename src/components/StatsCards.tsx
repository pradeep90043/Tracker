// ============================================================
// StatsCards — Key metrics overview
// ============================================================

'use client';

import type { DashboardStats } from '@/types';

interface StatsCardsProps {
  stats: DashboardStats;
}

interface StatCardData {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards: StatCardData[] = [
    {
      label: 'Current Streak',
      value: `${stats.currentStreak} days`,
      sub: `Longest: ${stats.longestStreak}`,
      color: stats.currentStreak >= 5 ? 'text-emerald-400' : stats.currentStreak >= 3 ? 'text-amber-400' : 'text-red-400',
    },
    {
      label: 'Problems Solved',
      value: stats.totalProblemsSolved,
      sub: `DSA Hours: ${stats.totalDSAHours}h`,
      color: 'text-blue-400',
    },
    {
      label: 'Backend Hours',
      value: `${stats.totalBackendHours}h`,
      sub: `AI Hours: ${stats.totalAIHours}h`,
      color: 'text-purple-400',
    },
    {
      label: 'Avg Score',
      value: `${stats.averageScore}/10`,
      sub: `${stats.passedDays}✅ / ${stats.failedDays}❌`,
      color: stats.averageScore >= 8 ? 'text-emerald-400' : stats.averageScore >= 5 ? 'text-amber-400' : 'text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4"
        >
          <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">
            {card.label}
          </p>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          {card.sub && (
            <p className="text-xs text-zinc-500 mt-1">{card.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
