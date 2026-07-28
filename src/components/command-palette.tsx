'use client';

import { useCallback, useMemo } from 'react';
import { Heart, History, Keyboard, Moon, Pause, Play, Radio, Sun } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useThemeToggle } from '@/hooks/use-theme-toggle';
import { getStationById, type Station } from '@/lib/stations';
import { selectCatalogue, useAudioStore } from '@/store/audioStore';
import { useUiStore } from '@/store/uiStore';

/**
 * ⌘K station switcher.
 *
 * Reuses the `cmdk` dependency and `components/ui/command.tsx` that were already
 * installed but unused, so search costs no new bundle weight beyond this file.
 */
export function CommandPalette() {
  const open = useUiStore((s) => s.isPaletteOpen);
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const setShortcutsOpen = useUiStore((s) => s.setShortcutsOpen);
  const { isDark, toggleTheme } = useThemeToggle();

  const catalogue = useAudioStore(selectCatalogue);
  const favorites = useAudioStore((s) => s.favorites);
  const recentlyPlayed = useAudioStore((s) => s.recentlyPlayed);
  const currentStation = useAudioStore((s) => s.currentStation);
  const userWantsPlay = useAudioStore((s) => s.userWantsPlay);
  const selectStationById = useAudioStore((s) => s.selectStationById);
  const requestPlay = useAudioStore((s) => s.requestPlay);
  const requestPause = useAudioStore((s) => s.requestPause);
  const toggleFavorite = useAudioStore((s) => s.toggleFavorite);

  const favoriteStations = useMemo(
    () => favorites.map((id) => getStationById(id)).filter((s): s is Station => Boolean(s)),
    [favorites],
  );
  const recentStations = useMemo(
    () => recentlyPlayed.map((id) => getStationById(id)).filter((s): s is Station => Boolean(s)),
    [recentlyPlayed],
  );

  const pick = useCallback(
    (id: string) => {
      selectStationById(id);
      setPaletteOpen(false);
    },
    [selectStationById, setPaletteOpen],
  );

  const renderStation = (station: Station, keyPrefix: string) => (
    <CommandItem
      key={`${keyPrefix}-${station.id}`}
      // cmdk matches on `value` + `keywords`; including scene and both style
      // tags means "爵士", "编程", "Chill" all find the right stations.
      value={`${station.name} ${station.scene} ${station.style1} ${station.style2} ${station.id}`}
      keywords={[station.scene, station.style1, station.style2]}
      onSelect={() => pick(station.id)}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: station.color }}
        aria-hidden="true"
      />
      <span className="flex-1 truncate">{station.name}</span>
      <span className="shrink-0 text-xs text-fg-subtle">
        {station.scene} · {station.style1}
      </span>
    </CommandItem>
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setPaletteOpen}
      title="搜索电台"
      description="按电台名称、场景或风格搜索，回车切台"
      className="max-w-xl"
    >
      <CommandInput placeholder="搜索电台、场景或风格…" />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>没有匹配的电台</CommandEmpty>

        {recentStations.length > 0 && (
          <CommandGroup heading="最近在听">
            {recentStations.slice(0, 5).map((s) => renderStation(s, 'recent'))}
          </CommandGroup>
        )}

        {favoriteStations.length > 0 && (
          <CommandGroup heading="我的收藏">
            {favoriteStations.map((s) => renderStation(s, 'fav'))}
          </CommandGroup>
        )}

        <CommandGroup heading="全部电台">
          {catalogue.map((s) => renderStation(s, 'all'))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="操作">
          <CommandItem
            value="播放 暂停 play pause"
            onSelect={() => {
              if (userWantsPlay) requestPause();
              else requestPlay();
              setPaletteOpen(false);
            }}
          >
            {userWantsPlay ? <Pause /> : <Play />}
            <span>{userWantsPlay ? '暂停' : '播放'}</span>
            <CommandShortcut>Space</CommandShortcut>
          </CommandItem>

          {currentStation && (
            <CommandItem
              value="收藏 当前电台 favorite"
              onSelect={() => {
                toggleFavorite(currentStation.id);
                setPaletteOpen(false);
              }}
            >
              <Heart />
              <span>
                {favorites.includes(currentStation.id) ? '取消收藏' : '收藏'}「
                {currentStation.name}」
              </span>
              <CommandShortcut>F</CommandShortcut>
            </CommandItem>
          )}

          <CommandItem
            value="切换主题 theme dark light"
            onSelect={() => {
              toggleTheme();
              setPaletteOpen(false);
            }}
          >
            {isDark ? <Sun /> : <Moon />}
            <span>{isDark ? '切换到亮色主题' : '切换到暗色主题'}</span>
            <CommandShortcut>T</CommandShortcut>
          </CommandItem>

          <CommandItem
            value="快捷键 帮助 shortcuts help"
            onSelect={() => {
              setPaletteOpen(false);
              setShortcutsOpen(true);
            }}
          >
            <Keyboard />
            <span>查看全部快捷键</span>
            <CommandShortcut>?</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>

      <div className="flex items-center gap-3 border-t border-hairline px-3 py-2 text-[11px] text-fg-subtle">
        <span className="flex items-center gap-1">
          <Radio className="h-3 w-3" />
          {catalogue.length} 个电台
        </span>
        <span className="flex items-center gap-1">
          <History className="h-3 w-3" />
          最近 {recentStations.length}
        </span>
        <span className="ml-auto">↑↓ 选择 · Enter 切台 · Esc 关闭</span>
      </div>
    </CommandDialog>
  );
}
