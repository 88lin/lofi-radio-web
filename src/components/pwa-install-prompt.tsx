'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Plus, Smartphone } from 'lucide-react';
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

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 检查是否已经安装为 PWA
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(standalone);
      return standalone;
    };

    if (checkStandalone()) return;

    // 识别设备类型
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/i.test(ua);
    
    let currentDevice: DeviceType = 'desktop';
    if (isIOSDevice) currentDevice = 'ios';
    else if (isAndroidDevice) currentDevice = 'android';
    
    setDeviceType(currentDevice);

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
      }, 10000);
      return () => clearTimeout(timer);
    }

    // 监听 beforeinstallprompt 事件（Android/桌面端）
    const handleBeforeInstallPrompt = (e: Event) => {
      if (currentDevice === 'desktop') {
        // 桌面端我们直接放行，让浏览器在地址栏显示原生安装图标即可，不弹出自定义卡片
        return;
      }

      // Android 端很多浏览器原生提示不明显，我们拦截并使用精美的自定义卡片
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // 延迟显示提示，先让用户体验一下
      setTimeout(() => {
        setShowPrompt(true);
      }, 8000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installed');
        setShowPrompt(false);
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error('Install failed:', error);
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
        <div className="relative overflow-hidden bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-2xl saturate-150 rounded-[28px] p-5 border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
          {/* Apple style top highlight */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent dark:from-white/10 pointer-events-none rounded-[28px]" />
          
          <div className="relative flex items-start gap-4">
            <div className="w-14 h-14 rounded-[16px] bg-gradient-to-b from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-600 flex items-center justify-center flex-shrink-0 shadow-[0_2px_10px_rgba(99,102,241,0.4)] dark:shadow-[0_2px_10px_rgba(99,102,241,0.2)] border border-white/20 dark:border-white/10">
              <Smartphone className="w-7 h-7 text-white drop-shadow-md" />
            </div>
            
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex justify-between items-start">
                <h3 className="text-zinc-900 dark:text-white font-semibold text-[16px] tracking-tight mb-1">
                  {deviceType === 'ios' ? '获取完整体验' : '安装 Lofi Radio'}
                </h3>
                <button
                  onClick={handleDismiss}
                  className="w-7 h-7 -mt-1 -mr-1 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors flex-shrink-0 cursor-pointer"
                  aria-label="关闭"
                >
                  <X className="w-4 h-4 text-zinc-500 dark:text-white/70" />
                </button>
              </div>
              <p className="text-zinc-600 dark:text-white/70 text-[13px] leading-relaxed mb-3 pr-2">
                {deviceType === 'ios' 
                  ? '将应用留存在主屏幕。轻点浏览器下方的分享图标，然后选择「添加到主屏幕」。' 
                  : '添加到主屏幕，获取独立窗口、沉浸式播放与离线支持，体验更佳。'
                }
              </p>
              
              {deviceType === 'ios' ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/5 shadow-sm">
                    <Share className="w-3.5 h-3.5 text-zinc-700 dark:text-white/80" />
                    <span className="text-zinc-700 dark:text-white/80 text-[12px] font-medium">分享</span>
                  </div>
                  <span className="text-zinc-300 dark:text-white/20 text-sm font-light">→</span>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/5 shadow-sm">
                    <Plus className="w-3.5 h-3.5 text-zinc-700 dark:text-white/80" />
                    <span className="text-zinc-700 dark:text-white/80 text-[12px] font-medium">添加到主屏幕</span>
                  </div>
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
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
