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
      volume: 0.3,
      isMuted: false,
      currentStation: stations[1], // 默认使用 Lofi Box（跳过 Bilibili 源）
      stationIndex: 1,
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
        // 跳过 Bilibili 源（索引 0）
        let newIndex = (stationIndex + 1) % stations.length;
        if (newIndex === 0) newIndex = 1;
        get().selectStation(newIndex);
      },
      
      prevStation: () => {
        const { stationIndex } = get();
        // 跳过 Bilibili 源（索引 0）
        let newIndex = (stationIndex - 1 + stations.length) % stations.length;
        if (newIndex === 0) newIndex = stations.length - 1;
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
    }
  )
);
