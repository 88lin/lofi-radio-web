'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

/**
 * 把 <meta name="theme-color"> 同步成站内当前主题色。
 *
 * layout 的 viewport.themeColor 会输出两条带 media 的 meta（light / dark 各一条）。
 * 只改第一条是不够的：系统处于深色、站内切成亮色时，浏览器命中的是 dark 那条，
 * 状态栏会停在深色不动。所以两条都写成当前主题色，让 media 查询失去作用。
 *
 * 挂在 root layout 而不是首页：主题是全站的，只在首页同步的话，
 * 跳到 /stations 之后状态栏会一直停在离开首页时的那个颜色。
 */
export function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;

    const color = resolvedTheme === 'dark' ? '#0a0a0c' : '#fafafa';
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
  }, [resolvedTheme]);

  return null;
}
