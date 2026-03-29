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
  } = useAudioStore();

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
    
    console.log('🎵 Loading station:', station.name, station.type, station.url);
    
    // 清理之前的资源
    cleanup();
    
    // 重置重试计数
    retryCountRef.current = 0;
    
    const audio = audioRef.current;
    audio.volume = isMuted ? 0 : volume;
    
    setLoading(true);
    
    // Bilibili 类型需要特殊处理，网页版不支持，跳过
    if (station.type === 'bilibili') {
      console.warn('⚠️ Bilibili直播源在网页端不支持，自动跳过');
      setLoading(false);
      // 自动切换到下一个可用电台
      const { selectStation } = useAudioStore.getState();
      const stationList = [
        'lofi-box', 'chill-sky', 'chill-wave', 'groove-salad',
        'asp', 'paradise', 'drone-zone', 'rain-sounds',
        'jazz-box', 'jazz-groove', 'jazz-smooth', 'swiss-classic',
        'bbc-3', 'rap', 'kexp'
      ];
      const nextId = stationList[0]; // 默认切换到 lofi-box
      setTimeout(() => {
        const { selectStationById } = useAudioStore.getState();
        selectStationById(nextId);
      }, 500);
      return;
    }
    
    // HLS 流
    if (station.type === 'm3u8') {
      if (Hls.isSupported()) {
        console.log('📺 Using HLS.js for m3u8 stream');
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          startLevel: -1, // 自动选择质量
        });
        
        hls.loadSource(station.url);
        hls.attachMedia(audio);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('✅ HLS manifest parsed, starting playback');
          audio.play()
            .then(() => {
              console.log('🎵 HLS playback started');
              setLoading(false);
              setPlaying(true);
            })
            .catch(err => {
              console.error('❌ HLS play failed:', err);
              setLoading(false);
            });
        });
        
        hls.on(Hls.Events.ERROR, (_, data) => {
          console.error('❌ HLS error:', data);
          if (data.fatal) {
            setLoading(false);
            setPlaying(false);
            // 尝试恢复
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++;
              console.log(`🔄 Retrying HLS (${retryCountRef.current}/${maxRetries})...`);
              hls.recoverMediaError();
            }
          }
        });
        
        hlsRef.current = hls;
      } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari 原生支持
        console.log('📺 Using native HLS (Safari)');
        audio.src = station.url;
        audio.play()
          .then(() => {
            console.log('🎵 Native HLS playback started');
            setLoading(false);
            setPlaying(true);
          })
          .catch(err => {
            console.error('❌ Native HLS play failed:', err);
            setLoading(false);
          });
      } else {
        console.error('❌ HLS not supported');
        setLoading(false);
      }
    } else {
      // MP3 流
      console.log('📻 Loading MP3 stream');
      audio.src = station.url;
      audio.load();
      
      audio.play()
        .then(() => {
          console.log('🎵 MP3 playback started');
          setLoading(false);
          setPlaying(true);
        })
        .catch(err => {
          console.error('❌ MP3 play failed:', err);
          setLoading(false);
          // 重试
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            console.log(`🔄 Retrying MP3 (${retryCountRef.current}/${maxRetries})...`);
            retryTimeoutRef.current = setTimeout(() => {
              audio.play().catch(e => console.error('Retry failed:', e));
            }, 1000 * retryCountRef.current);
          }
        });
    }
  }, [cleanup, volume, isMuted, setLoading, setPlaying]);

  // 初始化音频元素
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    console.log('🔊 Initializing audio player');
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;
    
    // 音频事件
    const handleCanPlay = () => {
      console.log('✅ Audio can play');
      setLoading(false);
    };
    
    const handlePlaying = () => {
      console.log('🎵 Audio is playing');
      setLoading(false);
      setPlaying(true);
    };
    
    const handleWaiting = () => {
      console.log('⏳ Audio waiting for data');
      setLoading(true);
    };
    
    const handleError = (e: Event) => {
      const audioEl = e.target as HTMLAudioElement;
      const error = audioEl?.error;
      console.error('❌ Audio error:', error?.code, error?.message);
      setLoading(false);
    };
    
    const handleEnded = () => {
      console.log('🔚 Audio ended, reconnecting...');
      // 直播流不应该结束，如果结束则重连
      if (currentStation && currentStation.type !== 'bilibili') {
        setTimeout(() => loadStation(currentStation), 2000);
      }
    };
    
    const handleStalled = () => {
      console.log('⚠️ Audio stalled');
    };
    
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('stalled', handleStalled);
    
    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('stalled', handleStalled);
      cleanup();
      audio.pause();
    };
  }, []);

  // 监听电台变化
  useEffect(() => {
    if (currentStation && audioRef.current) {
      loadStation(currentStation);
    }
  }, [currentStation?.id]); // 只在电台ID变化时重新加载

  // 监听播放状态变化（手动暂停/播放）
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
  }, [isPlaying]);

  // 监听音量变化
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  return null;
}
