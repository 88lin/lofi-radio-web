import assert from 'node:assert/strict';
import test from 'node:test';
import { probeHlsCandidate, type HlsCandidate } from '../src/lib/hls-candidates';

const candidates: HlsCandidate[] = [
  { url: 'https://ts.test/primary', format: 'ts', codec: 'avc' },
  { url: 'https://ts.test/backup', format: 'ts', codec: 'avc' },
  { url: 'https://ts.test/hevc', format: 'ts', codec: 'hevc' },
  { url: 'https://mp4.test/primary', format: 'fmp4', codec: 'avc' },
];

test('fast fMP4 can win while TS hangs; only playlists are fetched and losers are aborted', async (t) => {
  const requests: string[] = [];
  let aborted = false;
  t.mock.method(globalThis, 'fetch', (url: string, init: RequestInit) => {
    requests.push(url);
    if (url.includes('mp4')) return Promise.resolve(new Response('#EXTM3U\n#EXTINF:6\nvideo.m4s'));
    return new Promise((_resolve, reject) => init.signal!.addEventListener('abort', () => {
      aborted = true;
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true }));
  });
  assert.equal(await probeHlsCandidate(candidates, new AbortController().signal), candidates[3].url);
  assert.deepEqual(requests, [candidates[0].url, candidates[3].url]);
  assert.equal(aborted, true);
});

test('invalid and forbidden playlists do not win; failures advance a bounded queue', async (t) => {
  let active = 0;
  let peak = 0;
  const requested: string[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    requested.push(url);
    peak = Math.max(peak, ++active);
    await new Promise(resolve => setTimeout(resolve, 5));
    active--;
    if (url.endsWith('backup')) return new Response('#EXTM3U\n#EXT-X-TARGETDURATION:6');
    return url.includes('mp4') ? new Response('Forbidden', { status: 403 }) : new Response('<html>oops</html>');
  });
  assert.equal(await probeHlsCandidate(candidates, new AbortController().signal), candidates[1].url);
  assert.ok(peak <= 2);
  assert.ok(requested.includes(candidates[1].url));
});

test('abort cancels active probes and never starts queued candidates', async (t) => {
  const parent = new AbortController();
  const signals: AbortSignal[] = [];
  t.mock.method(globalThis, 'fetch', (_url: string, init: RequestInit) => {
    signals.push(init.signal!);
    return new Promise((_resolve, reject) => init.signal!.addEventListener('abort', () => {
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true }));
  });
  const result = probeHlsCandidate(candidates, parent.signal);
  parent.abort();
  await assert.rejects(result, { name: 'AbortError' });
  assert.equal(signals.length, 2);
  assert.ok(signals.every(signal => signal.aborted));
});

test('CORS failures or probe timeout return no preference so native/legacy playback can still try', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch'); });
  assert.equal(await probeHlsCandidate(candidates, new AbortController().signal), null);
  t.mock.method(globalThis, 'fetch', (_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
    init.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  }));
  assert.equal(await probeHlsCandidate(candidates, new AbortController().signal, 20), null);
});

test('already cancelled requests never fetch; duplicate URLs are not probed twice', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return new Response('invalid'); });
  await assert.rejects(probeHlsCandidate(candidates, AbortSignal.abort()), { name: 'AbortError' });
  assert.equal(calls, 0);
  await probeHlsCandidate([candidates[0], candidates[0]], new AbortController().signal);
  assert.equal(calls, 1);
});
