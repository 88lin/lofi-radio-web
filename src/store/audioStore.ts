'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Station, stations } from '@/lib/stations';

export const MAX_RECENTLY_PLAYED = 12;
/** Days of focus history kept in localStorage. */
export const FOCUS_HISTORY_DAYS = 30;

export type PomodoroPhase = 'idle' | 'focus' | 'break';

export type AmbientLayerId = 'rain' | 'waves' | 'wind' | 'fire' | 'noise';

export type AmbientLevels = Record<AmbientLayerId, number>;

export const AMBIENT_DEFAULTS: AmbientLevels = {
  rain: 0,
  waves: 0,
  wind: 0,
  fire: 0,
  noise: 0,
};

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
  accumulatedFocusTime: number;   // 今日累计的专注时间（秒）
  focusDate: string;
  /** 按日期归档的专注时长（秒），保留最近 FOCUS_HISTORY_DAYS 天 */
  dailyFocus: Record<string, number>;

  isMiniMode: boolean;
  selectedCategory: string;

  // 电台管理
  favorites: string[];
  recentlyPlayed: string[];
  customStations: Station[];

  // 番茄钟
  pomodoroEnabled: boolean;
  pomodoroFocusMinutes: number;
  pomodoroBreakMinutes: number;
  pomodoroPhase: PomodoroPhase;
  pomodoroEndTime: number | null;
  pomodoroRound: number;

  // 环境音混音器（0~1 每层独立增益）
  ambientLevels: AmbientLevels;

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
  /** 把当前进行中的计时落盘到 dailyFocus，用于 pagehide/visibilitychange */
  settleFocusTime: () => void;

  // 睡眠定时器
  sleepTimerMinutes: number | null;
  sleepTimerEndTime: number | null;
  setSleepTimer: (minutes: number | null) => void;

  setMiniMode: (mini: boolean) => void;
  toggleMiniMode: () => void;
  setSelectedCategory: (category: string) => void;
  checkAndResetDailyFocus: () => void;

  // 电台管理
  toggleFavorite: (id: string) => void;
  addCustomStation: (station: Station) => void;
  removeCustomStation: (id: string) => void;
  replaceCustomStations: (list: Station[]) => void;

  // 番茄钟
  setPomodoroEnabled: (enabled: boolean) => void;
  setPomodoroDurations: (focusMinutes: number, breakMinutes: number) => void;
  startPomodoro: (phase?: PomodoroPhase) => void;
  stopPomodoro: () => void;
  advancePomodoro: () => PomodoroPhase;

  // 环境音
  setAmbientLevel: (layer: AmbientLayerId, level: number) => void;
  resetAmbient: () => void;
}

/**
 * Exactly what `partialize` writes to localStorage. Declaring it explicitly
 * keeps `partialize` and `migrate` type-checked against the same shape.
 */
type PersistedAudioState = Pick<
  AudioState,
  | 'volume'
  | 'stationIndex'
  | 'accumulatedFocusTime'
  | 'focusDate'
  | 'focusStartTime'
  | 'dailyFocus'
  | 'sleepTimerMinutes'
  | 'sleepTimerEndTime'
  | 'favorites'
  | 'recentlyPlayed'
  | 'customStations'
  | 'pomodoroEnabled'
  | 'pomodoroFocusMinutes'
  | 'pomodoroBreakMinutes'
  | 'pomodoroPhase'
  | 'pomodoroEndTime'
  | 'pomodoroRound'
  | 'ambientLevels'
>;

const getCurrentDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/** Built-in catalogue plus any user-added stations, in stable index order. */
const catalogueOf = (custom: Station[]): Station[] =>
  custom.length > 0 ? [...stations, ...custom] : stations;

