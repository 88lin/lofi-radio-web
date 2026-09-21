'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAudioStore } from '@/store/audioStore';
import { createHlsRecoveryController } from '@/lib/hls-recovery';
import { isSelfInitiatedPause, nextPlayIntent } from '@/lib/media-intent';
import { Station } from '@/lib/stations';
import Hls, { type ErrorData } from 'hls.js';

// flv.js 类型定义
type FlvPlayer = {
  attachMediaElement: (media: HTMLMediaElement) => void;
  load: () => void;
  destroy: () => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  off: (event: string, callback: (...args: unknown[]) => void) => void;
  unload: () => void;
};

type FlvJs = {
  isSupported: () => boolean;
  createPlayer: (...args: unknown[]) => FlvPlayer;
  Events: { ERROR: string; LOADING_COMPLETE: string; RECOVERED_EARLY_EOF: string; MEDIA_INFO: string; METADATA_ARRIVED: string; SCRIPTDATA_ARRIVED: string; STATISTICS_INFO: string };
  ErrorTypes: { NETWORK_ERROR: string; MEDIA_ERROR: string; OTHER_ERROR: string };
  ErrorDetails: { 
    NETWORK_STATUS_CODE_INVALID: string; 
    NETWORK_TIMEOUT: string; 
    NETWORK_UNRECOVERABLE_EARLY_EOF: string;
    NETWORK_INVALID_APP: string;
    MEDIA_MSE_ERROR: string;
  };
};

// 动态加载 flv.js
let flvjs: FlvJs | null = null;
const loadFlvJs = async (): Promise<FlvJs | null> => {
  if (flvjs) return flvjs;
  if (typeof window === 'undefined') return null;
  try {
    const flvModule = await import('flv.js');
    flvjs = (flvModule.default || flvModule) as unknown as FlvJs;
    return flvjs;
  } catch (e) {
    console.error('[Player] Failed to load flv.js:', e);
    return null;
  }
};

// Bilibili 直播流信息接口
interface BilibiliStreamInfo {
  success: boolean;
  room_id: string;
  title: string;
  live_status: number;
  flv_url: string;
  hls_url: string | null;
  hls_backup_urls?: string[];
  backup_urls: string[];
  timestamp: number;
}

interface BilibiliStreamError {
  error?: string;
  message?: string;
  live_status?: number;
  title?: string;
}

// 手动实现带超时的 fetch（兼容性更好）
type LoadBilibiliStream = (station: Station, requestId: number) => Promise<boolean>;

