'use client';

import { useCallback, useEffect, useState } from 'react';
import { Clock3, ExternalLink, Github, Hand, Moon, Music4, Pause, Play, Sparkles } from 'lucide-react';
import { LiveClock } from '@/components/sections/live-clock';
import { Button } from '@/components/ui/button';
import { useMounted } from '@/hooks/use-mounted';
import { useFocusTimer } from '@/hooks/useFocusTimer';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import { useSleepTimer } from '@/hooks/useSleepTimer';
import { shortcuts } from '@/lib/home-content';
import {
  MOBILE_ISLAND_EXPAND_LEARNED_EVENT,
  MOBILE_ISLAND_HINT_DISMISSED_KEY,
} from '@/lib/mobile-island-events';
import { formatTrack } from '@/lib/now-playing';
import { stations } from '@/lib/stations';
import { useAudioStore } from '@/store/audioStore';

const MOBILE_HINT_TIMEOUT_MS = 30000;

/**
 * Stagger knob for `.animate-rise-in`. framer-motion's `staggerChildren` used to
 * do this; a CSS custom property does the same for 0 KB of JS.
 */
function enter(ms: number): React.CSSProperties {
  return { '--enter-delay': `${ms}ms` } as React.CSSProperties;
}

function formatFocus(minutes: number): string {
  if (minutes < 60) return `${minutes} 分钟`;
  return `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分钟`;
}

function StatChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-station/25 bg-station/10 px-3 py-1.5 text-xs font-medium text-station">
      {children}
    </span>
  );
}

/**
 * Mobile-only coach mark for the dynamic island. Shown once per browser: the
 * island dispatches `MOBILE_ISLAND_EXPAND_LEARNED_EVENT` the first time the user
 * double-taps it, which permanently dismisses the hint.
 */
function useMobileIslandHint(): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (window.localStorage.getItem(MOBILE_ISLAND_HINT_DISMISSED_KEY) === '1') return;
    } catch {
      // ignore localStorage access errors (private mode / blocked storage)
    }

    const showRafId = window.requestAnimationFrame(() => setShow(true));
    const hideTimer = window.setTimeout(() => setShow(false), MOBILE_HINT_TIMEOUT_MS);

    const handleIslandExpanded = () => {
      setShow(false);
      try {
        window.localStorage.setItem(MOBILE_ISLAND_HINT_DISMISSED_KEY, '1');
      } catch {
        // ignore localStorage access errors
      }
    };

    window.addEventListener(MOBILE_ISLAND_EXPAND_LEARNED_EVENT, handleIslandExpanded);

    return () => {
      window.cancelAnimationFrame(showRafId);
      window.clearTimeout(hideTimer);
      window.removeEventListener(MOBILE_ISLAND_EXPAND_LEARNED_EVENT, handleIslandExpanded);
    };
  }, []);

  return show;
}

