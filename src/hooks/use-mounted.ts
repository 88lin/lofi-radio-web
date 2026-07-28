'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * `false` during SSR and the hydration pass, `true` afterwards.
 *
 * Used to gate markup that depends on persisted zustand state (`currentStation`,
 * `accumulatedFocusTime`, `favorites`, …). Those values are rehydrated from
 * localStorage synchronously on the client, so rendering them on the first pass
 * would not match the server output.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
