/**
 * Perceptual volume mapping.
 *
 * Human loudness perception is roughly logarithmic, but an `<audio>` element's
 * `volume` (and a `GainNode`'s `gain`) are linear amplitude. Wiring a slider
 * straight to a linear gain wastes most of the travel: the top third of the
 * slider sounds almost identical while the bottom third jumps from "silent" to
 * "quite loud" in a few pixels.
 *
 * A power curve fixes that with one multiplication. `pos ** 2.5` is the usual
 * approximation of an equal-loudness taper (an "audio-taper" potentiometer):
 *
 *   pos 0.10 -> gain 0.003    pos 0.50 -> gain 0.177
 *   pos 0.25 -> gain 0.031    pos 0.75 -> gain 0.487
 *   pos 0.40 -> gain 0.101    pos 1.00 -> gain 1.000
 *
 * The store keeps the *slider position* (0-1), not the gain, so existing
 * persisted values keep working and the UI can keep showing 0-100%.
 */

export const VOLUME_CURVE_EXPONENT = 2.5;

export const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
};

/** Slider position (0-1) -> linear amplitude for `audio.volume` / `GainNode`. */
export const positionToGain = (position: number): number =>
  clamp01(position) ** VOLUME_CURVE_EXPONENT;

/** Inverse of {@link positionToGain}; used when adopting an external gain. */
export const gainToPosition = (gain: number): number =>
  clamp01(gain) ** (1 / VOLUME_CURVE_EXPONENT);

/** What the user sees. Deliberately the slider position, not the gain. */
export const formatVolumePercent = (position: number): number =>
  Math.round(clamp01(position) * 100);
