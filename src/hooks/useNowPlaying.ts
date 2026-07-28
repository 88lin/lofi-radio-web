'use client';

import { useEffect, useState } from 'react';
import type { NowPlaying } from '@/lib/now-playing';
import { hasNowPlaying } from '@/lib/station-meta';

/** Most upstream providers update roughly once per track; 20s is well inside that. */
const POLL_INTERVAL_MS = 20_000;

interface UseNowPlayingResult {
  nowPlaying: NowPlaying | null;
  /** False when the station has no metadata endpoint at all (see station-meta). */
  supported: boolean;
}

/**
 * Polls `/api/now-playing` for the active station.
 *
 * Deliberate behaviours:
 * - Stations without a metadata provider are never polled (`supported: false`),
 *   and callers must not render an "unknown track" placeholder for them.
 * - A `204` answer means "provider reachable but silent" -> clear the track
 *   rather than keeping a stale one.
 * - A network/5xx failure keeps the previous value so a single hiccup does not
 *   blank the UI.
 * - Polling stops while the tab is hidden and resumes on `visibilitychange`.
 * - The exposed value is *derived* from the fetched entry, so switching stations
 *   hides the previous track on the very same render instead of flashing it
 *   until the first response lands.
 */
export function useNowPlaying(
  stationId: string | null | undefined,
  enabled = true,
): UseNowPlayingResult {
  const [entry, setEntry] = useState<NowPlaying | null>(null);

  const supported = Boolean(stationId) && hasNowPlaying(stationId as string);
  const active = supported && enabled;

  useEffect(() => {
    if (!stationId || !active) return;

    let cancelled = false;
    let inFlight: AbortController | null = null;

    const tick = async () => {
      if (document.hidden || cancelled) return;

      inFlight?.abort();
      const controller = new AbortController();
      inFlight = controller;

      try {
        const res = await fetch(
          `/api/now-playing?station=${encodeURIComponent(stationId)}`,
          { signal: controller.signal, cache: 'no-store' },
        );
        if (cancelled) return;

        if (res.status === 204) {
          setEntry(null);
          return;
        }
        if (!res.ok) return; // keep the last good value

        const data = (await res.json()) as NowPlaying;
        if (!cancelled) setEntry(data);
      } catch {
        // Aborted or offline: keep the last good value.
      } finally {
        if (inFlight === controller) inFlight = null;
      }
    };

    void tick();
    const interval = window.setInterval(tick, POLL_INTERVAL_MS);
    const onVisibility = () => {
      if (!document.hidden) void tick();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      inFlight?.abort();
    };
  }, [stationId, active]);

  const nowPlaying = active && entry?.stationId === stationId ? entry : null;

  return { nowPlaying, supported };
}
