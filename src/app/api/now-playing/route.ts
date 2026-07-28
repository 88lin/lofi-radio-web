import { NextResponse } from 'next/server';
import { fetchNowPlaying } from '@/lib/now-playing';
import { hasNowPlaying } from '@/lib/station-meta';

/**
 * Now-playing aggregator.
 *
 * Proxied rather than called from the browser for two reasons: not every
 * upstream (AzuraCast / SomaFM / Radio Paradise) sends CORS headers, and
 * routing through the edge lets one cached response serve every listener
 * instead of each tab hammering the station's admin API.
 */
export const revalidate = 10;

export async function GET(request: Request) {
  const stationId = new URL(request.url).searchParams.get('station');

  if (!stationId) {
    return NextResponse.json({ error: 'missing `station` query parameter' }, { status: 400 });
  }

  // 204 rather than 404: "this station has no metadata source" is an expected,
  // permanent answer for 11 of the 21 stations, not an error the client
  // should retry or surface.
  if (!hasNowPlaying(stationId)) {
    return new NextResponse(null, {
      status: 204,
      headers: { 'Cache-Control': 'public, s-maxage=86400' },
    });
  }

  const nowPlaying = await fetchNowPlaying(stationId);

  if (!nowPlaying) {
    return new NextResponse(null, {
      status: 204,
      headers: { 'Cache-Control': 'public, s-maxage=10' },
    });
  }

  return NextResponse.json(nowPlaying, {
    headers: {
      'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
    },
  });
}
