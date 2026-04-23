import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

type BilibiliRoomInfoResponse = {
  code: number;
  message: string;
  data?: {
    title?: string;
    live_status?: number;
  };
};

type BilibiliPlayInfoResponse = {
  code: number;
  message: string;
  data?: {
    playurl_info?: {
      playurl?: {
        g_qn_desc?: Array<{ qn: number; desc: string }>;
        stream?: Array<{
          protocol_name?: string;
          format?: Array<{
            format_name?: string;
            master_url?: string;
            codec?: Array<{
              codec_name?: string;
              current_qn?: number;
              base_url?: string;
              url_info?: Array<{
                host?: string;
                extra?: string;
              }>;
            }>;
          }>;
        }>;
      };
    };
  };
};

type StreamCandidate = {
  url: string;
  qn: number;
  codecName: string;
};

const BILIBILI_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Referer: 'https://live.bilibili.com/',
};

async function fetchJson<T>(url: string, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: BILIBILI_HEADERS,
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Upstream request failed: ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildStreamUrl(baseUrl?: string, urlInfo?: { host?: string; extra?: string }): string | null {
  if (!baseUrl || !urlInfo?.host || !urlInfo.extra) {
    return null;
  }

  return `${urlInfo.host}${baseUrl}${urlInfo.extra}`;
}

function extractStreamCandidates(
  playInfo: BilibiliPlayInfoResponse['data'],
  protocolName: string,
  formatName: string
): StreamCandidate[] {
  const streams = playInfo?.playurl_info?.playurl?.stream ?? [];

  return streams
    .filter((stream) => stream.protocol_name === protocolName)
    .flatMap((stream) => stream.format ?? [])
    .filter((format) => format.format_name === formatName)
    .flatMap((format) =>
      (format.codec ?? []).flatMap((codec) =>
        (codec.url_info ?? []).flatMap((urlInfo) => {
          const url = buildStreamUrl(codec.base_url, urlInfo);
          if (!url) {
            return [];
          }

          return [{ url, qn: codec.current_qn ?? 0, codecName: codec.codec_name ?? '' }];
        })
      )
    )
    .sort((a, b) => {
      if (b.qn !== a.qn) {
        return b.qn - a.qn;
      }

      if (a.codecName === b.codecName) {
        return 0;
      }

      if (a.codecName === 'avc') {
        return -1;
      }

      if (b.codecName === 'avc') {
        return 1;
      }

      return 0;
    });
}

function extractHlsUrl(playInfo: BilibiliPlayInfoResponse['data']): string | null {
  const streams = playInfo?.playurl_info?.playurl?.stream ?? [];

  for (const protocolName of ['http_hls', 'http_stream']) {
    for (const formatName of ['ts', 'fmp4']) {
      const matchedFormats = streams
        .filter((stream) => stream.protocol_name === protocolName)
        .flatMap((stream) => stream.format ?? [])
        .filter((format) => format.format_name === formatName);

      for (const format of matchedFormats) {
        const candidates = (format.codec ?? [])
          .flatMap((codec) =>
            (codec.url_info ?? []).flatMap((urlInfo) => {
              const url = buildStreamUrl(codec.base_url, urlInfo);
              if (!url) {
                return [];
              }

              return [{ url, qn: codec.current_qn ?? 0, codecName: codec.codec_name ?? '' }];
            })
          )
          .sort((a, b) => {
            if (b.qn !== a.qn) {
              return b.qn - a.qn;
            }

            if (a.codecName === b.codecName) {
              return 0;
            }

            if (a.codecName === 'avc') {
              return -1;
            }

            if (b.codecName === 'avc') {
              return 1;
            }

            return 0;
          });

        if (candidates[0]) {
          return candidates[0].url;
        }

        if (format.master_url) {
          return format.master_url;
        }
      }
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get('room_id');

  if (!roomId) {
    return NextResponse.json({ error: 'room_id is required' }, { status: 400 });
  }

  try {
    const roomInfoUrl = `https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${roomId}`;
    const playInfoUrl =
      `https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo` +
      `?room_id=${roomId}&protocol=0,1&format=0,1,2&codec=0,1&qn=10000&platform=web&ptype=8`;

    const [infoData, playInfoData] = await Promise.all([
      fetchJson<BilibiliRoomInfoResponse>(roomInfoUrl),
      fetchJson<BilibiliPlayInfoResponse>(playInfoUrl),
    ]);

    if (infoData.code !== 0) {
      return NextResponse.json(
        {
          error: '获取直播间信息失败',
          message: infoData.message || 'Unknown error',
        },
        { status: 502 }
      );
    }

    if (infoData.data?.live_status !== 1) {
      return NextResponse.json(
        {
          error: '直播未开始',
          live_status: infoData.data?.live_status || 0,
          title: infoData.data?.title || '',
        },
        { status: 404 }
      );
    }

    if (playInfoData.code !== 0) {
      return NextResponse.json(
        {
          error: '获取直播流地址失败',
          message: playInfoData.message || 'Unknown error',
        },
        { status: 502 }
      );
    }

    const flvCandidates = extractStreamCandidates(playInfoData.data, 'http_stream', 'flv');
    const hlsUrl = extractHlsUrl(playInfoData.data);

    if (!flvCandidates[0]?.url) {
      return NextResponse.json(
        {
          error: '获取直播流地址失败',
          message: 'No FLV stream found in upstream response',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      room_id: roomId,
      title: infoData.data?.title || 'Bilibili Live',
      live_status: 1,
      flv_url: flvCandidates[0].url,
      hls_url: hlsUrl,
      backup_urls: flvCandidates.slice(1).map((candidate) => candidate.url),
      quality: playInfoData.data?.playurl_info?.playurl?.g_qn_desc ?? [],
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Bilibili stream API error:', error);

    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'Upstream request timeout'
        : error instanceof Error
          ? error.message
          : 'Unknown error';

    return NextResponse.json(
      {
        error: '请求失败',
        message,
      },
      { status: 500 }
    );
  }
}
