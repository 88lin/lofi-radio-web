'use client';

import { useEffect, useState } from 'react';
import { useAudioStore } from '@/store/audioStore';

export function getFocusRefreshInterval(isPlaying: boolean) {
  return isPlaying ? 1000 : 60000;
}

export function useFocusTimer() {
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const focusStartTime = useAudioStore((state) => state.focusStartTime);
  const accumulatedFocusTime = useAudioStore((state) => state.accumulatedFocusTime);
  const checkAndResetDailyFocus = useAudioStore((state) => state.checkAndResetDailyFocus);
  const [, setRefreshTick] = useState(0);
  
  // 初始化时检查日期并重置专注时间
  useEffect(() => {
    checkAndResetDailyFocus();
  }, [checkAndResetDailyFocus]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const interval = window.setInterval(() => {
      setRefreshTick((tick) => tick + 1);
    }, getFocusRefreshInterval(isPlaying));

    return () => window.clearInterval(interval);
  }, [isPlaying]);

  const focusTimeInSeconds = focusStartTime
    ? accumulatedFocusTime + Math.floor((Date.now() - focusStartTime) / 1000)
    : accumulatedFocusTime;

  const focusTime = Math.floor(focusTimeInSeconds / 60);
  
  return { focusTime };
}
