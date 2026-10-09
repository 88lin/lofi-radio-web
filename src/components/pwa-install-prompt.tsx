'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Plus, Music4 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  createPwaInstallState,
  PWA_DISMISSED_KEY,
  PWA_INSTALLED_KEY,
  PWA_SESSION_KEY,
  type InstallDevice,
  type PwaInstallState,
} from '@/lib/pwa-install';

// 扩展 Window 接口
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function getDeviceType(): InstallDevice | null {
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
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installState] = useState(() => createPwaInstallState(
    () => window.localStorage,
    () => window.sessionStorage,
  ));
  const deviceType = getDeviceType();
  const isStandalone = getIsStandalone();

  const handleInstalled = useCallback(() => {
    installState.markInstalled();
    deferredPromptRef.current = null;
    setDeferredPrompt(null);
    setIsInstalled(true);
  }, [installState]);

  useEffect(() => {
    // 从主屏幕打开过的用户，之后回到同一浏览器存储空间也不再提示。
    if (getIsStandalone()) installState.markInstalled();

    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      // 必须先拦截原生自动提示，再检查免打扰；地址栏/菜单的手动安装入口仍由浏览器提供。
      event.preventDefault();
      if (getIsStandalone()) {
        handleInstalled();
        return;
      }
      if (!installState.canPrompt(deviceType ?? 'desktop')) return;

      deferredPromptRef.current = event;
      setDeferredPrompt(event);
    };
    const checkInstalled = () => {
      if (getIsStandalone() || installState.isInstalled()) handleInstalled();
    };
    const displayMode = window.matchMedia('(display-mode: standalone)');

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('storage', checkInstalled);
    window.addEventListener('pageshow', checkInstalled);
    document.addEventListener('visibilitychange', checkInstalled);
    // addListener 兼容旧版 iOS Safari。
    if (displayMode.addEventListener) displayMode.addEventListener('change', checkInstalled);
    else displayMode.addListener(checkInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('storage', checkInstalled);
      window.removeEventListener('pageshow', checkInstalled);
      document.removeEventListener('visibilitychange', checkInstalled);
      if (displayMode.removeEventListener) displayMode.removeEventListener('change', checkInstalled);
      else displayMode.removeListener(checkInstalled);
    };
  }, [deviceType, handleInstalled, installState]);

  const handleInstall = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    // 浏览器事件只能消费一次；同步清空，避免快速连点或失败重试复用旧事件。
    deferredPromptRef.current = null;
    setDeferredPrompt(null);
    installState.dismiss();

    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') handleInstalled();
    } catch (error) {
      console.error('Install failed:', error);
    }
  }, [handleInstalled, installState]);

  // 监听器全站保留，卡片及其计时器只在首页存活。离开首页就卸载，返回也不会带回旧卡片。
  if (pathname !== '/' || isInstalled || isStandalone || !deviceType || deviceType === 'desktop') {
    return null;
  }

  return (
    <HomeInstallPrompt
      deviceType={deviceType}
      hasNativePrompt={deferredPrompt !== null}
      installState={installState}
      onInstall={handleInstall}
    />
  );
}

function HomeInstallPrompt({ deviceType, hasNativePrompt, installState, onInstall }: {
  deviceType: 'ios' | 'android';
  hasNativePrompt: boolean;
  installState: PwaInstallState;
  onInstall: () => Promise<void>;
}) {
  const [showPrompt, setShowPrompt] = useState(false);

  // 重复的 beforeinstallprompt 只更新可用事件，不叠加计时器。
  useEffect(() => {
    if (deviceType !== 'ios' && !hasNativePrompt) return;
    if (!installState.canPrompt(deviceType)) return;

    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const showTimer = setTimeout(() => {
      // 等待期间可能已在别处安装、关闭提示或改变显示模式，露出前再次核验并记账。
      // 路由已更新但 React 尚未清理旧 effect 时，不能消费首页的展示机会。
      if (window.location.pathname !== '/' || getIsStandalone() || !installState.markShown(deviceType)) return;
      setShowPrompt(true);
      hideTimer = setTimeout(() => setShowPrompt(false), 8000);
    }, 6000);

    const handleStorage = (event: StorageEvent) => {
      if (![PWA_DISMISSED_KEY, PWA_INSTALLED_KEY, PWA_SESSION_KEY].includes(event.key ?? '')) return;
      if (installState.canPrompt(deviceType)) return;
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      setShowPrompt(false);
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      window.removeEventListener('storage', handleStorage);
    };
  }, [deviceType, hasNativePrompt, installState]);

  const handleDismiss = useCallback(() => {
    installState.dismiss();
    setShowPrompt(false);
  }, [installState]);

  // showPrompt 的判断必须放在 AnimatePresence 里面。提前 return null 会把
  // AnimatePresence 本身一起卸载，它就没有机会播放子元素的 exit 动画——
  // 卡片直接消失，下面那行 exit 配置等于没写。
  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
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
                {/* 不要承诺「离线」：站内没有注册 service worker，装上之后断网打开
                    就是浏览器的错误页，/pricing.md 也明写了不提供离线缓存。 */}
                <p className="text-zinc-600 dark:text-white/60 text-[13px] leading-relaxed mb-3 pr-2">
                  {deviceType === 'ios'
                    ? '将应用添加到主屏幕。打开浏览器的分享菜单，选择添加到主屏幕'
                    : '添加到主屏幕，获取独立窗口与沉浸式播放，打开更快'}
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
                      onClick={() => {
                        handleDismiss();
                        void onInstall();
                      }}
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
      )}
    </AnimatePresence>
  );
}
