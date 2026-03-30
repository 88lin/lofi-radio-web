'use client';

import { useEffect, useMemo } from 'react';
import { useAudioStore } from '@/store/audioStore';

export function useFocusTimer() {
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const getFocusTime = useAudioStore((state) => state.getFocusTime);
  const checkAndResetDailyFocus = useAudioStore((state) => state.checkAndResetDailyFocus);
  
  // 初始化时检查日期并重置专注时间
  useEffect(() => {
    checkAndResetDailyFocus();
  }, [checkAndResetDailyFocus]);
  
  // 使用时间戳计算精确的专注时间（分钟）
  const focusTime = useMemo(() => {
    const seconds = getFocusTime();
    return Math.floor(seconds / 60);
  }, [getFocusTime]);
  
  // 注意：实际的计时逻辑在 audioStore 的 setPlaying 中处理
  // 这里只是读取当前专注时间
  
  return { focusTime };
}
