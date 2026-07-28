'use client';

import { Clock, Loader2, Maximize2, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { memo, useCallback } from 'react';
import { EqualizerBars } from '@/components/lofi/player/equalizer-bars';
import { useMounted } from '@/hooks/use-mounted';
import { useFocusTimer } from '@/hooks/useFocusTimer';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import { formatTrack } from '@/lib/now-playing';
import { cn } from '@/lib/utils';
import { useAudioStore } from '@/store/audioStore';

/**
 * The collapsed "dynamic island" player.
 *
 * Fixes S5: every control used to be a 36x30 box holding a 10px icon, which
 * failed WCAG 2.5.5 (44x44) and was genuinely hard to hit while walking. Icons
 * are now 16px inside 32px buttons wrapped in `tap-target`, which projects a
 * 44x44 hit area without inflating the island.
 *
 * Also fixes the duplication the screenshot audit surfaced: the nav pill used to
 * render its own "now playing" chip directly above this one. The nav no longer
 * shows playback state at all — the island is the single source of truth, so it
 * carries the live track when the station exposes one.
 *
 * Colours come from tokens, so the island is legible in the light theme instead
 * of being a dark-purple slab (the collapsed sibling of S1).
 */
export const MiniIsland = memo(function MiniIsland({ onExpand }: { onExpand: () => void }) {
  const mounted = useMounted();
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const isLoading = useAudioStore((s) => s.isLoading);
  const userWantsPlay = useAudioStore((s) => s.userWantsPlay);
  const hasError = useAudioStore((s) => s.hasError);
  const currentStation = useAudioStore((s) => s.currentStation);
  const requestPlay = useAudioStore((s) => s.requestPlay);
  const requestPause = useAudioStore((s) => s.requestPause);
  const nextStation = useAudioStore((s) => s.nextStation);
  const prevStation = useAudioStore((s) => s.prevStation);

  const { focusTime } = useFocusTimer();
  const { nowPlaying } = useNowPlaying(currentStation?.id, isPlaying);
  const track = formatTrack(nowPlaying);

  const togglePlay = useCallback(() => {
    if (userWantsPlay) requestPause();
    else requestPlay();
  }, [userWantsPlay, requestPlay, requestPause]);

  // Stop drag/double-tap handling on the shell from firing for control presses.
  const stop = (event: React.MouseEvent | React.PointerEvent) => event.stopPropagation();

  return (
    <div className="group/island relative select-none">
      {/* Station-tinted halo */}
      <div
        className={cn(
          'pointer-events-none absolute -inset-3 rounded-full bg-station/25 transition-opacity sm:-inset-4',
          isPlaying ? 'animate-breathe opacity-100' : 'opacity-30',
        )}
        style={{ filter: 'blur(14px)', transitionDuration: 'var(--dur-slow)' }}
      />

      <div className="panel-glass relative flex items-center gap-2 rounded-full py-1.5 pr-1.5 pl-2 sm:gap-2.5 sm:pr-2 sm:pl-2.5">
        {/* Spinning mini record */}
        <div className="relative h-9 w-9 flex-shrink-0" aria-hidden="true">
          <div
            className={cn(
              'absolute inset-0 overflow-hidden rounded-full',
              isPlaying && 'animate-spin-slow',
            )}
            style={{ background: 'conic-gradient(from 45deg, #2a2a34, #191920, #2a2a34, #191920)' }}
          >
            <div className="absolute inset-[26%] rounded-full bg-station" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-1.5 w-1.5 rounded-full bg-black/40" />
          </div>
        </div>

        {/* Station + live track */}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="max-w-[104px] truncate text-xs font-bold text-fg sm:max-w-[150px] sm:text-sm">
            {currentStation?.name || 'Lofi Radio'}
          </span>
          <div className="flex items-center gap-1 text-[10px] font-medium text-fg-subtle sm:text-xs">
            {hasError ? (
              <span className="text-red-600 dark:text-red-400">播放失败</span>
            ) : track && isPlaying ? (
              <>
                <EqualizerBars isPlaying className="h-2.5" barClassName="w-[2px]" />
                <span className="max-w-[92px] truncate sm:max-w-[136px]">{track}</span>
              </>
            ) : (
              <>
                <Clock className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                <span className="tabular-nums">{mounted ? focusTime : 0} min</span>
              </>
            )}
          </div>
        </div>

        {/* Transport. `tap-target` gives each a 44x44 hit area (S5). */}
        <div className="flex flex-shrink-0 items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={(e) => { stop(e); prevStation(); }}
            onPointerDown={stop}
            aria-label="上一个电台"
            className="tap-target flex h-8 w-8 items-center justify-center rounded-full text-fg-subtle transition-colors hover:bg-surface-3 hover:text-fg"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={(e) => { stop(e); togglePlay(); }}
            onPointerDown={stop}
            aria-label={isPlaying ? '暂停' : '播放'}
            className="tap-target flex h-9 w-9 items-center justify-center rounded-full bg-station text-white transition-transform active:scale-90"
            style={{ boxShadow: '0 2px 10px color-mix(in oklab, var(--station-accent) 45%, transparent)' }}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="ml-0.5 h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => { stop(e); nextStation(); }}
            onPointerDown={stop}
            aria-label="下一个电台"
            className="tap-target flex h-8 w-8 items-center justify-center rounded-full text-fg-subtle transition-colors hover:bg-surface-3 hover:text-fg"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={(e) => { stop(e); onExpand(); }}
            onPointerDown={stop}
            aria-label="展开播放器"
            className="tap-target flex h-8 w-8 items-center justify-center rounded-full bg-surface-3 text-fg-subtle transition-colors hover:text-fg"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
});
