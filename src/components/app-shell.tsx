'use client';

import { useEffect, type ReactNode } from 'react';
import { CommandPalette } from '@/components/command-palette';
import { FloatingPlayer } from '@/components/lofi/floating-player';
import { ShortcutsOverlay } from '@/components/shortcuts-overlay';
import { useMounted } from '@/hooks/use-mounted';
import { useThemeToggle } from '@/hooks/use-theme-toggle';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAudioStore } from '@/store/audioStore';

const DEFAULT_ACCENT = '#8B5CF6';
const THEME_COLOR_LIGHT = '#f6f6fb';
const THEME_COLOR_DARK = '#0a0a0c';

/**
 * Single client boundary for the landing page.
 *
 * `page.tsx` is now a Server Component; everything that needs browser APIs lives
 * here, and the static marketing sections are passed in as already-rendered
 * children. That keeps `FeaturesSection` / `SiteFooter` / `SectionHeading` out of
 * the client bundle entirely.
 *
 * Responsibilities:
 * 1. own the audio element lifecycle (`useAudioPlayer`) and the global key map;
 * 2. publish the active station colour as `--station-accent` on `<html>`, which
 *    is what lets every component use `text-station` / `bg-station/12` instead of
 *    threading a colour string through props and inline styles;
 * 3. keep the iOS PWA status-bar colour in sync with the resolved theme;
 * 4. settle in-flight focus time before the page goes away (fixes focus minutes
 *    being lost when the tab is closed mid-session).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const mounted = useMounted();
  const { isDark } = useThemeToggle();

  const stationColor = useAudioStore((s) => s.currentStation?.color);
  const settleFocusTime = useAudioStore((s) => s.settleFocusTime);

  useAudioPlayer();
  useKeyboardShortcuts();

  // 2. Station accent -> CSS custom property on the document root, so even
  //    document-level styling (scrollbar, ::selection) re-tints with the station.
  useEffect(() => {
    document.documentElement.style.setProperty('--station-accent', stationColor ?? DEFAULT_ACCENT);
  }, [stationColor]);

  // 3. Overwrite every theme-color meta (Next emits a media-scoped pair from
  //    `viewport.themeColor`; an explicit user override has to win over both).
  useEffect(() => {
    if (!mounted) return;
    const color = isDark ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;
    const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
    if (metas.length === 0) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = color;
      document.head.appendChild(meta);
      return;
    }
    metas.forEach((meta) => {
      meta.content = color;
    });
  }, [isDark, mounted]);

  // 4. `pagehide` fires reliably on mobile Safari where `beforeunload` does not;
  //    `visibilitychange` covers app switching without a navigation.
  useEffect(() => {
    const settle = () => settleFocusTime();
    const onVisibility = () => {
      if (document.hidden) settleFocusTime();
    };
    window.addEventListener('pagehide', settle);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', settle);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [settleFocusTime]);

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {children}
      <FloatingPlayer />
      <CommandPalette />
      <ShortcutsOverlay />
    </main>
  );
}
