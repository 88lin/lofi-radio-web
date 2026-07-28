import assert from 'node:assert/strict';
import test from 'node:test';

import { useAudioStore } from '../src/store/audioStore';

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

test('checkAndResetDailyFocus 同一天不做任何重置', () => {
  useAudioStore.setState({
    focusDate: today(),
    accumulatedFocusTime: 1234,
    focusStartTime: null,
    isPlaying: false,
  });

  useAudioStore.getState().checkAndResetDailyFocus();

  const state = useAudioStore.getState();
  assert.equal(state.accumulatedFocusTime, 1234);
  assert.equal(state.focusStartTime, null);
});

test('checkAndResetDailyFocus 跨天且未播放时清零并停表', () => {
  useAudioStore.setState({
    focusDate: '2000-01-01',
    accumulatedFocusTime: 5678,
    focusStartTime: null,
    isPlaying: false,
  });

  useAudioStore.getState().checkAndResetDailyFocus();

  const state = useAudioStore.getState();
  assert.equal(state.accumulatedFocusTime, 0);
  assert.equal(state.focusDate, today());
  assert.equal(state.focusStartTime, null);
});

test('checkAndResetDailyFocus 跨天且仍在播放时清零但继续计时', () => {
  const before = Date.now();

  useAudioStore.setState({
    focusDate: '2000-01-01',
    accumulatedFocusTime: 5678,
    focusStartTime: before - 3600_000,
    isPlaying: true,
  });

  useAudioStore.getState().checkAndResetDailyFocus();

  const state = useAudioStore.getState();
  assert.equal(state.accumulatedFocusTime, 0);
  assert.equal(state.focusDate, today());
  // 关键：不能被清成 null，否则计时会永久卡在 0 分钟
  assert.notEqual(state.focusStartTime, null);
  assert.ok(state.focusStartTime !== null && state.focusStartTime >= before);
  assert.equal(state.getFocusTime(), 0);
});
