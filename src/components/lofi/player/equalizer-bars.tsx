'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

/**
 * Decorative level meter.
 *
 * IMPORTANT: this is *not* a spectrum analyser and must never be labelled as
 * one. Reading real frequency data needs
 * `AudioContext.createMediaElementSource()`, which permanently silences the
 * media element if the stream turns out to be cross-origin without CORS headers
 * — an unacceptable risk for a radio app whose stations answer inconsistently
 * across CDN edges. The bars are pure CSS keyframes driven only by `isPlaying`.
 *
 * `aria-hidden` because it conveys nothing that the play/pause button does not
 * already state.
 */

/**
 * Per-bar animation offsets. Fixed rather than random so server and client
 * markup match and so the pattern reads as a rhythm instead of noise.
 */
const BARS = [
  { delay: 0, duration: 0.62, peak: 1 },
  { delay: 0.18, duration: 0.48, peak: 0.72 },
  { delay: 0.36, duration: 0.72, peak: 0.94 },
  { delay: 0.1, duration: 0.55, peak: 0.6 },
  { delay: 0.44, duration: 0.66, peak: 0.85 },
  { delay: 0.26, duration: 0.5, peak: 0.68 },
  { delay: 0.05, duration: 0.74, peak: 1 },
] as const;

export const EqualizerBars = memo(function EqualizerBars({
  isPlaying,
  className,
  barClassName,
}: {
  isPlaying: boolean;
  className?: string;
  barClassName?: string;
}) {
  return (
    <div
      className={cn('flex items-end gap-[3px]', className)}
      aria-hidden="true"
    >
      {BARS.map((bar, index) => (
        <span
          key={index}
          className={cn(
            'w-[3px] origin-bottom rounded-full bg-station transition-opacity',
            isPlaying ? 'animate-equalizer opacity-90' : 'opacity-30',
            barClassName,
          )}
          style={{
            height: `${Math.round(bar.peak * 100)}%`,
            animationDelay: `${bar.delay}s`,
            animationDuration: `${bar.duration}s`,
            transitionDuration: 'var(--dur-base)',
            // Paused state: collapse to a flat line instead of freezing mid-bounce.
            transform: isPlaying ? undefined : 'scaleY(0.18)',
          }}
        />
      ))}
    </div>
  );
});
