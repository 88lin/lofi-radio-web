/**
 * media 元素的 pause / playing 事件要不要改写「用户是否想播」（userWantsPlay）。
 *
 * 背景：站内的播放意图是 store 里的 userWantsPlay，而元素自己会被站外的东西
 * 改状态——系统 / 浏览器媒体控件、耳机按钮、来电抢占音频焦点。两边不同步就会
 * 出两类问题：意图停在 true 会让站内按钮反过来（显示「暂停」，点一下执行
 * requestPause 恢复不了播放），看门狗还会在 60 秒后误报连接失败；意图停在
 * false 则相反，按钮显示「播放」点一下反而继续播，看门狗也不启动。
 *
 * 判定放在这里而不是散在事件处理器里，是因为每条分支都挡着一个不明显的回归，
 * 而且这些回归全都出在事件顺序上（切台 → 开播 → 原生暂停），只有纯逻辑才好
 * 整段测。
 */

/**
 * 站内自己发起的暂停，pause 事件会在这个时间窗内派发。
 *
 * 时间窗只是兜底，真正的失效点是 markSelfPause / consume / reset 这三个调用
 * （见 createPauseOriginTracker）。留着它是因为「pause 事件一定会送达」这个
 * 前提不成立——cleanup() 里 pause() 紧接着就是 load()，而 load() 会把还没
 * 派发的 pause 事件一并清掉，那次登记就没人消费。
 */
export const SELF_PAUSE_WINDOW_MS = 1000;

export interface PauseOriginTracker {
  /** 站内主动调用 pause() 时登记。 */
  markSelfPause(now: number): void;
  /** 取出这次 pause 的来源并作废登记：一次 pause() 最多对应一次事件。 */
  consume(now: number): boolean;
  /** 播放（重新）开始，作废此前的登记。 */
  reset(): void;
}

/**
 * 「这次 pause 是站内自己发起的吗」。
 *
 * 只按时间距离判是不够的：切台时 cleanup() 会登记一次自发暂停，而新电台可能
 * 几百毫秒就开播了，此时窗口还没过期——紧接着的原生暂停会被当成站内暂停，
 * 意图停在 true，播放按钮显示「暂停」却恢复不了播放，看门狗 60 秒后还会
 * 误报连接失败。
 * 所以 playing 事件必须 reset()：能重新播起来，就说明之前登记的那次暂停
 * 要么事件早已派发、要么已经被 load() 清掉，无论如何都已经作废了。
 */
export function createPauseOriginTracker(): PauseOriginTracker {
  // 哨兵取 -Infinity 而不是 0：now - 0 在小时间戳下会落进窗口里，
  // 「从来没登记过」就成了「刚刚登记过」。
  const NEVER = Number.NEGATIVE_INFINITY;
  let lastSelfPauseAt = NEVER;

  return {
    markSelfPause(now) {
      lastSelfPauseAt = now;
    },
    consume(now) {
      const selfInitiated = now - lastSelfPauseAt < SELF_PAUSE_WINDOW_MS;
      lastSelfPauseAt = NEVER;
      return selfInitiated;
    },
    reset() {
      lastSelfPauseAt = NEVER;
    },
  };
}

/** release = 同步成「不想播了」，restore = 同步成「想播」，null = 不动。 */
export type PlayIntentAction = 'release' | 'restore' | null;

export interface MediaIntentInput {
  event: 'pause' | 'playing';
  /** 事件派发时元素自己的 paused。和事件对不上就是过期事件，一律不动意图。 */
  paused: boolean;
  /** 播放到末尾。直播流走到这里是上游断了，要留给看门狗报错，不是用户暂停。 */
  ended: boolean;
  /** 这次暂停是不是站内自己发起的（切台清理 / 用户点暂停）。 */
  selfInitiated: boolean;
  userWantsPlay: boolean;
}

export function nextPlayIntent({
  event,
  paused,
  ended,
  selfInitiated,
  userWantsPlay,
}: MediaIntentInput): PlayIntentAction {
  if (event === 'pause') {
    // 事件派发时又在播了：这是一条过期的 pause，按它改意图会把正在响的流标成暂停
    if (!paused) return null;
    // 站内发起的暂停意图已经由 store 管好了。切台尤其不能动：cleanup() 会 pause
    // 掉旧的流，若因此把 userWantsPlay 清成 false，下一台加载完就不会自动播。
    if (selfInitiated || ended) return null;
    return userWantsPlay ? 'release' : null;
  }

  // playing：元素已经被暂停了说明这条 playing 也过期了
  if (paused) return null;
  return userWantsPlay ? null : 'restore';
}
