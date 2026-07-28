'use client';

import {
  ChevronDown,
  ChevronUp,
  Headphones,
  List,
  Loader2,
  Minimize2,
  Moon,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { EqualizerBars } from '@/components/lofi/player/equalizer-bars';
import { SleepTimerPanel } from '@/components/lofi/player/sleep-timer-panel';
import { StationList } from '@/components/lofi/player/station-list';
import { VinylRecord } from '@/components/lofi/player/vinyl-record';
import { VolumeSlider } from '@/components/lofi/player/volume-slider';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMounted } from '@/hooks/use-mounted';
import { useFocusTimer } from '@/hooks/useFocusTimer';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import { formatTrack } from '@/lib/now-playing';
import type { Station } from '@/lib/stations';
import { cn } from '@/lib/utils';
import { useAudioStore } from '@/store/audioStore';

/**
 * Expanded player.
 *
 * Two defects drove this rewrite:
 *
 * S1 — the whole surface was painted with a hardcoded near-black RGBA literal
 * plus `text-white/xx`, so in the light theme the expanded player was a dark
 * purple slab pasted onto a pale page. Every colour now comes from the semantic
 * tokens, so it inverts with the theme. (The old literal is deliberately not
 * quoted here: a repo-wide grep for it is the regression guard.)
 *
 * S4 — on a 1440px screen the left half held a single 235px vinyl in a narrow
 * centred column, leaving a large void. The main column is now a horizontal
 * layout above `lg`: artwork on the left, metadata and transport on the right,
 * both vertically centred. It also has real content to show — cover art and the
 * live track title from `/api/now-playing`, which exists for 11 of the 21
 * bundled stations.
 */

const formatRemaining = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
};

