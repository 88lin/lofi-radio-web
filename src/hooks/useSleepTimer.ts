'use client';

import { useEffect, useRef, useState } from 'react';
import { useAudioStore } from '@/store/audioStore';

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
        const { isPlaying, requestPause, setSleepTimer } = useAudioStore.getState();
        if (isPlaying) {
          requestPause();
        }
        setSleepTimer(null);
        return;
      }

      const tick = () => {
        const now = Date.now();

        if (now >= sleepTimerEndTime) {
          const { isPlaying, requestPause, setSleepTimer } = useAudioStore.getState();
          if (isPlaying) {
            requestPause();
          }
          setSleepTimer(null);
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
