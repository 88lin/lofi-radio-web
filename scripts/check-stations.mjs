#!/usr/bin/env node
/**
 * Station health checker.
 *
 * Why this exists: a dead station ("Chill Sky" -> 502 Bad Gateway) sat in the
 * production catalogue with no way to notice. This script issues a small Range
 * request to every stream and fails the run when a station stops returning
 * audio, so CI can catch rot instead of users.
 *
 *   node scripts/check-stations.mjs            # human-readable table
 *   node scripts/check-stations.mjs --json     # machine-readable
 *
 * Exit codes: 0 = all healthy, 1 = at least one station is broken.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://lofi.88lin.eu.org';
const TIMEOUT_MS = 15_000;
const AUDIO_TYPES = [
  'audio/',
  'application/ogg',
  'application/vnd.apple.mpegurl',
  'application/x-mpegurl',
  'video/mp2t',
];

/**
 * Parses `stations.ts` without a TypeScript toolchain: the catalogue is a plain
 * object literal array, so a scoped regex over the source is enough and keeps
 * this script runnable with bare `node`.
 */
function loadStations() {
  const src = readFileSync(path.join(ROOT, 'src/lib/stations.ts'), 'utf8');
  const body = src.slice(
    src.indexOf('export const stations'),
    src.indexOf('export const categories'),
  );
  const stations = [];
  for (const block of body.split(/\n\s*\{\s*\n/).slice(1)) {
    const pick = (key) =>
      block.match(new RegExp(`^\\s*${key}:\\s*'([^']*)'`, 'm'))?.[1];
    const id = pick('id');
    const url = pick('url');
    if (id && url) stations.push({ id, name: pick('name'), type: pick('type'), url });
  }
  return stations;
}

async function probe(station) {
  // Bilibili rooms are resolved server-side through /api/bilibili-stream and
  // are not a plain audio URL, so only reachability of the room page is checked.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(station.url, {
      headers: {
        Origin: ORIGIN,
        Range: 'bytes=0-2047',
        'User-Agent': 'lofi-radio-web/check-stations',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    const contentType = (res.headers.get('content-type') ?? '').toLowerCase();
    const cors = res.headers.get('access-control-allow-origin');
    const okStatus = res.status >= 200 && res.status < 400;
    const okType =
      station.type === 'bilibili' || AUDIO_TYPES.some((t) => contentType.startsWith(t));

    // Drain and discard so the socket closes promptly.
    try {
      await res.arrayBuffer();
    } catch {
      /* streaming endpoints may never terminate; ignore */
    }

    return {
      ...station,
      status: res.status,
      contentType: contentType || '(none)',
      cors: cors ?? null,
      healthy: okStatus && okType,
      reason: !okStatus ? `HTTP ${res.status}` : !okType ? `not audio (${contentType})` : null,
    };
  } catch (error) {
    return {
      ...station,
      status: 0,
      contentType: '(none)',
      cors: null,
      healthy: false,
      reason: error.name === 'AbortError' ? 'timeout' : String(error.message ?? error),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const asJson = process.argv.includes('--json');
  const stations = loadStations();
  if (stations.length === 0) {
    console.error('check-stations: could not parse any station from src/lib/stations.ts');
    process.exit(1);
  }

  // Bounded concurrency: enough to stay quick, low enough to avoid tripping
  // rate limits on shared Icecast hosts.
  const results = [];
  const queue = [...stations];
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      for (let next = queue.shift(); next; next = queue.shift()) {
        results.push(await probe(next));
      }
    }),
  );
  results.sort((a, b) => stations.indexOf(a) - stations.indexOf(b));

  const broken = results.filter((r) => !r.healthy);

  if (asJson) {
    console.log(JSON.stringify({ checked: results.length, broken: broken.length, results }, null, 2));
  } else {
    const pad = Math.max(...results.map((r) => r.id.length));
    for (const r of results) {
      const mark = r.healthy ? 'ok  ' : 'FAIL';
      const cors = r.cors ? `cors=${r.cors}` : 'cors=none';
      console.log(
        `${mark} ${r.id.padEnd(pad)}  ${String(r.status).padStart(3)}  ${cors.padEnd(16)}  ${r.contentType}${r.reason ? `  <- ${r.reason}` : ''}`,
      );
    }
    console.log(`\n${results.length - broken.length}/${results.length} stations healthy`);
  }

  if (broken.length > 0) {
    console.error(`\ncheck-stations: ${broken.length} station(s) need attention: ${broken.map((r) => r.id).join(', ')}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
