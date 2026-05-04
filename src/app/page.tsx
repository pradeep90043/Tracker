// ============================================================
// Main Dashboard Page — Client Component (v2)
// ============================================================

'use client';

import { useState, useMemo, useCallback } from 'react';
import type { TabId } from '@/types';
import { useTracker } from '@/hooks/useTracker';
import { exportToCSV } from '@/lib/storage';
import { seedMockData, clearAllData } from '@/lib/mockData';

import AlertBanner from '@/components/AlertBanner';
import StatsCards from '@/components/StatsCards';
import Charts from '@/components/Charts';
import DailyEntryForm from '@/components/DailyEntryForm';
import EntryHistory from '@/components/EntryHistory';
import FailureAnalysis from '@/components/FailureAnalysis';
import WeeklyGoals from '@/components/WeeklyGoals';
import LockdownOverlay from '@/components/LockdownOverlay';
import FocusMode from '@/components/FocusMode';
import AdvancedAnalytics from '@/components/AdvancedAnalytics';
import WeeklyReviewModal from '@/components/WeeklyReviewModal';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'daily', label: 'Daily Log', icon: '📝' },
  { id: 'focus', label: 'Focus', icon: '🎯' },
  { id: 'analytics', label: 'Analytics', icon: '🔬' },
  { id: 'failures', label: 'Failures', icon: '⚠️' },
  { id: 'goals', label: 'Goals', icon: '🏁' },
];

import { UserButton } from "@clerk/nextjs";

