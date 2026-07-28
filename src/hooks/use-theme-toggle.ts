'use client';

import { useCallback } from 'react';
import { useTheme } from 'next-themes';

/**
 * Flips between light and dark.
 *
 * `defaultTheme` is now `"system"`, so `theme` can be the literal `'system'`;
 * resolving through `resolvedTheme` first is what makes the very first click do
 * the expected thing for a visitor whose OS is in dark mode.
 */
export function useThemeToggle(): { isDark: boolean; toggleTheme: () => void } {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (theme === 'system' ? resolvedTheme : theme) === 'dark';

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  return { isDark, toggleTheme };
}
