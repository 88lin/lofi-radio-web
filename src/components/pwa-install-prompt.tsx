'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Plus, Music4 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// 扩展 Window 接口
declare global {
  interface WindowEventMap {
    beforeinstallprompt: Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    };
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type DeviceType = 'ios' | 'android' | 'desktop' | null;

function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') {
    return null;
  }

  const ua = navigator.userAgent;
  const isIOSDevice =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroidDevice = /android/i.test(ua);

  if (isIOSDevice) {
    return 'ios';
  }

  if (isAndroidDevice) {
    return 'android';
  }

  return 'desktop';
}

function getIsStandalone() {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const deviceType = getDeviceType();
  const isStandalone = getIsStandalone();

  useEffect(() => {
    if (isStandalone) return;

    const currentDevice = deviceType ?? 'desktop';

    // 检查是否之前已关闭过提示
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // 7天后重新显示
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // iOS 设备特殊处理（没有原生事件，直接延迟显示）
    if (currentDevice === 'ios') {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 6000);
      return () => clearTimeout(timer);
    }

    // 监听 beforeinstallprompt 事件（Android/桌面端）
    const handleBeforeInstallPrompt = (e: Event) => {
      if (currentDevice === 'desktop') {
        return;
      }

      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      setTimeout(() => {
        setShowPrompt(true);
      }, 6000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [deviceType, isStandalone]);

  // 提示弹出 8 秒后自动关闭
  useEffect(() => {
    if (!showPrompt) return;

    const timer = setTimeout(() => {
      setShowPrompt(false);
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }, 8000);

    return () => clearTimeout(timer);
  }, [showPrompt]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installed');
        setShowPrompt(false);
        setDeferredPrompt(null);
      } else {
        setShowPrompt(false);
        setDeferredPrompt(null);
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
      }
    } catch (error) {
      console.error('Install failed:', error);
      setShowPrompt(false);
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }, []);

  // 如果是 PWA 模式，或者是桌面端（走原生），直接返回空
  if (isStandalone || deviceType === 'desktop' || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
        transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 1 }}
        className="fixed z-[100] bottom-6 left-4 right-4 sm:w-[380px] sm:left-1/2 sm:-translate-x-1/2"
      >
        <div className="relative overflow-hidden bg-white/90 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
          {/* Apple style top highlight */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-transparent dark:from-white/[0.06] pointer-events-none rounded-[24px]" />
          
          <div className="relative flex items-start gap-4 p-5">
            {/* Brand icon */}
            <div
              className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(139,92,246,0.1)' }}
            >
              <Music4 className="w-6 h-6" style={{ color: '#8B5CF6' }} />
            </div>
            
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex justify-between items-start">
                <h3 className="text-zinc-900 dark:text-[#f5f5f7] font-semibold text-[16px] tracking-tight mb-1">
                  {deviceType === 'ios' ? '获取完整体验' : '安装 Lofi Radio'}
                </h3>
                <button
                  onClick={handleDismiss}
                  className="w-7 h-7 -mt-1 -mr-1 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors flex-shrink-0 cursor-pointer"
                  aria-label="关闭"
                >
                  <X className="w-4 h-4 text-zinc-500 dark:text-white/60" />
                </button>
              </div>
              <p className="text-zinc-600 dark:text-white/60 text-[13px] leading-relaxed mb-3 pr-2">
                {deviceType === 'ios'
                  ? '将应用添加到主屏幕。轻点浏览器下方的分享图标，选择添加到主屏幕'
                  : '添加到主屏幕，获取独立窗口、沉浸式播放与离线支持，体验更佳'
                }
              </p>
              
              {deviceType === 'ios' ? (
                <div className="flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-white/40">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
                    <Share className="w-3 h-3" />
                    分享
                  </span>
                  <span className="text-zinc-300 dark:text-white/15">→</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
                    <Plus className="w-3 h-3" />
                    添加到主屏幕
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 mt-1">
                  <Button
                    onClick={handleInstall}
                    className="h-8 px-4 rounded-full text-[13px] font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shadow-sm transition-all"
                  >
                    立即安装
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleDismiss}
                    className="h-8 px-4 rounded-full text-[13px] font-medium text-zinc-500 dark:text-white/60 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all"
                  >
                    稍后
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Auto-dismiss progress bar */}
          <div className="relative h-[2px] bg-black/[0.04] dark:bg-white/[0.06]">
            <motion.div
              className="h-full"
              style={{ background: 'linear-gradient(90deg, #8B5CF6, #D946EF)' }}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 8, ease: 'linear' }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
