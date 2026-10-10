/** Optional metadata; old resolver responses containing only URLs still work. */
export interface HlsCandidate {
  url: string;
  format?: string;
  codec?: string;
}

function probeOrder(candidates: HlsCandidate[]): HlsCandidate[] {
  const unique = [...new Map(candidates.map(candidate => [candidate.url, candidate])).values()];
  const result: HlsCandidate[] = [];
  // Try AVC/unknown before HEVC, and interleave formats so slow TS hosts cannot
  // occupy every probe slot while a reachable fMP4 playlist waits in the queue.
  for (const hevc of [false, true]) {
    const formats = new Map<string, HlsCandidate[]>();
    for (const candidate of unique.filter(item => (item.codec === 'hevc') === hevc)) {
      const key = candidate.format ?? '';
      if (!formats.has(key)) formats.set(key, []);
      formats.get(key)!.push(candidate);
    }
    while ([...formats.values()].some(group => group.length)) {
      for (const group of formats.values()) {
        const candidate = group.shift();
        if (candidate) result.push(candidate);
      }
    }
  }
  return result;
}

async function isPlaylist(response: Response): Promise<boolean> {
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    return false;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      // A probe must remain small even if a CDN returns the wrong resource.
      if (bytes > 128 * 1024) return false;
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return /^#EXTM3U(?:\r?\n|$)/.test(text.trimStart());
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

/**
 * Race at most two playlist requests, never fragments or player instances.
 * The budget covers the whole queue and response bodies. A null result is only
 * "no preference": callers retain all URLs for CORS/native/decoder fallbacks.
 */
export async function probeHlsCandidate(
  candidates: HlsCandidate[],
  signal: AbortSignal,
  timeoutMs = 8000,
): Promise<string | null> {
  signal.throwIfAborted();
  const queue = probeOrder(candidates);
  if (!queue.length) return null;
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal.addEventListener('abort', onAbort, { once: true });
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let winner: string | null = null;
  const worker = async () => {
    while (!controller.signal.aborted && queue.length) {
      const candidate = queue.shift()!;
      try {
        const response = await fetch(candidate.url, { signal: controller.signal, credentials: 'omit' });
        if (await isPlaylist(response) && !controller.signal.aborted) {
          winner = candidate.url;
          controller.abort();
        }
      } catch {
        // Timeout, CORS and HTTP failures do not exclude native HLS playback.
      }
    }
  };
  try {
    await Promise.all([worker(), worker()]);
    signal.throwIfAborted();
    return winner;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', onAbort);
    controller.abort();
  }
}
