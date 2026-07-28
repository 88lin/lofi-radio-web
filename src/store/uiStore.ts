'use client';

import { create } from 'zustand';

/**
 * Transient UI state (overlays / panels). Deliberately not persisted and kept
 * out of `audioStore` so opening a dialog never touches playback state.
 */
interface UiState {
  isPaletteOpen: boolean;
  isShortcutsOpen: boolean;
  isFocusPanelOpen: boolean;
  isAmbientPanelOpen: boolean;
  isCustomStationOpen: boolean;

  setPaletteOpen: (open: boolean) => void;
  togglePalette: () => void;
  setShortcutsOpen: (open: boolean) => void;
  toggleShortcuts: () => void;
  setFocusPanelOpen: (open: boolean) => void;
  setAmbientPanelOpen: (open: boolean) => void;
  setCustomStationOpen: (open: boolean) => void;
  closeAll: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  isPaletteOpen: false,
  isShortcutsOpen: false,
  isFocusPanelOpen: false,
  isAmbientPanelOpen: false,
  isCustomStationOpen: false,

  setPaletteOpen: (open) => set({ isPaletteOpen: open }),
  togglePalette: () => set((s) => ({ isPaletteOpen: !s.isPaletteOpen })),
  setShortcutsOpen: (open) => set({ isShortcutsOpen: open }),
  toggleShortcuts: () => set((s) => ({ isShortcutsOpen: !s.isShortcutsOpen })),
  setFocusPanelOpen: (open) => set({ isFocusPanelOpen: open }),
  setAmbientPanelOpen: (open) => set({ isAmbientPanelOpen: open }),
  setCustomStationOpen: (open) => set({ isCustomStationOpen: open }),
  closeAll: () =>
    set({
      isPaletteOpen: false,
      isShortcutsOpen: false,
      isFocusPanelOpen: false,
      isAmbientPanelOpen: false,
      isCustomStationOpen: false,
    }),
}));

/** True when any modal-ish overlay owns the keyboard. */
export function selectAnyOverlayOpen(s: UiState): boolean {
  return (
    s.isPaletteOpen ||
    s.isShortcutsOpen ||
    s.isFocusPanelOpen ||
    s.isAmbientPanelOpen ||
    s.isCustomStationOpen
  );
}
