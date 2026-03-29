'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAudioStore } from '@/store/audioStore';
import { Station } from '@/lib/stations';
import Hls from 'hls.js';

// flv.js 类型定义
type FlvPlayer = {
  attachMediaElement: (media: HTMLMediaElement) => void;
  load: () => void;
  play: () => Promise<void>;
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
    console.log('Loading flv.js module...');
    const module = await import('flv.js');
    flvjs = module.default || module;
    console.log('flv.js loaded successfully');
    return flvjs;
  } catch (e) {
    console.error('Failed to load flv.js:', e);
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
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 使用 ref 跟踪状态，避免 useEffect 依赖问题
  const currentStationIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);
  const userInteractedRef = useRef(false);

  const {
    isPlaying,
    currentStation,
    volume,
    isMuted,
    setPlaying,
    setLoading,
    nextStation,
    prevStation,
    togglePlay,
  } = useAudioStore();

  // 检测用户交互
  useEffect(() => {
    const handleInteraction = () => {
      userInteractedRef.current = true;
      // 移除监听器，只需检测一次
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // 清理函数
  const cleanup = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (flvPlayerRef.current) {
      try {
        flvPlayerRef.current.destroy();
      } catch (e) {
        console.error('Error destroying flv player:', e);
      }
      flvPlayerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  }, []);

  // 加载 Bilibili 直播流
  const loadBilibiliStream = useCallback(async (station: Station): Promise<boolean> => {
    const audio = audioRef.current;
    if (!audio) return false;

    console.log('=== Loading Bilibili stream for:', station.name, '===');

    try {
      // 从 URL 提取房间号
      const urlMatch = station.url.match(/live\.bilibili\.com\/(\d+)/);
      const roomId = urlMatch ? urlMatch[1] : '27519423';

      console.log('Fetching stream for room:', roomId);

      // 通过 API 获取直播流地址
      const res = await fetch(`/api/bilibili-stream?room_id=${roomId}`);
      
      if (!res.ok) {
        console.error('API request failed:', res.status);
        return false;
      }

      const data: BilibiliStreamInfo = await res.json();

      if (!data.success || !data.flv_url) {
        console.error('No stream URL in response');
        return false;
      }

      console.log('Got FLV URL');

      // 加载 flv.js
      const flv = await loadFlvJs();
      if (!flv || !flv.isSupported()) {
        console.error('flv.js not supported');
        return false;
      }

      // 清理之前的播放器
      if (flvPlayerRef.current) {
        flvPlayerRef.current.destroy();
        flvPlayerRef.current = null;
      }

      // 创建播放器 - 禁用 worker 避免打包问题
      const flvPlayer = flv.createPlayer({
        type: 'flv',
        url: data.flv_url,
        isLive: true,
        hasAudio: true,
        hasVideo: false,
        cors: true,
      }, {
        enableWorker: false, // 禁用 worker，避免打包问题
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
      const handleError = (errorType: string, errorDetail: string) => {
        console.error('FLV error:', errorType, errorDetail);
      };
      flvPlayer.on(flv.Events.ERROR, handleError);

      // 更新标记
      currentStationIdRef.current = station.id;
      isLoadingRef.current = false;

      console.log('Bilibili stream loaded successfully');
      return true;

    } catch (error) {
      console.error('Bilibili stream load error:', error);
      return false;
    }
  }, []);

  // 加载电台
  const loadStation = useCallback(async (station: Station): Promise<boolean> => {
    if (!audioRef.current || !station) return false;
    
    // 防止重复加载
    if (isLoadingRef.current) {
      console.log('Already loading, skip');
      return false;
    }

    console.log('=== Loading station:', station.name, station.type, '===');
    
    isLoadingRef.current = true;
    
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
            currentStationIdRef.current = station.id;
            isLoadingRef.current = false;
            console.log('HLS stream ready');
          });
          
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              console.error('HLS fatal error:', data);
              isLoadingRef.current = false;
            }
          });
          
          hlsRef.current = hls;
          success = true;
        } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
          audio.src = station.url;
          currentStationIdRef.current = station.id;
          isLoadingRef.current = false;
          success = true;
        }
      }
      // MP3 流
      else {
        audio.src = station.url;
        audio.load();
        currentStationIdRef.current = station.id;
        isLoadingRef.current = false;
        success = true;
      }

    } catch (error) {
      console.error('Load station error:', error);
      isLoadingRef.current = false;
    }

    if (!success) {
      setLoading(false);
    }

    return success;
  }, [cleanup, loadBilibiliStream, volume, isMuted, setLoading]);

  // 初始化音频元素
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = 0.3;
    audioRef.current = audio;
    
    const handleCanPlay = () => {
      setLoading(false);
    };
    
    const handlePlaying = () => {
      setLoading(false);
      setPlaying(true);
    };
    
    const handlePause = () => {};
    
    const handleWaiting = () => {
      setLoading(true);
    };
    
    const handleError = (e: Event) => {
      const audioEl = e.target as HTMLAudioElement;
      const error = audioEl?.error;
      console.error('Audio error:', error?.code, error?.message);
      setLoading(false);
    };
    
    const handleEnded = () => {
      // 直播流不会结束
    };
    
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      cleanup();
      audio.pause();
    };
  }, []);

  // 监听电台变化 - 只在电台 ID 改变时加载
  useEffect(() => {
    if (currentStation && audioRef.current) {
      // 只有电台 ID 真正改变时才加载
      if (currentStationIdRef.current !== currentStation.id) {
        console.log('Station changed, loading new station');
        loadStation(currentStation);
      }
    }
  }, [currentStation?.id, loadStation]);

  // 监听播放状态变化 - 用户点击播放时触发
  useEffect(() => {
    if (!audioRef.current || !currentStation) return;
    
    const audio = audioRef.current;

    if (isPlaying) {
      // 检查是否需要加载电台
      if (currentStationIdRef.current !== currentStation.id && !isLoadingRef.current) {
        console.log('Play requested but station not loaded, loading...');
        loadStation(currentStation).then(() => {
          // 加载完成后播放
          audio.play().catch(err => {
            console.error('Play failed:', err);
            setPlaying(false);
          });
        });
      } else {
        // 直接播放
        audio.play().catch(err => {
          console.error('Play failed:', err);
          setPlaying(false);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentStation, loadStation, setPlaying]);

  // 监听音量变化
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  return null;
}
