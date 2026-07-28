'use client';

import { useEffect } from 'react';
import { useAudioStore } from '@/store/audioStore';
import { useNowPlaying } from '@/hooks/useNowPlaying';

/**
 * Publishes the current station to the OS media UI (Android notification, iOS
 * lock screen / Control Center, macOS Now Playing, Windows SMTC) via the Media
 * Session API, and accepts hardware transport commands back.
 *
 * Without this, a phone showing our tab in the background offers no controls at
 * all and headphone buttons do nothing — the single biggest usability gap for a
 * radio app that people leave running.
 *
 * Progressive enhancement only: every branch is feature-detected and the hook is
 * a no-op where `navigator.mediaSession` is missing (notably Firefox before 82
 * and any non-secure context).
 */

/** Sizes Android's notification and Chrome's Now Playing widget both look for. */
const ARTWORK_SIZES = ['96x96', '256x256', '512x512'] as const;

const ARTWORK_FALLBACK = '/icon-512.png';

export function useMediaSession() {
  const currentStation = useAudioStore((s) => s.currentStation);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const { nowPlaying } = useNowPlaying(currentStation?.id ?? null, true);

  // Metadata: station name is the reliable part, the live track is a bonus.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    if (!currentStation) {
      navigator.mediaSession.metadata = null;
      return;
    }

    const art = nowPlaying?.artwork || ARTWORK_FALLBACK;

    // The station is the "album" because it is the thing the user chose; the
    // live track (when a station exposes one) is the title, which is what the
    // OS renders largest.
    navigator.mediaSession.metadata = new MediaMetadata({
      title: nowPlaying?.title || currentStation.name,
      artist: nowPlaying?.artist || currentStation.description || 'Lofi Radio',
      album: currentStation.name,
      artwork: ARTWORK_SIZES.map((sizes) => ({ src: art, sizes })),
    });
  }, [currentStation, nowPlaying]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // Handlers read from the store at call time, so this effect never re-binds.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => useAudioStore.getState().requestPlay()],
      ['pause', () => useAudioStore.getState().requestPause()],
      ['stop', () => useAudioStore.getState().requestPause()],
      ['previoustrack', () => useAudioStore.getState().prevStation()],
      ['nexttrack', () => useAudioStore.getState().nextStation()],
    ];

    const bound: MediaSessionAction[] = [];
    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
        bound.push(action);
      } catch {
        // Older engines throw `NotSupportedError` for unknown actions instead of
        // ignoring them; skipping one action must not break the rest.
      }
    }

    return () => {
      for (const action of bound) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Same tolerance on teardown.
        }
      }
    };
  }, []);
}
