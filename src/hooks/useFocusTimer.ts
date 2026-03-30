'use client';

import { useEffect, useState } from 'react';
import { useAudioStore } from '@/store/audioStore';

export function useFocusTimer() {
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const getFocusTime = useAudioStore((state) => state.getFocusTime);
  const checkAndResetDailyFocus = useAudioStore((state) => state.checkAndResetDailyFocus);
  
  // 使用 state 来触发 UI 更新
  const [focusTime, setFocusTime] = useState(0);
  
  // 初始化时检查日期并重置专注时间
  useEffect(() => {
    checkAndResetDailyFocus();
  }, [checkAndResetDailyFocus]);
  
  // 播放时每秒更新一次显示
  useEffect(() => {
    // 立即更新一次
    setFocusTime(Math.floor(getFocusTime() / 60));
    
    if (isPlaying) {
      const interval = setInterval(() => {
        setFocusTime(Math.floor(getFocusTime() / 60));
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isPlaying, getFocusTime]);
  
  return { focusTime };
}