export const FullScreenPlayer = memo(function FullScreenPlayer({
  onClose,
  remainingSeconds,
  suppressVinylTapUntil,
}: {
  onClose: () => void;
  remainingSeconds: number | null;
  suppressVinylTapUntil: number;
}) {
  const mounted = useMounted();
  const isMobile = useIsMobile();

  const isPlaying = useAudioStore((s) => s.isPlaying);
  const isLoading = useAudioStore((s) => s.isLoading);
  const currentStation = useAudioStore((s) => s.currentStation);
  const volume = useAudioStore((s) => s.volume);
  const isMuted = useAudioStore((s) => s.isMuted);
  const userWantsPlay = useAudioStore((s) => s.userWantsPlay);
  const hasError = useAudioStore((s) => s.hasError);
  const errorMessage = useAudioStore((s) => s.errorMessage);
  const requestPlay = useAudioStore((s) => s.requestPlay);
  const requestPause = useAudioStore((s) => s.requestPause);
  const toggleMute = useAudioStore((s) => s.toggleMute);
  const setVolume = useAudioStore((s) => s.setVolume);
  const nextStation = useAudioStore((s) => s.nextStation);
  const prevStation = useAudioStore((s) => s.prevStation);
  const selectStationById = useAudioStore((s) => s.selectStationById);
  const sleepTimerMinutes = useAudioStore((s) => s.sleepTimerMinutes);
  const sleepTimerEndTime = useAudioStore((s) => s.sleepTimerEndTime);
  const setSleepTimer = useAudioStore((s) => s.setSleepTimer);

  const { focusTime } = useFocusTimer();
  const { nowPlaying, supported: trackSupported } = useNowPlaying(currentStation?.id, true);
  const track = formatTrack(nowPlaying);

  const [showStationSheet, setShowStationSheet] = useState(false);
  const [showSleepPanel, setShowSleepPanel] = useState(false);

  const togglePlay = useCallback(() => {
    if (userWantsPlay) requestPause();
    else requestPlay();
  }, [userWantsPlay, requestPlay, requestPause]);

  const handleVinylClick = useCallback(() => {
    // The double-tap that opened this view must not immediately toggle playback.
    if (Date.now() < suppressVinylTapUntil) return;
    togglePlay();
  }, [suppressVinylTapUntil, togglePlay]);

  const applySleepTimer = useCallback(
    (minutes: number | null) => {
      setSleepTimer(minutes);
      setShowSleepPanel(false);
    },
    [setSleepTimer],
  );

  const handleStationSelect = useCallback(
    (station: Station) => {
      selectStationById(station.id);
      setShowStationSheet(false);
    },
    [selectStationById],
  );

  // Escape unwinds one layer at a time instead of jumping straight out.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      if (showStationSheet) setShowStationSheet(false);
      else if (showSleepPanel) setShowSleepPanel(false);
      else onClose();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [showStationSheet, showSleepPanel, onClose]);

  const vinylSize = isMobile ? 168 : 236;

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-surface">
      {/* Station-tinted wash. Sits on `bg-surface`, so it reads correctly in
          both themes rather than forcing a dark backdrop. */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(120% 80% at 12% 0%, color-mix(in oklab, var(--station-accent) 22%, transparent) 0%, transparent 60%),' +
            'radial-gradient(100% 70% at 88% 100%, color-mix(in oklab, var(--station-accent) 16%, transparent) 0%, transparent 62%),' +
            'linear-gradient(160deg, color-mix(in oklab, var(--station-accent) 7%, transparent), transparent 55%)',
        }}
      />

      <div className="relative z-10 flex h-full flex-1 overflow-hidden">
        {/* ---------------- Main column ---------------- */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col items-center justify-center gap-8 px-5 pt-16 pb-10 sm:px-8 lg:max-w-4xl lg:flex-row lg:items-center lg:gap-14 lg:pt-8">
            {/* Artwork */}
            <div className="flex flex-col items-center gap-5 lg:shrink-0">
              <button
                type="button"
                onClick={handleVinylClick}
                aria-label={isPlaying ? '暂停' : '播放'}
                className="rounded-full transition-transform duration-[var(--dur-base)] hover:scale-[1.02] active:scale-[0.99]"
                style={{ transform: isPlaying ? undefined : 'scale(0.96)' }}
              >
                <VinylRecord
                  isPlaying={isPlaying}
                  size={vinylSize}
                  artwork={nowPlaying?.artwork}
                />
              </button>

              {/* Decorative level meter — not a spectrum analyser (see
                  equalizer-bars.tsx for why we do not tap the audio graph). */}
              <EqualizerBars isPlaying={isPlaying} className="h-6" barClassName="w-1" />
            </div>

            {/* Metadata + transport */}
            <div className="flex w-full max-w-sm flex-col items-center gap-6 lg:items-start">
              <div className="w-full text-center lg:text-left">
                <p className="mb-1 text-xs font-medium tracking-[0.18em] text-fg-faint uppercase">
                  {currentStation?.scene ? `${currentStation.scene} · 正在收听` : '正在收听'}
                </p>
                <h2 className="truncate text-2xl font-bold text-fg sm:text-3xl">
                  {currentStation?.name || 'Lofi Radio'}
                </h2>

                {/* Live track, only when the provider actually returned one. */}
                <div className="mt-2 min-h-6">
                  {track ? (
                    <div className="flex items-center justify-center gap-2 lg:justify-start">
                      <EqualizerBars isPlaying={isPlaying} className="h-3" barClassName="w-[2px]" />
                      <p className="truncate text-sm font-medium text-fg-muted">{track}</p>
                    </div>
                  ) : trackSupported ? (
                    <p className="text-sm text-fg-faint">曲目信息获取中…</p>
                  ) : (
                    <p className="text-sm text-fg-faint">该电台不提供曲目信息</p>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                  {currentStation?.style1 && (
                    <span className="rounded-full bg-station/12 px-3 py-1 text-xs font-medium text-station">
                      {currentStation.style1}
                    </span>
                  )}
                  {currentStation?.style2 && (
                    <span className="rounded-full bg-surface-3 px-3 py-1 text-xs text-fg-muted">
                      {currentStation.style2}
                    </span>
                  )}
                  {typeof nowPlaying?.listeners === 'number' && (
                    <span className="flex items-center gap-1 rounded-full bg-surface-3 px-3 py-1 text-xs text-fg-muted">
                      <Users className="h-3 w-3" aria-hidden="true" />
                      <span className="tabular-nums">{nowPlaying.listeners}</span> 在听
                    </span>
                  )}
                </div>
              </div>

              {hasError && errorMessage && (
                <div
                  role="alert"
                  className="w-full rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-center lg:text-left"
                >
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">{errorMessage}</p>
                  <p className="mt-0.5 text-xs text-red-600/70 dark:text-red-400/70">
                    试试切换到其他电台
                  </p>
                </div>
              )}

              {/* Transport */}
              <div className="flex items-center gap-6 sm:gap-8">
                <button
                  type="button"
                  onClick={prevStation}
                  aria-label="上一个电台"
                  className="tap-target flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-fg-muted transition-all hover:scale-105 hover:bg-surface-3 hover:text-fg"
                >
                  <SkipBack className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? '暂停' : '播放'}
                  className="tap-target flex h-16 w-16 items-center justify-center rounded-full bg-station text-white transition-transform hover:scale-105 active:scale-95 sm:h-18 sm:w-18"
                  style={{
                    boxShadow:
                      '0 10px 32px color-mix(in oklab, var(--station-accent) 40%, transparent)',
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="h-7 w-7 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-7 w-7" />
                  ) : (
                    <Play className="ml-0.5 h-7 w-7" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={nextStation}
                  aria-label="下一个电台"
                  className="tap-target flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-fg-muted transition-all hover:scale-105 hover:bg-surface-3 hover:text-fg"
                >
                  <SkipForward className="h-5 w-5" />
                </button>
              </div>

              {/* Volume */}
              <div className="w-full rounded-2xl border border-hairline bg-surface-2/70 px-4 py-3">
                <VolumeSlider
                  volume={volume}
                  isMuted={isMuted}
                  onVolumeChange={setVolume}
                  onMuteToggle={toggleMute}
                />
              </div>

              {/* Session stats + sleep timer */}
              <div className="grid w-full grid-cols-2 gap-2">
                <div className="flex h-11 items-center justify-center gap-1.5 rounded-full border border-hairline bg-surface-2/70 px-2">
                  <Sparkles className="h-4 w-4 flex-shrink-0 text-station" aria-hidden="true" />
                  <span className="text-[11px] text-fg-subtle">今日专注</span>
                  <span className="text-xs font-bold text-station tabular-nums">
                    {mounted ? focusTime : 0}分钟
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSleepPanel((prev) => !prev)}
                  aria-expanded={showSleepPanel}
                  className={cn(
                    'flex h-11 items-center justify-center gap-1.5 rounded-full border px-2 transition-colors active:scale-[0.98]',
                    sleepTimerEndTime
                      ? 'border-station/35 bg-station/10'
                      : 'border-hairline bg-surface-2/70 hover:bg-surface-3',
                  )}
                >
                  <Moon
                    className={cn(
                      'h-4 w-4 flex-shrink-0',
                      sleepTimerEndTime ? 'text-station' : 'text-fg-subtle',
                    )}
                    aria-hidden="true"
                  />
                  <span className="text-[11px] text-fg-subtle">睡眠定时</span>
                  <span
                    className={cn(
                      'text-xs font-bold tabular-nums',
                      sleepTimerEndTime ? 'text-station' : 'text-fg-subtle',
                    )}
                  >
                    {sleepTimerEndTime && remainingSeconds !== null
                      ? formatRemaining(remainingSeconds)
                      : '关闭'}
                  </span>
                  {showSleepPanel ? (
                    <ChevronUp className="h-3.5 w-3.5 text-fg-faint" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-fg-faint" aria-hidden="true" />
                  )}
                </button>
              </div>

              <div className="w-full">
                <SleepTimerPanel
                  open={showSleepPanel}
                  activeMinutes={sleepTimerMinutes}
                  onApply={applySleepTimer}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowStationSheet(true)}
                className="tap-target flex items-center gap-2 rounded-full border border-hairline bg-surface-2/70 px-4 py-2 text-sm text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg lg:hidden"
              >
                <List className="h-4 w-4" aria-hidden="true" />
                电台列表
              </button>
            </div>
          </div>
        </div>

        {/* ---------------- Desktop station panel ---------------- */}
        <aside
          className="hidden w-80 flex-col border-l border-hairline bg-surface-2/60 backdrop-blur-xl lg:flex"
          aria-label="电台列表"
        >
          <StationList onSelect={handleStationSelect} variant="desktop" />
        </aside>
      </div>

      {/* Collapse */}
      <button
        type="button"
        onClick={onClose}
        aria-label="收起播放器"
        className="tap-target absolute top-4 left-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-surface-2/80 text-fg-muted backdrop-blur-md transition-colors hover:bg-surface-3 hover:text-fg"
      >
        <Minimize2 className="h-4 w-4" />
      </button>

      {/* Status badge */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-full bg-surface-2/70 px-3 py-1.5 backdrop-blur-md">
        <Headphones className="h-3.5 w-3.5 text-fg-subtle" aria-hidden="true" />
        <span
          className={cn('h-2 w-2 rounded-full bg-station', isPlaying && 'animate-pulse')}
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-fg-muted">Lofi Radio</span>
      </div>

      {/* ---------------- Mobile station sheet ---------------- */}
      {/* Kept mounted so open/close is a pure CSS transform transition; `inert`
          keeps it out of the tab order while hidden. */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          showStationSheet ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        inert={!showStationSheet}
        aria-hidden={!showStationSheet}
      >
        <div
          className={cn(
            'absolute inset-0 bg-black/45 transition-opacity',
            showStationSheet ? 'opacity-100' : 'opacity-0',
          )}
          style={{ transitionDuration: 'var(--dur-base)' }}
          onClick={() => setShowStationSheet(false)}
        />
        <div
          className={cn(
            'panel-glass absolute inset-x-0 bottom-0 flex h-[80vh] flex-col overflow-hidden rounded-t-3xl transition-transform',
            showStationSheet ? 'translate-y-0' : 'translate-y-full',
          )}
          style={{
            transitionDuration: 'var(--dur-base)',
            transitionTimingFunction: 'var(--ease-out-soft)',
          }}
          role="dialog"
          aria-modal={showStationSheet}
          aria-label="电台列表"
        >
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-hairline-strong" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setShowStationSheet(false)}
              aria-label="关闭电台列表"
              className="tap-target flex h-8 w-8 items-center justify-center rounded-full text-fg-subtle transition-colors hover:bg-surface-3 hover:text-fg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <StationList
            onClose={() => setShowStationSheet(false)}
            onSelect={handleStationSelect}
            variant="sheet"
          />
        </div>
      </div>
    </div>
  );
});
