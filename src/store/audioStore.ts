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
  /**
   * 「还在连，但明显比平时慢」。
   *
   * 它不是错误：数据确实在往回走，只是网络卡。单独一个状态是因为
   * 「慢」和「失败」的处置完全相反——慢就该接着等，点重试反而会把
   * 已经缓冲的部分全丢掉重来。
   */
  isSlowConnection: boolean;
  
  // 用户意图状态
  userWantsPlay: boolean;
  
  volume: number;
  isMuted: boolean;
  currentStation: Station | null;
  stationIndex: number;
  // 重试令牌：+1 强制 useAudioPlayer 重新加载当前电台。
  // 只改 currentStation 无法触发重载（id 未变化时加载 effect 会跳过），
  // 出错后播放按钮/重试按钮需要靠它恢复同一电台。
  stationLoadToken: number;
  
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
  setSlowConnection: (slow: boolean) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  selectStation: (index: number) => void;
  selectStationById: (id: string) => void;
  nextStation: () => void;
  prevStation: () => void;
  retryStation: () => void;
  
  // 专注时间
  startFocusTime: () => void;
  pauseFocusTime: () => void;
  getFocusTime: () => number;
  resetFocusTime: () => void;

  // 睡眠定时器
  sleepTimerMinutes: number | null;
  sleepTimerEndTime: number | null;
  setSleepTimer: (minutes: number | null) => void;

  setMiniMode: (mini: boolean) => void;
  toggleMiniMode: () => void;
  setSelectedCategory: (category: string) => void;
  checkAndResetDailyFocus: () => void;
}

const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// 本地时区「今天零点」的时间戳，用于跨天重置时把午夜之后的时间补回来
const getStartOfToday = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.getTime();
};

type AudioSet = (partial: Partial<AudioState>) => void;
type AudioGet = () => AudioState;

/**
 * 选台的统一实现。
 *
 * 递增 stationLoadToken 这一步不能省：useAudioPlayer 的加载 effect 只看「电台 id
 * 变了没」和「令牌变了没」，重新选中当前这个电台时两者都不变，它会直接跳过，
 * 上一次加载失败留下的死 audio 元素永远不会被重建——表现就是按钮变回暂停、
 * 错误提示消失、但一直没有声音。
 */
