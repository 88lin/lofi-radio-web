'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Plus, MonitorSmartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 检查是否已经安装为 PWA
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(standalone);
      return standalone;
    };

    // 检查是否是 iOS 设备（更可靠的检测方式）
    const checkIOS = () => {
      // 方法1: 检查 User Agent
      const isAppleDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      // 方法2: 检查 iPadOS 桌面模式（iPadOS 13+ 在桌面模式下 UA 不包含 iPad）
      const isIPadDesktop = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
      
      const isIOS = isAppleDevice || isIPadDesktop;
      setIsIOS(isIOS);
      return isIOS;
    };

    // 如果已经安装，不显示提示
    if (checkStandalone()) return;

    // 检查是否之前已关闭过提示
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // 7天后重新显示
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // iOS 设备特殊处理
    if (checkIOS()) {
      // 延迟显示，让用户先体验应用
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 10000);
      return () => clearTimeout(timer);
    }

    // 监听 beforeinstallprompt 事件（Android/桌面端）
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // 延迟显示提示
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

  // 如果是 PWA 模式或未显示，返回空
  if (isStandalone || !showPrompt) return null;

  // iOS 安装提示
  if (isIOS) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 z-50"
        >
          <div className="max-w-md mx-auto bg-zinc-900/95 backdrop-blur-lg rounded-2xl p-4 border border-white/10 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                <MonitorSmartphone className="w-5 h-5 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm mb-1">添加到主屏幕</h3>
                <p className="text-white/50 text-xs leading-relaxed">
                  点击下方分享按钮，然后选择"添加到主屏幕"，即可像 App 一样使用
                </p>
                
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5">
                    <Share className="w-3.5 h-3.5 text-white/60" />
                    <span className="text-white/60 text-xs">分享</span>
                  </div>
                  <span className="text-white/30">→</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5">
                    <Plus className="w-3.5 h-3.5 text-white/60" />
                    <span className="text-white/60 text-xs">添加到主屏幕</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleDismiss}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Android/桌面端安装提示
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 z-50"
      >
        <div className="max-w-sm mx-auto bg-zinc-900/95 backdrop-blur-lg rounded-2xl p-4 border border-white/10 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm mb-1">安装 Lofi Radio</h3>
              <p className="text-white/50 text-xs leading-relaxed">
                安装到设备，享受更好的体验：离线使用、桌面快捷方式、沉浸式播放
              </p>
              
              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="h-8 px-4 rounded-lg text-xs font-medium"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #D946EF)' }}
                >
                  立即安装
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="h-8 px-3 rounded-lg text-xs text-white/50 hover:text-white/70 hover:bg-white/5"
                >
                  稍后
                </Button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-white/50" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
