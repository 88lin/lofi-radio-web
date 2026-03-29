'use client';

import { useEffect, useRef } from 'react';
import { useAudioStore } from '@/store/audioStore';

export function useFocusTimer() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const incrementFocusTime = useAudioStore((state) => state.incrementFocusTime);
  const focusTime = useAudioStore((state) => state.focusTime);
  const checkAndResetDailyFocus = useAudioStore((state) => state.checkAndResetDailyFocus);
  
  // 初始化时检查日期并重置专注时间
  useEffect(() => {
    checkAndResetDailyFocus();
  }, [checkAndResetDailyFocus]);
  
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        incrementFocusTime();
      }, 60000); // 1分钟
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, incrementFocusTime]);
  
  return { focusTime };
}
