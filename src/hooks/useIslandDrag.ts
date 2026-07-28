'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Pointer-events drag for the dynamic island, replacing framer-motion's `drag`.
 *
 * Why hand-rolled:
 * - framer-motion cost 128 KB minified in the initial bundle for this one
 *   interaction plus a few enter/exit fades (both now CSS).
 * - The old setup had a latent bug: the island's position lived in
 *   `style={{ x, y }}` while `animate={{ y: 0 }}` also drove `y`, so remounting
 *   the island (every full-screen toggle) visually snapped it back to the top
 *   while the stored position said otherwise.
 * - Writing `transform` directly during the gesture means zero React renders
 *   per pointermove; state is committed once on release.
 *
 * Behaviour preserved verbatim from the previous implementation:
 * `edgePadding = 13`, `initialY = 78`, fallback size 200x50 below 640px and
 * 220x56 above, constraints recomputed on resize inside `requestAnimationFrame`,
 * and the position re-clamped when the viewport shrinks.
 */

export const ISLAND_EDGE_PADDING = 13;
export const ISLAND_INITIAL_Y = 78;

interface Constraints {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface Point {
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

export function useIslandDrag(enabled: boolean) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [width, setWidth] = useState(220);

  // Mirrors of the reactive values that the pointer handlers need to read
  // synchronously without re-subscribing on every render.
  const constraintsRef = useRef<Constraints>({ left: 0, right: 0, top: 0, bottom: 0 });
  const positionRef = useRef<Point>({ x: 0, y: 0 });
  const originRef = useRef<Point>({ x: 0, y: 0 });
  const pointerIdRef = useRef<number | null>(null);

  const commit = useCallback((next: Point) => {
    positionRef.current = next;
    setPosition(next);
  }, []);

  /** Recompute the draggable box from the live viewport and island size. */
  useEffect(() => {
    if (!enabled) return;

    const measure = () => {
      const el = ref.current;
      const measured = el?.offsetWidth && el?.offsetHeight
        ? { width: el.offsetWidth, height: el.offsetHeight }
        : null;

      if (measured) setWidth(measured.width);

      const size = measured ?? {
        width: window.innerWidth < 640 ? 200 : 220,
        height: window.innerWidth < 640 ? 50 : 56,
      };

      // The island is centred with `left: 50%; margin-left: -width/2`, so the
      // drag offsets are relative to that resting position.
      const restingX = (window.innerWidth - size.width) / 2;
      const next: Constraints = {
        left: ISLAND_EDGE_PADDING - restingX,
        right: window.innerWidth - size.width - ISLAND_EDGE_PADDING - restingX,
        top: ISLAND_EDGE_PADDING - ISLAND_INITIAL_Y,
        bottom: window.innerHeight - size.height - ISLAND_EDGE_PADDING - ISLAND_INITIAL_Y,
      };
      constraintsRef.current = next;

      const current = positionRef.current;
      const clamped = {
        x: clamp(current.x, next.left, next.right),
        y: clamp(current.y, next.top, next.bottom),
      };
      if (clamped.x !== current.x || clamped.y !== current.y) commit(clamped);
    };

    const rafId = window.requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', measure);
    };
  }, [enabled, commit]);

  /**
   * Begin a drag. Safe to call from `onPointerDown` on the island shell; the
   * caller is responsible for ignoring presses that land on a control.
   */
  const startDrag = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el || pointerIdRef.current !== null) return;

    pointerIdRef.current = event.pointerId;
    originRef.current = { x: event.clientX, y: event.clientY };
    const base = positionRef.current;
    let moved = false;

    const apply = (point: Point) => {
      el.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerIdRef.current) return;
      const { left, right, top, bottom } = constraintsRef.current;
      const next = {
        x: clamp(base.x + (e.clientX - originRef.current.x), left, right),
        y: clamp(base.y + (e.clientY - originRef.current.y), top, bottom),
      };
      // Ignore sub-pixel jitter so a tap is never mistaken for a drag.
      if (!moved && Math.hypot(next.x - base.x, next.y - base.y) < 3) return;
      if (!moved) {
        moved = true;
        setIsDragging(true);
      }
      positionRef.current = next;
      apply(next);
    };

    const finish = (e: PointerEvent) => {
      if (e.pointerId !== pointerIdRef.current) return;
      pointerIdRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      setIsDragging(false);
      // Hand the final transform back to React so a re-render keeps it.
      if (moved) commit(positionRef.current);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  }, [commit]);

  return { ref, position, isDragging, width, startDrag };
}
