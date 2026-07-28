'use client';

import { useCallback } from 'react';
import { ChevronRight, Heart, History, Waves } from 'lucide-react';
import { SectionHeading } from '@/components/sections/section-heading';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import { useMounted } from '@/hooks/use-mounted';
import { cn } from '@/lib/utils';
import { getStationById, stations, type Station } from '@/lib/stations';
import { useAudioStore } from '@/store/audioStore';

/** Number of stations surfaced on the landing page (kept from the original copy). */
const FEATURED_COUNT = 8;

function Equalizer({ delayStep = 0.12 }: { delayStep?: number }) {
  return (
    <span className="flex h-4 items-end gap-0.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="animate-equalizer w-[2px] origin-bottom rounded-full bg-station will-change-transform"
          style={{ height: '14px', transform: 'scaleY(0.4)', animationDelay: `${i * delayStep}s` }}
        />
      ))}
    </span>
  );
}

function StationCard({
  station,
  index,
  isActive,
  isPlaying,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: {
  station: Station;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <Reveal delayMs={index * 45}>
      {/* The favourite toggle is a real button, so the card cannot itself be a
          <button> (nested interactive elements are invalid and break keyboard
          navigation). The select action is a full-bleed overlay button instead. */}
      <article
        className="group panel relative h-full overflow-hidden rounded-xl transition-[transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out-soft)] focus-within:elev-lg hover:-translate-y-[3px] hover:elev-lg"
        style={{ '--station-accent': station.color } as React.CSSProperties}
      >
        <span
          className="absolute inset-y-0 left-0 w-[3px] transition-colors"
          style={{ background: isActive ? 'var(--station-accent)' : 'transparent' }}
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[var(--dur-base)] group-hover:opacity-100"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in oklab, var(--station-accent) 10%, transparent) 0%, transparent 55%)',
          }}
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={onSelect}
          className="absolute inset-0 z-10 rounded-xl"
          aria-label={`播放 ${station.name}`}
        />

        <div className="pointer-events-none relative flex items-center gap-3 p-4 pr-10">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-station/12">
            {isActive && isPlaying ? (
              <Equalizer />
            ) : (
              <Waves className="h-4 w-4 text-station transition-transform group-hover:scale-110" />
            )}
          </span>

          <span className="min-w-0 flex-1">
            <span
              className={cn(
                'block truncate text-sm font-semibold transition-colors',
                isActive ? 'text-station' : 'text-fg',
              )}
            >
              {station.name}
            </span>
            <span className="mt-0.5 flex items-center gap-1">
              <span className="text-xs text-fg-subtle">{station.style1}</span>
              {station.custom && (
                <>
                  <span className="text-xs text-fg-faint">·</span>
                  <span className="text-[10px] font-medium text-station">{station.custom}</span>
                </>
              )}
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleFavorite}
          className="tap-target absolute top-2.5 right-2.5 z-20 flex h-6 w-6 items-center justify-center rounded-full text-fg-faint transition-colors hover:text-rose-500 focus-visible:text-rose-500"
          aria-label={isFavorite ? `取消收藏 ${station.name}` : `收藏 ${station.name}`}
          aria-pressed={isFavorite}
        >
          <Heart
            className={cn('h-3.5 w-3.5 transition-transform', isFavorite && 'scale-110')}
            fill={isFavorite ? 'currentColor' : 'none'}
            style={isFavorite ? { color: '#f43f5e' } : undefined}
          />
        </button>
      </article>
    </Reveal>
  );
}

function RecentlyPlayedRail({
  ids,
  currentId,
  onSelect,
}: {
  ids: string[];
  currentId: string | undefined;
  onSelect: (id: string) => void;
}) {
  const resolved = ids.map((id) => getStationById(id)).filter((s): s is Station => Boolean(s));
  if (resolved.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-fg-subtle">
        <History className="h-3.5 w-3.5" />
        最近在听
      </div>
      <div className="no-scrollbar scroll-fade-x -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {resolved.map((station) => (
          <button
            key={station.id}
            type="button"
            onClick={() => onSelect(station.id)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition-colors',
              station.id === currentId
                ? 'border-station/40 bg-station/12 text-station'
                : 'border-hairline bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg',
            )}
            style={{ '--station-accent': station.color } as React.CSSProperties}
          >
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: station.color }}
              aria-hidden="true"
            />
            {station.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StationsSection() {
  const mounted = useMounted();

  const currentStation = useAudioStore((s) => s.currentStation);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const favorites = useAudioStore((s) => s.favorites);
  const recentlyPlayed = useAudioStore((s) => s.recentlyPlayed);
  const selectStationById = useAudioStore((s) => s.selectStationById);
  const toggleFavorite = useAudioStore((s) => s.toggleFavorite);
  const setMiniMode = useAudioStore((s) => s.setMiniMode);

  const handleSelect = useCallback(
    (id: string) => {
      selectStationById(id);
      setMiniMode(false);
    },
    [selectStationById, setMiniMode],
  );

  const featured = stations.slice(0, FEATURED_COUNT);

  return (
    <section className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <SectionHeading title="精选电台" description="涵盖多种风格，总有适合你的音乐" />

        {mounted && (
          <RecentlyPlayedRail
            ids={recentlyPlayed}
            currentId={currentStation?.id}
            onSelect={handleSelect}
          />
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {featured.map((station, index) => (
            <StationCard
              key={station.id}
              station={station}
              index={index}
              isActive={mounted && currentStation?.id === station.id}
              isPlaying={isPlaying}
              isFavorite={mounted && favorites.includes(station.id)}
              onSelect={() => handleSelect(station.id)}
              onToggleFavorite={() => toggleFavorite(station.id)}
            />
          ))}
        </div>

        <div className="mt-6 text-center">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-full border-hairline-strong px-5 text-fg-muted hover:bg-surface-3 hover:text-fg"
            onClick={() => setMiniMode(false)}
          >
            查看全部电台
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
