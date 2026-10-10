export type InstallDevice = 'ios' | 'android' | 'desktop';

// 保留旧 key，让已有用户的免打扰记录继续有效。
export const PWA_DISMISSED_KEY = 'pwa-install-dismissed';
export const PWA_INSTALLED_KEY = 'pwa-installed';
export const PWA_SESSION_KEY = 'pwa-install-seen';
export const PWA_MANUAL_SHOWN_KEY = 'pwa-install-manual-shown';
export const PWA_DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type InstallPromptMode = 'native' | 'manual';

type StorageAccess = () => Pick<Storage, 'getItem' | 'setItem'>;

function readStorage(access: StorageAccess, key: string) {
  try {
    return { available: true, value: access().getItem(key) };
  } catch {
    return { available: false, value: null };
  }
}

function writeStorage(access: StorageAccess, key: string, value: string) {
  try {
    access().setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** 独立于 React 生命周期：切页、重复事件和存储受限时共用同一份安装意图。 */
export function createPwaInstallState(local: StorageAccess, session: StorageAccess) {
  let seenInDocument = false;
  let installedInDocument = false;

  function isInstalled() {
    return installedInDocument || [local, session].some(
      (access) => readStorage(access, PWA_INSTALLED_KEY).value === 'true',
    );
  }

  function canPrompt(device: InstallDevice, now = Date.now(), mode: InstallPromptMode = 'native') {
    if (device === 'desktop' || seenInDocument || isInstalled()) return false;
    if (readStorage(session, PWA_SESSION_KEY).value === 'true') return false;
    // 无安装事件的手动说明只自动展示一次；之后收到原生事件仍走原有冷却规则。
    if (mode === 'manual' && [local, session].some(
      (access) => readStorage(access, PWA_MANUAL_SHOWN_KEY).value === 'true',
    )) return false;

    const records = [local, session].map((access) => readStorage(access, PWA_DISMISSED_KEY));
    // 无法记住露出记录时保持安静，避免每次刷新都重新打扰。
    if (!records.some((record) => record.available)) return false;

    return records.every(({ value }) => {
      const dismissedAt = Number(value);
      if (!Number.isFinite(dismissedAt) || dismissedAt <= 0) return true;
      // iOS 的普通标签页无法可靠查询主屏幕安装状态，手动安装引导只自动展示一次。
      return device !== 'ios' && now - dismissedAt >= PWA_DISMISS_WINDOW_MS;
    });
  }

  function rememberSeen(now: number) {
    const saved = [local, session].map((access) =>
      writeStorage(access, PWA_DISMISSED_KEY, String(now)),
    );
    writeStorage(session, PWA_SESSION_KEY, 'true');
    return saved.some(Boolean);
  }

  return {
    canPrompt,
    isInstalled,
    markShown(device: InstallDevice, now = Date.now(), mode: InstallPromptMode = 'native') {
      // 写入必须先于显示；同一份状态最多领取一次展示机会。
      if (!canPrompt(device, now, mode)) return false;
      if (mode === 'manual') {
        const saved = [local, session].map((access) =>
          writeStorage(access, PWA_MANUAL_SHOWN_KEY, 'true'),
        );
        if (!saved.some(Boolean)) return false;
      }
      if (!rememberSeen(now)) return false;
      seenInDocument = true;
      return true;
    },
    dismiss(now = Date.now()) {
      seenInDocument = true;
      rememberSeen(now);
    },
    markInstalled() {
      installedInDocument = true;
      for (const access of [local, session]) {
        writeStorage(access, PWA_INSTALLED_KEY, 'true');
      }
    },
  };
}

export type PwaInstallState = ReturnType<typeof createPwaInstallState>;
