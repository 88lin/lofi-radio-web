'use client';

import { useState, useEffect, useCallback } from 'react';
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

/** Must match the `.animate-drain` duration in globals.css. */
const AUTO_DISMISS_MS = 8000;
const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 6000;

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
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // 7天后重新显示
      if (Date.now() - dismissedTime < DISMISS_COOLDOWN_MS) {
        return;
      }
    }

    // iOS 设备特殊处理（没有原生事件，直接延迟显示）
    if (currentDevice === 'ios') {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, SHOW_DELAY_MS);
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
      }, SHOW_DELAY_MS);
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
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [showPrompt]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowPrompt(false);
        setDeferredPrompt(null);
      } else {
        setShowPrompt(false);
        setDeferredPrompt(null);
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
      }
    } catch (error) {
      console.error('Install failed:', error);
      setShowPrompt(false);
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }, []);

  // 如果是 PWA 模式，或者是桌面端（走原生），直接返回空
  if (isStandalone || deviceType === 'desktop' || !showPrompt) return null;

  return (
    // Two nested wrappers on purpose: the outer one owns the fixed placement
    // (including `-translate-x-1/2`), the inner one owns the entrance keyframes.
    // Sharing one element would let the animation's `transform` fight the
    // centring translate.
    <div
      className="fixed bottom-6 left-4 right-4 z-[100] sm:left-1/2 sm:w-[380px] sm:-translate-x-1/2"
      role="dialog"
      aria-label="安装应用"
    >
      <div className="animate-sheet-up">
        <div className="panel-glass relative overflow-hidden rounded-[24px]">
          {/* Apple-style top highlight */}
          <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-b from-white/60 to-transparent dark:from-white/[0.06]" />

          <div className="relative flex items-start gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-station/10">
              <Music4 className="h-6 w-6 text-station" />
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-start justify-between">
                <h3 className="mb-1 text-[16px] font-semibold tracking-tight text-fg">
                  {deviceType === 'ios' ? '获取完整体验' : '安装 Lofi Radio'}
                </h3>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="tap-target -mt-1 -mr-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface-3 text-fg-subtle transition-colors hover:text-fg"
                  aria-label="关闭"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mb-3 pr-2 text-[13px] leading-relaxed text-fg-muted">
                {deviceType === 'ios'
                  ? '将应用添加到主屏幕。轻点浏览器下方的分享图标，选择添加到主屏幕'
                  : '添加到主屏幕，获取独立窗口、沉浸式播放与离线支持，体验更佳'}
              </p>

              {deviceType === 'ios' ? (
                <div className="flex items-center gap-1.5 text-[12px] text-fg-subtle">
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-1">
                    <Share className="h-3 w-3" />
                    分享
                  </span>
                  <span className="text-fg-faint" aria-hidden="true">
                    →
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-1">
                    <Plus className="h-3 w-3" />
                    添加到主屏幕
                  </span>
                </div>
              ) : (
                <div className="mt-1 flex items-center gap-2.5">
                  <Button
                    onClick={handleInstall}
                    className="h-8 rounded-full px-4 text-[13px] font-medium shadow-sm"
                  >
                    立即安装
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleDismiss}
                    className="h-8 rounded-full px-4 text-[13px] font-medium text-fg-subtle hover:bg-surface-3 hover:text-fg"
                  >
                    稍后
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Auto-dismiss countdown. `.animate-drain` runs for the same 8s as the
              timeout above, and is decorative only. */}
          <div className="relative h-[2px] bg-hairline" aria-hidden="true">
            <div
              className="animate-drain h-full w-full"
              style={{ background: 'linear-gradient(90deg, #8B5CF6, #D946EF)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
