'use client';

import { Github, Moon, Music4, Search, Sun } from 'lucide-react';
import { useMounted } from '@/hooks/use-mounted';
import { useThemeToggle } from '@/hooks/use-theme-toggle';
import { useUiStore } from '@/store/uiStore';

function Divider() {
  return <span className="mx-0.5 h-4 w-px bg-hairline-strong sm:h-5" aria-hidden="true" />;
}

/**
 * Floating navigation pill: brand, ⌘K, theme, source link. Nothing else.
 *
 * Changes vs. the previous inline-styled version:
 * - all colours come from tokens (`panel-glass`, `text-fg*`, `bg-station/…`),
 *   so the light theme is no longer a washed-out afterthought (S6/S7);
 * - adds the ⌘K search entry point;
 * - every icon control has an `aria-label` and a >=44px hit area (`tap-target`);
 * - the now-playing chip is **gone**. The pill sat 62px above the dynamic island,
 *   so on mobile the two stacked and read as two competing playback surfaces —
 *   with the pill's "未播放" being the loudest thing on an idle first screen. The
 *   island is now the single source of truth for playback state, and the hero
 *   carries the expanded now-playing chip when something is actually playing.
 */
export function NavBar() {
  const mounted = useMounted();
  const { isDark, toggleTheme } = useThemeToggle();

  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);

  return (
    <nav className="fixed top-4 left-1/2 z-40 -translate-x-1/2" aria-label="主导航">
      <div className="panel-glass flex items-center gap-1 rounded-full px-2 py-1.5">
        <a
          href="https://lofi.88lin.eu.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="tap-target flex items-center gap-2 rounded-full px-2 py-1 transition-opacity hover:opacity-80"
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
