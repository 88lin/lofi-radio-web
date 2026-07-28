import { NextResponse } from 'next/server';
import { categories, stations } from '@/lib/stations';
import { getStationMeta } from '@/lib/station-meta';

/**
 * Public read-only catalogue of the built-in stations.
 *
 * Previously this route fetched `stations.json` from an unrelated GitHub
 * repository (`labilio/lofi-radio`) that this project does not control, so the
 * response had nothing to do with what the app actually plays. It now serves
 * this app's own catalogue plus the measured capability metadata, which is what
 * the station health checker and third-party clients need.
 */
export const revalidate = 3600;

export function GET() {
  return NextResponse.json(
    {
      count: stations.length,
      categories,
      stations: stations.map((station) => {
        const meta = getStationMeta(station.id);
        return {
          ...station,
          cors: meta.cors,
          nowPlaying: meta.nowPlaying.kind,
        };
      }),
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}