const fetchWithTimeout = async (url: string, timeout: number = 15000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

/**
 * 看门狗的三个阈值。
 *
 * 之所以要分三档而不是一个超时：「连不上」和「网络慢」的正确处置是相反的。
 * 慢就该接着等（数据在往回走，几十秒后自己会响）；这时候报错会诱导用户点重试，
 * 而重试会 destroy 掉 hls 实例、清空已经缓冲的部分，从头再来——在弱网下
 * 用户可能永远等不到那一次成功。
 */
// 迟迟没出声先给个「网络较慢」的提示。只是提示，不是错误，也不打断加载。
const SLOW_HINT_MS = 10000;
/**
 * 一个字节都没动过多久才算「连不上」。
 *
 * 给到 60s 是因为两边的代价不对称：弱网下 DNS + 建连 + 首包本来就可能耗掉
 * 半分钟到一分钟，这时候误报会把用户推去点重试、丢掉已有进度；而真的连不上时
 * 多等这十几秒的代价只是提示晚一点——何况 10s 起就已经在显示「仍在连接」了。
 * 注意这一档只兜「完全没有任何数据回来」；真的下载起来之后计时会被不断重置，
 * 缓冲阶段再慢也不会触发。
 */
const NO_PROGRESS_TIMEOUT_MS = 60000;
// 即便一直在下载，迟迟放不出声的绝对上限（例如拿到的根本不是能播的流）。
const CONNECT_CEILING_MS = 120000;
const WATCHDOG_PROBE_MS = 1000;

export function useAudioPlayer() {
  const audioRef = useRef<HTMLMediaElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const flvPlayerRef = useRef<FlvPlayer | null>(null);
  
  // 请求版本控制 - 解决竞态条件
  const loadRequestIdRef = useRef(0);
  const currentLoadingIdRef = useRef<string | null>(null);
  // 记录最近一次加载使用的重试令牌，令牌变化时强制重载当前电台
  const lastLoadTokenRef = useRef<number | null>(null);
  // 标记当前是否正在加载 Bilibili 流（flv.js 会处理错误）
  const isLoadingBilibiliRef = useRef(false);
  // Bilibili 403 自动恢复状态（每次请求只尝试一次）
  const bilibiliRecoveryRef = useRef({
    requestId: -1,
    attempted: false,
    inProgress: false,
    proxyHits: 0,
    hlsRefreshCount: 0,
  });
  // loadBilibiliStream 需要在内部重试时自我调用，这里用 ref 转发，避免在声明前引用自身
  const loadBilibiliStreamRef = useRef<LoadBilibiliStream | null>(null);
  // 最近一次站内发起暂停的时刻，用来把它和原生暂停区分开，见 media-intent.ts
  const selfPauseAtRef = useRef(0);

  const {
    currentStation,
    volume,
    isMuted,
    userWantsPlay,
    stationLoadToken,
    setPlaying,
    setLoading,
    setError,
    setSlowConnection,
  } = useAudioStore();

  /**
   * 站内发起的暂停。记下时刻，handlePause 才能把它和原生暂停区分开。
   * 只在确实还在播时记——已经是暂停态时 pause() 不会再触发事件，
   * 记下来只会让紧随其后的一次原生暂停落进时间窗里被误判。
   */
  const pauseMedia = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) selfPauseAtRef.current = Date.now();
    audio.pause();
  }, []);

  // 清理函数
  const cleanup = useCallback(() => {
    isLoadingBilibiliRef.current = false;
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (flvPlayerRef.current) {
      try {
        flvPlayerRef.current.destroy();
      } catch (e) {}
      flvPlayerRef.current = null;
    }
    if (audioRef.current) {
      pauseMedia();
      // 注意：不能用 src = ''。空字符串会被解析成当前页面地址，浏览器会去把
      // HTML 当媒体加载，随后异步抛出 MEDIA_ERR_SRC_NOT_SUPPORTED，把
      // loadStation() 刚刚清空的错误状态重新写成"该音源在当前网络环境下不可用"。
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
  }, [pauseMedia]);

  // 尝试播放音频
  const tryPlay = useCallback((requestId: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    // 检查是否是最新请求
    if (requestId !== loadRequestIdRef.current) {
      console.log('[Player] Stale play request, ignoring');
      return;
    }
    
    // 再次从 store 读取最新的用户意图
    const latestUserWantsPlay = useAudioStore.getState().userWantsPlay;
    if (!latestUserWantsPlay) {
      console.log('[Player] User no longer wants to play, skipping');
      setLoading(false);
      return;
    }

    audio.play()
      .then(() => {
        // play() resolve 不代表音频正在播放
        // 真正的播放状态由 playing 事件处理
      })
      .catch((err) => {
        // 再次检查是否是最新请求
        if (requestId !== loadRequestIdRef.current) return;
        
        if (err.name === 'NotAllowedError') {
          console.log('[Player] Autoplay blocked, user interaction required');
          setPlaying(false);
          setLoading(false);
        } else if (err.name === 'AbortError') {
          console.log('[Player] Play request interrupted by media reload');
        } else {
          // 必须 setError：不报错的话这条失败对用户完全不可见——按钮停在「暂停」，
          // 既没有声音也没有提示。地区阻断下 play() 抛的 NotSupportedError
          // 原本就是在这里被吞掉的。
          console.error('[Player] Play error:', err);
          setPlaying(false);
          setError(
            true,
            err.name === 'NotSupportedError'
              ? '该音源在当前网络环境下不可用'
              : '播放失败，请重试',
          );
        }
      });
  }, [setPlaying, setLoading, setError]);

  // 加载 Bilibili 直播流
  const loadBilibiliStream = useCallback<LoadBilibiliStream>(async (station, requestId) => {
    const audio = audioRef.current;
    if (!audio) return false;

    // 重新拉取流地址并重试（通过 ref 自我调用）
    const retryLoadStream = async (): Promise<boolean> =>
      (await loadBilibiliStreamRef.current?.(station, requestId)) ?? false;

    const repeatedNetworkErrorMessage = '直播源连接失败，请稍后重试';
    const transientErrorMessage = '加载失败，请刷新';

    // 统一的 Bilibili HLS 加载逻辑
    const loadBilibiliHls = async (hlsUrl: string): Promise<boolean> => {
      if (Hls.isSupported()) {
        if (flvPlayerRef.current) {
          try {
            flvPlayerRef.current.destroy();
          } catch (e) {}
          flvPlayerRef.current = null;
        }

        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }

        const hls = new Hls({ enableWorker: true, maxBufferLength: 30 });
        hls.loadSource(hlsUrl);
        hls.attachMedia(audio);
        // settled 之前的致命错误属于「初始加载失败」，
        // 由外层的候选地址循环处理（换下一个地址），这里不重复介入
        let settled = false;
        const recovery = createHlsRecoveryController();
        hls.on(Hls.Events.FRAG_BUFFERED, () => recovery.resetOnProgress());
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (requestId !== loadRequestIdRef.current || !data.fatal || !settled) return;
          // hls.js 官方恢复策略：网络错误重新拉流、媒体错误恢复解码，
          // 各自连续失败 3 次后才收敛为用户可见的错误提示
          const action = recovery.next(data.type);
          if (action === 'restart-load') {
            hls.startLoad();
            return;
          }
          if (action === 'recover-media') {
            hls.recoverMediaError();
            return;
          }
          setError(true, '直播中断，请重试');
          setLoading(false);
        });

        const parsed = await new Promise<boolean>((resolve) => {
          let resolved = false;
          let timeoutId: number | null = null;

          const finish = (result: boolean) => {
            if (resolved) return;
            resolved = true;
            if (timeoutId) clearTimeout(timeoutId);
            hls.off(Hls.Events.MANIFEST_PARSED, handleManifestParsed);
            hls.off(Hls.Events.ERROR, handleInitialError);
            resolve(result);
          };

          const handleManifestParsed = () => finish(true);
          const handleInitialError = (_event: string, data: ErrorData) => {
            if (data.fatal) finish(false);
          };

          hls.on(Hls.Events.MANIFEST_PARSED, handleManifestParsed);
          hls.on(Hls.Events.ERROR, handleInitialError);
          timeoutId = window.setTimeout(() => finish(false), 5000);
        });

        if (requestId !== loadRequestIdRef.current) return false;

        if (!parsed) {
          hls.destroy();
          return false;
        }

        // 进入播放阶段，之后的致命错误走恢复/报错逻辑
        settled = true;
        hlsRef.current = hls;
        isLoadingBilibiliRef.current = false;
        return true;
      }

      if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari HLS support
        audio.src = hlsUrl;
        audio.load();
        const canPlay = await new Promise<boolean>((resolve) => {
          let resolved = false;
          let timeoutId: number | null = null;

          const onCanPlay = () => {
            if (resolved) return;
            resolved = true;
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('error', onError);
            if (timeoutId) clearTimeout(timeoutId);
            resolve(true);
          };

          const onError = () => {
            if (resolved) return;
            resolved = true;
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('error', onError);
            if (timeoutId) clearTimeout(timeoutId);
            resolve(false);
          };

          audio.addEventListener('canplay', onCanPlay);
          audio.addEventListener('error', onError);
          timeoutId = window.setTimeout(() => {
            if (resolved) return;
            resolved = true;
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('error', onError);
            resolve(false);
          }, 5000);
        });

        if (requestId !== loadRequestIdRef.current) return false;

        if (!canPlay) {
          return false;
        }

        isLoadingBilibiliRef.current = false;
        return true;
      }

      return false;
    };

    console.log('[Player] Loading Bilibili stream for:', station.name);

    try {
      // 从 URL 提取房间号。提取不到就直接报错，
      // 不再静默回落到某个固定房间号（会导致播放的其实是另一个电台）
      const urlMatch = station.url.match(/live\.bilibili\.com\/(\d+)/);
      if (!urlMatch) {
        console.error('[Player] Cannot parse Bilibili room id from url:', station.url);
        setError(true, '直播间地址无效');
        return false;
      }
      const roomId = urlMatch[1];

      console.log('[Player] Fetching stream for room:', roomId);

      // 使用手动超时的 fetch
      const res = await fetchWithTimeout(`/api/bilibili-stream?room_id=${roomId}`, 15000);
      
      // 检查请求是否已过期
      if (requestId !== loadRequestIdRef.current) {
        console.log('[Player] Request expired, ignoring Bilibili response');
        return false;
      }
      
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as BilibiliStreamError | null;
        console.error('[Player] API request failed:', res.status, payload);

        if (requestId !== loadRequestIdRef.current) {
          return false;
        }

        if (res.status === 404 || payload?.live_status === 0) {
          setError(true, '直播未开始');
        } else {
          setError(true, transientErrorMessage);
        }

        return false;
      }

      const data: BilibiliStreamInfo = await res.json();

      // 检查直播状态
      if (data.live_status !== 1) {
        console.log('[Player] Stream is not live');
        setError(true, '直播未开始');
        return false;
      }

      if (!data.success || (!data.hls_url && !data.flv_url)) {
        console.error('[Player] No stream URL in response');
        return false;
      }

      const hlsUrls = [data.hls_url, ...(data.hls_backup_urls ?? [])].filter(
        (url): url is string => Boolean(url)
      );

      if (hlsUrls.length > 0) {
        console.log(`[Player] Trying ${hlsUrls.length} HLS stream candidate(s)`);
        let hlsLoaded = false;

        for (const hlsUrl of hlsUrls) {
          hlsLoaded = await loadBilibiliHls(hlsUrl);

          if (requestId !== loadRequestIdRef.current) {
            console.log('[Player] Request expired after loading HLS');
            return false;
          }

          if (hlsLoaded) {
            break;
          }
        }

        if (hlsLoaded) {
          console.log('[Player] Bilibili stream loaded via HLS');
          return true;
        }

        const recoveryState = bilibiliRecoveryRef.current;
        const nextHlsRefreshCount =
          recoveryState.requestId === requestId ? recoveryState.hlsRefreshCount + 1 : 1;

        if (nextHlsRefreshCount <= 2) {
          bilibiliRecoveryRef.current = {
            ...recoveryState,
            requestId,
            hlsRefreshCount: nextHlsRefreshCount,
          };
          console.warn(`[Player] HLS load failed, refreshing stream info and retrying (${nextHlsRefreshCount}/2)`);
          await new Promise(resolve => setTimeout(resolve, 800));

          if (requestId !== loadRequestIdRef.current) {
            return false;
          }

          return await retryLoadStream();
        }

        console.warn('[Player] HLS load failed, falling back to FLV');
      }

      if (!data.flv_url) {
        console.error('[Player] No FLV URL available after HLS fallback');
        setError(true, transientErrorMessage);
        return false;
      }

      console.log('[Player] Falling back to FLV URL');

      // 加载 flv.js
      const flv = await loadFlvJs();
      if (!flv || !flv.isSupported()) {
        console.error('[Player] flv.js not supported. Trying HLS fallback.');
        if (data.hls_url) {
          const hlsLoaded = await loadBilibiliHls(data.hls_url);
          if (!hlsLoaded) {
            setError(true, transientErrorMessage);
          }
          return hlsLoaded;
        } else {
          setError(true, '浏览器不支持播放此格式');
          return false;
        }
      }

      // 再次检查请求是否过期
      if (requestId !== loadRequestIdRef.current) {
        console.log('[Player] Request expired after loading flv.js');
        return false;
      }

      // 清理之前的播放器
      if (flvPlayerRef.current) {
        try {
          flvPlayerRef.current.destroy();
        } catch (e) {}
        flvPlayerRef.current = null;
      }

      // 创建播放器
      const flvPlayer = flv.createPlayer({
        type: 'flv',
        url: data.flv_url,
        isLive: true,
        hasAudio: true,
        hasVideo: false,
        cors: true,
      }, {
        enableWorker: false,
        enableStashBuffer: false,
        stashInitialSize: 128,
        lazyLoad: false,
        autoCleanupSourceBuffer: true,
        autoCleanupMaxBackwardDuration: 3,
        autoCleanupMinBackwardDuration: 2,
      });

      flvPlayer.attachMediaElement(audio);
      flvPlayer.load();
      flvPlayerRef.current = flvPlayer;

      // 错误处理
      flvPlayer.on(flv.Events.ERROR, (...args: unknown[]) => {
        const [errorType, errorDetail] = args as [string, string];
        console.error('[Player] FLV error:', errorType, errorDetail);
        if (requestId !== loadRequestIdRef.current) return;

        const isNetworkError = errorType === flv?.ErrorTypes?.NETWORK_ERROR;
        const isStatusInvalid =
          errorDetail === flv?.ErrorDetails?.NETWORK_STATUS_CODE_INVALID ||
          errorDetail === 'HttpStatusCodeInvalid';
        const isFetchException = errorDetail === 'Exception';

        // CDN 403 和 fetch 异常都可能由地址失效、地域路由或网络抖动造成。
        if (isNetworkError && (isStatusInvalid || isFetchException)) {
          const recoveryState = bilibiliRecoveryRef.current;

          const nextProxyHits = recoveryState.requestId === requestId
            ? recoveryState.proxyHits + 1
            : 1;

          if (nextProxyHits >= 2) {
            bilibiliRecoveryRef.current = {
              requestId,
              attempted: true,
              inProgress: false,
              proxyHits: nextProxyHits,
              hlsRefreshCount: bilibiliRecoveryRef.current.hlsRefreshCount,
            };
            setError(true, repeatedNetworkErrorMessage);
            setLoading(false);
            return;
          }

          if (recoveryState.requestId === requestId && recoveryState.inProgress) {
            return;
          }

          bilibiliRecoveryRef.current = {
            requestId,
            attempted: true,
            inProgress: true,
            proxyHits: nextProxyHits,
            hlsRefreshCount: bilibiliRecoveryRef.current.hlsRefreshCount,
          };
          setError(false, null);

          void (async () => {
            try {
              if (requestId !== loadRequestIdRef.current) return;

              const latestUserWantsPlay = useAudioStore.getState().userWantsPlay;
              if (!latestUserWantsPlay) {
                setLoading(false);
                return;
              }

              setLoading(true);

              // 1) 先尝试 HLS fallback
              if (data.hls_url) {
                const hlsLoaded = await loadBilibiliHls(data.hls_url);
                if (hlsLoaded) {
                  if (requestId !== loadRequestIdRef.current) return;

                  const wantsPlayAfterHls = useAudioStore.getState().userWantsPlay;
                  if (wantsPlayAfterHls) {
                    tryPlay(requestId);
                  } else {
                    setLoading(false);
                  }
                  return;
                }
              }

              // 2) 再尝试重新获取一次流地址
              await new Promise(resolve => setTimeout(resolve, 800));
              if (requestId !== loadRequestIdRef.current) return;

              const retryLoaded = await retryLoadStream();
              if (requestId !== loadRequestIdRef.current) return;

              if (retryLoaded) {
                const wantsPlayAfterRetry = useAudioStore.getState().userWantsPlay;
                if (wantsPlayAfterRetry) {
                  tryPlay(requestId);
                } else {
                  setLoading(false);
                }
              } else {
                setError(true, transientErrorMessage);
                setLoading(false);
              }
            } catch (error) {
              console.error('[Player] Bilibili recovery error:', error);
              if (requestId === loadRequestIdRef.current) {
                setError(true, transientErrorMessage);
                setLoading(false);
              }
            } finally {
              if (bilibiliRecoveryRef.current.requestId === requestId) {
                bilibiliRecoveryRef.current = {
                  ...bilibiliRecoveryRef.current,
                  inProgress: false,
                };
              }
            }
          })();

          return;
        }
        
        if (isNetworkError) {
          setError(true, '网络错误，请刷新');
          setLoading(false);
        }
      });

      console.log('[Player] Bilibili stream loaded');
      return true;

    } catch (error) {
      console.error('[Player] Bilibili stream load error:', error);
      if (requestId === loadRequestIdRef.current) {
        setError(true, transientErrorMessage);
      }
      return false;
    }
  }, [setError]);

  useEffect(() => {
    loadBilibiliStreamRef.current = loadBilibiliStream;
  }, [loadBilibiliStream]);

  // 加载电台 - 带版本控制，从 store 读取最新播放意图
  const loadStation = useCallback(async (station: Station) => {
    if (!audioRef.current || !station) return;

    // 生成新的请求 ID
    const requestId = ++loadRequestIdRef.current;
    currentLoadingIdRef.current = station.id;
    
    console.log('[Player] Loading station:', station.name, 'requestId:', requestId);

    // 清理之前的资源
    cleanup();
    
    const audio = audioRef.current;
    audio.volume = isMuted ? 0 : volume;
    
    // 设置加载状态
    setLoading(true);
    setError(false, null);
    
    // 标记是否正在加载 Bilibili 流
    isLoadingBilibiliRef.current = station.type === 'bilibili';
    if (station.type === 'bilibili') {
      bilibiliRecoveryRef.current = {
        requestId,
        attempted: false,
        inProgress: false,
        proxyHits: 0,
        hlsRefreshCount: 0,
      };
    }

    let success = false;

    try {
      // Bilibili 直播流
      if (station.type === 'bilibili') {
        success = await loadBilibiliStream(station, requestId);
        
        // 检查请求是否仍然有效
        if (requestId !== loadRequestIdRef.current) {
          console.log('[Player] Request expired after Bilibili load');
          return;
        }
        
        if (success) {
          // 等待数据准备好
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // 再次检查
          if (requestId !== loadRequestIdRef.current) return;
          
          // 从 store 读取最新的用户播放意图
          const latestUserWantsPlay = useAudioStore.getState().userWantsPlay;
          if (latestUserWantsPlay) {
            tryPlay(requestId);
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      }
      // HLS 流
      else if (station.type === 'm3u8') {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            maxBufferLength: 30,
          });
          
          hls.loadSource(station.url);
          hls.attachMedia(audio);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            // 检查请求是否有效
            if (requestId !== loadRequestIdRef.current) {
              console.log('[Player] Stale HLS manifest, ignoring');
              return;
            }

            // 从 store 读取最新的用户播放意图
            const latestUserWantsPlay = useAudioStore.getState().userWantsPlay;
            if (latestUserWantsPlay) {
              tryPlay(requestId);
            } else {
              setLoading(false);
            }
          });

          // 播放中的致命错误先按 hls.js 官方策略自动恢复（网络错误重拉流、
          // 媒体错误恢复解码；两类错误各自连续失败 3 次后才提示用户）
          const recovery = createHlsRecoveryController();
          hls.on(Hls.Events.FRAG_BUFFERED, () => recovery.resetOnProgress());
          hls.on(Hls.Events.ERROR, (_, data) => {
            console.error('[Player] HLS error:', data.type, data.details);
            if (requestId !== loadRequestIdRef.current || !data.fatal) return;

            const action = recovery.next(data.type);
            if (action === 'restart-load') {
              hls.startLoad();
              return;
            }
            if (action === 'recover-media') {
              hls.recoverMediaError();
              return;
            }

            setError(true, '播放中断，请重试');
          });
          
          hlsRef.current = hls;
          success = true;
        } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari 原生支持
          audio.src = station.url;
          audio.load();
          success = true;
          
          // Safari 等待数据 - 带清理
          await new Promise<void>((resolve) => {
            let resolved = false;
            let timeoutId: number | null = null;
            
            const onCanPlay = () => {
              if (resolved) return;
              resolved = true;
              audio.removeEventListener('canplay', onCanPlay);
              if (timeoutId) clearTimeout(timeoutId);
              resolve();
            };
            
            audio.addEventListener('canplay', onCanPlay);
            timeoutId = window.setTimeout(() => {
              if (resolved) return;
              resolved = true;
              audio.removeEventListener('canplay', onCanPlay);
              resolve();
            }, 3000);
          });
          
          // 检查请求是否有效
          if (requestId !== loadRequestIdRef.current) return;
          
          // 从 store 读取最新的用户播放意图
          const latestUserWantsPlay = useAudioStore.getState().userWantsPlay;
          if (latestUserWantsPlay) {
            tryPlay(requestId);
          } else {
            setLoading(false);
          }
        }
      }
      // MP3 流
      else {
        audio.src = station.url;
        audio.load();
        success = true;
        
        // 等待数据准备好 - 带清理
        await new Promise<void>((resolve) => {
          let resolved = false;
          let timeoutId: number | null = null;
          
          const onCanPlay = () => {
            if (resolved) return;
            resolved = true;
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('error', onError);
            if (timeoutId) clearTimeout(timeoutId);
            resolve();
          };
          
          const onError = () => {
            if (resolved) return;
            resolved = true;
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('error', onError);
            if (timeoutId) clearTimeout(timeoutId);
            resolve();
          };
          
          audio.addEventListener('canplay', onCanPlay);
          audio.addEventListener('error', onError);
          timeoutId = window.setTimeout(() => {
            if (resolved) return;
            resolved = true;
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('error', onError);
            resolve();
          }, 5000);
        });
        
        // 检查请求是否有效
        if (requestId !== loadRequestIdRef.current) return;
        
        // 从 store 读取最新的用户播放意图
        const latestUserWantsPlay = useAudioStore.getState().userWantsPlay;
        if (latestUserWantsPlay) {
          tryPlay(requestId);
        } else {
          setLoading(false);
        }
      }

    } catch (error) {
      console.error('[Player] Load station error:', error);
      if (requestId === loadRequestIdRef.current) {
        isLoadingBilibiliRef.current = false;
        setError(true, '加载失败，请刷新');
      }
    }

    if (!success && requestId === loadRequestIdRef.current) {
      isLoadingBilibiliRef.current = false;
      setLoading(false);
    }
  }, [cleanup, loadBilibiliStream, volume, isMuted, setLoading, setError, tryPlay]);

  // 初始化音频元素
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const audio = document.createElement('video');
    audio.style.display = 'none';
    audio.playsInline = true;
    audio.preload = 'metadata';
    audio.volume = 0.5;
    document.body.appendChild(audio);
    audioRef.current = audio;
    
    // 把 pause / playing 反映到播放意图上。判定见 media-intent.ts：
    // 意图停在 true 会让看门狗把用户主动暂停误报成中断，停在 false 会让
    // 站内按钮反过来（显示「播放」、点一下反而继续播），看门狗也不会启动。
    const syncPlayIntent = (event: 'pause' | 'playing') => {
      const store = useAudioStore.getState();
      const action = nextPlayIntent({
        event,
        paused: audio.paused,
        ended: audio.ended,
        selfInitiated: isSelfInitiatedPause(Date.now(), selfPauseAtRef.current),
        userWantsPlay: store.userWantsPlay,
      });

      if (action === 'release') store.requestPause();
      else if (action === 'restore') store.requestPlay();
    };

    // playing 事件 - 只有音频真正在播放时才触发
    const handlePlaying = () => {
      setLoading(false);
      setPlaying(true);
      syncPlayIntent('playing');
    };

    // pause 事件
    const handlePause = () => {
      setPlaying(false);
      syncPlayIntent('pause');
    };
    
    // waiting 事件 - 缓冲中
    const handleWaiting = () => {
      setLoading(true);
    };
    
    // canplay 事件 - 可以播放了
    const handleCanPlay = () => {
      setLoading(false);
    };
    
    // error 事件
    const handleError = (e: Event) => {
      const audioEl = e.target as HTMLMediaElement;
      const error = audioEl?.error;
      
      // 如果是 Bilibili 流，忽略 audio 元素的错误（flv.js 会处理）
      // isLoadingBilibiliRef 标记当前正在使用 flv.js 加载 Bilibili 流
      if (isLoadingBilibiliRef.current) {
        console.log('[Player] Audio error ignored (loading Bilibili stream):', error?.code);
        return;
      }
      
      console.error('[Player] Audio error:', error?.code, error?.message);
      
      if (error) {
        let message = '播放失败';
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            message = '播放被中止';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            message = '网络错误';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            message = '解码错误';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            message = '该音源在当前网络环境下不可用';
            break;
        }
        setError(true, message);
      }
    };
    
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      cleanup();
      audio.pause();
      audio.remove();
    };
  }, []);

  // 监听电台变化 / 重试令牌变化
  useEffect(() => {
    if (!currentStation || !audioRef.current) return;

    // 电台 ID 真正改变、或用户触发了重试（令牌变化）时才（重新）加载
    if (
      currentLoadingIdRef.current !== currentStation.id ||
      lastLoadTokenRef.current !== stationLoadToken
    ) {
      lastLoadTokenRef.current = stationLoadToken;
      loadStation(currentStation);
    }
  }, [currentStation?.id, stationLoadToken, loadStation]);

  // 监听用户播放意图 - 订阅 userWantsPlay 变化
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (userWantsPlay) {
      // 用户想要播放 - 如果电台已加载完成，尝试播放
      if (currentLoadingIdRef.current === currentStation?.id) {
        const requestId = loadRequestIdRef.current;
        tryPlay(requestId);
      }
    } else {
      // 用户想要暂停 - 立即暂停
      pauseMedia();
      setLoading(false);
    }
  }, [userWantsPlay, currentStation, tryPlay, setLoading, pauseMedia]);

  // 监听音量变化
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  /**
   * 播放看门狗。
   *
   * 其余的错误处理全部挂在 media 的 error 事件和 hls.js / flv.js 的 fatal error 上，
   * 而地区阻断、DNS 污染这类故障里连接是被丢包吃掉的：不会 RST、不触发 error，
   * 浏览器只发一个 waiting，UI 就永远停在「加载中」——没有声音也没有任何提示。
   *
   * 但「连不上」和「慢」必须分开判。判据是有没有**任何进展**：
   * currentTime 前进、buffered 变长、readyState 上升，三者任一成立就说明
   * 数据在往回走，只是慢，这时候绝不能报错（见上面阈值处的说明）。
   * 这三个信号对 MP3 / HLS / FLV 三条路径都成立——HLS 和 FLV 走 MediaSource，
   * 分片每 append 一次 buffered 就会变长。
   *
   * 另外看门狗只改 store，不碰播放器：报了错底下的加载也还在跑，
   * 用户什么都不做也可能自己响起来，那时 setPlaying(true) 会把错误清掉。
   * 它同时兜「一直没连上」和「放着放着断流」两种情况——后者不会触发
   * pause 事件，isPlaying 会一直停在 true，只靠事件是发现不了的。
   */
  useEffect(() => {
    if (!userWantsPlay || !currentStation) return;

    const audio = audioRef.current;
    if (!audio) return;

    const progressMark = () => {
      let buffered = 0;
      for (let i = 0; i < audio.buffered.length; i += 1) {
        buffered += audio.buffered.end(i) - audio.buffered.start(i);
      }
      return `${audio.currentTime}|${audio.readyState}|${buffered.toFixed(3)}`;
    };

    const startedAt = Date.now();
    let lastMark = progressMark();
    let lastProgressAt = startedAt;
    let hasSounded = false;
    let hintedSlow = false;
    let gaveUp = false;

    const timerId = window.setInterval(() => {
      const state = useAudioStore.getState();
      if (!state.userWantsPlay) return;

      const now = Date.now();
      const mark = progressMark();
      if (mark !== lastMark) {
        lastMark = mark;
        lastProgressAt = now;
        if (state.isPlaying && audio.currentTime > 0) hasSounded = true;
      }

      const stalledFor = now - lastProgressAt;
      const waitedFor = now - startedAt;
      // 「用户已经多久没听到声音了」。出过声之后只看卡了多久，
      // 还没出声则从点播那一刻算起——不然数据一直在慢慢下，
      // 用户等了半分钟却连个「还在连」都看不到。
      const silentFor = hasSounded ? stalledFor : waitedFor;

      if (silentFor < SLOW_HINT_MS) {
        if (hintedSlow) {
          hintedSlow = false;
          setSlowConnection(false);
        }
        gaveUp = false;
        return;
      }

      // 断流（一点数据都不回来了）和「连上了但迟迟起不来」分开判。
      // 绝对上限只管「还没出声」这一段：已经放过的流卡住是断流，不是连不上。
      const deadStall = stalledFor >= NO_PROGRESS_TIMEOUT_MS;
      const tooLongToStart = !hasSounded && waitedFor >= CONNECT_CEILING_MS;

      if (deadStall || tooLongToStart) {
        if (gaveUp) return; // 报一次就够，不要每秒刷一遍同一个错误
        gaveUp = true;
        console.warn(
          `[Player] Watchdog giving up: no progress for ${stalledFor}ms, waited ${waitedFor}ms, sounded=${hasSounded}`,
        );
        setError(
          true,
          hasSounded
            ? '播放中断了，请重试或换一个电台'
            : deadStall
              ? '连接不上这个音源，可能被网络环境拦截了，换一个电台试试'
              : '音源响应过慢，请重试或换一个电台',
        );
        return;
      }

      if (!hintedSlow) {
        hintedSlow = true;
        setSlowConnection(true);
      }
    }, WATCHDOG_PROBE_MS);

    return () => {
      window.clearInterval(timerId);
      setSlowConnection(false);
    };
  }, [userWantsPlay, currentStation?.id, stationLoadToken, setError, setSlowConnection]);

  return null;
}
