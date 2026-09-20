'use client';

import { Pause, Play } from 'lucide-react';

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

function useStationPlayback(stationId: string) {
  const current = useAudioStore((s) => s.currentStation);
  const userWantsPlay = useAudioStore((s) => s.userWantsPlay);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const selectStationById = useAudioStore((s) => s.selectStationById);
  const requestPause = useAudioStore((s) => s.requestPause);
  const requestPlay = useAudioStore((s) => s.requestPlay);
  const setMiniMode = useAudioStore((s) => s.setMiniMode);

  const isCurrent = current?.id === stationId;

  const toggle = () => {
    if (!isCurrent) {
      selectStationById(stationId);
      setMiniMode(true);
      return;
    }
    if (userWantsPlay) requestPause();
    else requestPlay();
  };

  return { isCurrent, isActive: isCurrent && userWantsPlay, isSounding: isCurrent && isPlaying, toggle };
}

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
  const { isCurrent, isActive, isSounding, toggle } = useStationPlayback(station.id);
  const label = isActive ? `暂停 ${station.name}` : `播放 ${station.name}`;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
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
        style={{ "--sf": tintSurface(station.color), "--sf-d": shadeSurface(station.color) } as React.CSSProperties}
      >
        {isSounding ? (
          <Equalizer color={station.color} />
        ) : isActive ? (
          <Pause className="h-4 w-4" style={{ color: station.color }} />
        ) : (
          <Play className="h-4 w-4 translate-x-[1px]" style={{ color: station.color }} />
        )}
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
        {layout === 'card' ? (
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
  const { isCurrent, isActive, isSounding, toggle } = useStationPlayback(station.id);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isActive ? `暂停 ${station.name}` : `播放 ${station.name}`}
      aria-pressed={isActive}
      className={cn(
        'inline-flex min-h-9 items-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EC4899] focus-visible:ring-offset-2',
        'focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#101014]',
        isCurrent
          ? 'bg-[#FFE3F1] text-[#BE185D] dark:bg-[#33132A] dark:text-[#FBCFE8]'
          : 'bg-black/[0.04] text-zinc-600 hover:bg-black/[0.07] hover:text-zinc-900 dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/[0.11] dark:hover:text-white',
      )}
    >
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--sf)] dark:bg-[var(--sf-d)]"
        style={{ "--sf": tintSurface(station.color), "--sf-d": shadeSurface(station.color) } as React.CSSProperties}
      >
        {isSounding ? (
          <Equalizer color={station.color} />
        ) : isActive ? (
          <Pause className="h-2.5 w-2.5" style={{ color: station.color }} />
        ) : (
          <Play className="h-2.5 w-2.5 translate-x-[0.5px]" style={{ color: station.color }} />
        )}
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
