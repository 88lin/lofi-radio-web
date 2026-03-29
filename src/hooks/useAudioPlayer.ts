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
  const pendingPlayRef = useRef(false); // 是否有待处理的播放请求

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

  // 尝试播放音频
  const tryPlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.log('[Player] No audio element');
      return;
    }

    console.log('[Player] Attempting to play...');
    
    audio.play()
      .then(() => {
        console.log('[Player] Play succeeded');
        setPlaying(true);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[Player] Play failed:', err.message);
        // 如果是自动播放策略限制
        if (err.name === 'NotAllowedError') {
          console.log('[Player] Autoplay blocked, waiting for user interaction');
          setPlaying(false);
          setLoading(false);
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

      // 错误处理
      flvPlayer.on(flv.Events.ERROR, (errorType: string, errorDetail: string) => {
        console.error('[Player] FLV error:', errorType, errorDetail);
      });

      console.log('[Player] Bilibili stream loaded');
      return true;

    } catch (error) {
      console.error('[Player] Bilibili stream load error:', error);
      return false;
    }
  }, []);

  // 加载电台 - 核心函数
  const loadStation = useCallback(async (station: Station) => {
    if (!audioRef.current || !station) return;
    
    // 防止重复加载同一个电台
    if (isLoadingStationRef.current) {
      console.log('[Player] Already loading, queuing station:', station.name);
      return;
    }

    console.log('[Player] === Loading station:', station.name, station.type, '===');
    
    isLoadingStationRef.current = true;
    
    // 清理之前的资源
    cleanup();
    
    const audio = audioRef.current;
    audio.volume = isMuted ? 0 : volume;
    
    setLoading(true);

    let success = false;

    try {
      // Bilibili 直播流
      if (station.type === 'bilibili') {
        success = await loadBilibiliStream(station);
        if (success) {
          currentStationIdRef.current = station.id;
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
            
            // 如果有待处理的播放请求，尝试播放
            if (pendingPlayRef.current || isPlaying) {
              tryPlay();
            }
          });
          
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              console.error('[Player] HLS fatal error:', data);
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
        }
      }
      // MP3 流
      else {
        audio.src = station.url;
        audio.load();
        currentStationIdRef.current = station.id;
        success = true;
      }

    } catch (error) {
      console.error('[Player] Load station error:', error);
    }

    isLoadingStationRef.current = false;

    if (!success) {
      setLoading(false);
    } else if (station.type !== 'm3u8') {
      // 非 HLS 流，直接尝试播放
      // 等待一小段时间让音频准备好
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 如果应该播放，则尝试播放
      if (pendingPlayRef.current || isPlaying) {
        tryPlay();
      } else {
        setLoading(false);
      }
    }
  }, [cleanup, loadBilibiliStream, volume, isMuted, setLoading, isPlaying, tryPlay]);

  // 初始化音频元素
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = 0.3;
    audioRef.current = audio;
    
    const handleCanPlay = () => {
      console.log('[Player] Audio canplay event');
    };
    
    const handlePlaying = () => {
      console.log('[Player] Audio playing event');
      setLoading(false);
      setPlaying(true);
    };
    
    const handlePause = () => {
      console.log('[Player] Audio pause event');
    };
    
    const handleWaiting = () => {
      console.log('[Player] Audio waiting event');
      setLoading(true);
    };
    
    const handleError = (e: Event) => {
      const audioEl = e.target as HTMLAudioElement;
      const error = audioEl?.error;
      console.error('[Player] Audio error:', error?.code, error?.message);
      setLoading(false);
      isLoadingStationRef.current = false;
    };
    
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('error', handleError);
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
      // 标记有待处理的播放请求（如果当前正在播放）
      pendingPlayRef.current = isPlaying;
      loadStation(currentStation);
    }
  }, [currentStation?.id, isPlaying, loadStation]);

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
      tryPlay();
    } else {
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
