'use client';

import { useEffect, useRef, useState } from 'react';
import { useAudioStore } from '@/store/audioStore';

export function useSleepTimer() {
  const sleepTimerEndTime = useAudioStore((state) => state.sleepTimerEndTime);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (sleepTimerEndTime) {
      const tick = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((sleepTimerEndTime - now) / 1000));
        setRemainingSeconds(remaining);

        if (now >= sleepTimerEndTime) {
          const { isPlaying, requestPause, setSleepTimer } = useAudioStore.getState();
          if (isPlaying) {
            requestPause();
          }
          setSleepTimer(null);
          setRemainingSeconds(null);
        }
      };

      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      setRemainingSeconds(null);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sleepTimerEndTime]);

  return { remainingSeconds };
}
