'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Station, stations } from '@/lib/stations';

interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  currentStation: Station | null;
  stationIndex: number;
  focusTime: number;
  focusDate: string;
  isMiniMode: boolean;
  selectedCategory: string;
  
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  setLoading: (loading: boolean) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  selectStation: (index: number) => void;
  selectStationById: (id: string) => void;
  nextStation: () => void;
  prevStation: () => void;
  incrementFocusTime: () => void;
  resetFocusTime: () => void;
  setMiniMode: (mini: boolean) => void;
  toggleMiniMode: () => void;
  setSelectedCategory: (category: string) => void;
  checkAndResetDailyFocus: () => void;
}

const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const useAudioStore = create<AudioState>()(
  persist(
    (set, get) => ({
      isPlaying: false,
      isLoading: false,
      volume: 0.5, // 默认音量50%
      isMuted: false,
      currentStation: stations[0], // 默认使用第一个电台
      stationIndex: 0,
      focusTime: 0,
      focusDate: getCurrentDate(),
      isMiniMode: true, // 默认迷你模式，可以点击展开
      selectedCategory: 'all',
      
      // 检查并重置每日专注时间
      checkAndResetDailyFocus: () => {
        const { focusDate } = get();
        const currentDate = getCurrentDate();
        if (focusDate !== currentDate) {
          set({ focusTime: 0, focusDate: currentDate });
        }
      },
      
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      setPlaying: (playing) => set({ isPlaying: playing }),
      setLoading: (loading) => set({ isLoading: loading }),
      setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      setMuted: (muted) => set({ isMuted: muted }),
      
      selectStation: (index) => {
        if (index >= 0 && index < stations.length) {
          set({ 
            stationIndex: index, 
            currentStation: stations[index],
            isPlaying: true,
            isLoading: true,
          });
        }
      },
      
      selectStationById: (id) => {
        const index = stations.findIndex(s => s.id === id);
        if (index >= 0) {
          set({ 
            stationIndex: index, 
            currentStation: stations[index],
            isPlaying: true,
            isLoading: true,
          });
        }
      },
      
      nextStation: () => {
        const { stationIndex } = get();
        const newIndex = (stationIndex + 1) % stations.length;
        get().selectStation(newIndex);
      },
      
      prevStation: () => {
        const { stationIndex } = get();
        const newIndex = (stationIndex - 1 + stations.length) % stations.length;
        get().selectStation(newIndex);
      },
      
      incrementFocusTime: () => {
        const { focusDate } = get();
        const currentDate = getCurrentDate();
        
        set((state) => {
          if (focusDate !== currentDate) {
            return { focusTime: 1, focusDate: currentDate };
          }
          return { focusTime: state.focusTime + 1 };
        });
      },
      
      resetFocusTime: () => set({ focusTime: 0, focusDate: getCurrentDate() }),
      
      setMiniMode: (mini) => set({ isMiniMode: mini }),
      toggleMiniMode: () => set((state) => ({ isMiniMode: !state.isMiniMode })),
      setSelectedCategory: (category) => set({ selectedCategory: category }),
    }),
    {
      name: 'lofi-radio-storage',
      partialize: (state) => ({
        volume: state.volume,
        stationIndex: state.stationIndex,
        focusTime: state.focusTime,
        focusDate: state.focusDate,
        isMiniMode: state.isMiniMode,
      }),
      // hydration 后根据 stationIndex 恢复 currentStation
      onRehydrateStorage: () => (state) => {
        if (state && state.stationIndex !== undefined) {
          state.currentStation = stations[state.stationIndex] || stations[0];
        }
      },
    }
  )
);
