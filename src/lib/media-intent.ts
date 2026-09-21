/**
 * media 元素的 pause / playing 事件要不要改写「用户是否想播」（userWantsPlay）。
 *
 * 背景：站内的播放意图是 store 里的 userWantsPlay，而元素自己会被站外的东西
 * 改状态——系统 / 浏览器媒体控件、耳机按钮、来电抢占音频焦点。两边不同步就会
 * 出两类问题：意图停在 true 会让看门狗把「用户主动暂停」误报成播放中断；
 * 意图停在 false 会让站内按钮反过来（显示「播放」，点一下反而继续播），
 * 看门狗也不会启动。
 *
 * 判定放在这里而不是散在事件处理器里，是因为每条分支都挡着一个不明显的回归，
 * 而且事件顺序（切台 → 原生暂停 → 原生恢复）只有纯函数才好整段测。
 */

/**
 * 站内自己发起的暂停，pause 事件会在这个时间窗内派发。
 *
 * 用时间窗而不是「打一个一次性标记、由事件消费」：cleanup() 里 pause() 之后
 * 紧接着就是 load()，而 load() 会把还没派发的 pause 事件一并清掉，标记就永远
 * 没人消费，一直留到下一次真正的原生暂停上被误判成「自己发起的」。
 * 时间窗到点自动失效，不依赖事件一定送达。
 *
 * 取 1s 是就两边的代价权衡：判成「原生」的代价是切台时清掉播放意图、下一台
 * 不会自动播；判成「自己发起」的代价只是这一次原生暂停没同步，看门狗 60s 后
 * 多报一句中断。所以窗口宁可给宽一点。
 */
export const SELF_PAUSE_WINDOW_MS = 1000;

export function isSelfInitiatedPause(now: number, lastSelfPauseAt: number): boolean {
  return now - lastSelfPauseAt < SELF_PAUSE_WINDOW_MS;
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
