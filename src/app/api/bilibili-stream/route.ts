import { NextRequest, NextResponse } from 'next/server';

// Bilibili 直播流代理 API
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const roomId = searchParams.get('room_id');

  if (!roomId) {
    return NextResponse.json({ error: 'room_id is required' }, { status: 400 });
  }

  try {
    // 1. 获取直播间信息
    const infoRes = await fetch(
      `https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${roomId}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://live.bilibili.com/',
        },
      }
    );
    const infoData = await infoRes.json();

    // 检查直播状态
    if (infoData.data?.live_status !== 1) {
      return NextResponse.json({ 
        error: '直播未开始',
        live_status: infoData.data?.live_status || 0,
        title: infoData.data?.title || '',
      }, { status: 404 });
    }

    // 2. 获取直播流地址
    const playUrlRes = await fetch(
      `https://api.live.bilibili.com/room/v1/Room/playUrl?cid=${roomId}&quality=4&platform=web`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://live.bilibili.com/',
        },
      }
    );
    const playUrlData = await playUrlRes.json();

    if (playUrlData.code !== 0 || !playUrlData.data?.durl?.[0]?.url) {
      return NextResponse.json({ 
        error: '获取直播流地址失败',
        message: playUrlData.message || 'Unknown error',
      }, { status: 500 });
    }

    // 返回直播流信息
    return NextResponse.json({
      success: true,
      room_id: roomId,
      title: infoData.data?.title || 'Bilibili Live',
      live_status: 1,
      flv_url: playUrlData.data.durl[0].url,
      backup_urls: playUrlData.data.durl.slice(1).map((d: { url: string }) => d.url),
      quality: playUrlData.data.quality_description,
      timestamp: Date.now(),
    });

  } catch (error) {
    console.error('Bilibili stream API error:', error);
    return NextResponse.json({ 
      error: '请求失败',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
