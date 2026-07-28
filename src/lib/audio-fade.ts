/**
 * Click-free volume ramps for a media element.
 *
 * Radio streams start and stop abruptly: `audio.play()` on a live MP3 stream
 * drops you into the middle of a waveform, and `audio.pause()` truncates it, so
 * both produce an audible click on most hardware. Ramping `HTMLMediaElement.volume`
 * over ~300 ms removes it.
 *
 * Deliberately *not* Web Audio. A `GainNode` would need
 * `AudioContext.createMediaElementSource(el)`, which is irreversible per element
 * and permanently silences the element when the stream turns out to be tainted
 * (cross-origin response without `Access-Control-Allow-Origin`). Several of the
 * bundled stations answer inconsistently across CDN edges, so that trade is not
 * worth an audio graph we only wanted for cosmetics.
 *
 * `volume` is the *gain* already mapped through `positionToGain`; this module
 * never touches the perceptual curve.
 */

/** Ramp duration. Matches `--dur-base` so audio and UI settle together. */
export const AUDIO_FADE_MS = 300;

interface FadeState {
  rafId: number;
  /** Bumped by every new fade so stale frames and `.then()` tails bail out. */
  generation: number;
}

const fades = new WeakMap<HTMLMediaElement, FadeState>();

const clampVolume = (value: number) => Math.min(1, Math.max(0, value));

/** Stop any ramp in flight, leaving `volume` wherever it happens to be. */
export function cancelFade(element: HTMLMediaElement): void {
  const state = fades.get(element);
  if (!state) return;
  cancelAnimationFrame(state.rafId);
  fades.set(element, { rafId: 0, generation: state.generation + 1 });
}

/**
 * Ramp to `target` and resolve when the ramp finishes.
 *
 * Resolves `false` when a newer fade (or `cancelFade`) superseded this one, so
 * callers can skip follow-up work such as pausing.
 */
export function fadeTo(
  element: HTMLMediaElement,
  target: number,
  durationMs: number = AUDIO_FADE_MS,
): Promise<boolean> {
  const to = clampVolume(target);
  const from = clampVolume(element.volume);

  const previous = fades.get(element);
  if (previous?.rafId) cancelAnimationFrame(previous.rafId);
  const generation = (previous?.generation ?? 0) + 1;

  // Nothing to interpolate, and `requestAnimationFrame` is unavailable during
  // SSR/tests — set it directly and report success.
  if (durationMs <= 0 || Math.abs(to - from) < 0.001 || typeof requestAnimationFrame !== 'function') {
    fades.set(element, { rafId: 0, generation });
    element.volume = to;
    return Promise.resolve(true);
  }

  return new Promise<boolean>((resolve) => {
    const start = performance.now();

    const step = (now: number) => {
      // A newer fade started: abandon this frame loop silently.
      if (fades.get(element)?.generation !== generation) {
        resolve(false);
        return;
      }

      const progress = Math.min(1, (now - start) / durationMs);
      // Ease-out keeps the tail of a fade-out quiet for longer, which is where
      // the click would otherwise be.
      const eased = 1 - (1 - progress) ** 3;
      element.volume = clampVolume(from + (to - from) * eased);

      if (progress >= 1) {
        fades.set(element, { rafId: 0, generation });
        resolve(true);
        return;
      }

      fades.set(element, { rafId: requestAnimationFrame(step), generation });
    };

    fades.set(element, { rafId: requestAnimationFrame(step), generation });
  });
}

/**
 * Note on pausing: callers must not treat the resolved value as "safe to pause".
 * A ramp can be superseded by an unrelated volume change while the user still
 * wants playback stopped, so the pause decision has to be re-read from the store
 * after the ramp settles. See `useAudioPlayer`'s `fadeOutThenPause`.
 */
