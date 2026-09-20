'use client';

import { Loader2, Pause, Play, RotateCcw } from 'lucide-react';

import { useAudioStore } from '@/store/audioStore';
import { getSceneColor, type Station } from '@/lib/stations';
import { shadeSurface, tintSurface } from '@/lib/palette';
import { cn } from '@/lib/utils';

/**
 * /stations 上的点播控件。
 *
 * 页面本体保持服务端渲染（正文要进首屏 HTML），只有需要出声的这几个元素是客户端的。
 * 播放本身由 layout 里的 PlayerHost 负责，这里只往全局 store 写意图。
 */

/** 失败态的红色，浅底深字都用它，和 palette.ts 里的语义色保持一个量级。 */
const FAIL_COLOR = '#DC2626';

function useStationPlayback(stationId: string) {
  const current = useAudioStore((s) => s.currentStation);
  const userWantsPlay = useAudioStore((s) => s.userWantsPlay);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const isLoading = useAudioStore((s) => s.isLoading);
  const hasError = useAudioStore((s) => s.hasError);
  const isSlowConnection = useAudioStore((s) => s.isSlowConnection);
  const selectStationById = useAudioStore((s) => s.selectStationById);
  const requestPause = useAudioStore((s) => s.requestPause);
  const requestPlay = useAudioStore((s) => s.requestPlay);
  const retryStation = useAudioStore((s) => s.retryStation);
  const setMiniMode = useAudioStore((s) => s.setMiniMode);

  const isCurrent = current?.id === stationId;
  const isFailed = isCurrent && hasError;
  // 不加 !isPlaying：直播流放着放着断流时不会触发 pause 事件，isPlaying 会一直
  // 停在 true，只有 waiting 事件把 isLoading 抬起来——这时候该转圈，不是显示均衡器。
  const isBuffering = isCurrent && userWantsPlay && isLoading && !hasError;

  const toggle = () => {
    if (!isCurrent) {
      selectStationById(stationId);
      setMiniMode(true);
      return;
    }
    // 出错时点播放 = 重试当前电台，原因同播放器内的处理：只调 requestPlay 会把
    // hasError 清掉却不重新加载（加载 effect 认为电台和令牌都没变，直接跳过），
    // 结果是错误提示消失、按钮变成暂停、但一直没有声音。
    if (isFailed) retryStation();
    else if (userWantsPlay) requestPause();
    else requestPlay();
  };

  return {
    isCurrent,
    // 失败态不能算「正在播放」：这一格的图标是用户判断有没有在响的唯一依据
    isActive: isCurrent && userWantsPlay && !hasError,
    isSounding: isCurrent && isPlaying,
    // 「在连但还没出声」必须和「已经在放」区分开，否则连不上的那段时间里
    // 按钮显示的是暂停图标，看起来和正常播放一模一样。
    // 要带上 userWantsPlay：页面刚打开时播放器会预载当前电台，那会儿
    // isLoading 也是 true，但用户并没有点过任何东西，不该转圈。
    isBuffering,
    /** 还在连、只是慢。这是提示不是错误，文案不能写成「失败」。 */
    isSlow: isBuffering && isSlowConnection,
    isFailed,
    toggle,
  };
}

type PlaybackState = ReturnType<typeof useStationPlayback>;

