'use client';

import { useEffect, useRef, useState } from 'react';
import { useAudioStore } from '@/store/audioStore';

// 定时结束时收尾：只要用户还想播（含"正在加载、还没真正出声"的情况）就取消播放意图，
// 否则定时器清掉之后音频加载完成还会自己响起来。
function finishSleepTimer() {
  const { isPlaying, userWantsPlay, requestPause, setSleepTimer } = useAudioStore.getState();
  if (isPlaying || userWantsPlay) {
    requestPause();
  }
  setSleepTimer(null);
}

export function useSleepTimer() {
  const sleepTimerEndTime = useAudioStore((state) => state.sleepTimerEndTime);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [, setRefreshTick] = useState(0);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (sleepTimerEndTime) {
      if (Date.now() >= sleepTimerEndTime) {
        finishSleepTimer();
        return;
      }

      const tick = () => {
        const now = Date.now();

        if (now >= sleepTimerEndTime) {
          finishSleepTimer();
          return;
        }

        setRefreshTick((tickCount) => tickCount + 1);
      };

      intervalRef.current = setInterval(tick, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sleepTimerEndTime]);

  const remainingSeconds = sleepTimerEndTime
    ? Math.max(0, Math.ceil((sleepTimerEndTime - Date.now()) / 1000))
    : null;

  return { remainingSeconds };
}
