/**
 * Per-station capability metadata.
 *
 * Kept separate from `stations.ts` on purpose: `stations.ts` is the editorial
 * catalogue (name / scene / colour) that a contributor edits by hand, while
 * everything here was measured against the live endpoints and should only
 * change when a probe says so.
 *
 * `nowPlaying` describes where a real "current track" can be read from.
 * `cors` records whether the audio endpoint returns permissive CORS headers,
 * which decides whether the Web Audio spectrum analyser can read raw samples
 * (a stream without CORS taints the graph and yields silence-shaped data).
 *
 * Measured 2025 with `Origin: https://lofi.88lin.eu.org` + a Range request.
 */

export type NowPlayingProvider =
  /** AzuraCast: GET {base}/api/nowplaying/{shortcode} */
  | { kind: 'azuracast'; base: string; shortcode: string }
  /** SomaFM: GET https://somafm.com/songs/{channel}.json */
  | { kind: 'somafm'; channel: string }
  /** Radio Paradise: GET https://api.radioparadise.com/api/now_playing?chan={chan} */
  | { kind: 'radioparadise'; chan: number }
  /** No public metadata endpoint - the UI falls back to name + style tags. */
  | { kind: 'none' };

export interface StationMeta {
  /**
   * `true`  - Access-Control-Allow-Origin present, analyser can run.
   * `false` - no CORS, analyser must fall back to a synthetic waveform.
   * `'unknown'` - not directly probeable (e.g. proxied Bilibili HLS/FLV);
   *               the runtime probes once and caches the answer.
   */
  cors: boolean | 'unknown';
  nowPlaying: NowPlayingProvider;
}

const LOFICAFE = 'https://radio.loficafe.net';

const NO_METADATA: StationMeta = { cors: true, nowPlaying: { kind: 'none' } };

function azuracast(base: string, shortcode: string): StationMeta {
  return { cors: true, nowPlaying: { kind: 'azuracast', base, shortcode } };
}

function somafm(channel: string): StationMeta {
  return { cors: true, nowPlaying: { kind: 'somafm', channel } };
}

export const stationMeta: Record<string, StationMeta> = {
  'lofi-girl': { cors: 'unknown', nowPlaying: { kind: 'none' } },

  'lofi-box': NO_METADATA,
  'chill-wave': NO_METADATA,
  'jazz-box': NO_METADATA,
  'rain-sounds': NO_METADATA,
  rap: NO_METADATA,
  'jazz-smooth': NO_METADATA,
  'swiss-classic': NO_METADATA,
  asp: NO_METADATA,

  // Answers inconsistently across CDN edges: one probe returned
  // `application/octet-stream` with no ACAO header, a later probe returned
  // `audio/mpeg` with a reflected Origin. Left as 'unknown' so the client
  // probes once per browser and caches the real answer.
  'jazz-groove': { cors: 'unknown', nowPlaying: { kind: 'none' } },

  'lofi-cafe-studying': azuracast(LOFICAFE, 'studying'),
  'lofi-cafe-japanese': azuracast(LOFICAFE, 'japanese-lofi'),
  'lofi-cafe-chilling': azuracast(LOFICAFE, 'chilling'),
  'lofi-cafe-sleeping': azuracast(LOFICAFE, 'sleeping'),
  'lofi-cafe-gaming': azuracast(LOFICAFE, 'gaming'),
  'b3cks-radio': azuracast('https://radio.b3ck.com', 'b3cks-radio'),
  'freecodecamp-coderadio': azuracast(
    'https://coderadio-admin-v2.freecodecamp.org',
    'coderadio',
  ),

  'groove-salad': somafm('groovesalad'),
  'drone-zone': somafm('dronezone'),
  'beat-blender': somafm('beatblender'),

  paradise: { cors: true, nowPlaying: { kind: 'radioparadise', chan: 2 } },
};

export function getStationMeta(id: string): StationMeta {
  return stationMeta[id] ?? { cors: 'unknown', nowPlaying: { kind: 'none' } };
}

/** Stations that can display a real track title. */
export function hasNowPlaying(id: string): boolean {
  return getStationMeta(id).nowPlaying.kind !== 'none';
}
