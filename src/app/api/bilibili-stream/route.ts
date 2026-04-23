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

type BilibiliPageBootstrap = {
  roomInitRes?: {
    code?: number;
    data?: {
      room_id?: number;
      live_status?: number;
      playurl_info?: BilibiliPlayInfoResponse['data']['playurl_info'];
    };
  };
  roomInfoRes?: {
    code?: number;
    data?: {
      room_info?: {
        title?: string;
      };
    };
  };
};

type StreamCandidate = {
  url: string;
  qn: number;
  codecName: string;
};

class UpstreamStatusError extends Error {
  status: number;

  constructor(status: number) {
    super(`Upstream request failed: ${status}`);
    this.name = 'UpstreamStatusError';
    this.status = status;
  }
}

const BILIBILI_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Referer: 'https://live.bilibili.com/',
  Origin: 'https://live.bilibili.com',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
};

const BILIBILI_API_HEADERS = {
  ...BILIBILI_HEADERS,
  Accept: 'application/json, text/plain, */*',
};

const BILIBILI_HTML_HEADERS = {
  ...BILIBILI_HEADERS,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
};

function isUpstreamStatusError(error: unknown, status: number): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as { status?: unknown; message?: unknown };
  return maybeError.status === status || maybeError.message === `Upstream request failed: ${status}`;
}

async function fetchJson<T>(url: string, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: BILIBILI_API_HEADERS,
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new UpstreamStatusError(response.status);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchText(url: string, timeoutMs = 12000): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: BILIBILI_HTML_HEADERS,
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new UpstreamStatusError(response.status);
    }

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractBootstrapData(html: string): BilibiliPageBootstrap | null {
  const marker = 'window.__NEPTUNE_IS_MY_WAIFU__=';
  const startIndex = html.indexOf(marker);

  if (startIndex === -1) {
    return null;
  }

  const jsonStart = startIndex + marker.length;
  const jsonEnd = html.indexOf('</script>', jsonStart);

  if (jsonEnd === -1) {
    return null;
  }

  try {
    return JSON.parse(html.slice(jsonStart, jsonEnd).trim()) as BilibiliPageBootstrap;
  } catch {
    return null;
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

async function loadFromLivePage(roomId: string) {
  const html = await fetchText(`https://live.bilibili.com/${roomId}`);
  const bootstrap = extractBootstrapData(html);

  if (!bootstrap?.roomInitRes?.data?.playurl_info?.playurl) {
    throw new Error('No playable stream data found in live page');
  }

  return {
    title: bootstrap.roomInfoRes?.data?.room_info?.title || 'Bilibili Live',
    live_status: bootstrap.roomInitRes.data.live_status || 0,
    playurl_info: bootstrap.roomInitRes.data.playurl_info,
  };
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

    let infoData: BilibiliRoomInfoResponse;
    let playInfoData: BilibiliPlayInfoResponse;

    try {
      [infoData, playInfoData] = await Promise.all([
        fetchJson<BilibiliRoomInfoResponse>(roomInfoUrl),
        fetchJson<BilibiliPlayInfoResponse>(playInfoUrl),
      ]);
    } catch (error) {
      if (isUpstreamStatusError(error, 412)) {
        const livePageData = await loadFromLivePage(roomId);

        infoData = {
          code: 0,
          message: 'ok',
          data: {
            title: livePageData.title,
            live_status: livePageData.live_status,
          },
        };

        playInfoData = {
          code: 0,
          message: 'ok',
          data: {
            playurl_info: livePageData.playurl_info,
          },
        };
      } else {
        throw error;
      }
    }

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

    if (!flvCandidates[0]?.url && !hlsUrl) {
      return NextResponse.json(
        {
          error: '获取直播流地址失败',
          message: 'No playable stream found in upstream response',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      room_id: roomId,
      title: infoData.data?.title || 'Bilibili Live',
      live_status: 1,
      flv_url: flvCandidates[0]?.url || '',
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
