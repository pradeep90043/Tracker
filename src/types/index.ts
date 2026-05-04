// ============================================================
// Data Models — Discipline Tracker v2
// ============================================================

/** A single daily tracking entry */
export interface DailyEntry {
  id: string;
  date: string; // ISO date string YYYY-MM-DD

  // DSA
  dsaHours: number;
  dsaProblemsSolved: number;
  dsaTopic: string;

  // Backend
  backendHours: number;
  backendTopic: string;

  // AI
  aiHours: number;
  aiTopic: string;

  // Booleans
  projectWork: boolean;
  revision: boolean;
  deepWork: boolean;

  // Computed
  totalHours: number;
  score: number;
  performanceLevel: PerformanceLevel;
  passed: boolean; // totalHours >= 6
}

export type PerformanceLevel = 'Excellent' | 'Average' | 'Poor';

/** Form data before computation */
export interface DailyEntryFormData {
  date: string;
  dsaHours: number;
  dsaProblemsSolved: number;
  dsaTopic: string;
  backendHours: number;
  backendTopic: string;
  aiHours: number;
  aiTopic: string;
  projectWork: boolean;
  revision: boolean;
  deepWork: boolean;
}

/** Failure category — predefined for pattern analysis */
export type FailureCategory =
  | 'Distraction'
  | 'Low Energy'
  | 'No Plan'
  | 'Overcommitted'
  | 'Personal Issues'
  | 'Procrastination'
  | 'Health'
  | 'Other';

export const FAILURE_CATEGORIES: FailureCategory[] = [
  'Distraction',
  'Low Energy',
  'No Plan',
  'Overcommitted',
  'Personal Issues',
  'Procrastination',
  'Health',
  'Other',
];

/** Failure analysis log */
export interface FailureLog {
  id: string;
  date: string;
  missedTask: string;
  reason: string;
  rootCause: string;
  fixAction: string;
  category: FailureCategory;
}

/** Weekly goals */
export interface WeeklyGoal {
  id: string;
  weekStart: string; // ISO date of Monday
  weekEnd: string;   // ISO date of Sunday
  dsaTopics: string;
  backendTopics: string;
  aiTopics: string;
  projectGoal: string;
  dsaTopicsCompleted: string;
  backendTopicsCompleted: string;
  aiTopicsCompleted: string;
  projectGoalCompleted: boolean;
}

/** Weekly review — self-reflection every 7 days */
export interface WeeklyReview {
  id: string;
  weekStart: string;
  weekEnd: string;
  metGoals: boolean;
  whatWentWrong: string;
  whatToImprove: string;
  rating: number; // 1-10 self-rating
  createdAt: string | Date;
}

/** Aggregate stats for the dashboard */
export interface DashboardStats {
  currentStreak: number;
  longestStreak: number;
  totalProblemsSolved: number;
  totalBackendHours: number;
  totalAIHours: number;
  totalDSAHours: number;
  totalEntries: number;
  averageScore: number;
  passedDays: number;
  failedDays: number;
}

/** Chart data point for daily hours trend */
export interface HoursTrendPoint {
  date: string;
  totalHours: number;
  dsaHours: number;
  backendHours: number;
  aiHours: number;
}

/** Chart data point for weekly consistency */
export interface WeeklyConsistencyPoint {
  week: string;
  passedDays: number;
  failedDays: number;
  averageScore: number;
}

/** Chart data point for score distribution */
export interface ScoreDistributionPoint {
  level: PerformanceLevel;
  count: number;
}

/** Time distribution for pie chart */
export interface TimeDistributionPoint {
  name: string;
  hours: number;
  fill: string;
}

/** Alert type for strict UX */
export type AlertType = 'warning' | 'danger' | 'success' | 'lockdown';

export interface DisciplineAlert {
  type: AlertType;
  message: string;
  show: boolean;
}

/** Advanced analytics insight */
export interface Insight {
  id: string;
  type: 'warning' | 'positive' | 'neutral';
  title: string;
  description: string;
  metric?: string;
}

/** Streak milestone badge */
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
  threshold: number;
}

/** Pomodoro session state */
export interface PomodoroState {
  isRunning: boolean;
  isBreak: boolean;
  timeRemaining: number; // in seconds
  workDuration: number;  // in minutes
  breakDuration: number; // in minutes
  sessionsCompleted: number;
  totalWorkSeconds: number;
  currentCategory: 'dsa' | 'backend' | 'ai' | 'project';
}

/** Focus mode session log */
export interface FocusSession {
  id: string;
  date: string;
  category: 'dsa' | 'backend' | 'ai' | 'project';
  durationMinutes: number;
  completedAt: string | Date;
}

/** AI analysis response */
export interface AIAnalysis {
  weekStart: string;
  weaknesses: string[];
  suggestions: string[];
  nextDayPlan: string[];
  overallAssessment: string;
  generatedAt: string;
}

/** Tab navigation — extended */
export type TabId = 'dashboard' | 'daily' | 'focus' | 'analytics' | 'failures' | 'goals';

/** Discipline enforcement level */
export type DisciplineLevel = 'normal' | 'warning' | 'drifting' | 'lockdown';
