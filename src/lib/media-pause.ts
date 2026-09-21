/**
 * media 元素的 pause 事件有三个来源，处置完全不同——这个判断单独拎出来，
 * 是因为三条分支各自对应一个不明显的回归。
 *
 * 1. 站内自己发起的暂停（切台时的 cleanup、用户点暂停）。播放意图已经由 store
 *    管好了，这里不能再动。切台尤其危险：cleanup() 会 pause 掉旧的流，若因此
 *    把 userWantsPlay 清成 false，下一个电台加载完就不会自动播。
 * 2. 原生暂停：系统 / 浏览器媒体控件、耳机按钮、来电抢占音频焦点。它只改
 *    isPlaying，播放意图还留在 true。不同步的话，看门狗看到 currentTime 不再
 *    前进，会把「用户主动暂停」误报成「播放中断」，之后点播放还会整台重载。
 * 3. 播放到末尾（ended）。直播流走到这里意味着上游断了，是真的中断，
 *    要让看门狗照常报错，不能当成用户暂停悄悄收场。
 */
export function shouldReleasePlayIntent({
  selfInitiated,
  ended,
}: {
  selfInitiated: boolean;
  ended: boolean;
}): boolean {
  return !selfInitiated && !ended;
}
