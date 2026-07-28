'use client';

import { ChevronDown, Heart, Music4, Radio, Search, X } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';
import { useMounted } from '@/hooks/use-mounted';
import {
  buildCategories,
  collectStyles,
  filterByScene,
  type Station,
} from '@/lib/stations';
import { cn } from '@/lib/utils';
import { selectCatalogue, useAudioStore } from '@/store/audioStore';

/**
 * Station browser used by both the desktop side panel and the mobile sheet.
 *
 * Fixes S3: the category row used to be a bare `overflow-x-auto` strip inside a
 * 320px panel, so the last chips were silently cut off with no affordance. It is
 * now a `scroll-fade-x` scroller (mask-based right fade), and the two other
 * filters — free text and style — are ordinary form controls above it, so the
 * common case needs no horizontal scrolling at all.
 */
export const StationList = memo(function StationList({
  onClose,
  onSelect,
  initialScene,
  variant,
}: {
  onClose?: () => void;
  onSelect: (station: Station) => void;
  initialScene?: string;
  variant: 'desktop' | 'sheet';
}) {
  const mounted = useMounted();
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const currentStationId = useAudioStore((s) => s.currentStation?.id);
  const selectedCategory = useAudioStore((s) => s.selectedCategory);
  const setSelectedCategory = useAudioStore((s) => s.setSelectedCategory);
  const favorites = useAudioStore((s) => s.favorites);
  const toggleFavorite = useAudioStore((s) => s.toggleFavorite);
  const catalogue = useAudioStore(selectCatalogue);

  const [query, setQuery] = useState('');
  const [style, setStyle] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const categories = useMemo(() => buildCategories(catalogue), [catalogue]);
  const styles = useMemo(() => collectStyles(catalogue), [catalogue]);

  useEffect(() => {
    if (initialScene && categories.some((c) => c.id === initialScene)) {
      setSelectedCategory(initialScene);
    }
  }, [initialScene, categories, setSelectedCategory]);

  const visible = useMemo(() => {
    let list = filterByScene(catalogue, selectedCategory);
    if (style) list = list.filter((s) => s.style1 === style || s.style2 === style);
    if (favoritesOnly) list = list.filter((s) => favorites.includes(s.id));
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((s) =>
        `${s.name} ${s.scene} ${s.style1} ${s.style2}`.toLowerCase().includes(q),
      );
    }
    return list;
  }, [catalogue, selectedCategory, style, favoritesOnly, favorites, query]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-station">
            <Radio className="h-3.5 w-3.5 text-white" />
          </div>
          <h3 className="text-sm font-medium text-fg">电台列表</h3>
          <span className="text-xs text-fg-subtle tabular-nums">({visible.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setFavoritesOnly((v) => !v)}
            aria-pressed={favoritesOnly}
            aria-label="仅看收藏"
            title="仅看收藏"
            className={cn(
              'tap-target flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
              favoritesOnly
                ? 'bg-station/15 text-station'
                : 'bg-surface-2 text-fg-subtle hover:text-fg',
            )}
          >
            <Heart className={cn('h-4 w-4', favoritesOnly && 'fill-current')} />
          </button>
          {variant === 'sheet' && (
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭电台列表"
              className="tap-target flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-fg-subtle transition-colors hover:text-fg"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search + style filter */}
      <div className="flex gap-2 border-b border-hairline px-3 py-2.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-faint" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索电台"
            aria-label="搜索电台、场景或风格"
            className="h-11 w-full rounded-xl border border-hairline bg-surface-2 pl-9 pr-3 text-sm text-fg outline-none placeholder:text-fg-faint focus-visible:border-station/50"
          />
        </div>

        {/* A native select rather than a chip rail: there are 21 styles, which as
            chips meant ~1000px of horizontal scrolling inside a 320px panel and
            22 controls no taller than 25px. The select is one 44px control, and
            keyboard/screen-reader/mobile-wheel behaviour comes for free. */}
        <div className="relative w-[7.25rem] flex-shrink-0">
          <select
            value={style ?? ''}
            onChange={(event) => setStyle(event.target.value || null)}
            aria-label="按风格筛选"
            className={cn(
              'h-11 w-full appearance-none rounded-xl border bg-surface-2 pl-3 pr-7 text-xs font-medium outline-none transition-colors',
              style
                ? 'border-station/45 text-station'
                : 'border-hairline text-fg-muted hover:text-fg',
            )}
          >
            <option value="">全部风格</option>
            {styles.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-faint"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Scene chips */}
      <div className="border-b border-hairline px-3 py-2">
        <div className="no-scrollbar scroll-fade-x flex gap-1.5 overflow-x-auto pb-0.5">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              aria-pressed={selectedCategory === category.id}
              className={cn(
                'tap-target flex h-9 flex-shrink-0 items-center whitespace-nowrap rounded-full px-3 text-xs font-medium transition-colors',
                selectedCategory === category.id
                  ? 'bg-station text-white'
                  : 'bg-surface-2 text-fg-muted hover:text-fg',
              )}
            >
              {category.name}
              <span className="ml-1 tabular-nums opacity-60">{category.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-2.5">
        {visible.length === 0 ? (
          <p className="py-10 text-center text-sm text-fg-subtle">
            没有符合条件的电台
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {visible.map((station) => {
              const isActive = mounted && currentStationId === station.id;
              const isFavorite = mounted && favorites.includes(station.id);
              return (
                <li key={station.id} className="relative">
                  <button
                    type="button"
                    onClick={() => onSelect(station)}
                    aria-label={`播放 ${station.name}`}
                    aria-current={isActive ? 'true' : undefined}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border py-2.5 pl-2.5 pr-11 text-left transition-colors',
                      isActive
                        ? 'border-hairline-strong bg-surface-3'
                        : 'border-transparent hover:border-hairline hover:bg-surface-2',
                    )}
                    style={{
                      borderLeft: `3px solid ${isActive ? station.color : 'transparent'}`,
                    }}
                  >
                    <span
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${station.color}1f` }}
                    >
                      {isActive && isPlaying ? (
                        <span className="flex items-end gap-[2px]" aria-hidden="true">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="animate-equalizer w-[2px] rounded-full will-change-transform"
                              style={{
                                background: station.color,
                                animationDelay: `${i * 0.1}s`,
                                height: 14,
                              }}
                            />
                          ))}
                        </span>
                      ) : (
                        <Music4 className="h-5 w-5" style={{ color: station.color }} />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="mb-1 flex items-center gap-2">
                        <span
                          className={cn(
                            'truncate text-sm font-medium',
                            isActive ? 'text-fg' : 'text-fg-muted',
                          )}
                        >
                          {station.name}
                        </span>
                        {station.custom && (
                          <span
                            className="flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
                            style={{ background: `${station.color}2b`, color: station.color }}
                          >
                            {station.custom}
                          </span>
                        )}
                      </span>
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-fg-subtle">
                          {station.style1}
                        </span>
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-fg-faint">
                          {station.scene}
                        </span>
                      </span>
                    </span>
                  </button>

                  {/* Sibling, not a child: a button inside a button is invalid HTML
                      and browsers drop the inner one's activation behaviour. */}
                  <button
                    type="button"
                    onClick={() => toggleFavorite(station.id)}
                    aria-label={isFavorite ? `取消收藏 ${station.name}` : `收藏 ${station.name}`}
                    aria-pressed={isFavorite}
                    className="tap-target absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-fg-faint transition-colors hover:text-fg"
                  >
                    <Heart
                      className={cn('h-4 w-4', isFavorite && 'fill-current')}
                      style={isFavorite ? { color: '#f43f5e' } : undefined}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
});
