/** Wait for native media without leaving listeners alive after pause/switch. */
export function waitForMediaReady(media: HTMLMediaElement, signal: AbortSignal, timeoutMs: number): Promise<boolean> {
  if (signal.aborted) return Promise.resolve(false);
  if (media.readyState >= 3) return Promise.resolve(true);
  return new Promise(resolve => {
    const finish = (ready: boolean) => {
      clearTimeout(timer);
      media.removeEventListener('canplay', onReady);
      media.removeEventListener('error', onError);
      signal.removeEventListener('abort', onError);
      resolve(ready);
    };
    const onReady = () => finish(true);
    const onError = () => finish(false);
    const timer = setTimeout(onError, timeoutMs);
    media.addEventListener('canplay', onReady);
    media.addEventListener('error', onError);
    signal.addEventListener('abort', onError, { once: true });
  });
}