function pruneHistory(history: Record<string, number>): Record<string, number> {
  const keys = Object.keys(history).sort();
  if (keys.length <= FOCUS_HISTORY_DAYS) return history;
  const keep = keys.slice(-FOCUS_HISTORY_DAYS);
  return Object.fromEntries(keep.map((k) => [k, history[k]]));
}

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
      dailyFocus: {},
      isMiniMode: true,
      selectedCategory: 'all',
      sleepTimerMinutes: null,
      sleepTimerEndTime: null,
      favorites: [],
      recentlyPlayed: [],
      customStations: [],
      pomodoroEnabled: false,
      pomodoroFocusMinutes: 25,
      pomodoroBreakMinutes: 5,
      pomodoroPhase: 'idle',
      pomodoroEndTime: null,
      pomodoroRound: 0,
      ambientLevels: { ...AMBIENT_DEFAULTS },

      setSleepTimer: (minutes) => set({
        sleepTimerMinutes: minutes,
        sleepTimerEndTime: minutes ? Date.now() + minutes * 60 * 1000 : null
      }),

      checkAndResetDailyFocus: () => {
        const { focusDate, accumulatedFocusTime, focusStartTime, dailyFocus } = get();
        const currentDate = getCurrentDate();
        if (focusDate === currentDate) return;

        // Archive the finished day (including any in-flight segment) before
        // resetting, so the 7-day chart does not lose the last session.
        const inFlight = focusStartTime
          ? Math.floor((Date.now() - focusStartTime) / 1000)
          : 0;
        const closing = accumulatedFocusTime + inFlight;
        const nextHistory = { ...dailyFocus };
        if (closing > 0) nextHistory[focusDate] = closing;

        set({
          accumulatedFocusTime: 0,
          focusDate: currentDate,
          focusStartTime: focusStartTime ? Date.now() : null,
          dailyFocus: pruneHistory(nextHistory),
        });
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
            const accumulated = state.accumulatedFocusTime + elapsed;
            set({
              focusStartTime: null,
              accumulatedFocusTime: accumulated,
              dailyFocus: pruneHistory({ ...state.dailyFocus, [state.focusDate]: accumulated }),
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
        const catalogue = catalogueOf(get().customStations);
        if (index >= 0 && index < catalogue.length) {
          const station = catalogue[index];
          set((state) => ({
            stationIndex: index,
            currentStation: station,
            userWantsPlay: true,
            isLoading: true,
            hasError: false,
            errorMessage: null,
            recentlyPlayed: [
              station.id,
              ...state.recentlyPlayed.filter((id) => id !== station.id),
            ].slice(0, MAX_RECENTLY_PLAYED),
          }));
        }
      },

      selectStationById: (id) => {
        const index = catalogueOf(get().customStations).findIndex(s => s.id === id);
        if (index >= 0) get().selectStation(index);
      },

      nextStation: () => {
        const { stationIndex, customStations } = get();
        const total = catalogueOf(customStations).length;
        get().selectStation((stationIndex + 1) % total);
      },

      prevStation: () => {
        const { stationIndex, customStations } = get();
        const total = catalogueOf(customStations).length;
        get().selectStation((stationIndex - 1 + total) % total);
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
        const { focusStartTime, accumulatedFocusTime, focusDate, dailyFocus } = get();
        if (focusStartTime) {
          const elapsed = Math.floor((Date.now() - focusStartTime) / 1000);
          const accumulated = accumulatedFocusTime + elapsed;
          set({
            focusStartTime: null,
            accumulatedFocusTime: accumulated,
            dailyFocus: pruneHistory({ ...dailyFocus, [focusDate]: accumulated }),
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

      /**
       * Flushes the in-flight segment into `accumulatedFocusTime` + `dailyFocus`
       * while keeping the clock running. Called on pagehide/visibilitychange so
       * a closed tab does not discard the current session.
       */
      settleFocusTime: () => {
        const { focusStartTime, accumulatedFocusTime, focusDate, dailyFocus } = get();
        const accumulated = focusStartTime
          ? accumulatedFocusTime + Math.floor((Date.now() - focusStartTime) / 1000)
          : accumulatedFocusTime;
        set({
          accumulatedFocusTime: accumulated,
          focusStartTime: focusStartTime ? Date.now() : null,
          dailyFocus: pruneHistory({ ...dailyFocus, [focusDate]: accumulated }),
        });
      },

      resetFocusTime: () => set((state) => {
        const nextHistory = { ...state.dailyFocus };
        delete nextHistory[getCurrentDate()];
        return {
          accumulatedFocusTime: 0,
          focusDate: getCurrentDate(),
          focusStartTime: null,
          dailyFocus: nextHistory,
        };
      }),

      setMiniMode: (mini) => set({ isMiniMode: mini }),
      toggleMiniMode: () => set((state) => ({ isMiniMode: !state.isMiniMode })),
      setSelectedCategory: (category) => set({ selectedCategory: category }),

      toggleFavorite: (id) => set((state) => ({
        favorites: state.favorites.includes(id)
          ? state.favorites.filter((f) => f !== id)
          : [...state.favorites, id],
      })),

      addCustomStation: (station) => set((state) => ({
        customStations: [
          ...state.customStations.filter((s) => s.id !== station.id),
          station,
        ],
      })),

      removeCustomStation: (id) => set((state) => {
        const customStations = state.customStations.filter((s) => s.id !== id);
        const wasCurrent = state.currentStation?.id === id;
        const catalogue = catalogueOf(customStations);
        return {
          customStations,
          favorites: state.favorites.filter((f) => f !== id),
          recentlyPlayed: state.recentlyPlayed.filter((r) => r !== id),
          ...(wasCurrent
            ? { stationIndex: 0, currentStation: catalogue[0], userWantsPlay: false }
            : {}),
        };
      }),

      replaceCustomStations: (list) => set({ customStations: list }),

      setPomodoroEnabled: (enabled) => set(
        enabled
          ? { pomodoroEnabled: true }
          : { pomodoroEnabled: false, pomodoroPhase: 'idle', pomodoroEndTime: null },
      ),

      setPomodoroDurations: (focusMinutes, breakMinutes) => set({
        pomodoroFocusMinutes: Math.min(180, Math.max(1, Math.round(focusMinutes))),
        pomodoroBreakMinutes: Math.min(60, Math.max(1, Math.round(breakMinutes))),
      }),

      startPomodoro: (phase = 'focus') => {
        const { pomodoroFocusMinutes, pomodoroBreakMinutes, pomodoroRound } = get();
        const minutes = phase === 'break' ? pomodoroBreakMinutes : pomodoroFocusMinutes;
        set({
          pomodoroEnabled: true,
          pomodoroPhase: phase,
          pomodoroEndTime: Date.now() + minutes * 60_000,
          pomodoroRound: phase === 'focus' ? pomodoroRound + 1 : pomodoroRound,
        });
      },

      stopPomodoro: () => set({ pomodoroPhase: 'idle', pomodoroEndTime: null }),

      /** Flips focus <-> break and returns the phase that just started. */
      advancePomodoro: () => {
        const next: PomodoroPhase = get().pomodoroPhase === 'focus' ? 'break' : 'focus';
        get().startPomodoro(next);
        return next;
      },

      setAmbientLevel: (layer, level) => set((state) => ({
        ambientLevels: {
          ...state.ambientLevels,
          [layer]: Math.min(1, Math.max(0, level)),
        },
      })),

      resetAmbient: () => set({ ambientLevels: { ...AMBIENT_DEFAULTS } }),
    }),
    {
      name: 'lofi-radio-storage',
      version: 2,
      partialize: (state): PersistedAudioState => ({
        volume: state.volume,
        stationIndex: state.stationIndex,
        accumulatedFocusTime: state.accumulatedFocusTime,
        focusDate: state.focusDate,
        // focusStartTime is now persisted: previously a page reload while
        // playing silently discarded the entire in-flight session.
        focusStartTime: state.focusStartTime,
        dailyFocus: state.dailyFocus,
        sleepTimerMinutes: state.sleepTimerMinutes,
        sleepTimerEndTime: state.sleepTimerEndTime,
        favorites: state.favorites,
        recentlyPlayed: state.recentlyPlayed,
        customStations: state.customStations,
        pomodoroEnabled: state.pomodoroEnabled,
        pomodoroFocusMinutes: state.pomodoroFocusMinutes,
        pomodoroBreakMinutes: state.pomodoroBreakMinutes,
        pomodoroPhase: state.pomodoroPhase,
        pomodoroEndTime: state.pomodoroEndTime,
        pomodoroRound: state.pomodoroRound,
        ambientLevels: state.ambientLevels,
      }),
      // zustand merges whatever this returns over the freshly created store, so
      // a partial object is safe at runtime even though the type wants the full
      // persisted shape — hence the casts below.
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<PersistedAudioState>;
        if (version >= 2) return state as PersistedAudioState;

        // v1 tracked a single day (focusDate + accumulatedFocusTime). Seed the
        // history map with it so existing users keep that day in the chart.
        const seeded: Record<string, number> = { ...(state.dailyFocus ?? {}) };
        if (state.focusDate && (state.accumulatedFocusTime ?? 0) > 0) {
          seeded[state.focusDate] = state.accumulatedFocusTime as number;
        }
        return {
          ...state,
          dailyFocus: seeded,
          favorites: state.favorites ?? [],
          recentlyPlayed: state.recentlyPlayed ?? [],
          customStations: state.customStations ?? [],
          ambientLevels: { ...AMBIENT_DEFAULTS, ...(state.ambientLevels ?? {}) },
        } as PersistedAudioState;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const catalogue = catalogueOf(state.customStations ?? []);
        if (state.stationIndex !== undefined) {
          state.currentStation = catalogue[state.stationIndex] || catalogue[0];
        }
        // A persisted focusStartTime from a previous day would otherwise inflate
        // today's total by everything since then.
        if (state.focusStartTime && state.focusDate !== getCurrentDate()) {
          state.focusStartTime = null;
        }
      },
    }
  )
);

/** Built-in + user-added stations for the current store state. */
export function selectCatalogue(state: AudioState): Station[] {
  return catalogueOf(state.customStations);
}
