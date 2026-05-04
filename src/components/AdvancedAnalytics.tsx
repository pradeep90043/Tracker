// ============================================================
// AdvancedAnalytics — Insights, patterns, and AI feedback
// ============================================================

'use client';

import { useMemo, useState } from 'react';
import type { DailyEntry, FailureLog, Insight, Badge } from '@/types';
import {
  generateAllInsights,
  getTimeDistribution,
  getConsistencyScore,
  calculateBadges,
  generateAIAnalysis,
  getFailureCategoryStats,
} from '@/lib/analytics';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

interface AdvancedAnalyticsProps {
  entries: DailyEntry[];
  failures: FailureLog[];
}

const INSIGHT_STYLES: Record<string, string> = {
  warning: 'border-l-red-500 bg-red-950/20',
  positive: 'border-l-emerald-500 bg-emerald-950/20',
  neutral: 'border-l-zinc-500 bg-zinc-800/30',
};

const INSIGHT_ICONS: Record<string, string> = {
  warning: '⚠️',
  positive: '✅',
  neutral: 'ℹ️',
};

export default function AdvancedAnalytics({ entries, failures }: AdvancedAnalyticsProps) {
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  const insights = useMemo(() => generateAllInsights(entries), [entries]);
  const timeDist = useMemo(() => getTimeDistribution(entries), [entries]);
  const consistency = useMemo(() => getConsistencyScore(entries), [entries]);
  const badges = useMemo(() => calculateBadges(entries), [entries]);
  const failureStats = useMemo(() => getFailureCategoryStats(failures), [failures]);

  const aiAnalysis = useMemo(() => {
    if (!showAIAnalysis) return null;
    return generateAIAnalysis(entries, failures);
  }, [showAIAnalysis, entries, failures]);

  // Weekly score data for bar chart
  const weeklyScores = useMemo(() => {
    const weekMap = new Map<string, number[]>();
    entries.forEach(e => {
      const date = new Date(e.date);
      const dayOfWeek = date.getDay();
      const monday = new Date(date);
      monday.setDate(date.getDate() - ((dayOfWeek + 6) % 7));
      const weekKey = monday.toISOString().slice(0, 10);
      if (!weekMap.has(weekKey)) weekMap.set(weekKey, []);
      weekMap.get(weekKey)!.push(e.score);
    });

    return Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, scores]) => ({
        week: week.slice(5),
        avgScore: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length * 10) / 10,
        maxScore: Math.max(...scores),
        minScore: Math.min(...scores),
      }));
  }, [entries]);

  const earnedBadges = badges.filter(b => b.earned);
  const nextBadges = badges.filter(b => !b.earned).slice(0, 3);

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <p className="text-lg">No data yet. Start logging to see analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Consistency Score Header */}
      <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-400 uppercase tracking-wider">7-Day Consistency</p>
          <p className={`text-3xl font-bold ${
            consistency >= 70 ? 'text-emerald-400' : consistency >= 40 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {consistency}/100
          </p>
        </div>
        <div className="w-24 h-24 relative">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" stroke="#3f3f46" strokeWidth="8" fill="none" />
            <circle
              cx="50" cy="50" r="42"
              stroke={consistency >= 70 ? '#34d399' : consistency >= 40 ? '#fbbf24' : '#f87171'}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${(consistency / 100) * 264} 264`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-zinc-300">
            {consistency}%
          </span>
        </div>
      </div>

      {/* Insights Grid */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Performance Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight: Insight) => (
            <div
              key={insight.id}
              className={`border-l-4 rounded-r-md p-3 ${INSIGHT_STYLES[insight.type]}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-sm mt-0.5">{INSIGHT_ICONS[insight.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{insight.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{insight.description}</p>
                  {insight.metric && (
                    <p className="text-xs font-mono text-zinc-500 mt-1">{insight.metric}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Distribution Pie */}
        <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">
            Time Distribution
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={timeDist}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                dataKey="hours"
                nameKey="name"
                label={({ name, value }) => `${name}: ${value}h`}
              >
                {timeDist.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px' }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Scores Bar */}
        <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">
            Weekly Scores
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyScores}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="week" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
              <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} domain={[0, 10]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px' }}
                labelStyle={{ color: '#e4e4e7' }}
              />
              <Bar dataKey="avgScore" fill="#60a5fa" name="Avg Score" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Failure Category Breakdown */}
      {failureStats.length > 0 && (
        <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-400 mb-3 uppercase tracking-wider">
            Failure Categories
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {failureStats.map(({ category, count }) => (
              <div key={category} className="bg-zinc-800/40 rounded-md p-3 text-center">
                <p className="text-lg font-bold text-red-400">{count}</p>
                <p className="text-xs text-zinc-500">{category}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-3">
            Most common: <span className="text-red-400 font-medium">{failureStats[0]?.category}</span>
            {' '}({failureStats[0]?.count} occurrences)
          </p>
        </div>
      )}

      {/* Badges */}
      <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">
          Milestone Badges
        </h3>

        {earnedBadges.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-emerald-400 uppercase tracking-wider mb-2">Earned</p>
            <div className="flex flex-wrap gap-2">
              {earnedBadges.map((badge: Badge) => (
                <div
                  key={badge.id}
                  className="bg-emerald-950/30 border border-emerald-800/50 rounded-md px-3 py-2 text-center"
                  title={badge.description}
                >
                  <span className="text-xl">{badge.icon}</span>
                  <p className="text-xs text-emerald-300 mt-1">{badge.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {nextBadges.length > 0 && (
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Next to earn</p>
            <div className="flex flex-wrap gap-2">
              {nextBadges.map((badge: Badge) => (
                <div
                  key={badge.id}
                  className="bg-zinc-800/40 border border-zinc-700/30 rounded-md px-3 py-2 text-center opacity-50"
                  title={badge.description}
                >
                  <span className="text-xl grayscale">{badge.icon}</span>
                  <p className="text-xs text-zinc-500 mt-1">{badge.name}</p>
                  <p className="text-xs text-zinc-600">{badge.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Analysis */}
      <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            AI Weekly Analysis
          </h3>
          <button
            onClick={() => setShowAIAnalysis(!showAIAnalysis)}
            className="text-xs bg-blue-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md transition-colors"
          >
            {showAIAnalysis ? 'Hide Analysis' : '🤖 Analyze My Week'}
          </button>
        </div>

        {aiAnalysis && (
          <div className="space-y-4">
            {/* Overall */}
            <div className="bg-zinc-800/80 rounded-md p-3">
              <p className="text-xs text-zinc-400 uppercase mb-1">Overall Assessment</p>
              <p className="text-sm text-zinc-200">{aiAnalysis.overallAssessment}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Weaknesses */}
              <div className="bg-red-950/20 border border-red-900/30 rounded-md p-3">
                <p className="text-xs text-red-400 uppercase font-semibold mb-2">Weaknesses</p>
                <ul className="space-y-1">
                  {aiAnalysis.weaknesses.map((w, i) => (
                    <li key={i} className="text-xs text-zinc-400">• {w}</li>
                  ))}
                </ul>
              </div>

              {/* Suggestions */}
              <div className="bg-blue-950/20 border border-blue-900/30 rounded-md p-3">
                <p className="text-xs text-blue-400 uppercase font-semibold mb-2">Suggestions</p>
                <ul className="space-y-1">
                  {aiAnalysis.suggestions.map((s, i) => (
                    <li key={i} className="text-xs text-zinc-400">• {s}</li>
                  ))}
                </ul>
              </div>

              {/* Next Day Plan */}
              <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-md p-3">
                <p className="text-xs text-emerald-400 uppercase font-semibold mb-2">Tomorrow&apos;s Plan</p>
                <ul className="space-y-1">
                  {aiAnalysis.nextDayPlan.map((p, i) => (
                    <li key={i} className="text-xs text-zinc-400">• {p}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {!showAIAnalysis && (
          <p className="text-zinc-500 text-xs">
            Click &quot;Analyze My Week&quot; to get personalized performance feedback and a strict plan for tomorrow.
          </p>
        )}
      </div>
    </div>
  );
}