/** 播放中的三根跳动竖条。用真实的动画条而不是一个静态图标，状态一眼可辨。 */
function Equalizer({ color }: { color: string }) {
  return (
    <span className="flex items-end gap-[2px] h-3.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[2px] rounded-full animate-equalizer origin-bottom"
          style={{ background: color, height: '14px', transform: 'scaleY(0.4)', animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </span>
  );
}

/**
 * 五态图标：失败 → 重试，缓冲 → 转圈，出声 → 均衡器，有播放意图 → 暂停，其余 → 播放。
 * 缓冲要排在出声前面：流卡住时 isPlaying 仍是 true，先判它才不会一边没声一边跳均衡器。
 */
function StateIcon({
  state,
  color,
  size,
}: {
  state: PlaybackState;
  color: string;
  size: string;
}) {
  if (state.isFailed) return <RotateCcw className={size} style={{ color: FAIL_COLOR }} />;
  if (state.isBuffering) return <Loader2 className={cn(size, 'animate-spin')} style={{ color }} />;
  if (state.isSounding) return <Equalizer color={color} />;
  if (state.isActive) return <Pause className={size} style={{ color }} />;
  return <Play className={cn(size, 'translate-x-[1px]')} style={{ color }} />;
}

function playbackLabel(station: Station, state: PlaybackState) {
  if (state.isFailed) return `重试播放 ${station.name}（播放失败）`;
  if (state.isSlow) return `${station.name} 网络较慢，仍在连接，点击停止`;
  if (state.isBuffering) return `${station.name} 连接中，点击停止`;
  return state.isActive ? `暂停 ${station.name}` : `播放 ${station.name}`;
}

/**
 * 电台清单里的一行/一张卡。
 * 整行是一个 button：键盘可达，不需要给 <tr> 挂 onClick 那种鼠标专属的写法。
 */
export function StationPlayButton({
  station,
  layout,
}: {
  station: Station;
  layout: 'row' | 'card';
}) {
  const state = useStationPlayback(station.id);
  const { isCurrent, isActive, isFailed, isSlow, toggle } = state;
  const swatch = isFailed ? FAIL_COLOR : station.color;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playbackLabel(station, state)}
      aria-pressed={isActive}
      className={cn(
        'group/play flex min-h-11 items-center gap-3 rounded-xl text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC4899] focus-visible:ring-offset-2',
        'focus-visible:ring-offset-[#fafafa] dark:focus-visible:ring-offset-[#0a0a0c]',
        layout === 'card' ? 'w-full' : '-ml-1 pr-2',
      )}
    >
      <span
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--sf)] transition-transform group-hover/play:scale-105 dark:bg-[var(--sf-d)]"
        style={{ "--sf": tintSurface(swatch), "--sf-d": shadeSurface(swatch) } as React.CSSProperties}
      >
        <StateIcon state={state} color={station.color} size="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            'block truncate text-base font-semibold transition-colors',
            isCurrent
              ? 'text-[#BE185D] dark:text-[#FBCFE8]'
              : 'text-zinc-900 group-hover/play:text-[#BE185D] dark:text-zinc-100 dark:group-hover/play:text-[#FBCFE8]',
          )}
        >
          {station.name}
        </span>
        {/* 失败和「慢」必须分开讲：整站只有浮动播放器会显示状态，清单页上
            21 行里只有这一行出了问题，不在原地讲一句用户无从判断。
            尤其不能把「还在连」写成「失败」——用户一点重试就把缓冲全丢了。 */}
        {isFailed ? (
          <span className="mt-0.5 block text-sm font-medium text-[#DC2626] dark:text-[#FCA5A5]">
            播放失败 · 点击重试
          </span>
        ) : isSlow ? (
          <span className="mt-0.5 block text-sm font-medium text-[#92400E] dark:text-[#FDE68A]">
            网络较慢，仍在连接…
          </span>
        ) : layout === 'card' ? (
          <span className="mt-0.5 block text-sm text-zinc-500 dark:text-zinc-400">
            {station.style1} / {station.style2}
          </span>
        ) : null}
      </span>
    </button>
  );
}

/** 场景面板里的电台小胶囊，点一下直接播。 */
export function StationChip({ station }: { station: Station }) {
  const state = useStationPlayback(station.id);
  const { isCurrent, isActive, isFailed, toggle } = state;
  const swatch = isFailed ? FAIL_COLOR : station.color;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playbackLabel(station, state)}
      aria-pressed={isActive}
      className={cn(
        'inline-flex min-h-9 items-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC4899] focus-visible:ring-offset-2',
        'focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#101014]',
        isFailed
          ? 'bg-[#FEE2E2] text-[#B91C1C] dark:bg-[#3A1414] dark:text-[#FCA5A5]'
          : isCurrent
            ? 'bg-[#FFE3F1] text-[#BE185D] dark:bg-[#33132A] dark:text-[#FBCFE8]'
            : 'bg-black/[0.04] text-zinc-600 hover:bg-black/[0.07] hover:text-zinc-900 dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/[0.11] dark:hover:text-white',
      )}
    >
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--sf)] dark:bg-[var(--sf-d)]"
        style={{ "--sf": tintSurface(swatch), "--sf-d": shadeSurface(swatch) } as React.CSSProperties}
      >
        <StateIcon state={state} color={station.color} size="h-2.5 w-2.5" />
      </span>
      {station.name}
    </button>
  );
}

/** 场景标签。底色取该场景第一个电台的颜色，和电台清单里的色块是同一套。 */
export function SceneTag({ scene, count }: { scene: string; count?: number }) {
  const color = getSceneColor(scene);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--sf)] px-2.5 py-1 text-sm font-medium text-zinc-800 dark:bg-[var(--sf-d)] dark:text-zinc-100"
      style={{ "--sf": tintSurface(color), "--sf-d": shadeSurface(color) } as React.CSSProperties}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden="true" />
      {scene}
      {count !== undefined ? (
        <span className="tabular-nums text-zinc-500 dark:text-zinc-400">{count}</span>
      ) : null}
    </span>
  );
}
