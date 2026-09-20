'use client';

import { FloatingPlayer } from '@/components/lofi/floating-player';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

/**
 * 播放器宿主，必须挂在 root layout 而不是某个页面组件里。
 *
 * useAudioPlayer 的卸载清理会 `audio.pause(); audio.remove()`。它原本挂在首页里，
 * 站点只有首页时没人碰得到；加了 /stations、/faq、/about 之后，任何一次 SPA 跳转
 * 都会卸载首页 ⇒ 正在放的音乐被掐断。挂在 layout 上，audio 元素跨路由存活。
 *
 * 副产品是内容页也能直接点播：store 是全局的，任何页面调 selectStationById 都会出声。
 */
export function PlayerHost() {
  useAudioPlayer();
  return <FloatingPlayer />;
}
