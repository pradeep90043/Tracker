// ============================================================
// Charts — Dashboard visualizations (recharts)
// ============================================================

'use client';

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
  ReferenceLine,
} from 'recharts';
import type { DailyEntry } from '@/types';
import {
  getHoursTrendData,
  getWeeklyConsistencyData,
  getScoreDistributionData,
} from '@/lib/scoring';

interface ChartsProps {
  entries: DailyEntry[];
}

const COLORS = {
  excellent: '#34d399',
  average: '#fbbf24',
  poor: '#f87171',
  dsa: '#60a5fa',
  backend: '#a78bfa',
  ai: '#f472b6',
  total: '#2dd4bf',
  passed: '#34d399',
  failed: '#f87171',
};

export default function Charts({ entries }: ChartsProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <p className="text-lg">No data yet. Start logging your daily work.</p>
      </div>
    );
  }

  const hoursTrend = getHoursTrendData(entries);
  const weeklyData = getWeeklyConsistencyData(entries);
  const scoreDist = getScoreDistributionData(entries);

  const PIE_COLORS: Record<string, string> = {
    Excellent: COLORS.excellent,
    Average: COLORS.average,
    Poor: COLORS.poor,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Hours Trend */}
      <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">
          Daily Hours Trend
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={hoursTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
            <XAxis dataKey="date" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
            <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px' }}
              labelStyle={{ color: '#e4e4e7' }}
            />
            <ReferenceLine y={6} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: '6h min', fill: '#f59e0b', fontSize: 10 }} />
            <Line type="monotone" dataKey="totalHours" stroke={COLORS.total} strokeWidth={2} dot={{ r: 3 }} name="Total" />
            <Line type="monotone" dataKey="dsaHours" stroke={COLORS.dsa} strokeWidth={1.5} dot={false} name="DSA" />
            <Line type="monotone" dataKey="backendHours" stroke={COLORS.backend} strokeWidth={1.5} dot={false} name="Backend" />
            <Line type="monotone" dataKey="aiHours" stroke={COLORS.ai} strokeWidth={1.5} dot={false} name="AI" />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Consistency */}
      <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">
          Weekly Consistency
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
            <XAxis dataKey="week" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
            <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} domain={[0, 7]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px' }}
              labelStyle={{ color: '#e4e4e7' }}
            />
            <Bar dataKey="passedDays" fill={COLORS.passed} name="Passed Days" radius={[2, 2, 0, 0]} />
            <Bar dataKey="failedDays" fill={COLORS.failed} name="Failed Days" radius={[2, 2, 0, 0]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Score Distribution */}
      <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4 lg:col-span-2">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">
          Score Distribution
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={scoreDist}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="count"
              nameKey="level"
              label={({ level, count }) => `${level}: ${count}`}
            >
              {scoreDist.map((entry) => (
                <Cell key={entry.level} fill={PIE_COLORS[entry.level]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px' }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