export function HeroSection() {
  const mounted = useMounted();
  const showMobileHint = useMobileIslandHint();

  const isPlaying = useAudioStore((s) => s.isPlaying);
  const isLoading = useAudioStore((s) => s.isLoading);
  const userWantsPlay = useAudioStore((s) => s.userWantsPlay);
  const currentStation = useAudioStore((s) => s.currentStation);
  const requestPlay = useAudioStore((s) => s.requestPlay);
  const requestPause = useAudioStore((s) => s.requestPause);
  const setMiniMode = useAudioStore((s) => s.setMiniMode);

  const { focusTime } = useFocusTimer();
  const { remainingSeconds } = useSleepTimer();
  const { nowPlaying } = useNowPlaying(currentStation?.id, isPlaying);
  const track = formatTrack(nowPlaying);

  const togglePlay = useCallback(() => {
    if (userWantsPlay) requestPause();
    else requestPlay();
  }, [userWantsPlay, requestPlay, requestPause]);

  return (
    // pt-36 (144px) clears the fixed dynamic island, which sits at y=78 and is
    // ~56px tall. The old `pt-22` (88px) put the announcement badge directly
    // underneath it, so the badge was completely hidden until the island was
    // dragged away (defect S2).
    <section className="px-4 pt-36 pb-10 sm:px-6 sm:pt-40 sm:pb-14">
      <div className="mx-auto max-w-4xl text-center">
        <div className="animate-rise-in mb-6" style={enter(0)}>
          <a
            href="https://lofi.88lin.eu.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target inline-flex items-center gap-2 rounded-full border border-station/25 bg-station/10 px-4 py-1.5 text-sm font-medium text-station transition-transform hover:scale-105"
          >
            <Sparkles className="h-3.5 w-3.5" />
            网页版全新上线
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </div>

        <div className="animate-rise-in" style={enter(80)}>
          <LiveClock />
        </div>

        <h1
          className="animate-rise-in mb-5 text-3xl leading-[1.1] font-bold whitespace-nowrap sm:text-5xl md:text-6xl lg:text-7xl"
          style={enter(160)}
        >
          {/* Same violet -> fuchsia -> pink brand ramp, one shade deeper in the
              light theme. The old 500-weight tail measured 3.26:1 on #f6f6fb —
              enough for large text (AA wants 3:1) but nothing else; the
              600-weight tail is 4.25:1, so it also holds up if the heading ever
              gets used at a smaller size. Dark theme keeps the 400 weights
              (7.5:1 on #0a0a0c). */}
          <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent dark:from-violet-400 dark:via-fuchsia-400 dark:to-pink-400">
            专注音乐 触手可及
          </span>
        </h1>

        <p
          className="animate-rise-in mx-auto mb-10 max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg md:text-xl"
          style={enter(240)}
        >
          Lofi 音乐被科学认证为最适合专注工作学习的音乐。
          <br className="hidden sm:block" />
          macOS 灵动岛设计，{stations.length} 个精选电台，打开即用，无需下载。
        </p>

        <div
          className="animate-rise-in mb-6 flex flex-col items-center justify-center gap-3 sm:mb-10 sm:flex-row"
          style={enter(320)}
        >
          <Button
            size="lg"
            onClick={togglePlay}
            className="h-12 w-full rounded-full px-7 text-base font-semibold text-white elev-xl transition-transform hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #D946EF)' }}
          >
            {isPlaying ? (
              <>
                <Pause className="mr-2 h-5 w-5" />
                <span>正在播放</span>
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                <span>{isLoading ? '加载中...' : '开始播放'}</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="group h-12 w-full rounded-full border-hairline-strong px-7 text-base font-medium text-fg hover:bg-surface-3 sm:w-auto"
            asChild
          >
            <a
              href="https://github.com/88lin/lofi-radio-web"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="mr-2 h-5 w-5" />
              查看源码
              <ExternalLink className="ml-2 h-4 w-4 opacity-50 transition-opacity group-hover:opacity-90" />
            </a>
          </Button>
        </div>

        {/* Desktop shortcut strip. Wraps now that there are seven bindings. */}
        <div className="animate-fade-in hidden justify-center sm:flex" style={enter(600)}>
          <div className="inline-flex max-w-3xl flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border border-hairline bg-surface-2/70 px-5 py-2.5">
            {shortcuts.map((item) => (
              <span key={item.key} className="flex items-center gap-1.5">
                <kbd className="rounded-md border border-hairline bg-surface-3 px-2 py-0.5 font-mono text-xs font-semibold text-fg-muted">
                  {item.key}
                </kbd>
                <span className="text-xs text-fg-subtle">{item.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Mobile coach mark. Previously tinted text on a 10%-opacity tint, which
            measured ~2.5-3:1 — below AA at this size. Now a solid `surface`
            panel with `text-fg` / `text-fg-muted`, both >=4.5:1 in both themes. */}
        {showMobileHint && (
          <div className="animate-pop-in mt-1 flex justify-center sm:hidden">
            <div className="panel inline-flex items-center gap-2 rounded-full px-3.5 py-2">
              <Hand className="h-3.5 w-3.5 shrink-0 text-station" aria-hidden="true" />
              <span className="text-xs font-semibold text-fg">双击灵动岛展开播放器</span>
              <span className="text-xs text-fg-faint" aria-hidden="true">
                ·
              </span>
              <span className="text-xs text-fg-muted">可拖动</span>
            </div>
          </div>
        )}

        {mounted && isPlaying && currentStation && (
          <div className="animate-pop-in mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setMiniMode(false)}
              className="panel-glass inline-flex max-w-[92vw] items-center gap-3 rounded-full px-4 py-2.5 text-left transition-transform hover:scale-[1.03] active:scale-[0.97]"
              aria-label="展开播放器"
            >
              <span className="animate-spin-slow flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-station/15">
                <Music4 className="h-3.5 w-3.5 text-station" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-xs font-semibold text-fg">
                  {track ?? '正在播放'}
                </span>
                <span className="truncate text-[10px] text-fg-subtle">{currentStation.name}</span>
              </span>
              <span className="hidden shrink-0 rounded-full bg-station/15 px-2 py-0.5 text-[10px] font-semibold text-station sm:inline">
                {currentStation.style1}
              </span>
              <span
                className="animate-pulse-subtle h-1.5 w-1.5 shrink-0 rounded-full bg-station"
                aria-hidden="true"
              />
            </button>
          </div>
        )}

        {mounted && (focusTime > 0 || remainingSeconds !== null) && (
          <div className="animate-pop-in mt-4 flex flex-wrap justify-center gap-3">
            {focusTime > 0 && (
              <StatChip>
                <Clock3 className="h-3 w-3" />
                今日专注 {formatFocus(focusTime)}
              </StatChip>
            )}
            {remainingSeconds !== null && (
              <StatChip>
                <Moon className="h-3 w-3" />
                <span className="tabular-nums">
                  即将睡眠 {String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:
                  {String(remainingSeconds % 60).padStart(2, '0')}
                </span>
              </StatChip>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
