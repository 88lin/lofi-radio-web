'use client';

import { memo, useEffect, useState } from 'react';
import { useAudioStore } from '@/store/audioStore';

interface ClockValue {
  h: string;
  m: string;
  s: string;
  date: string;
  greeting: string;
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const;

function greetingFor(hour: number): string {
  if (hour < 6) return '深夜好';
  if (hour < 12) return '早上好';
  if (hour < 18) return '下午好';
  if (hour < 22) return '晚上好';
  return '深夜好';
}

function useClock(): ClockValue | null {
  const [value, setValue] = useState<ClockValue | null>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setValue({
        h: String(now.getHours()).padStart(2, '0'),
        m: String(now.getMinutes()).padStart(2, '0'),
        s: String(now.getSeconds()).padStart(2, '0'),
        date: `${WEEKDAYS[now.getDay()]}  ${now.getMonth() + 1}月${now.getDate()}日`,
        greeting: greetingFor(now.getHours()),
      });
    };
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);

  return value;
}

/**
 * Hero clock card.
 *
 * Contrast fix (S6): the greeting and date were `text-white/38` / `text-zinc-600`
 * on a near-white background. They now use the `fg-subtle` token (6.0:1 in light,
 * 5.4:1 in dark), and the time keeps its station-tinted gradient via the shared
 * `gradient-text` utility instead of an inline `linear-gradient` string.
 */
export const LiveClock = memo(function LiveClock() {
  const clock = useClock();
  const isPlaying = useAudioStore((s) => s.isPlaying);

  // Reserve the final height so the hero does not shift when the clock mounts.
  if (!clock) return <div className="mb-8 h-[132px]" aria-hidden="true" />;

  return (
    <div className="mb-8 inline-flex flex-col items-center rounded-3xl border border-station/25 bg-surface/70 px-8 py-5 elev-md backdrop-blur-xl">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={
            isPlaying
              ? 'h-1.5 w-1.5 rounded-full bg-station shadow-[0_0_8px_var(--station-accent)] animate-pulse-subtle'
              : 'h-1.5 w-1.5 rounded-full bg-fg-faint'
          }
          aria-hidden="true"
        />
        <span className="text-xs font-medium uppercase tracking-widest text-fg-subtle">
          {clock.greeting}
        </span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span
          className="gradient-text text-5xl font-bold tabular-nums tracking-tight sm:text-6xl"
          suppressHydrationWarning
        >
          {clock.h}:{clock.m}
        </span>
        <span
          className="self-end pb-1 text-2xl font-semibold tabular-nums text-station"
          suppressHydrationWarning
        >
          {clock.s}
        </span>
      </div>

      <span className="mt-1.5 text-xs tracking-wide text-fg-subtle" suppressHydrationWarning>
        {clock.date}
      </span>
    </div>
  );
});
