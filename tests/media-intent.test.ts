import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SELF_PAUSE_WINDOW_MS,
  isSelfInitiatedPause,
  nextPlayIntent,
  type PlayIntentAction,
} from '../src/lib/media-intent';

/**
 * 播放意图与 media 元素状态的同步。
 *
 * 用例按「完整事件顺序」写，而不是逐个布尔值点一遍：这几个回归全都是
 * 前一个事件留下的状态影响了后一个事件的判定，单看一步看不出来。
 */

/** 顺着事件序列跑一遍，返回每一步的动作和跟着变化的 userWantsPlay。 */
function runSequence(
  steps: {
    at: number;
    event: 'pause' | 'playing';
    paused: boolean;
    ended?: boolean;
    /** 这一步之前站内主动调了 pause()（切台清理 / 用户点暂停） */
    selfPausedAt?: number;
  }[],
  initialUserWantsPlay: boolean,
) {
  let userWantsPlay = initialUserWantsPlay;
  let lastSelfPauseAt = 0;
  const actions: PlayIntentAction[] = [];

  for (const step of steps) {
    if (step.selfPausedAt !== undefined) lastSelfPauseAt = step.selfPausedAt;

    const action = nextPlayIntent({
      event: step.event,
      paused: step.paused,
      ended: step.ended ?? false,
      selfInitiated: isSelfInitiatedPause(step.at, lastSelfPauseAt),
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
    [{ at: 1000, event: 'pause', paused: true, selfPausedAt: 1000 }],
    true,
  );

  assert.deepEqual(actions, [null]);
  assert.equal(userWantsPlay, true);
});

test('切台之后的原生暂停不会被上一次清理的标记吞掉', () => {
  // cleanup() 里 pause() 紧接着 load()，而 load() 会把还没派发的 pause 事件
  // 一并清掉。若用「一次性标记 + 事件消费」，那个标记永远没人消费，
  // 下一次真正的原生暂停就会被误判成站内发起的，意图留在 true，
  // 看门狗 60 秒后误报「播放中断」。
  const { actions, userWantsPlay } = runSequence(
    [
      // t=1000 切台：标记这一刻，但 pause 事件被 load() 吃掉了，不产生事件
      // t=40000 用户按系统媒体控件暂停
      { at: 40000, event: 'pause', paused: true, selfPausedAt: 1000 },
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
    [{ at: 5000, event: 'pause', paused: true, selfPausedAt: 5000 }],
    false,
  );

  assert.deepEqual(actions, [null]);
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
  assert.equal(isSelfInitiatedPause(1000, 1000), true);
  assert.equal(isSelfInitiatedPause(1000 + SELF_PAUSE_WINDOW_MS - 1, 1000), true);
  assert.equal(isSelfInitiatedPause(1000 + SELF_PAUSE_WINDOW_MS, 1000), false);
  // 从来没有自发暂停过（hook 里 ref 初值就是 0）
  assert.equal(isSelfInitiatedPause(Date.now(), 0), false);
});
