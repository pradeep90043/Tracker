// ============================================================
// LockdownOverlay — Full-screen blocking when 3+ failed days
// ============================================================

'use client';

interface LockdownOverlayProps {
  consecutiveFailedDays: number;
  onGoToFailures: () => void;
  onGoToDailyLog: () => void;
}

export default function LockdownOverlay({
  consecutiveFailedDays,
  onGoToFailures,
  onGoToDailyLog,
}: LockdownOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center space-y-6">
        {/* Lock icon */}
        <div className="text-6xl">🔒</div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-red-400">
          DASHBOARD LOCKED
        </h2>

        {/* Message */}
        <div className="space-y-3">
          <p className="text-zinc-300 text-lg">
            You have <span className="text-red-400 font-bold">{consecutiveFailedDays}</span> consecutive
            failed days.
          </p>
          <p className="text-zinc-400">
            You are drifting from your goals. The dashboard is locked until you take action.
          </p>
        </div>

        {/* Rules */}
        <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-4 text-left space-y-2">
          <p className="text-red-400 text-sm font-semibold uppercase tracking-wider">To unlock:</p>
          <ol className="text-zinc-400 text-sm space-y-1 list-decimal list-inside">
            <li>Analyze why you failed — go to Failure Analysis</li>
            <li>Log a new daily entry with <span className="text-emerald-400 font-medium">6+ hours</span></li>
            <li>The dashboard will unlock automatically</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onGoToFailures}
            className="bg-red-700 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-md text-sm transition-colors"
          >
            Go to Failure Analysis
          </button>
          <button
            onClick={onGoToDailyLog}
            className="bg-blue-700 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-md text-sm transition-colors"
          >
            Log Today&apos;s Entry
          </button>
        </div>

        {/* Harsh quote */}
        <p className="text-zinc-600 text-xs italic">
          &quot;Discipline is choosing between what you want now and what you want most.&quot;
        </p>
      </div>
    </div>
  );
}
