// ============================================================
// AlertBanner — Strict discipline alerts (v2)
// ============================================================

'use client';

import type { DisciplineAlert } from '@/types';

interface AlertBannerProps {
  alerts: DisciplineAlert[];
}

const ALERT_STYLES: Record<string, string> = {
  warning: 'bg-amber-900/80 border-amber-500 text-amber-100',
  danger: 'bg-red-900/80 border-red-500 text-red-100',
  success: 'bg-emerald-900/80 border-emerald-500 text-emerald-100',
  lockdown: 'bg-red-950 border-red-600 text-red-200',
};

export default function AlertBanner({ alerts }: AlertBannerProps) {
  const visible = alerts.filter(a => a.show);
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {visible.map((alert, i) => (
        <div
          key={i}
          className={`px-4 py-3 border-l-4 rounded-r-md text-sm font-medium ${ALERT_STYLES[alert.type]}`}
          role="alert"
        >
          {alert.message}
        </div>
      ))}
    </div>
  );
}
