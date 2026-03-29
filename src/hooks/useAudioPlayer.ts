'use client';

import { useEffect, useRef, useCallback } from 'react';
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
};

type FlvJs = {
  isSupported: () => boolean;
  createPlayer: (config: Record<string, unknown>, options?: Record<string, unknown>) => FlvPlayer;
  Events: { ERROR: string };
  ErrorTypes: { NETWORK_ERROR: string };
};

// 动态加载 flv.js
let flvjs: FlvJs | null = null;
const loadFlvJs = async (): Promise<FlvJs | null> => {
  if (flvjs) return flvjs;
  if (typeof window === 'undefined') return null;
  try {
    flvjs = await import('flv.js').then(m => m.default || m);
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
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  
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

  // Media Session API - 更新媒体信息
  const updateMediaSession = useCallback((station: Station | null) => {
    if (!('mediaSession' in navigator) || !station) return;

    const mediaSession = navigator.mediaSession;
    
    mediaSession.metadata = new MediaMetadata({
      title: station.name,
      artist: 'Lofi Radio',
      album: station.style1 || 'Focus Music',
      artwork: [
        { src: '/logo.svg', sizes: '512x512', type: 'image/svg+xml' },
      ],
    });

    mediaSession.setPositionState?.({
      duration: Infinity,
      playbackRate: 1,
    });
  }, []);

  // Media Session API - 设置播放状态
  const updateMediaSessionPlaybackState = useCallback((playing: boolean) => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  }, []);

  // Media Session API - 设置事件处理器
  const setupMediaSessionHandlers = useCallback(() => {
    if (!('mediaSession' in navigator)) return;

    const mediaSession = navigator.mediaSession;

    mediaSession.setActionHandler('play', () => togglePlay());
    mediaSession.setActionHandler('pause', () => togglePlay());
    mediaSession.setActionHandler('previoustrack', () => prevStation());
    mediaSession.setActionHandler('nexttrack', () => nextStation());

    try { mediaSession.setActionHandler('seekbackward', () => prevStation()); } catch {}
    try { mediaSession.setActionHandler('seekforward', () => nextStation()); } catch {}
    try { mediaSession.setActionHandler('stop', () => { if (isPlaying) togglePlay(); }); } catch {}
  }, [togglePlay, prevStation, nextStation, isPlaying]);

  // 清理函数
  const cleanup = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (flvPlayerRef.current) {
      flvPlayerRef.current.destroy();
      flvPlayerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.load();
    }
  }, []);

  // 加载 Bilibili 直播流
  const loadBilibiliStream = useCallback(async (station: Station) => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      // 从 URL 提取房间号
      const urlMatch = station.url.match(/live\.bilibili\.com\/(\d+)/);
      const roomId = urlMatch ? urlMatch[1] : '27519423';

      console.log('Fetching Bilibili stream for room:', roomId);

      // 通过我们的 API 获取直播流地址
      const res = await fetch(`/api/bilibili-stream?room_id=${roomId}`);
      const data: BilibiliStreamInfo = await res.json();

      if (!data.success || !data.flv_url) {
        console.error('Failed to get Bilibili stream:', data.error || 'Unknown error');
        setLoading(false);
        setTimeout(() => nextStation(), 500);
        return;
      }

      console.log('Got Bilibili FLV URL, loading with flv.js...');

      // 动态加载 flv.js
      const flv = await loadFlvJs();
      if (!flv || !flv.isSupported()) {
        console.error('flv.js is not supported');
        setLoading(false);
        setTimeout(() => nextStation(), 500);
        return;
      }

      // 创建 flv.js 播放器
      const flvPlayer = flv.createPlayer({
        type: 'flv',
        url: data.flv_url,
        isLive: true,
        hasAudio: true,
        hasVideo: false,
        cors: true,
      }, {
        enableWorker: true,
        enableStashBuffer: false,
        stashInitialSize: 128,
        lazyLoad: false,
      });

      flvPlayer.attachMediaElement(audio);
      flvPlayer.load();

      // 尝试播放
      await flvPlayer.play();
      setLoading(false);
      setPlaying(true);

      // 保存播放器引用
      flvPlayerRef.current = flvPlayer;

      // 设置错误处理
      flvPlayer.on(flv.Events.ERROR, (errorType: string, errorDetail: string) => {
        console.error('FLV player error:', errorType, errorDetail);
        if (errorType === flv.ErrorTypes.NETWORK_ERROR) {
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            setTimeout(() => loadBilibiliStream(station), 2000);
          } else {
            setLoading(false);
            setPlaying(false);
          }
        }
      });

      // 定时刷新流地址（每 5 分钟）
      refreshTimeoutRef.current = setTimeout(() => {
        console.log('Refreshing Bilibili stream URL...');
        if (flvPlayerRef.current) {
          flvPlayerRef.current.destroy();
          flvPlayerRef.current = null;
        }
        loadBilibiliStream(station);
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error('Bilibili stream load error:', error);
      setLoading(false);
      setTimeout(() => nextStation(), 500);
    }
  }, [setLoading, setPlaying, nextStation]);

  // 加载电台
  const loadStation = useCallback((station: Station) => {
    if (!audioRef.current || !station) return;
    
    console.log('Loading station:', station.name, station.type, station.url);
    
    // 清理之前的资源
    cleanup();
    
    // 重置重试计数
    retryCountRef.current = 0;
    
    const audio = audioRef.current;
    audio.volume = isMuted ? 0 : volume;
    
    setLoading(true);
    
    // 更新 Media Session
    updateMediaSession(station);
    
    // Bilibili 直播流
    if (station.type === 'bilibili') {
      loadBilibiliStream(station);
      return;
    }
    
    // HLS 流
    if (station.type === 'm3u8') {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          startLevel: -1,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 30 * 1000 * 1000,
          maxBufferHole: 0.5,
        });
        
        hls.loadSource(station.url);
        hls.attachMedia(audio);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          audio.play()
            .then(() => {
              setLoading(false);
              setPlaying(true);
            })
            .catch(err => {
              console.error('HLS play failed:', err);
              setLoading(false);
            });
        });
        
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setLoading(false);
            setPlaying(false);
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++;
              hls.recoverMediaError();
            }
          }
        });
        
        hlsRef.current = hls;
      } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        audio.src = station.url;
        audio.play()
          .then(() => {
            setLoading(false);
            setPlaying(true);
          })
          .catch(err => {
            console.error('Native HLS play failed:', err);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    } else {
      // MP3 流
      audio.src = station.url;
      audio.load();
      
      audio.play()
        .then(() => {
          setLoading(false);
          setPlaying(true);
        })
        .catch(err => {
          console.error('MP3 play failed:', err);
          setLoading(false);
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            retryTimeoutRef.current = setTimeout(() => {
              audio.play().catch(e => console.error('Retry failed:', e));
            }, 1000 * retryCountRef.current);
          }
        });
    }
  }, [cleanup, volume, isMuted, setLoading, setPlaying, updateMediaSession, loadBilibiliStream]);

  // 初始化音频元素
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = volume;
    audioRef.current = audio;
    
    setupMediaSessionHandlers();
    
    const handleCanPlay = () => setLoading(false);
    const handlePlaying = () => {
      setLoading(false);
      setPlaying(true);
      updateMediaSessionPlaybackState(true);
    };
    const handlePause = () => updateMediaSessionPlaybackState(false);
    const handleWaiting = () => setLoading(true);
    const handleError = (e: Event) => {
      const audioEl = e.target as HTMLAudioElement;
      const error = audioEl?.error;
      console.error('Audio error:', error?.code, error?.message);
      setLoading(false);
    };
    const handleEnded = () => {
      if (currentStation && currentStation.type !== 'bilibili') {
        setTimeout(() => loadStation(currentStation), 2000);
      }
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

  // 监听电台变化
  useEffect(() => {
    if (currentStation && audioRef.current) {
      loadStation(currentStation);
    }
  }, [currentStation?.id]);

  // 监听播放状态变化
  useEffect(() => {
    if (!audioRef.current || !currentStation) return;
    
    if (isPlaying) {
      audioRef.current.play().catch(err => {
        console.error('Play failed:', err);
        setPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
    
    updateMediaSessionPlaybackState(isPlaying);
  }, [isPlaying]);

  // 监听音量变化
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  return null;
}
