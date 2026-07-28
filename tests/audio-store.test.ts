import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';

import { useAudioStore } from '../src/store/audioStore';

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 用本地时区的年月日时分秒造时间戳，避免测试结果随运行机器的时区变化。
 * 一律在启用 mock timers 之前调用，拿到的都是真实的 Date 构造函数。
 */
function localTime(y: number, m: number, d: number, hh = 0, mm = 0, ss = 0) {
  return new Date(y, m - 1, d, hh, mm, ss, 0).getTime();
}

// 每个用例前把专注计时相关字段恢复到已知基线，避免用例之间互相污染
beforeEach(() => {
  useAudioStore.setState({
    focusDate: dateKey(new Date()),
    accumulatedFocusTime: 0,
    focusStartTime: null,
    isPlaying: false,
  });
});

test('同一天调用时不做任何重置', () => {
  useAudioStore.setState({ accumulatedFocusTime: 1234 });

  useAudioStore.getState().checkAndResetDailyFocus();

  const state = useAudioStore.getState();
  assert.equal(state.accumulatedFocusTime, 1234);
  assert.equal(state.focusStartTime, null);
});

test('跨天且未播放时清零并停表', () => {
  useAudioStore.setState({ focusDate: '2000-01-01', accumulatedFocusTime: 5678 });

  useAudioStore.getState().checkAndResetDailyFocus();

  const state = useAudioStore.getState();
  assert.equal(state.accumulatedFocusTime, 0);
  assert.equal(state.focusDate, dateKey(new Date()));
  assert.equal(state.focusStartTime, null);
});

test('跨天且仍在播放时清零但继续计时（不能停表在 0）', (t) => {
  const midnight = localTime(2026, 3, 15, 0, 0, 0);
  const startedYesterday = localTime(2026, 3, 14, 22, 0, 0);
  // 午夜之后 45 秒才检测到跨天：后台标签页定时器被节流时就是这种情形
  t.mock.timers.enable({ apis: ['Date'], now: localTime(2026, 3, 15, 0, 0, 45) });

  useAudioStore.setState({
    focusDate: '2026-03-14',
    accumulatedFocusTime: 5678,
    focusStartTime: startedYesterday,
    isPlaying: true,
  });

  useAudioStore.getState().checkAndResetDailyFocus();

  const state = useAudioStore.getState();
  assert.equal(state.accumulatedFocusTime, 0);
  assert.equal(state.focusDate, '2026-03-15');
  // 关键：不能被清成 null，否则计时会永久卡在 0 分钟
  assert.notEqual(state.focusStartTime, null);
  // 起算点必须回退到当天零点，而不是「检测发生的那一刻」，
  // 否则午夜到首次检测之间的 45 秒会被静默漏掉
  assert.equal(state.focusStartTime, midnight);
  assert.equal(state.getFocusTime(), 45);
});

test('跨天后在日期检查前暂停，仍保留午夜后的时长', (t) => {
  const startedYesterday = localTime(2026, 3, 14, 22, 0, 0);
  t.mock.timers.enable({ apis: ['Date'], now: localTime(2026, 3, 15, 0, 0, 45) });

  useAudioStore.setState({
    focusDate: '2026-03-14',
    accumulatedFocusTime: 5678,
    focusStartTime: startedYesterday,
    isPlaying: true,
  });

  // pause 事件可能抢在被节流的跨日 interval 前到达。
  useAudioStore.getState().setPlaying(false);
  useAudioStore.getState().checkAndResetDailyFocus();

  const state = useAudioStore.getState();
  assert.equal(state.focusDate, '2026-03-15');
  assert.equal(state.isPlaying, false);
  assert.equal(state.focusStartTime, null);
  assert.equal(state.accumulatedFocusTime, 45);
  assert.equal(state.getFocusTime(), 45);
});

test('跨天检测发生在开播之后时，沿用原起算点而不是回退到零点', (t) => {
  const startedAfterMidnight = localTime(2026, 3, 15, 0, 0, 30);
  t.mock.timers.enable({ apis: ['Date'], now: localTime(2026, 3, 15, 0, 0, 45) });

  useAudioStore.setState({
    focusDate: '2026-03-14',
    accumulatedFocusTime: 5678,
    focusStartTime: startedAfterMidnight,
    isPlaying: true,
  });

  useAudioStore.getState().checkAndResetDailyFocus();

  const state = useAudioStore.getState();
  // 回退到零点会把 00:00:00–00:00:30 这段没在听的时间算进来
  assert.equal(state.focusStartTime, startedAfterMidnight);
  assert.equal(state.getFocusTime(), 15);
});

test('跨天且在播放但起算点缺失时，从当下开始计时', (t) => {
  const now = localTime(2026, 3, 15, 0, 0, 45);
  t.mock.timers.enable({ apis: ['Date'], now });

  useAudioStore.setState({
    focusDate: '2026-03-14',
    accumulatedFocusTime: 5678,
    focusStartTime: null,
    isPlaying: true,
  });

  useAudioStore.getState().checkAndResetDailyFocus();

  const state = useAudioStore.getState();
  // 状态不一致时保守处理：不回退到零点，避免凭空多算时间
  assert.equal(state.focusStartTime, now);
  assert.equal(state.getFocusTime(), 0);
});
