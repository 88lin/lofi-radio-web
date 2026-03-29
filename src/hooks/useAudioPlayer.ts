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
  createPlayer: (config: Record<string, unknown>, options?: Record<string, unknown>) => FlvPlayer;
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
    console.log('[Player] Loading flv.js module...');
    const module = await import('flv.js');
    flvjs = module.default || module;
    console.log('[Player] flv.js loaded successfully');
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
  backup_urls: string[];
  timestamp: number;
}

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const flvPlayerRef = useRef<FlvPlayer | null>(null);
  
  // 使用 ref 跟踪状态，避免闭包问题
  const currentStationIdRef = useRef<string | null>(null);
  const isLoadingStationRef = useRef(false);
  const userWantsPlayRef = useRef(false); // 用户是否想要播放

  const {
    isPlaying,
    currentStation,
    volume,
    isMuted,
    setPlaying,
    setLoading,
  } = useAudioStore();

  // 清理函数
  const cleanup = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (flvPlayerRef.current) {
      try {
        flvPlayerRef.current.destroy();
      } catch (e) {
        console.error('[Player] Error destroying flv player:', e);
      }
      flvPlayerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.load();
    }
  }, []);

  // 尝试播放音频 - 只有真正播放成功才更新状态
  const tryPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.log('[Player] No audio element');
      return;
    }

    console.log('[Player] Attempting to play...');
    
    audio.play()
      .then(() => {
        console.log('[Player] Play promise resolved');
        // 注意：play() resolve 不代表音频正在播放
        // 真正的播放状态由 playing 事件处理
      })
      .catch((err) => {
        console.error('[Player] Play failed:', err.message);
        if (err.name === 'NotAllowedError') {
          console.log('[Player] Autoplay blocked, waiting for user interaction');
          setPlaying(false);
          setLoading(false);
          userWantsPlayRef.current = true;
        } else {
          // 其他错误
          setLoading(false);
          setPlaying(false);
        }
      });
  }, [setPlaying, setLoading]);

  // 加载 Bilibili 直播流
  const loadBilibiliStream = useCallback(async (station: Station): Promise<boolean> => {
    const audio = audioRef.current;
    if (!audio) return false;

    console.log('[Player] Loading Bilibili stream for:', station.name);

    try {
      // 从 URL 提取房间号
      const urlMatch = station.url.match(/live\.bilibili\.com\/(\d+)/);
      const roomId = urlMatch ? urlMatch[1] : '27519423';

      console.log('[Player] Fetching stream for room:', roomId);

      // 通过 API 获取直播流地址
      const res = await fetch(`/api/bilibili-stream?room_id=${roomId}`, {
        signal: AbortSignal.timeout(15000)
      });
      
      if (!res.ok) {
        console.error('[Player] API request failed:', res.status);
        return false;
      }

      const data: BilibiliStreamInfo = await res.json();

      if (!data.success || !data.flv_url) {
        console.error('[Player] No stream URL in response');
        return false;
      }

      console.log('[Player] Got FLV URL');

      // 加载 flv.js
      const flv = await loadFlvJs();
      if (!flv || !flv.isSupported()) {
        console.error('[Player] flv.js not supported');
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

      // 错误处理 - 只记录日志，不自动跳转
      flvPlayer.on(flv.Events.ERROR, (errorType: string, errorDetail: string) => {
        console.error('[Player] FLV error:', errorType, errorDetail);
        // 如果是致命错误，停止加载状态
        if (errorType === flv?.ErrorTypes?.NETWORK_ERROR) {
          console.error('[Player] FLV network error, stream may be unavailable');
          setLoading(false);
        }
      });

      console.log('[Player] Bilibili stream loaded');
      return true;

    } catch (error) {
      console.error('[Player] Bilibili stream load error:', error);
      return false;
    }
  }, [setLoading]);

  // 加载电台 - 核心函数
  const loadStation = useCallback(async (station: Station) => {
    if (!audioRef.current || !station) return;
    
    // 防止重复加载同一个电台
    if (isLoadingStationRef.current && currentStationIdRef.current === station.id) {
      console.log('[Player] Already loading this station:', station.name);
      return;
    }

    console.log('[Player] === Loading station:', station.name, station.type, '===');
    
    isLoadingStationRef.current = true;
    
    // 清理之前的资源
    cleanup();
    
    const audio = audioRef.current;
    audio.volume = isMuted ? 0 : volume;
    
    // 设置加载状态
    setLoading(true);
    // 先重置播放状态，等真正播放时再设置
    setPlaying(false);

    let success = false;

    try {
      // Bilibili 直播流
      if (station.type === 'bilibili') {
        success = await loadBilibiliStream(station);
        if (success) {
          currentStationIdRef.current = station.id;
          isLoadingStationRef.current = false;
          
          // 等待数据准备好
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // 如果用户想要播放，尝试播放
          if (userWantsPlayRef.current) {
            tryPlay();
          } else {
            setLoading(false);
          }
        } else {
          isLoadingStationRef.current = false;
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
            console.log('[Player] HLS manifest parsed');
            currentStationIdRef.current = station.id;
            isLoadingStationRef.current = false;
            
            // 如果用户想要播放，尝试播放
            if (userWantsPlayRef.current) {
              tryPlay();
            } else {
              setLoading(false);
            }
          });
          
          hls.on(Hls.Events.ERROR, (_, data) => {
            console.error('[Player] HLS error:', data.type, data.details);
            if (data.fatal) {
              console.error('[Player] HLS fatal error');
              isLoadingStationRef.current = false;
              setLoading(false);
            }
          });
          
          hlsRef.current = hls;
          success = true;
        } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari 原生支持
          audio.src = station.url;
          audio.load();
          currentStationIdRef.current = station.id;
          success = true;
          isLoadingStationRef.current = false;
          
          // Safari 等待数据
          await new Promise<void>((resolve) => {
            const onCanPlay = () => {
              audio.removeEventListener('canplay', onCanPlay);
              resolve();
            };
            audio.addEventListener('canplay', onCanPlay);
            setTimeout(resolve, 3000); // 超时保护
          });
          
          if (userWantsPlayRef.current) {
            tryPlay();
          } else {
            setLoading(false);
          }
        }
      }
      // MP3 流
      else {
        audio.src = station.url;
        audio.load();
        currentStationIdRef.current = station.id;
        success = true;
        isLoadingStationRef.current = false;
        
        // 等待数据准备好
        await new Promise<void>((resolve) => {
          const onCanPlay = () => {
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('error', onError);
            resolve();
          };
          const onError = () => {
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('error', onError);
            resolve();
          };
          audio.addEventListener('canplay', onCanPlay);
          audio.addEventListener('error', onError);
          setTimeout(resolve, 5000); // 超时保护
        });
        
        if (userWantsPlayRef.current) {
          tryPlay();
        } else {
          setLoading(false);
        }
      }

    } catch (error) {
      console.error('[Player] Load station error:', error);
      isLoadingStationRef.current = false;
      setLoading(false);
    }

    // 如果加载失败，确保状态重置
    if (!success) {
      isLoadingStationRef.current = false;
      setLoading(false);
    }
  }, [cleanup, loadBilibiliStream, volume, isMuted, setLoading, setPlaying, tryPlay]);

  // 初始化音频元素
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = 0.3;
    audioRef.current = audio;
    
    // playing 事件 - 只有音频真正在播放时才触发
    const handlePlaying = () => {
      console.log('[Player] Audio PLAYING event - actually playing now');
      setLoading(false);
      setPlaying(true);
    };
    
    // pause 事件
    const handlePause = () => {
      console.log('[Player] Audio pause event');
      // 不要在这里设置 isPlaying = false，因为可能是切换电台
    };
    
    // waiting 事件 - 缓冲中
    const handleWaiting = () => {
      console.log('[Player] Audio waiting/buffering event');
      setLoading(true);
    };
    
    // canplay 事件 - 可以播放了
    const handleCanPlay = () => {
      console.log('[Player] Audio canplay event');
      setLoading(false);
    };
    
    // error 事件
    const handleError = (e: Event) => {
      const audioEl = e.target as HTMLAudioElement;
      const error = audioEl?.error;
      console.error('[Player] Audio error:', error?.code, error?.message);
      setLoading(false);
      isLoadingStationRef.current = false;
    };
    
    // stalled 事件
    const handleStalled = () => {
      console.log('[Player] Audio stalled event');
    };
    
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('stalled', handleStalled);
    
    return () => {
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('stalled', handleStalled);
      cleanup();
      audio.pause();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听电台变化 - 加载新电台
  useEffect(() => {
    if (!currentStation || !audioRef.current) return;
    
    // 只有电台 ID 真正改变时才加载
    if (currentStationIdRef.current !== currentStation.id) {
      console.log('[Player] Station changed to:', currentStation.name);
      loadStation(currentStation);
    }
  }, [currentStation?.id, loadStation]);

  // 监听播放状态变化 - 控制播放/暂停
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // 如果电台还没加载完成，不处理
    if (currentStationIdRef.current !== currentStation?.id) {
      return;
    }

    console.log('[Player] isPlaying changed to:', isPlaying);

    if (isPlaying) {
      userWantsPlayRef.current = true;
      tryPlay();
    } else {
      userWantsPlayRef.current = false;
      audio.pause();
      setLoading(false);
    }
  }, [isPlaying, currentStation, tryPlay, setLoading]);

  // 监听音量变化
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  return null;
}
