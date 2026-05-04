// ============================================================
// FocusMode — Pomodoro timer + live progress tracking
// ============================================================

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PomodoroState, FocusSession } from '@/types';

interface FocusModeProps {
  onSessionComplete: (session: Omit<FocusSession, 'id' | 'userId'>) => void;
  todayHours: { dsa: number; backend: number; ai: number; project: number };
  targetHours: { dsa: number; backend: number; ai: number; project: number };
}

const CATEGORIES = [
  { key: 'dsa' as const, label: 'DSA', color: 'text-blue-400', bg: 'bg-blue-500', border: 'border-blue-600' },
  { key: 'backend' as const, label: 'Backend', color: 'text-purple-400', bg: 'bg-purple-500', border: 'border-purple-600' },
  { key: 'ai' as const, label: 'AI', color: 'text-pink-400', bg: 'bg-pink-500', border: 'border-pink-600' },
  { key: 'project' as const, label: 'Project', color: 'text-teal-400', bg: 'bg-teal-500', border: 'border-teal-600' },
];

const DEFAULT_WORK = 25;
const DEFAULT_BREAK = 5;

export default function FocusMode({ onSessionComplete, todayHours, targetHours }: FocusModeProps) {
  const [pomodoro, setPomodoro] = useState<PomodoroState>({
    isRunning: false,
    isBreak: false,
    timeRemaining: DEFAULT_WORK * 60,
    workDuration: DEFAULT_WORK,
    breakDuration: DEFAULT_BREAK,
    sessionsCompleted: 0,
    totalWorkSeconds: 0,
    currentCategory: 'dsa',
  });

  const [isPageFocused, setIsPageFocused] = useState(true);
  const [showDistraction, setShowDistraction] = useState(false);
  const [customWork, setCustomWork] = useState(DEFAULT_WORK);
  const [customBreak, setCustomBreak] = useState(DEFAULT_BREAK);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Page visibility detection for distraction warning
  useEffect(() => {
    function handleVisibility() {
      const hidden = document.hidden;
      setIsPageFocused(!hidden);
      if (hidden && pomodoro.isRunning && !pomodoro.isBreak) {
        setShowDistraction(true);
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [pomodoro.isRunning, pomodoro.isBreak]);

  // Dismiss distraction warning when user returns
  useEffect(() => {
    if (isPageFocused && showDistraction) {
      const timeout = setTimeout(() => setShowDistraction(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [isPageFocused, showDistraction]);

  // Timer logic
  useEffect(() => {
    if (!pomodoro.isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setPomodoro(prev => {
        if (prev.timeRemaining <= 1) {
          // Timer finished
          try {
            audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2AgoODhIOCgn+Af32CgHV1eXp9f4CCgoODg4ODgoKBgH99fHt6');
            audioRef.current.play().catch(() => {});
          } catch { /* no audio support */ }

          if (prev.isBreak) {
            // Break finished → start new work session
            return {
              ...prev,
              isBreak: false,
              timeRemaining: prev.workDuration * 60,
            };
          } else {
            // Work session finished → log session + start break
            const sessionMinutes = prev.workDuration;
            onSessionComplete({
              date: new Date().toISOString().slice(0, 10),
              category: prev.currentCategory,
              durationMinutes: sessionMinutes,
              completedAt: new Date().toISOString(),
            });

            return {
              ...prev,
              isBreak: true,
              timeRemaining: prev.breakDuration * 60,
              sessionsCompleted: prev.sessionsCompleted + 1,
              totalWorkSeconds: prev.totalWorkSeconds + sessionMinutes * 60,
            };
          }
        }

        return {
          ...prev,
          timeRemaining: prev.timeRemaining - 1,
          totalWorkSeconds: !prev.isBreak ? prev.totalWorkSeconds + 1 : prev.totalWorkSeconds,
        };
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pomodoro.isRunning, onSessionComplete]);

  const startTimer = useCallback(() => {
    setPomodoro(prev => ({
      ...prev,
      isRunning: true,
      timeRemaining: prev.isBreak ? prev.breakDuration * 60 : prev.workDuration * 60,
    }));
  }, []);

  const pauseTimer = useCallback(() => {
    setPomodoro(prev => ({ ...prev, isRunning: false }));
  }, []);

  const resetTimer = useCallback(() => {
    setPomodoro(prev => ({
      ...prev,
      isRunning: false,
      isBreak: false,
      timeRemaining: prev.workDuration * 60,
    }));
  }, []);

  const selectCategory = useCallback((cat: typeof pomodoro.currentCategory) => {
    if (!pomodoro.isRunning) {
      setPomodoro(prev => ({ ...prev, currentCategory: cat }));
    }
  }, [pomodoro.isRunning]);

  const applyCustomDurations = useCallback(() => {
    setPomodoro(prev => ({
      ...prev,
      workDuration: customWork,
      breakDuration: customBreak,
      timeRemaining: prev.isBreak ? customBreak * 60 : customWork * 60,
    }));
  }, [customWork, customBreak]);

  const markSessionComplete = useCallback(() => {
    const elapsedSeconds = pomodoro.workDuration * 60 - pomodoro.timeRemaining;
    const elapsedMinutes = Math.round(elapsedSeconds / 60);

    if (elapsedMinutes > 0) {
      onSessionComplete({
        date: new Date().toISOString().slice(0, 10),
        category: pomodoro.currentCategory,
        durationMinutes: elapsedMinutes,
        completedAt: new Date().toISOString(),
      });
    }

    setPomodoro(prev => ({
      ...prev,
      isRunning: false,
      isBreak: false,
      timeRemaining: prev.workDuration * 60,
      sessionsCompleted: prev.sessionsCompleted + 1,
      totalWorkSeconds: prev.totalWorkSeconds + elapsedSeconds,
    }));
  }, [pomodoro, onSessionComplete]);

  // Format time
  const minutes = Math.floor(pomodoro.timeRemaining / 60);
  const seconds = pomodoro.timeRemaining % 60;
  const totalWorkMinutes = Math.round(pomodoro.totalWorkSeconds / 60);
  const progress = pomodoro.isBreak
    ? ((pomodoro.breakDuration * 60 - pomodoro.timeRemaining) / (pomodoro.breakDuration * 60)) * 100
    : ((pomodoro.workDuration * 60 - pomodoro.timeRemaining) / (pomodoro.workDuration * 60)) * 100;

  const currentCat = CATEGORIES.find(c => c.key === pomodoro.currentCategory)!;

  return (
    <div className="space-y-6">
      {/* Distraction Warning */}
      {showDistraction && (
        <div className="bg-red-900/80 border border-red-500 rounded-lg p-4 text-center">
          <p className="text-red-200 font-semibold">⚠️ DISTRACTION DETECTED</p>
          <p className="text-red-300/80 text-sm mt-1">
            You left the page during a focus session. Stay focused.
          </p>
        </div>
      )}

      {/* Today's Progress */}
      <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-4">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Today&apos;s Progress
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CATEGORIES.map(cat => {
            const done = todayHours[cat.key];
            const target = targetHours[cat.key];
            const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
            return (
              <div key={cat.key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={cat.color}>{cat.label}</span>
                  <span className="text-zinc-500">{done}h / {target}h</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-1.5">
                  <div
                    className={`${cat.bg} h-1.5 rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Selection */}
      <div className="flex gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => selectCategory(cat.key)}
            disabled={pomodoro.isRunning}
            className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
              pomodoro.currentCategory === cat.key
                ? `bg-zinc-800 ${cat.border} ${cat.color} border`
                : 'bg-zinc-800/40 border-zinc-700/30 text-zinc-500 hover:text-zinc-300'
            } ${pomodoro.isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Timer */}
      <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-6 text-center">
        {/* Status */}
        <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
          pomodoro.isBreak ? 'text-emerald-400' : currentCat.color
        }`}>
          {pomodoro.isBreak ? 'Break Time' : `Working — ${currentCat.label}`}
        </p>

        {/* Progress bar */}
        <div className="w-full bg-zinc-700 rounded-full h-1 mb-4">
          <div
            className={`${pomodoro.isBreak ? 'bg-emerald-500' : currentCat.bg} h-1 rounded-full transition-all`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Time display */}
        <div className="text-5xl font-mono font-bold text-zinc-100 mb-6 tabular-nums">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center mb-4">
          {!pomodoro.isRunning ? (
            <button
              onClick={startTimer}
              className="bg-emerald-700 hover:bg-emerald-600 text-white font-medium py-2.5 px-8 rounded-md text-sm transition-colors"
            >
              {pomodoro.timeRemaining === pomodoro.workDuration * 60 ? 'Start' : 'Resume'}
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="bg-amber-700 hover:bg-amber-600 text-white font-medium py-2.5 px-8 rounded-md text-sm transition-colors"
            >
              Pause
            </button>
          )}
          <button
            onClick={resetTimer}
            className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-medium py-2.5 px-6 rounded-md text-sm transition-colors"
          >
            Reset
          </button>
          {pomodoro.isRunning && !pomodoro.isBreak && (
            <button
              onClick={markSessionComplete}
              className="bg-blue-700 hover:bg-blue-600 text-white font-medium py-2.5 px-6 rounded-md text-sm transition-colors"
            >
              ✓ Done Early
            </button>
          )}
        </div>

        {/* Session stats */}
        <div className="flex justify-center gap-6 text-xs text-zinc-500">
          <span>Sessions: <span className="text-zinc-300 font-medium">{pomodoro.sessionsCompleted}</span></span>
          <span>Work time: <span className="text-zinc-300 font-medium">{totalWorkMinutes}min</span></span>
        </div>
      </div>

      {/* Custom durations */}
      <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-4">
        <p className="text-xs text-zinc-400 uppercase tracking-wider mb-3">Timer Settings</p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label htmlFor="work-duration" className="block text-xs text-zinc-500 mb-1">Work (min)</label>
            <input
              id="work-duration"
              type="number"
              min={5}
              max={90}
              value={customWork}
              onChange={e => setCustomWork(parseInt(e.target.value) || 25)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="break-duration" className="block text-xs text-zinc-500 mb-1">Break (min)</label>
            <input
              id="break-duration"
              type="number"
              min={1}
              max={30}
              value={customBreak}
              onChange={e => setCustomBreak(parseInt(e.target.value) || 5)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={applyCustomDurations}
            disabled={pomodoro.isRunning}
            className="bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs py-1.5 px-4 rounded-md transition-colors disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
