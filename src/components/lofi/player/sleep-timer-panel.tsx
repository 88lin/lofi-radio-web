'use client';

import { Check } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

const PRESETS = [15, 30, 45, 60, 90, 120] as const;
const MIN_MINUTES = 1;
const MAX_MINUTES = 480;

/**
 * Sleep-timer settings. Behaviour (presets, 1-480 range, the "请输入 1 到 480
 * 分钟" message, "关闭定时") is carried over unchanged; only the styling moved
 * to semantic tokens so it is readable in the light theme.
 */
export const SleepTimerPanel = memo(function SleepTimerPanel({
  open,
  activeMinutes,
  onApply,
}: {
  open: boolean;
  activeMinutes: number | null;
  onApply: (minutes: number | null) => void;
}) {
  const [custom, setCustom] = useState('');

  const parsed = Number(custom);
  const isValid =
    custom.trim().length > 0 &&
    Number.isFinite(parsed) &&
    parsed >= MIN_MINUTES &&
    parsed <= MAX_MINUTES;

  const applyCustom = useCallback(() => {
    if (!isValid) return;
    onApply(Math.round(parsed));
    setCustom('');
  }, [isValid, parsed, onApply]);

  return (
    <div
      // Kept mounted so the open/close transition is pure CSS; `inert` keeps the
      // collapsed panel out of the tab order and the accessibility tree.
      inert={!open}
      aria-hidden={!open}
      className={cn(
        'panel w-full max-w-sm overflow-hidden rounded-2xl transition-all',
        open ? 'mt-3 max-h-[420px] opacity-100' : 'pointer-events-none mt-0 max-h-0 opacity-0',
      )}
      style={{
        transitionDuration: 'var(--dur-base)',
        transitionTimingFunction: 'var(--ease-out-soft)',
      }}
    >
      <div className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-fg-muted">快速设置</span>
          <button
            type="button"
            onClick={() => onApply(null)}
            className="tap-target flex h-9 items-center rounded-full px-3 text-xs text-fg-muted transition-colors hover:bg-hairline hover:text-fg"
          >
            关闭定时
          </button>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2">
          {PRESETS.map((minutes) => {
            const isActive = activeMinutes === minutes;
            return (
              <button
                key={minutes}
                type="button"
                onClick={() => onApply(minutes)}
                aria-pressed={isActive}
                className={cn(
                  // h-11 rather than tap-target: a 3-column grid of overlapping
                  // 44px pseudo-elements would make adjacent presets ambiguous.
                  'flex h-11 items-center justify-center rounded-xl border px-2 text-xs font-medium transition-colors',
                  isActive
                    ? 'border-station/50 bg-station/15 text-station'
                    : 'border-hairline bg-surface-2 text-fg-muted hover:text-fg',
                )}
              >
                {minutes} 分钟
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row">
          <input
            type="text"
            inputMode="numeric"
            value={custom}
            onChange={(event) => setCustom(event.target.value.replace(/[^\d]/g, ''))}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyCustom();
              }
            }}
            placeholder={`自定义分钟（${MIN_MINUTES}-${MAX_MINUTES}）`}
            aria-label="自定义睡眠定时分钟数"
            className="h-11 flex-1 rounded-xl border border-hairline bg-surface-2 px-3 text-sm text-fg outline-none placeholder:text-fg-faint focus-visible:border-station/50"
          />
          <button
            type="button"
            onClick={applyCustom}
            disabled={!isValid}
            className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-station px-4 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Check className="h-3.5 w-3.5" />
            设置
          </button>
        </div>

        {custom.trim().length > 0 && !isValid && (
          <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400" role="alert">
            请输入 {MIN_MINUTES} 到 {MAX_MINUTES} 分钟
          </p>
        )}
      </div>
    </div>
  );
});
