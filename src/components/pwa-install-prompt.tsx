'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Plus, Music4, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BeforeInstallPromptEvent } from '@/lib/pwa-install-capture';
import {
  createPwaInstallState,
  PWA_DISMISSED_KEY,
  PWA_INSTALLED_KEY,
  PWA_MANUAL_SHOWN_KEY,
  PWA_SESSION_KEY,
  type InstallDevice,
  type PwaInstallState,
} from '@/lib/pwa-install';

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
    const captured = window.__lofiPwaInstall;
    if (captured) {
      captured.installed = true;
      captured.prompt = null;
    }
    installState.markInstalled();
    deferredPromptRef.current = null;
    setDeferredPrompt(null);
    setIsInstalled(true);
  }, [installState]);

  useEffect(() => {
    // 从主屏幕打开或在 hydration 前已安装，先记账，首页计时器就不会启动。
    if (getIsStandalone() || window.__lofiPwaInstall?.installed) installState.markInstalled();

    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      // 桌面端不显示自定义卡片，必须保留浏览器自己的原生安装入口。
      if (deviceType === 'desktop') return;

      // 移动端由自定义卡片在合适时机调用 prompt；先拦截浏览器自动提示。
      event.preventDefault();
      const captured = window.__lofiPwaInstall;
      if (captured?.prompt === event) captured.prompt = null;
      if (getIsStandalone() || captured?.installed) {
        handleInstalled();
        return;
      }
      // 展示机会由首页计时器核验。已显示的手动说明也可以接管迟到的原生事件，
      // 更新为可用的安装按钮；不重新弹卡片，也不重新领取展示机会。
      deferredPromptRef.current = event;
      setDeferredPrompt(event);
    };
    const checkInstalled = () => {
      if (getIsStandalone() || installState.isInstalled()) handleInstalled();
    };
    const displayMode = window.matchMedia('(display-mode: standalone)');

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    // 接管 head 脚本收到的早期事件，仍走同一套冷却和安装状态判断。
    const pendingPrompt = window.__lofiPwaInstall?.prompt;
    if (pendingPrompt) handleBeforeInstallPrompt(pendingPrompt);
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
  const mode = deviceType === 'android' && hasNativePrompt ? 'native' : 'manual';

  // 无事件的安卓浏览器多等一会，再展示一次手动说明；收到原生事件则替换等待计时。
  // 重复事件只更新可用事件，不叠加计时器，也不重置已显示卡片的收起时间。
  useEffect(() => {
    if (!installState.canPrompt(deviceType, Date.now(), mode)) return;

    const showTimer = setTimeout(() => {
      // 等待期间可能已在别处安装、关闭提示或改变显示模式，露出前再次核验并记账。
      // 路由已更新但 React 尚未清理旧 effect 时，不能消费首页的展示机会。
      if (window.location.pathname !== '/' || getIsStandalone() || !installState.markShown(deviceType, Date.now(), mode)) return;
      setShowPrompt(true);
    }, deviceType === 'android' && mode === 'manual' ? 12000 : 6000);

    return () => clearTimeout(showTimer);
  }, [deviceType, mode, installState]);

  useEffect(() => {
    if (!showPrompt) return;
    const hideTimer = setTimeout(() => setShowPrompt(false), 8000);
    return () => clearTimeout(hideTimer);
  }, [showPrompt]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (![PWA_DISMISSED_KEY, PWA_INSTALLED_KEY, PWA_SESSION_KEY, PWA_MANUAL_SHOWN_KEY].includes(event.key ?? '')) return;
      if (installState.canPrompt(deviceType, Date.now(), mode)) return;
      setShowPrompt(false);
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [deviceType, mode, installState]);

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
                  <h3 className="text-zinc-900 dark:text-[#f5f5f7] font-semibold text-[16px] mb-1">
                    {deviceType === 'ios' ? '获取完整体验' : mode === 'manual' ? '添加到桌面' : '安装 Lofi Radio'}
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
                    : mode === 'manual'
                      ? '打开浏览器菜单，查找“添加到桌面”“添加到主屏幕”或“安装应用”。'
                      : '添加到主屏幕，获取独立窗口与沉浸式播放，打开更快'}
                </p>

                {deviceType === 'ios' ? (
                  <div className="flex flex-wrap items-center gap-1.5 text-[12px] min-[390px]:text-[13px] font-medium text-zinc-600 dark:text-white/70">
                    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.08]">
                      <Share className="w-3 h-3" />
                      分享
                    </span>
                    <span className="text-zinc-300 dark:text-white/15">→</span>
                    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.08]">
                      <Plus className="w-3 h-3" />
                      添加到主屏幕
                    </span>
                  </div>
                ) : mode === 'manual' ? (
                  <div className="flex flex-wrap items-center gap-1.5 text-[12px] min-[390px]:text-[13px] font-medium text-zinc-600 dark:text-white/70">
                    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.08]">
                      <Menu className="w-3 h-3" />
                      浏览器菜单
                    </span>
                    <span className="text-zinc-300 dark:text-white/15">→</span>
                    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.08]">
                      <Plus className="w-3 h-3" />
                      添加到桌面
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