export default function HomePage() {
  const tracker = useTracker();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDismissed, setReviewDismissed] = useState(false);

  // Don't render until localStorage is loaded to prevent hydration mismatch
  if (!tracker.loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-zinc-500 text-sm">Loading...</div>
      </div>
    );
  }

  // Auto-show weekly review modal
  if (tracker.isWeeklyReviewDue && !reviewDismissed && !showReviewModal) {
    // Use timeout to avoid setState during render
    setTimeout(() => setShowReviewModal(true), 100);
  }

  // Days remaining calculation
  const startDate = new Date('2026-05-04');
  const targetDate = new Date('2026-08-02');
  const today = new Date();
  const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / 86400000));

  // Current week bounds for review modal
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekStart = monday.toISOString().slice(0, 10);
  const weekEnd = sunday.toISOString().slice(0, 10);

  // Today's hours for focus mode
  const todayStr = today.toISOString().slice(0, 10);
  const todayEntry = tracker.entries.find(e => e.date === todayStr);
  const todayHours = {
    dsa: todayEntry?.dsaHours || 0,
    backend: todayEntry?.backendHours || 0,
    ai: todayEntry?.aiHours || 0,
    project: todayEntry?.projectWork ? 1 : 0,
  };
  const targetHours = { dsa: 2, backend: 2, ai: 1, project: 1 };

  // Lockdown: in lockdown mode, only allow failures + daily log tabs
  const isLocked = tracker.disciplineLevel === 'lockdown';
  const allowedInLockdown: TabId[] = ['daily', 'failures'];

  // Tab navigation with lockdown enforcement
  const handleTabChange = (id: TabId) => {
    if (isLocked && !allowedInLockdown.includes(id)) return;
    setActiveTab(id);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Lockdown Overlay */}
      {isLocked && !allowedInLockdown.includes(activeTab) && (
        <LockdownOverlay
          consecutiveFailedDays={tracker.consecutiveFailedDays}
          onGoToFailures={() => { setActiveTab('failures'); }}
          onGoToDailyLog={() => { setActiveTab('daily'); }}
        />
      )}

      {/* Weekly Review Modal */}
      {showReviewModal && (
        <WeeklyReviewModal
          weekStart={weekStart}
          weekEnd={weekEnd}
          pastReviews={tracker.reviews}
          onSubmit={(data) => {
            tracker.addReview(data);
            setShowReviewModal(false);
            setReviewDismissed(true);
          }}
          onDismiss={() => {
            setShowReviewModal(false);
            setReviewDismissed(true);
          }}
        />
      )}

      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-zinc-100 tracking-tight">
                Discipline Tracker
              </h1>
              <p className="text-xs text-zinc-500">
                {daysRemaining > 0
                  ? `${daysRemaining} days remaining — no excuses.`
                  : 'Target reached. Review your data.'}
                {tracker.stats.currentStreak > 0 && (
                  <span className="ml-2 text-emerald-400">🔥 {tracker.stats.currentStreak}-day streak</span>
                )}
                {tracker.syncing && (
                  <span className="ml-3 text-[10px] text-zinc-600 animate-pulse tracking-widest uppercase font-bold">● Syncing...</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Demo Data */}
              <button
                onClick={async () => { await seedMockData(); window.location.reload(); }}
                className="text-xs text-emerald-500 hover:text-emerald-300 transition-colors px-2 py-1 border border-emerald-700/50 rounded hidden md:inline-flex"
                title="Load demo data"
              >
                ▶ Demo
              </button>
              <button
                onClick={async () => { if (confirm('Clear ALL data?')) { await clearAllData(); window.location.reload(); } }}
                className="text-xs text-red-500 hover:text-red-300 transition-colors px-2 py-1 border border-red-700/50 rounded hidden md:inline-flex"
                title="Clear all data"
              >
                ✕ Clear
              </button>

              {/* Weekly Review */}
              <button
                onClick={() => setShowReviewModal(true)}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 border border-zinc-700 rounded hidden md:inline-flex"
                title="Weekly Review"
              >
                📋 Review
              </button>

              {/* Export */}
              <button
                onClick={() => exportToCSV(tracker.entries)}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 border border-zinc-700 rounded"
                disabled={tracker.entries.length === 0}
                title="Export CSV"
              >
                ↓ CSV
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={tracker.toggleDarkMode}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 border border-zinc-700 rounded mr-2"
                title="Toggle dark mode"
              >
                {tracker.darkMode ? '☀' : '●'}
              </button>

              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 mt-3 -mb-px overflow-x-auto">
            {TABS.map(tab => {
              const disabled = isLocked && !allowedInLockdown.includes(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  disabled={disabled}
                  className={`px-3 md:px-4 py-2 text-xs font-medium rounded-t-md transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 border-b-zinc-800'
                      : disabled
                        ? 'text-zinc-700 cursor-not-allowed'
                        : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <span className="mr-1 hidden md:inline">{tab.icon}</span>
                  {tab.label}
                  {tab.id === 'failures' && tracker.failures.length > 0 && (
                    <span className="ml-1 text-red-400">({tracker.failures.length})</span>
                  )}
                  {disabled && <span className="ml-1">🔒</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Alerts — always visible */}
        <AlertBanner alerts={tracker.alerts} />

        {/* ===== DASHBOARD TAB ===== */}
        {activeTab === 'dashboard' && (
          <>
            <StatsCards stats={tracker.stats} />
            <Charts entries={tracker.entries} />
            {/* Recent entries preview */}
            <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                  Recent Entries
                </h3>
                <button
                  onClick={() => setActiveTab('daily')}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  View All →
                </button>
              </div>
              <EntryHistory
                entries={tracker.entries.slice(-7)}
                onDelete={tracker.removeDailyEntry}
              />
            </div>
          </>
        )}

        {/* ===== DAILY LOG TAB ===== */}
        {activeTab === 'daily' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4 sticky top-28">
                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
                  Log Daily Entry
                </h2>
                <DailyEntryForm
                  onSubmit={tracker.addDailyEntry}
                  existingDates={tracker.entries.map(e => e.date)}
                />
              </div>
            </div>

            {/* History */}
            <div className="lg:col-span-3">
              <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4">
                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
                  Entry History ({tracker.entries.length} entries)
                </h2>
                <EntryHistory
                  entries={tracker.entries}
                  onDelete={tracker.removeDailyEntry}
                />
              </div>
            </div>
          </div>
        )}

        {/* ===== FOCUS MODE TAB ===== */}
        {activeTab === 'focus' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
              🎯 Focus Mode
            </h2>
            <FocusMode
              onSessionComplete={tracker.logFocusSession}
              todayHours={todayHours}
              targetHours={targetHours}
            />
          </div>
        )}

        {/* ===== ANALYTICS TAB ===== */}
        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
              🔬 Advanced Analytics
            </h2>
            <AdvancedAnalytics
              entries={tracker.entries}
              failures={tracker.failures}
            />
          </div>
        )}

        {/* ===== FAILURES TAB ===== */}
        {activeTab === 'failures' && (
          <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
              Failure Analysis
            </h2>
            <FailureAnalysis
              failures={tracker.failures}
              onAdd={tracker.addFailureLog}
              onDelete={tracker.removeFailure}
            />
          </div>
        )}

        {/* ===== GOALS TAB ===== */}
        {activeTab === 'goals' && (
          <div>
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
              Weekly Goals
            </h2>
            <WeeklyGoals
              goals={tracker.goals}
              entries={tracker.entries}
              onUpsert={tracker.upsertGoal}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-3 text-center">
        <p className="text-xs text-zinc-600">
          Discipline beats talent. Every day counts.
        </p>
      </footer>
    </div>
  );
}
