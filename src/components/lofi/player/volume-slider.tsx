'use client';

import { Volume1, Volume2, VolumeX } from 'lucide-react';
import { memo } from 'react';
import { formatVolumePercent } from '@/lib/volume';

/**
 * Volume control.
 *
 * The visible track/thumb are decorative divs and the real `<input type="range">`
 * sits on top at `opacity-0`, which keeps native keyboard and touch behaviour
 * (arrows, Home/End, drag) while allowing the station-tinted styling. The input
 * therefore carries the accessible name and value — a `role="slider"` wrapper
 * would only duplicate what the native element already reports, so instead we
 * add `aria-valuetext` so screen readers announce "40%" rather than "0.4".
 */
export const VolumeSlider = memo(function VolumeSlider({
  volume,
  isMuted,
  onVolumeChange,
  onMuteToggle,
}: {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (value: number) => void;
  onMuteToggle: () => void;
}) {
  const position = isMuted ? 0 : volume;
  const percent = formatVolumePercent(position);
  const silent = isMuted || volume === 0;
  const Icon = silent ? VolumeX : percent < 45 ? Volume1 : Volume2;

  return (
    <div className="flex w-full items-center gap-3">
      <button
        type="button"
        onClick={onMuteToggle}
        aria-label={silent ? '取消静音' : '静音'}
        aria-pressed={isMuted}
        className="tap-target flex-shrink-0 rounded-xl p-2 text-fg-subtle transition-colors hover:bg-hairline hover:text-fg"
      >
        <Icon className="h-5 w-5" />
      </button>

      {/* 44px tall so the slider itself clears the minimum touch target; the
          visible track stays 6px because it is absolutely centred. */}
      <div className="group relative flex h-11 flex-1 items-center">
        <div className="pointer-events-none absolute inset-x-0 h-1.5 rounded-full bg-hairline-strong" />
        <div
          className="pointer-events-none absolute left-0 h-1.5 rounded-full bg-station"
          style={{ width: `${percent}%` }}
        />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={position}
          onChange={(event) => onVolumeChange(Number.parseFloat(event.target.value))}
          aria-label="音量"
          aria-valuetext={`${percent}%`}
          className="absolute inset-x-0 z-10 h-full w-full cursor-pointer touch-pan-x appearance-none opacity-0"
        />
        <div
          className="pointer-events-none absolute h-4 w-4 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] ring-2 ring-station/40 transition-transform group-hover:scale-110"
          style={{ left: `calc(${percent}% - 8px)` }}
        />
      </div>

      <span className="w-10 text-right font-mono text-xs tabular-nums text-fg-subtle">
        {percent}%
      </span>
    </div>
  );
});
