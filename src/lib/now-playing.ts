import { getStationMeta, type NowPlayingProvider } from '@/lib/station-meta';

/**
 * Normalised "what is on air right now" record.
 *
 * Every field is optional on purpose: most internet radio stations expose
 * nothing, several expose a title but no artwork, and the UI must never invent
 * a placeholder like "Unknown track" — it falls back to the station name.
 */
export interface NowPlaying {
  stationId: string;
  title?: string;
  artist?: string;
  album?: string;
  /** Absolute artwork URL, if the provider supplied a non-empty one. */
  artwork?: string;
  listeners?: number;
  /** Epoch millis when this snapshot was produced. */
  fetchedAt: number;
}

const FETCH_TIMEOUT_MS = 6_000;

async function getJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      // Cached at the edge; the route handler sets its own revalidate window.
      next: { revalidate: 10 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const asString = (v: unknown): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const asNumber = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

/**
 * AzuraCast: `GET {base}/api/nowplaying/{shortcode}`
 * -> now_playing.song.{title,artist,album,art}, listeners.total
 * Covers the five loficafe.net stations, b3cks-radio and freeCodeCamp CodeRadio.
 */
function parseAzuracast(payload: unknown): Partial<NowPlaying> {
  const root = asRecord(payload);
  const song = asRecord(asRecord(root?.now_playing)?.song);
  const listeners = asRecord(root?.listeners);
  if (!song) return {};

  // AzuraCast always fills `text` ("Artist - Title"); the split fields are more
  // reliable when present.
  const title = asString(song.title) ?? asString(song.text);
  return {
    title,
    artist: asString(song.artist),
    album: asString(song.album),
    artwork: asString(song.art),
    listeners: asNumber(listeners?.total) ?? asNumber(listeners?.current),
  };
}

/**
 * SomaFM: `GET https://somafm.com/songs/{channel}.json`
 * -> songs[0].{title,artist,album,albumArt}. `albumArt` is frequently "".
 */
function parseSomaFm(payload: unknown): Partial<NowPlaying> {
  const root = asRecord(payload);
  const songs = Array.isArray(root?.songs) ? root.songs : [];
  const current = asRecord(songs[0]);
  if (!current) return {};
  return {
    title: asString(current.title),
    artist: asString(current.artist),
    album: asString(current.album),
    artwork: asString(current.albumArt),
  };
}

/**
 * Radio Paradise: `GET https://api.radioparadise.com/api/now_playing?chan=N`
 * -> {artist,title,album,year,cover,cover_med,cover_small}. `cover` is a
 * path relative to the Radio Paradise CDN when it is not already absolute.
 */
function parseRadioParadise(payload: unknown): Partial<NowPlaying> {
  const root = asRecord(payload);
  if (!root) return {};
  const cover = asString(root.cover_med) ?? asString(root.cover) ?? asString(root.cover_small);
  return {
    title: asString(root.title),
    artist: asString(root.artist),
    album: asString(root.album),
    artwork: cover
      ? cover.startsWith('http')
        ? cover
        : `https://img.radioparadise.com/${cover.replace(/^\/+/, '')}`
      : undefined,
  };
}

function endpointFor(provider: NowPlayingProvider): string | null {
  switch (provider.kind) {
    case 'azuracast':
      return `${provider.base}/api/nowplaying/${provider.shortcode}`;
    case 'somafm':
      return `https://somafm.com/songs/${provider.channel}.json`;
    case 'radioparadise':
      return `https://api.radioparadise.com/api/now_playing?chan=${provider.chan}`;
    default:
      return null;
  }
}

function parseFor(provider: NowPlayingProvider, payload: unknown): Partial<NowPlaying> {
  switch (provider.kind) {
    case 'azuracast':
      return parseAzuracast(payload);
    case 'somafm':
      return parseSomaFm(payload);
    case 'radioparadise':
      return parseRadioParadise(payload);
    default:
      return {};
  }
}

/**
 * Resolves the current track for a station, or `null` when the station has no
 * metadata provider or the provider is unreachable. Server-side only: the
 * upstream APIs do not all send CORS headers, which is why this is proxied
 * through /api/now-playing rather than called from the browser.
 */
export async function fetchNowPlaying(stationId: string): Promise<NowPlaying | null> {
  const provider = getStationMeta(stationId).nowPlaying;
  const url = endpointFor(provider);
  if (!url) return null;

  const parsed = parseFor(provider, await getJson(url));
  if (!parsed.title && !parsed.artist) return null;

  return { stationId, ...parsed, fetchedAt: Date.now() };
}

/** "Artist — Title", or whichever half exists. */
export function formatTrack(np: NowPlaying | null | undefined): string | null {
  if (!np) return null;
  if (np.artist && np.title && !np.title.includes(np.artist)) {
    return `${np.artist} — ${np.title}`;
  }
  return np.title ?? np.artist ?? null;
}

export { parseAzuracast, parseSomaFm, parseRadioParadise, endpointFor };
