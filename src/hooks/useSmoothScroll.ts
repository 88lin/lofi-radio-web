'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export function useSmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // 只在桌面端启用平滑滚动
    const isDesktop = window.innerWidth >= 1024;
    if (!isDesktop) return;

    const lenis = new Lenis({
      duration: 1.2,           // 滚动持续时间，越大越慢
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // 缓动函数
      orientation: 'vertical', // 垂直滚动
      gestureOrientation: 'vertical',
      smoothWheel: true,       // 鼠标滚轮平滑
      wheelMultiplier: 1,      // 滚轮倍率
      touchMultiplier: 2,      // 触摸倍率
      infinite: false,         // 不无限滚动
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return lenisRef;
}
