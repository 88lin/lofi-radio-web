'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FullScreenPlayer } from '@/components/lofi/player/full-screen-player';
import { MiniIsland } from '@/components/lofi/player/mini-island';
import { useIslandDrag, ISLAND_INITIAL_Y } from '@/hooks/useIslandDrag';
import { useMediaSession } from '@/hooks/useMediaSession';
import { useSleepTimer } from '@/hooks/useSleepTimer';
import { MOBILE_ISLAND_EXPAND_LEARNED_EVENT } from '@/lib/mobile-island-events';
import { cn } from '@/lib/utils';
import { useAudioStore } from '@/store/audioStore';

/**
 * Player shell: owns the mini/expanded switch, the island's drag gesture, the
 * double-tap-to-expand affordance and the full-screen scroll lock.
 *
 * Previously this file was a 1137-line component that also contained the vinyl,
 * the volume slider, the station list, the sleep timer, the expanded player and
 * the island. Those are now separate modules under `player/`; this file is only
 * the shell.
 *
 * framer-motion is gone. It cost 128 KB minified for one drag gesture and a few
 * fades, and its `style={{ x, y }}` plus `animate={{ y: 0 }}` on the same element
 * meant the island visually snapped back to the top every time the expanded
 * player closed. Dragging is now `useIslandDrag` (pointer events, zero renders
 * per move) and the transitions are CSS keyframes.
 */

/** Max gap between two taps for the island's double-tap-to-expand gesture. */
const DOUBLE_TAP_MS = 300;
/** Swallows the duplicate expand that a real `dblclick` fires right after. */
const DOUBLE_EXPAND_GUARD_MS = 420;
/** After expanding, ignore vinyl taps briefly so the gesture does not toggle play. */
const VINYL_TAP_SUPPRESS_MS = 360;
/** Matches `.animate-player-out` (`--dur-fast`) so the DOM leaves after the fade. */
const PLAYER_EXIT_MS = 150;

export function FloatingPlayer() {
  const { remainingSeconds } = useSleepTimer();
  const isMiniMode = useAudioStore((s) => s.isMiniMode);
  const setMiniMode = useAudioStore((s) => s.setMiniMode);

  // Lock-screen / headphone controls. Lives here because the shell is mounted
  // for the whole session regardless of which view is showing.
  useMediaSession();

  const [suppressVinylTapUntil, setSuppressVinylTapUntil] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const lastTapRef = useRef(0);
  const lastExpandRef = useRef(0);
  const closeTimerRef = useRef<number | null>(null);
  const scrollYRef = useRef(0);

  const { ref: islandRef, position, isDragging, width, startDrag } = useIslandDrag(isMiniMode);

  const openFullPlayer = useCallback(() => {
    setSuppressVinylTapUntil(Date.now() + VINYL_TAP_SUPPRESS_MS);
    setMiniMode(false);
  }, [setMiniMode]);

  /**
   * Close with an exit animation. Driven from the event handler rather than an
   * effect, so no `setState` runs during an effect body.
   */
  const closeFullPlayer = useCallback(() => {
    if (closeTimerRef.current !== null) return;
    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setIsClosing(false);
      setMiniMode(true);
    }, PLAYER_EXIT_MS);
  }, [setMiniMode]);

  useEffect(() => () => {
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
  }, []);

  // Lock page scroll while expanded, so mobile scroll gestures do not bleed
  // through to the landing page underneath.
  useEffect(() => {
    if (typeof window === 'undefined' || isMiniMode) return;

    const html = document.documentElement;
    const body = document.body;

    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
      overscroll: body.style.overscrollBehavior,
      htmlOverscroll: html.style.overscrollBehavior,
    };

    scrollYRef.current = window.scrollY || window.pageYOffset || 0;

    body.style.position = 'fixed';
    body.style.top = `-${scrollYRef.current}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    html.style.overscrollBehavior = 'none';

    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      body.style.overscrollBehavior = prev.overscroll;
      html.style.overscrollBehavior = prev.htmlOverscroll;
      window.scrollTo(0, scrollYRef.current);
    };
  }, [isMiniMode]);

  const handleExpandGesture = useCallback(() => {
    if (!isMiniMode) return;

    // `pointerdown` double-tap detection and the native `dblclick` both fire on
    // desktop; the guard keeps the second one from re-opening.
    const now = Date.now();
    if (now - lastExpandRef.current < DOUBLE_EXPAND_GUARD_MS) return;
    lastExpandRef.current = now;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(MOBILE_ISLAND_EXPAND_LEARNED_EVENT));
    }
    openFullPlayer();
  }, [isMiniMode, openFullPlayer]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isMiniMode) return;
      // Controls handle their own presses.
      if ((event.target as HTMLElement).closest('button')) return;

      if (event.pointerType === 'touch') {
        const now = Date.now();
        if (now - lastTapRef.current < DOUBLE_TAP_MS) {
          handleExpandGesture();
          lastTapRef.current = 0;
          return;
        }
        lastTapRef.current = now;
      }

      startDrag(event);
    },
    [isMiniMode, handleExpandGesture, startDrag],
  );

  const showFullPlayer = !isMiniMode;

  return (
    <>
      {showFullPlayer && (
        <div
          className={cn(
            'fixed inset-0 z-50',
            isClosing ? 'animate-player-out' : 'animate-player-in',
          )}
          role="dialog"
          aria-modal="true"
          aria-label="播放器"
        >
          <FullScreenPlayer
            onClose={closeFullPlayer}
            remainingSeconds={remainingSeconds}
            suppressVinylTapUntil={suppressVinylTapUntil}
          />
        </div>
      )}

      {isMiniMode && (
        <div
          ref={islandRef}
          data-testid="dynamic-island"
          className={cn(
            'animate-island-in fixed z-50 touch-none',
            isDragging ? 'cursor-grabbing' : 'cursor-grab',
          )}
          style={{
            left: '50%',
            top: `${ISLAND_INITIAL_Y}px`,
            marginLeft: `-${width / 2}px`,
            transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          }}
          title="双击展开播放器，拖动可移动位置"
          onPointerDown={handlePointerDown}
          onDoubleClick={handleExpandGesture}
        >
          <MiniIsland onExpand={openFullPlayer} />
        </div>
      )}
    </>
  );
}
