export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }

  interface Window {
    __lofiPwaInstall?: {
      prompt: BeforeInstallPromptEvent | null;
      installed: boolean;
    };
  }
}

// 使用普通 head 内联脚本，必须在 React 下载、hydration 和 effect 之前捕获事件。
// 不读取存储、不自行弹窗；冷却、路由和安装状态仍由组件统一处理。
export const PWA_INSTALL_CAPTURE_SCRIPT = `(() => {
  if (window.__lofiPwaInstall) return;
  const state = window.__lofiPwaInstall = { prompt: null, installed: false };
  window.addEventListener('beforeinstallprompt', (event) => {
    if (!/android/i.test(navigator.userAgent)) return;
    event.preventDefault();
    state.prompt = state.installed ? null : event;
  }, true);
  window.addEventListener('appinstalled', () => {
    state.installed = true;
    state.prompt = null;
  });
})();`;
