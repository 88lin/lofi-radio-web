'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAudioStore } from '@/store/audioStore';
import { Station } from '@/lib/stations';
import Hls from 'hls.js';

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

export function useAudioPlayer() {
  const audioRef = useRef<HTMLMediaElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const flvPlayerRef = useRef<FlvPlayer | null>(null);
  
  // 请求版本控制 - 解决竞态条件
  const loadRequestIdRef = useRef(0);
  const currentLoadingIdRef = useRef<string | null>(null);
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

  const {
    currentStation,
    volume,
    isMuted,
    userWantsPlay,
    setPlaying,
    setLoading,
    setError,
  } = useAudioStore();

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
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.load();
    }
  }, []);

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
          console.error('[Player] Play error:', err);
          setLoading(false);
          setPlaying(false);
        }
      });
  }, [setPlaying, setLoading]);

  // 加载 Bilibili 直播流
  const loadBilibiliStream = useCallback(async (station: Station, requestId: number): Promise<boolean> => {
    const audio = audioRef.current;
    if (!audio) return false;

    const proxyErrorMessage = '请关闭代理后刷新';
    const transientErrorMessage = '加载失败，请刷新';

    // 统一的 Bilibili HLS 加载逻辑
    const loadBilibiliHls = async (hlsUrl: string): Promise<boolean> => {
      if (Hls.isSupported()) {
        isLoadingBilibiliRef.current = false;

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
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (requestId !== loadRequestIdRef.current) return;
          if (data.fatal) {
            setLoading(false);
          }
        });

        const parsed = await new Promise<boolean>((resolve) => {
          let resolved = false;
          let timeoutId: number | null = null;

          const handleManifestParsed = () => {
            if (resolved) return;
            resolved = true;
            if (timeoutId) clearTimeout(timeoutId);
            hls.off(Hls.Events.MANIFEST_PARSED, handleManifestParsed);
            resolve(true);
          };

          hls.on(Hls.Events.MANIFEST_PARSED, handleManifestParsed);
          timeoutId = window.setTimeout(() => {
            if (resolved) return;
            resolved = true;
            hls.off(Hls.Events.MANIFEST_PARSED, handleManifestParsed);
            resolve(false);
          }, 3000);
        });

        if (requestId !== loadRequestIdRef.current) return false;

        if (!parsed) {
          hls.destroy();
          return false;
        }

        hlsRef.current = hls;
        return true;
      }

      if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari HLS support
        isLoadingBilibiliRef.current = false;
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
          }, 3000);
        });

        if (requestId !== loadRequestIdRef.current) return false;

        if (!canPlay) {
          return false;
        }

        return true;
      }

      return false;
    };

    console.log('[Player] Loading Bilibili stream for:', station.name);

    try {
      // 从 URL 提取房间号
      const urlMatch = station.url.match(/live\.bilibili\.com\/(\d+)/);
      const roomId = urlMatch ? urlMatch[1] : '27519423';

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

      if (data.hls_url) {
        console.log('[Player] Trying HLS stream first');
        const hlsLoaded = await loadBilibiliHls(data.hls_url);

        if (requestId !== loadRequestIdRef.current) {
          console.log('[Player] Request expired after loading HLS');
          return false;
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

          return await loadBilibiliStream(station, requestId);
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

        // Bilibili 代理环境常见 403：先按网络抖动处理，连续失败再提示关闭代理
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
            setError(true, proxyErrorMessage);
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

              const retryLoaded = await loadBilibiliStream(station, requestId);
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
          
          hls.on(Hls.Events.ERROR, (_, data) => {
            console.error('[Player] HLS error:', data.type, data.details);
            if (requestId !== loadRequestIdRef.current) return;
            
            if (data.fatal) {
              setError(true, '加载失败，请刷新');
            }
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
    
    // playing 事件 - 只有音频真正在播放时才触发
    const handlePlaying = () => {
      setLoading(false);
      setPlaying(true);
    };
    
    // pause 事件
    const handlePause = () => {
      setPlaying(false);
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
            message = '不支持的格式';
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

  // 监听电台变化
  useEffect(() => {
    if (!currentStation || !audioRef.current) return;
    
    // 只有电台 ID 真正改变时才加载
    if (currentLoadingIdRef.current !== currentStation.id) {
      loadStation(currentStation);
    }
  }, [currentStation?.id, loadStation]);

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
      audio.pause();
      setLoading(false);
    }
  }, [userWantsPlay, currentStation, tryPlay, setLoading]);

  // 监听音量变化
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  return null;
}
