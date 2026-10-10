import assert from 'node:assert/strict';
import test from 'node:test';
import { waitForMediaReady } from '../src/lib/media-load';

class MediaStub extends EventTarget {
  readyState = 0;
  listeners = new Set<EventListenerOrEventListenerObject>();
  override addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions) {
    this.listeners.add(listener);
    super.addEventListener(type, listener, options);
  }
  override removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    this.listeners.delete(listener);
    super.removeEventListener(type, listener);
  }
}

test('cancelling native media initialization resolves immediately and removes old listeners', async () => {
  const media = new MediaStub();
  const controller = new AbortController();
  const pending = waitForMediaReady(media as unknown as HTMLMediaElement, controller.signal, 10000);
  controller.abort();
  assert.equal(await pending, false);
  assert.equal(media.listeners.size, 0);
  // A late canplay must not revive the aborted operation.
  media.dispatchEvent(new Event('canplay'));
});

for (const event of ['canplay', 'error', 'timeout']) {
  test(`native initialization cleans listeners after ${event}`, async () => {
    const media = new MediaStub();
    const pending = waitForMediaReady(media as unknown as HTMLMediaElement, new AbortController().signal, 10);
    if (event !== 'timeout') media.dispatchEvent(new Event(event));
    assert.equal(await pending, event === 'canplay');
    assert.equal(media.listeners.size, 0);
  });
}
