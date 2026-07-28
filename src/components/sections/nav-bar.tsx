'use client';

import { Github, Moon, Music4, Search, Sun } from 'lucide-react';
import { useMounted } from '@/hooks/use-mounted';
import { useThemeToggle } from '@/hooks/use-theme-toggle';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import { formatTrack } from '@/lib/now-playing';
import { useAudioStore } from '@/store/audioStore';
import { useUiStore } from '@/store/uiStore';

function Divider() {
  return <span className="mx-0.5 h-4 w-px bg-hairline-strong sm:h-5" aria-hidden="true" />;
}

/**
 * Floating navigation pill.
 *
 * Changes vs. the previous inline-styled version:
 * - all colours come from tokens (`panel-glass`, `text-fg*`, `bg-station/…`),
 *   so the light theme is no longer a washed-out afterthought (S6/S7);
 * - the "now playing" slot shows the real track title when the station exposes
 *   metadata, and falls back to the station name — never a fake placeholder;
 * - adds the ⌘K search entry point;
 * - every icon control has an `aria-label` and a >=44px hit area (`tap-target`).
 */
export function NavBar() {
  const mounted = useMounted();
  const { isDark, toggleTheme } = useThemeToggle();

  const isPlaying = useAudioStore((s) => s.isPlaying);
  const currentStation = useAudioStore((s) => s.currentStation);
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);

  const { nowPlaying } = useNowPlaying(currentStation?.id, isPlaying);
  const track = formatTrack(nowPlaying);

  const label = !mounted || !isPlaying || !currentStation ? null : (track ?? currentStation.name);

  return (
    <nav className="fixed top-4 left-1/2 z-40 -translate-x-1/2" aria-label="主导航">
      <div className="panel-glass flex items-center gap-1 rounded-full px-2 py-1.5">
        <a
          href="https://lofi.88lin.eu.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full px-2 py-1 transition-opacity hover:opacity-80"
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6, #D946EF, #EC4899)',
              boxShadow: '0 2px 8px rgba(139,92,246,0.45)',
            }}
          >
            <Music4 className="h-3 w-3 text-white sm:h-3.5 sm:w-3.5" />
          </span>
          <span className="hidden text-sm font-bold tracking-tight text-fg sm:block">
            Lofi Radio
          </span>
        </a>

        <Divider />

        <div className="flex min-w-0 items-center px-1" aria-live="polite">
          {label ? (
            <span className="flex items-center gap-1.5 rounded-full bg-station/10 px-2 py-1">
              <span className="flex h-3 shrink-0 items-end gap-0.5" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="animate-equalizer w-[2px] origin-bottom rounded-full bg-station will-change-transform"
                    style={{ height: '12px', transform: 'scaleY(0.4)', animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </span>
              <span className="max-w-[120px] truncate text-xs font-medium text-fg-muted sm:max-w-[180px]">
                {label}
              </span>
            </span>
          ) : (
            <span className="px-2 py-1 text-xs whitespace-nowrap text-fg-subtle">未播放</span>
          )}
        </div>

        <Divider />

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="tap-target flex h-7 items-center gap-1.5 rounded-full px-2 text-fg-subtle transition-colors hover:bg-surface-3 hover:text-fg"
          aria-label="搜索电台（⌘K）"
        >
          <Search className="h-3.5 w-3.5" />
          <kbd className="hidden rounded border border-hairline bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle md:block">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="tap-target flex h-7 w-7 items-center justify-center rounded-full text-fg-subtle transition-colors hover:bg-surface-3 hover:text-fg"
          aria-label={isDark ? '切换到亮色主题' : '切换到暗色主题'}
        >
          {mounted && isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>

        <a
          href="https://github.com/88lin/lofi-radio-web"
          target="_blank"
          rel="noopener noreferrer"
          className="tap-target hidden h-7 w-7 items-center justify-center rounded-full text-fg-subtle transition-colors hover:bg-surface-3 hover:text-fg sm:flex"
          aria-label="在 GitHub 查看源码"
        >
          <Github className="h-3.5 w-3.5" />
        </a>
      </div>
    </nav>
  );
}