function applyStationSelection(index: number, set: AudioSet, get: AudioGet) {
  if (index < 0 || index >= stations.length) return;

  const station = stations[index];
  const { currentStation, isPlaying, isLoading, hasError, isSlowConnection, stationLoadToken } = get();

  /**
   * 「这一台已经在正常工作」= 正在出声，或正在连。两种都不该推倒重来：
   * 出声的别打断；正在连的重来会 destroy 掉 hls 实例、丢掉已经缓冲的部分，
   * 弱网下用户可能因此永远等不到成功那一次。
   *
   * hasError 必须参与判断。断流不会触发 pause 事件，isPlaying 会一直停在 true，
   * 只看 isPlaying 的话「看门狗报错 → 用户点同一台」会走进不重载的分支，
   * 把错误清掉却什么都没做，正好退回到这套改动要修的「界面正常但没有声音」。
   */
  const keepCurrentLoad =
    currentStation?.id === station.id && !hasError && (isPlaying || isLoading);

  set({
    stationIndex: index,
    currentStation: station,
    userWantsPlay: true,
    stationLoadToken: keepCurrentLoad ? stationLoadToken : stationLoadToken + 1,
    isLoading: keepCurrentLoad ? isLoading : true,
    hasError: false,
    errorMessage: null,
    // 沿用当前这次加载时慢提示要保留：看门狗的 hintedSlow 是 effect 内的局部
    // 状态，这里清掉它不会再被重新置起来，提示就永远消失了。
    isSlowConnection: keepCurrentLoad ? isSlowConnection : false,
  });
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set, get) => ({
      isPlaying: false,
      isLoading: false,
      hasError: false,
      errorMessage: null,
      isSlowConnection: false,
      userWantsPlay: false,
      volume: 0.5,
      isMuted: false,
      currentStation: stations[0],
      stationIndex: 0,
      stationLoadToken: 0,
      focusStartTime: null,
      accumulatedFocusTime: 0,
      focusDate: getCurrentDate(),
      isMiniMode: true,
      selectedCategory: 'all',
      sleepTimerMinutes: null,
      sleepTimerEndTime: null,
      
      setSleepTimer: (minutes) => set({ 
        sleepTimerMinutes: minutes, 
        sleepTimerEndTime: minutes ? Date.now() + minutes * 60 * 1000 : null 
      }),

      checkAndResetDailyFocus: () => {
        const { focusDate, isPlaying, focusStartTime } = get();
        const currentDate = getCurrentDate();
        if (focusDate !== currentDate) {
          set({ 
            accumulatedFocusTime: 0, 
            focusDate: currentDate,
            // 跨天时如果还在播放，要立刻按新的一天重新起算，
            // 否则 focusStartTime 被清空后计时会一直停在 0。
            // 起算点取「今天零点」和原起算点里更晚的那个：
            //   - 后台标签页的定时器会被节流，这次检测可能比午夜晚几十秒甚至更久，
            //     用零点兜底才不会漏掉午夜到首次检测之间的时间；
            //   - 若本次播放本身就是午夜之后才开始的，则沿用原起算点，
            //     避免把零点到开播之间没在听的时间算进来。
            focusStartTime: isPlaying
              ? Math.max(focusStartTime ?? Date.now(), getStartOfToday())
              : null
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
        userWantsPlay: false,
        isSlowConnection: false
      }),
      
      // 由音频事件设置真实播放状态
      setPlaying: (playing) => {
        // 播放状态可能在被节流的跨日检查之前发生变化（例如暂停或切台）。
        // 先按旧的播放状态完成跨日归档，再基于更新后的计时状态处理本次事件。
        get().checkAndResetDailyFocus();
        const state = get();
        if (playing) {
          set({
            isPlaying: true,
            isLoading: false,
            hasError: false,
            errorMessage: null,
            // 真的出声了，之前报过的「慢 / 超时」一律作废——
            // 看门狗宁可先提醒再被推翻，也不能让用户对着静音的界面干等
            isSlowConnection: false
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

      // 只有「报错」才意味着加载结束；「清空错误」是重新开始加载的前奏，
      // 不能顺手把 isLoading 也关掉。loadStation 里就是 setLoading(true) 紧跟着
      // setError(false, null)，一起关掉的话刚点下重试的那一两秒钟按钮会显示成
      // 暂停图标——又变回「看起来在播、其实没声音」。
      setError: (hasError, message = null) =>
        set(
          hasError
            ? { hasError: true, errorMessage: message, isLoading: false, isSlowConnection: false }
            : { hasError: false, errorMessage: null }
        ),

      setSlowConnection: (slow) => set({ isSlowConnection: slow }),
      
      setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      setMuted: (muted) => set({ isMuted: muted }),
      
      selectStation: (index) => applyStationSelection(index, set, get),

      selectStationById: (id) =>
        applyStationSelection(stations.findIndex(s => s.id === id), set, get),
      
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

      // 出错后的恢复入口：保持当前电台不变，仅递增令牌强制重新加载
      retryStation: () => set({
        stationLoadToken: get().stationLoadToken + 1,
        userWantsPlay: true,
        isLoading: true,
        hasError: false,
        errorMessage: null,
        isSlowConnection: false
      }),
      
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
        sleepTimerMinutes: state.sleepTimerMinutes,
        sleepTimerEndTime: state.sleepTimerEndTime,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.stationIndex !== undefined) {
          state.currentStation = stations[state.stationIndex] || stations[0];
        }
      },
    }
  )
);
