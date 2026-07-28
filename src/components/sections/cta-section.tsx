'use client';

import { useCallback } from 'react';
import { Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import { useAudioStore } from '@/store/audioStore';

export function CtaSection() {
  const userWantsPlay = useAudioStore((s) => s.userWantsPlay);
  const isLoading = useAudioStore((s) => s.isLoading);
  const requestPlay = useAudioStore((s) => s.requestPlay);
  const requestPause = useAudioStore((s) => s.requestPause);
  const setMiniMode = useAudioStore((s) => s.setMiniMode);

  const handleClick = useCallback(() => {
    if (userWantsPlay) {
      requestPause();
    } else {
      requestPlay();
      setMiniMode(false);
    }
  }, [userWantsPlay, requestPause, requestPlay, setMiniMode]);

  return (
    <section className="px-4 py-6 sm:px-6 sm:py-10">
      <Reveal className="mx-auto max-w-3xl text-center">
        <div className="relative overflow-hidden rounded-3xl border border-station/20 bg-station/8 p-8 sm:p-12">
          <span
            className="absolute top-6 right-8 h-24 w-24 rounded-full opacity-25 blur-2xl"
            style={{ background: 'radial-gradient(circle, var(--station-accent), transparent)' }}
            aria-hidden="true"
          />
          <span
            className="absolute bottom-4 left-6 h-16 w-16 rounded-full opacity-20 blur-xl"
            style={{ background: 'radial-gradient(circle, #EC4899, transparent)' }}
            aria-hidden="true"
          />

          <h2 className="relative mb-3 text-2xl font-bold text-fg sm:text-3xl">
            开始你的专注之旅
          </h2>
          <p className="relative mx-auto mb-8 max-w-xl text-sm leading-relaxed text-fg-muted sm:text-base">
            无需注册，无需下载，打开网页即可享受高品质的专注音乐。让 Lofi Radio
            成为你每天工作学习的最佳伴侣。
          </p>

          <Button
            size="lg"
            onClick={handleClick}
            className="relative h-12 rounded-full px-8 text-base font-semibold text-white elev-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #D946EF)' }}
          >
            {userWantsPlay ? (
              <>
                <Pause className="mr-2 h-5 w-5" />
                {isLoading ? '加载中...' : '正在播放'}
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                立即开始
              </>
            )}
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
