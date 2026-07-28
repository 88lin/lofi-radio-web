'use client';

import { useEffect } from 'react';
import { useThemeToggle } from '@/hooks/use-theme-toggle';
import { useAudioStore } from '@/store/audioStore';
import { selectAnyOverlayOpen, useUiStore } from '@/store/uiStore';

const VOLUME_STEP = 0.05;

/**
 * True when the event should be ignored because the user is typing, or because
 * a browser/OS shortcut is in flight.
 *
 * The previous implementation was a bare `switch (e.code)` with only an
 * `HTMLInputElement | HTMLTextAreaElement` check, so `Cmd+Space` (Spotlight),
 * `Ctrl+T`/`Cmd+T` (new tab), `Alt+Left` (back) and every `contenteditable`
 * surface all triggered player actions.
 */
function shouldIgnore(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.isComposing || event.repeat) return true;

  const target = event.target as HTMLElement | null;
  if (target) {
    const tag = target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (target.isContentEditable) return true;
    if (target.closest('[role="textbox"],[role="combobox"]')) return true;
  }
  return false;
}

const hasModifier = (e: KeyboardEvent) => e.metaKey || e.ctrlKey || e.altKey;

/**
 * Global keyboard layer. Registered once from the page shell.
 */
export function useKeyboardShortcuts() {
  const { toggleTheme: handleThemeToggle } = useThemeToggle();

  const togglePalette = useUiStore((s) => s.togglePalette);
  const toggleShortcuts = useUiStore((s) => s.toggleShortcuts);
  const closeAll = useUiStore((s) => s.closeAll);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl+K is the one binding that deliberately wants a modifier.
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        togglePalette();
        return;
      }

      if (shouldIgnore(event)) return;

      const store = useAudioStore.getState();
      const overlayOpen = selectAnyOverlayOpen(useUiStore.getState());

      if (event.key === 'Escape') {
        if (overlayOpen) {
          event.preventDefault();
          closeAll();
        }
        return;
      }

      // While an overlay owns the keyboard, only Escape and Cmd+K apply.
      if (overlayOpen) return;

      // `?` (Shift+/) opens the shortcut reference. Checked before the
      // modifier guard because Shift is required to produce the character.
      if (event.key === '?') {
        event.preventDefault();
        toggleShortcuts();
        return;
      }

      if (hasModifier(event) || event.shiftKey) return;

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (store.userWantsPlay) store.requestPause();
          else store.requestPlay();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          store.prevStation();
          break;
        case 'ArrowRight':
          event.preventDefault();
          store.nextStation();
          break;
        case 'ArrowUp':
          event.preventDefault();
          store.setVolume(Math.min(1, store.volume + VOLUME_STEP));
          break;
        case 'ArrowDown':
          event.preventDefault();
          store.setVolume(Math.max(0, store.volume - VOLUME_STEP));
          break;
        case 'KeyM':
          event.preventDefault();
          store.toggleMute();
          break;
        case 'KeyT':
          event.preventDefault();
          handleThemeToggle();
          break;
        case 'KeyF':
          if (store.currentStation) {
            event.preventDefault();
            store.toggleFavorite(store.currentStation.id);
          }
          break;
        case 'KeyL':
          event.preventDefault();
          store.setMiniMode(!store.isMiniMode);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleThemeToggle, togglePalette, toggleShortcuts, closeAll]);

  return { toggleTheme: handleThemeToggle };
}
