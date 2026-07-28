'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Scroll-triggered fade + rise, built on a single IntersectionObserver.
 *
 * Replaces framer-motion's `whileInView` in the static marketing sections.
 * framer-motion can only be used from a Client Component, so every section that
 * used it had to be `'use client'`; with `Reveal` the section itself stays a
 * Server Component and only this thin wrapper hydrates.
 *
 * The reveal is applied by writing a class onto the DOM node instead of going
 * through React state. Two reasons:
 * 1. It is a one-shot, write-only side effect — re-rendering the whole subtree
 *    to flip one class is pure overhead (and `react-hooks/set-state-in-effect`
 *    rightly flags it).
 * 2. `className` here is constant for the lifetime of each call site, so React
 *    never rewrites the attribute and never clobbers the added class.
 *
 * The transition itself uses the motion tokens, so the global
 * `prefers-reduced-motion: reduce` block collapses it to an instant reveal.
 */
export function Reveal({
  children,
  className,
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const show = () => el.classList.add('reveal-in');

    // Without IntersectionObserver there is no way to know when the element
    // scrolls in, so show it immediately rather than leaving it at opacity 0.
    if (typeof IntersectionObserver === 'undefined') {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          show();
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.04 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn('reveal', className)}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
