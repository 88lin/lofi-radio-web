import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createPwaInstallState,
  PWA_DISMISSED_KEY,
  PWA_DISMISS_WINDOW_MS,
  PWA_INSTALLED_KEY,
  PWA_MANUAL_SHOWN_KEY,
} from '../src/lib/pwa-install';

const NOW = 1_800_000_000_000;

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

const unavailable = () => { throw new Error('Storage blocked'); };

test('提示一露出就持久化，切页、刷新、新标签页都保留免打扰', () => {
  const local = storage();
  const session = storage();
  const state = createPwaInstallState(() => local, () => session);

  assert.equal(state.markShown('android', NOW), true);
  assert.equal(local.getItem(PWA_DISMISSED_KEY), String(NOW));
  assert.equal(state.markShown('android', NOW + 1), false);
  assert.equal(createPwaInstallState(() => local, () => session).canPrompt('android', NOW + 1), false);
  assert.equal(createPwaInstallState(() => local, storage).canPrompt('android', NOW + 1), false);
});

test('兼容旧版七天免打扰，过期后仅在新的浏览会话允许安卓提示', () => {
  const local = storage();
  local.setItem(PWA_DISMISSED_KEY, String(NOW));
  const state = createPwaInstallState(() => local, storage);

  assert.equal(state.canPrompt('android', NOW + PWA_DISMISS_WINDOW_MS - 1), false);
  assert.equal(state.canPrompt('android', NOW + PWA_DISMISS_WINDOW_MS), true);

  const session = storage();
  const shown = createPwaInstallState(() => local, () => session);
  assert.equal(shown.markShown('android', NOW + PWA_DISMISS_WINDOW_MS), true);
  assert.equal(createPwaInstallState(() => local, () => session).canPrompt('android', NOW + 3 * PWA_DISMISS_WINDOW_MS), false);
});

test('安卓无安装事件时的手动说明只自动展示一次，原生提示仍遵守七天冷却', () => {
  const local = storage();
  const session = storage();
  const state = createPwaInstallState(() => local, () => session);

  assert.equal(state.markShown('android', NOW, 'manual'), true);
  assert.equal(local.getItem(PWA_MANUAL_SHOWN_KEY), 'true');
  assert.equal(createPwaInstallState(() => local, storage).canPrompt('android', NOW + 365 * 86400000, 'manual'), false);
  assert.equal(createPwaInstallState(() => local, storage).canPrompt('android', NOW + 365 * 86400000), true);
});

test('关闭后的重复事件不能重新获取展示机会', () => {
  const local = storage();
  const state = createPwaInstallState(() => local, storage);
  state.dismiss(NOW);
  assert.equal(state.markShown('android', NOW + 1), false);
  assert.equal(state.markShown('android', NOW + 10 * PWA_DISMISS_WINDOW_MS), false);
});

test('安装记录不随免打扰期限过期，并对新页面生效', () => {
  const local = storage();
  const state = createPwaInstallState(() => local, storage);
  state.markInstalled();

  assert.equal(local.getItem(PWA_INSTALLED_KEY), 'true');
  const reopened = createPwaInstallState(() => local, storage);
  assert.equal(reopened.isInstalled(), true);
  assert.equal(reopened.canPrompt('android', NOW + 365 * 86400000), false);
  assert.equal(reopened.canPrompt('ios', NOW + 365 * 86400000), false);
});

test('localStorage 不可用时用 sessionStorage 保留刷新后的免打扰和安装记录', () => {
  const session = storage();
  const state = createPwaInstallState(unavailable, () => session);
  assert.equal(state.markShown('android', NOW), true);
  assert.equal(createPwaInstallState(unavailable, () => session).canPrompt('android', NOW + 1), false);

  state.markInstalled();
  assert.equal(createPwaInstallState(unavailable, () => session).isInstalled(), true);
});

test('sessionStorage 被禁用时仍可使用 localStorage 免打扰', () => {
  const local = storage();
  assert.equal(createPwaInstallState(() => local, unavailable).markShown('android', NOW), true);
  assert.equal(createPwaInstallState(() => local, unavailable).canPrompt('android', NOW + 1), false);
});

test('两种存储都不可用时不自动弹窗，也不会因写入失败崩溃', () => {
  const state = createPwaInstallState(unavailable, unavailable);
  assert.equal(state.canPrompt('ios', NOW), false);
  assert.equal(state.markShown('android', NOW), false);
  assert.doesNotThrow(() => state.dismiss(NOW));
  assert.doesNotThrow(() => state.markInstalled());
  assert.equal(state.isInstalled(), true);
});

test('存储可读但写入失败时不展示无法记账的提示', () => {
  const readOnly = () => ({ getItem: () => null, setItem: unavailable });
  const state = createPwaInstallState(readOnly, readOnly);
  assert.equal(state.markShown('android', NOW), false);
  assert.equal(state.markShown('ios', NOW), false);
});

test('另一个标签页在计时期间展示或完成安装，本页不能再展示', () => {
  const local = storage();
  const first = createPwaInstallState(() => local, storage);
  const second = createPwaInstallState(() => local, storage);
  assert.equal(second.canPrompt('android', NOW), true);
  assert.equal(first.markShown('android', NOW), true);
  assert.equal(second.markShown('android', NOW + 1), false);

  const freshLocal = storage();
  const waiting = createPwaInstallState(() => freshLocal, storage);
  createPwaInstallState(() => freshLocal, storage).markInstalled();
  assert.equal(waiting.markShown('android', NOW), false);
});

test('iOS 无法从普通标签查询主屏幕安装状态，旧提示记录也永久抑制自动引导', () => {
  const local = storage();
  const state = createPwaInstallState(() => local, storage);
  assert.equal(state.canPrompt('ios', NOW), true);
  local.setItem(PWA_DISMISSED_KEY, String(NOW - 365 * 86400000));
  assert.equal(state.canPrompt('ios', NOW), false);
});

test('损坏的旧时间戳不导致异常，未来时间戳继续保持免打扰', () => {
  const local = storage();
  const state = createPwaInstallState(() => local, storage);
  for (const value of ['invalid', '123bad', 'NaN', '-1', '0', 'Infinity']) {
    local.setItem(PWA_DISMISSED_KEY, value);
    assert.equal(state.canPrompt('android', NOW), true, value);
  }
  local.setItem(PWA_DISMISSED_KEY, String(NOW + 86400000));
  assert.equal(state.canPrompt('android', NOW), false);
});

test('桌面端始终只使用浏览器的手动安装入口', () => {
  assert.equal(createPwaInstallState(storage, storage).markShown('desktop', NOW), false);
});
