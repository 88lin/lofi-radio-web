'use client';

import { useEffect, useState } from 'react';
import { useAudioStore } from '@/store/audioStore';

export function getFocusRefreshInterval(isPlaying: boolean) {
  return isPlaying ? 1000 : 60000;
}

export function useFocusTimer() {
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const checkAndResetDailyFocus = useAudioStore((state) => state.checkAndResetDailyFocus);
  const [focusTime, setFocusTime] = useState(0);
  
  // 初始化时检查日期并重置专注时间
  useEffect(() => {
    checkAndResetDailyFocus();
  }, [checkAndResetDailyFocus]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setFocusTime(Math.floor(useAudioStore.getState().getFocusTime() / 60));

    const interval = window.setInterval(() => {
      setFocusTime(Math.floor(useAudioStore.getState().getFocusTime() / 60));
    }, getFocusRefreshInterval(isPlaying));

    return () => window.clearInterval(interval);
  }, [isPlaying]);
  
  return { focusTime };
}
