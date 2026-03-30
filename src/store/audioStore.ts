'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Station, stations } from '@/lib/stations';

interface AudioState {
  // 播放状态 - 由音频事件驱动
  isPlaying: boolean;
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  
  // 用户意图状态
  userWantsPlay: boolean;
  
  volume: number;
  isMuted: boolean;
  currentStation: Station | null;
  stationIndex: number;
  
  // 专注时间 - 改用时间戳累计
  focusStartTime: number | null;  // 开始播放时的时间戳
  accumulatedFocusTime: number;   // 累计的专注时间（秒）
  focusDate: string;
  
  isMiniMode: boolean;
  selectedCategory: string;
  
  // 播放控制
  requestPlay: () => void;
  requestPause: () => void;
  setPlaying: (playing: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (hasError: boolean, message?: string | null) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  selectStation: (index: number) => void;
  selectStationById: (id: string) => void;
  nextStation: () => void;
  prevStation: () => void;
  
  // 专注时间
  startFocusTime: () => void;
  pauseFocusTime: () => void;
  getFocusTime: () => number;
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
      hasError: false,
      errorMessage: null,
      userWantsPlay: false,
      volume: 0.5,
      isMuted: false,
      currentStation: stations[0],
      stationIndex: 0,
      focusStartTime: null,
      accumulatedFocusTime: 0,
      focusDate: getCurrentDate(),
      isMiniMode: true,
      selectedCategory: 'all',
      
      checkAndResetDailyFocus: () => {
        const { focusDate } = get();
        const currentDate = getCurrentDate();
        if (focusDate !== currentDate) {
          set({ 
            accumulatedFocusTime: 0, 
            focusDate: currentDate,
            focusStartTime: null 
          });
        }
      },
      
      // 用户请求播放 - 只是表达意图
      requestPlay: () => set({ 
        userWantsPlay: true, 
        hasError: false, 
        errorMessage: null 
      }),
      
      // 用户请求暂停
      requestPause: () => set({ 
        userWantsPlay: false 
      }),
      
      // 由音频事件设置真实播放状态
      setPlaying: (playing) => {
        const state = get();
        if (playing) {
          set({ 
            isPlaying: true, 
            isLoading: false,
            hasError: false,
            errorMessage: null
          });
          // 开始计时
          if (!state.focusStartTime) {
            set({ focusStartTime: Date.now() });
          }
        } else {
          set({ isPlaying: false });
          // 暂停计时 - 累加已播放时间
          if (state.focusStartTime) {
            const elapsed = Math.floor((Date.now() - state.focusStartTime) / 1000);
            set({ 
              focusStartTime: null,
              accumulatedFocusTime: state.accumulatedFocusTime + elapsed
            });
          }
        }
      },
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (hasError, message = null) => set({ 
        hasError, 
        errorMessage: message,
        isLoading: false
      }),
      
      setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      setMuted: (muted) => set({ isMuted: muted }),
      
      selectStation: (index) => {
        if (index >= 0 && index < stations.length) {
          set({ 
            stationIndex: index, 
            currentStation: stations[index],
            userWantsPlay: true,
            isLoading: true,
            hasError: false,
            errorMessage: null
          });
        }
      },
      
      selectStationById: (id) => {
        const index = stations.findIndex(s => s.id === id);
        if (index >= 0) {
          set({ 
            stationIndex: index, 
            currentStation: stations[index],
            userWantsPlay: true,
            isLoading: true,
            hasError: false,
            errorMessage: null
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
      
      // 开始专注计时
      startFocusTime: () => {
        const { focusStartTime } = get();
        if (!focusStartTime) {
          set({ focusStartTime: Date.now() });
        }
      },
      
      // 暂停专注计时
      pauseFocusTime: () => {
        const { focusStartTime, accumulatedFocusTime } = get();
        if (focusStartTime) {
          const elapsed = Math.floor((Date.now() - focusStartTime) / 1000);
          set({ 
            focusStartTime: null,
            accumulatedFocusTime: accumulatedFocusTime + elapsed
          });
        }
      },
      
      // 获取当前专注时间（秒）
      getFocusTime: () => {
        const { focusStartTime, accumulatedFocusTime } = get();
        if (focusStartTime) {
          return accumulatedFocusTime + Math.floor((Date.now() - focusStartTime) / 1000);
        }
        return accumulatedFocusTime;
      },
      
      resetFocusTime: () => set({ 
        accumulatedFocusTime: 0, 
        focusDate: getCurrentDate(),
        focusStartTime: null
      }),
      
      setMiniMode: (mini) => set({ isMiniMode: mini }),
      toggleMiniMode: () => set((state) => ({ isMiniMode: !state.isMiniMode })),
      setSelectedCategory: (category) => set({ selectedCategory: category }),
    }),
    {
      name: 'lofi-radio-storage',
      partialize: (state) => ({
        volume: state.volume,
        stationIndex: state.stationIndex,
        accumulatedFocusTime: state.accumulatedFocusTime,
        focusDate: state.focusDate,
        isMiniMode: state.isMiniMode,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.stationIndex !== undefined) {
          state.currentStation = stations[state.stationIndex] || stations[0];
        }
      },
    }
  )
);
