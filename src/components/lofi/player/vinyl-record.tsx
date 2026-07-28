'use client';

import { Music } from 'lucide-react';
import { memo } from 'react';
import { cn } from '@/lib/utils';

/**
 * Spinning vinyl. A record is black in both themes, so the disc keeps its own
 * palette; only the halo and the centre label follow `--station-accent`.
 *
 * When the station exposes now-playing metadata with cover art, the artwork
 * replaces the generic music-note label — that was the most visible symptom of
 * the "expanded player looks empty" problem.
 */
export const VinylRecord = memo(function VinylRecord({
  isPlaying,
  size = 120,
  artwork,
  className,
}: {
  isPlaying: boolean;
  size?: number;
  artwork?: string | null;
  className?: string;
}) {
  const grooves = size >= 150 ? 8 : 5;

  return (
    <div
      className={cn('relative flex-shrink-0 select-none', className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Accent halo */}
      <div
        className={cn(
          'absolute -inset-4 rounded-full bg-station/15 transition-opacity',
          isPlaying ? 'animate-pulse-subtle opacity-100' : 'opacity-25',
        )}
        style={{ transitionDuration: 'var(--dur-slow)', filter: 'blur(14px)' }}
      />

      {/* Disc */}
      <div
        className={cn('absolute inset-0 rounded-full', isPlaying && 'animate-spin-slow')}
        style={{
          background:
            'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.12) 0%, transparent 45%),' +
            'radial-gradient(circle at 70% 70%, rgba(0,0,0,0.4) 0%, transparent 45%),' +
            'conic-gradient(from 0deg, #17171c, #26262e, #17171c, #26262e, #17171c)',
          boxShadow:
            'inset 0 2px 6px rgba(255,255,255,0.05), inset 0 -2px 6px rgba(0,0,0,0.35), var(--shadow-lg)',
        }}
      >
        {Array.from({ length: grooves }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-white/[0.015]"
            style={{ inset: `${(i + 1) * (56 / grooves)}%` }}
          />
        ))}
      </div>

      {/* Centre label: artwork when we have it, station-tinted note otherwise */}
      <div
        className="absolute overflow-hidden rounded-full bg-station"
        style={{
          inset: '18%',
          boxShadow:
            'inset 0 2px 8px rgba(0,0,0,0.25), inset 0 -1px 2px rgba(255,255,255,0.08),' +
            '0 0 24px color-mix(in oklab, var(--station-accent) 40%, transparent)',
        }}
      >
        {artwork ? (
          // Plain <img> on purpose: the art comes from arbitrary radio CDNs, and
          // `next/image` would need every one of those hosts allow-listed.
          <img
            src={artwork}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Music
              className="text-white/95 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
              style={{ width: size * 0.22, height: size * 0.22 }}
            />
          </div>
        )}
      </div>

      {/* Spindle hole */}
      <div
        className="absolute rounded-full bg-black/45"
        style={{ inset: '47.5%' }}
      />
    </div>
  );
});
