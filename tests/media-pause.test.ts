import assert from 'node:assert/strict';
import test from 'node:test';

import { shouldReleasePlayIntent } from '../src/lib/media-pause';

/**
 * pause 事件的三个来源。三条分支各自挡着一个不明显的回归，
 * 改这段逻辑时它们必须还是绿的。
 */

test('切台清理发出的暂停不动播放意图', () => {
  // cleanup() 会 pause 掉旧的流。若因此把 userWantsPlay 清成 false，
  // 下一个电台加载完就不会自动播了。
  assert.equal(shouldReleasePlayIntent({ selfInitiated: true, ended: false }), false);
});

test('原生暂停要同步成「用户不想播了」', () => {
  // 系统媒体控件、耳机按钮、来电抢占音频焦点都走这条路。不同步的话
  // 播放意图留在 true，看门狗看到 currentTime 不再前进，会把用户主动
  // 暂停误报成「播放中断」，之后点播放还会整台重载而不是继续播。
  assert.equal(shouldReleasePlayIntent({ selfInitiated: false, ended: false }), true);
});

test('播放到末尾不算用户暂停', () => {
  // 直播流走到 ended 意味着上游断了，是真的中断。
  // 当成用户暂停悄悄收场的话，看门狗就不会报错，用户只看到播放器停了。
  assert.equal(shouldReleasePlayIntent({ selfInitiated: false, ended: true }), false);
});
