import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SELF_PAUSE_WINDOW_MS,
  createPauseOriginTracker,
  nextPlayIntent,
  type PlayIntentAction,
} from '../src/lib/media-intent';

/**
 * 播放意图与 media 元素状态的同步。
 *
 * 用例按「完整事件顺序」写，而不是逐个布尔值点一遍：这几个回归全都是
 * 前一个事件留下的状态影响了后一个事件的判定，单看一步看不出来。
 */

type Step =
  /** 站内主动调 pause()（切台清理 / 用户点暂停） */
  | { at: number; selfPause: true }
  | { at: number; event: 'pause' | 'playing'; paused: boolean; ended?: boolean };

/** 顺着事件序列跑一遍，返回每个事件的动作和跟着变化的 userWantsPlay。 */
function runSequence(steps: Step[], initialUserWantsPlay: boolean) {
  const origin = createPauseOriginTracker();
  let userWantsPlay = initialUserWantsPlay;
  const actions: PlayIntentAction[] = [];

  for (const step of steps) {
    if ('selfPause' in step) {
      origin.markSelfPause(step.at);
      continue;
    }

    // 与 useAudioPlayer 的 syncPlayIntent 保持同一套调用顺序
    let selfInitiated = false;
    if (step.event === 'pause') selfInitiated = origin.consume(step.at);
    else origin.reset();

    const action = nextPlayIntent({
      event: step.event,
      paused: step.paused,
      ended: step.ended ?? false,
      selfInitiated,
      userWantsPlay,
    });

    if (action === 'release') userWantsPlay = false;
    if (action === 'restore') userWantsPlay = true;
    actions.push(action);
  }

  return { actions, userWantsPlay };
}

test('切台清理发出的暂停不动播放意图', () => {
  // cleanup() 会 pause 掉旧的流。若因此把 userWantsPlay 清成 false，
  // 下一个电台加载完就不会自动播。
  const { actions, userWantsPlay } = runSequence(
    [
      { at: 1000, selfPause: true },
      { at: 1010, event: 'pause', paused: true },
    ],
    true,
  );

  assert.deepEqual(actions, [null]);
  assert.equal(userWantsPlay, true);
});

test('切台后新电台已开播，1 秒内的原生暂停仍要算原生', () => {
  // 只按「离上一次自发暂停多久」判的话，新电台几百毫秒就开播时窗口还没过期，
  // 紧接着的原生暂停会被当成站内暂停：意图停在 true，按钮显示「暂停」却
  // 恢复不了播放，看门狗 60 秒后还会误报连接失败。
  // playing 必须作废上一轮的登记。
  const { actions, userWantsPlay } = runSequence(
    [
      { at: 0, selfPause: true }, // 切台 cleanup，pause 事件被 load() 清掉
      { at: 200, event: 'playing', paused: false }, // 新电台开播
      { at: 400, event: 'pause', paused: true }, // 系统媒体控件暂停
    ],
    true,
  );

  assert.deepEqual(actions, [null, 'release'], '开播之后的原生暂停必须同步意图');
  assert.equal(userWantsPlay, false);
});

test('切台之后隔很久的原生暂停不会被登记吞掉', () => {
  // cleanup() 里 pause() 紧接着 load()，而 load() 会把还没派发的 pause 事件
  // 一并清掉。登记没人消费时，时间窗是最后一道兜底。
  const { actions, userWantsPlay } = runSequence(
    [
      { at: 1000, selfPause: true },
      { at: 40000, event: 'pause', paused: true },
    ],
    true,
  );

  assert.deepEqual(actions, ['release'], '时间窗早已过期，这一次必须算原生暂停');
  assert.equal(userWantsPlay, false);
});

test('原生暂停后再原生恢复，意图要对称地还回去', () => {
  // 只 release 不 restore 的话：isPlaying=true 而 userWantsPlay=false，
  // 站内按钮会反过来（点「暂停」实际执行 requestPlay，音乐继续响），
  // 看门狗也不会启动，之后再断流不会报错。
  const { actions, userWantsPlay } = runSequence(
    [
      { at: 10000, event: 'pause', paused: true },
      { at: 20000, event: 'playing', paused: false },
    ],
    true,
  );

  assert.deepEqual(actions, ['release', 'restore']);
  assert.equal(userWantsPlay, true);
});

test('站内暂停不会被重复 release', () => {
  // 用户点暂停时 store 已经把意图置成 false，随后的 pause 事件不该再动它
  const { actions } = runSequence(
    [
      { at: 5000, selfPause: true },
      { at: 5010, event: 'pause', paused: true },
    ],
    false,
  );

  assert.deepEqual(actions, [null]);
});

test('一次自发暂停只挡一次 pause 事件', () => {
  // consume 之后登记就作废了，否则同一次登记会把后面的原生暂停也一起挡掉
  const origin = createPauseOriginTracker();
  origin.markSelfPause(1000);

  assert.equal(origin.consume(1010), true);
  assert.equal(origin.consume(1020), false, '第二次 pause 不该再被当成站内发起');
});

test('正常播放时的 playing 不重复 restore', () => {
  const { actions } = runSequence([{ at: 3000, event: 'playing', paused: false }], true);

  assert.deepEqual(actions, [null]);
});

test('播放到末尾不算用户暂停', () => {
  // 直播流走到 ended 意味着上游断了，是真的中断。当成用户暂停悄悄收场的话，
  // 看门狗就不会报错，用户只看到播放器停了。
  const { actions, userWantsPlay } = runSequence(
    [{ at: 30000, event: 'pause', paused: true, ended: true }],
    true,
  );

  assert.deepEqual(actions, [null]);
  assert.equal(userWantsPlay, true, '意图要留着，看门狗才会报出中断');
});

test('过期事件不改意图', () => {
  // play/pause 抢跑时事件可能比状态晚到：pause 事件派发时元素已经又在播了，
  // 或者 playing 事件派发时已经被暂停了。按它改意图会把状态标反。
  assert.equal(
    nextPlayIntent({ event: 'pause', paused: false, ended: false, selfInitiated: false, userWantsPlay: true }),
    null,
  );
  assert.equal(
    nextPlayIntent({ event: 'playing', paused: true, ended: false, selfInitiated: false, userWantsPlay: false }),
    null,
  );
});

test('自发暂停的时间窗到点即失效', () => {
  const origin = createPauseOriginTracker();

  origin.markSelfPause(1000);
  assert.equal(origin.consume(1000 + SELF_PAUSE_WINDOW_MS - 1), true);

  origin.markSelfPause(1000);
  assert.equal(origin.consume(1000 + SELF_PAUSE_WINDOW_MS), false);

  // 从来没有登记过
  assert.equal(createPauseOriginTracker().consume(Date.now()), false);
});
