'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAudioStore } from '@/store/audioStore';
import { Station } from '@/lib/stations';
import Hls from 'hls.js';

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
      duration: Infinity, // 直播流
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

    mediaSession.setActionHandler('play', () => {
      togglePlay();
    });

    mediaSession.setActionHandler('pause', () => {
      togglePlay();
    });

    mediaSession.setActionHandler('previoustrack', () => {
      prevStation();
    });

    mediaSession.setActionHandler('nexttrack', () => {
      nextStation();
    });

    // 某些浏览器不支持这些操作，所以用 try-catch
    try {
      mediaSession.setActionHandler('seekbackward', () => {
        prevStation();
      });
    } catch {}

    try {
      mediaSession.setActionHandler('seekforward', () => {
        nextStation();
      });
    } catch {}

    try {
      mediaSession.setActionHandler('stop', () => {
        if (isPlaying) togglePlay();
      });
    } catch {}
  }, [togglePlay, prevStation, nextStation, isPlaying]);

  // 清理函数
  const cleanup = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.load();
    }
  }, []);

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
    
    // HLS 流 - 优化配置减少功耗
    if (station.type === 'm3u8') {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false, // 关闭低延迟模式减少CPU占用
          startLevel: -1,
          maxBufferLength: 30, // 减少缓冲区大小
          maxMaxBufferLength: 60,
          maxBufferSize: 30 * 1000 * 1000, // 30MB
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
  }, [cleanup, volume, isMuted, setLoading, setPlaying, updateMediaSession]);

  // 初始化音频元素
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const audio = new Audio();
    audio.preload = 'metadata'; // 减少预加载
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
      if (currentStation) {
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
