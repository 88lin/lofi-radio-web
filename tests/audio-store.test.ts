import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';

import { useAudioStore } from '../src/store/audioStore';
import { stations } from '../src/lib/stations';

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

/**
 * 选台的重载判定。
 *
 * useAudioPlayer 的加载 effect 只看「电台 id 变了没」和「stationLoadToken 变了没」，
 * 所以「要不要重新加载」这件事完全由 selectStation 写进 store 的令牌决定。
 * 下面三条各自对应一个真实回归，改动这段逻辑时它们必须还是绿的。
 */
function primePlayback(patch: Partial<ReturnType<typeof useAudioStore.getState>>) {
  useAudioStore.setState({
    currentStation: stations[0],
    stationIndex: 0,
    stationLoadToken: 7,
    userWantsPlay: true,
    isPlaying: false,
    isLoading: false,
    hasError: false,
    errorMessage: null,
    isSlowConnection: false,
    ...patch,
  });
}

test('出错后重选同一电台必须强制重载', () => {
  // 断流不会触发 pause 事件，isPlaying 会一直停在 true。若只按 isPlaying 判定
  // 「还在正常播、不用重载」，这一下就只是把错误清掉，什么都没做——
  // 回到「界面看着正常但没有声音」。
  primePlayback({ isPlaying: true, hasError: true, errorMessage: '播放中断了，请重试或换一个电台' });

  useAudioStore.getState().selectStationById(stations[0].id);

  const state = useAudioStore.getState();
  assert.equal(state.stationLoadToken, 8, '出错后重选同一电台必须递增令牌');
  assert.equal(state.hasError, false);
  assert.equal(state.errorMessage, null);
  assert.equal(state.isLoading, true);
  assert.equal(state.userWantsPlay, true);
});

test('正在正常出声时重选同一电台不打断', () => {
  primePlayback({ isPlaying: true });

  useAudioStore.getState().selectStationById(stations[0].id);

  const state = useAudioStore.getState();
  assert.equal(state.stationLoadToken, 7, '正在出声的电台不该被重新加载');
  assert.equal(state.isLoading, false, '不重载就不该显示加载中');
});

test('正在连接时重选同一电台不推倒重来', () => {
  // 重载会 destroy 掉 hls 实例、丢掉已经缓冲的部分，弱网下用户可能
  // 因此永远等不到成功那一次。慢提示也要一并保留：看门狗里的 hintedSlow
  // 是 effect 内的局部状态，这里清掉就不会再被置起来了。
  primePlayback({ isLoading: true, isSlowConnection: true });

  useAudioStore.getState().selectStationById(stations[0].id);

  const state = useAudioStore.getState();
  assert.equal(state.stationLoadToken, 7, '在连的电台不该被推倒重来');
  assert.equal(state.isLoading, true);
  assert.equal(state.isSlowConnection, true, '沿用当前这次加载时慢提示要保留');
});

test('切到另一个电台一定重载', () => {
  primePlayback({ isPlaying: true });

  useAudioStore.getState().selectStationById(stations[1].id);

  const state = useAudioStore.getState();
  assert.equal(state.currentStation?.id, stations[1].id);
  assert.equal(state.stationLoadToken, 8);
  assert.equal(state.isLoading, true);
});
