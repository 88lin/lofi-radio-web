'use client';

import { useCallback, useEffect } from 'react';
import { useTheme } from 'next-themes';

import { useAudioStore } from '@/store/audioStore';

/**
 * 全站键盘快捷键。
 *
 * 挂在 root layout 而不是首页：播放器已经提到 layout、音乐跨页继续放，
 * 快捷键只在首页生效就成了「在 /stations 上按空格没反应」。
 */

/**
 * 焦点落在这些元素上时一律让路。
 *
 * summary 尤其要排除：FAQ 全部用 details/summary 渲染，抢走空格键
 * 等于键盘用户展不开答案。button / a 同理——空格与回车是它们自己的激活键。
 */
const INTERACTIVE_SELECTOR =
  'input, textarea, select, summary, button, a[href], [contenteditable="true"], [role="button"], [role="textbox"]';

export function KeyboardShortcuts() {
  const { setTheme, resolvedTheme } = useTheme();

  // 用 resolvedTheme 而不是 theme：theme 可能是 'system'（用户未手动选过），
  // 此时系统已是深色、再设成 'dark' 视觉上没有任何变化，第一次按 T 等于失效
  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest(INTERACTIVE_SELECTOR)) return;
      // 不要抢浏览器/系统快捷键，例如 Cmd+← 返回上一页、Ctrl+T 新标签页、Shift+Space 向上滚动
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      // 播放状态每次现取，不订阅：订阅会让这个监听器随播放状态反复解绑重绑
      const audio = useAudioStore.getState();

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          // 出错时按空格 = 重试当前电台，和播放器里的处理一致
          if (audio.hasError) audio.retryStation();
          else if (audio.userWantsPlay) audio.requestPause();
          else audio.requestPlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          audio.prevStation();
          break;
        case 'ArrowRight':
          e.preventDefault();
          audio.nextStation();
          break;
        case 'KeyM':
          e.preventDefault();
          audio.toggleMute();
          break;
        case 'KeyT':
          e.preventDefault();
          toggleTheme();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme]);

  return null;
}
