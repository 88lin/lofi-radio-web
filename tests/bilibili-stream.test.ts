import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';

import { GET, extractHlsCandidates, extractHlsUrls, isValidRoomId } from '../src/app/api/bilibili-stream/route';

test('isValidRoomId only accepts plain positive integers', () => {
  assert.equal(isValidRoomId('27519423'), true);
  assert.equal(isValidRoomId('1'), true);

  // 会被拼进上游 URL 的输入必须全部拒绝
  assert.equal(isValidRoomId('27519423&qn=0'), false);
  assert.equal(isValidRoomId('27519423#'), false);
  assert.equal(isValidRoomId('../foo'), false);
  assert.equal(isValidRoomId(' 27519423'), false);
  assert.equal(isValidRoomId('27519423\n'), false);
  assert.equal(isValidRoomId('0'), false);
  assert.equal(isValidRoomId('-1'), false);
  assert.equal(isValidRoomId('1e3'), false);
  assert.equal(isValidRoomId(''), false);
  assert.equal(isValidRoomId('9'.repeat(21)), false);
});

test('extractHlsUrls keeps compatible HLS fallbacks in priority order', () => {
  const playInfo = {
    playurl_info: {
      playurl: {
        stream: [
          {
            protocol_name: 'http_hls',
            format: [
              {
                format_name: 'fmp4',
                codec: [
                  {
                    codec_name: 'avc',
                    current_qn: 250,
                    base_url: '/fmp4-avc.m3u8',
                    url_info: [{ host: 'https://fmp4.example.com', extra: '?token=1' }],
                  },
                ],
              },
              {
                format_name: 'ts',
                codec: [
                  {
                    codec_name: 'hevc',
                    current_qn: 250,
                    base_url: '/ts-hevc.m3u8',
                    url_info: [{ host: 'https://ts-hevc.example.com', extra: '?token=2' }],
                  },
                  {
                    codec_name: 'avc',
                    current_qn: 250,
                    base_url: '/ts-avc.m3u8',
                    url_info: [
                      { host: 'https://ts-avc-primary.example.com', extra: '?token=3' },
                      { host: 'https://ts-avc-backup.example.com', extra: '?token=4' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  };

  assert.deepEqual(extractHlsUrls(playInfo), [
    'https://ts-avc-primary.example.com/ts-avc.m3u8?token=3',
    'https://ts-avc-backup.example.com/ts-avc.m3u8?token=4',
    'https://ts-hevc.example.com/ts-hevc.m3u8?token=2',
    'https://fmp4.example.com/fmp4-avc.m3u8?token=1',
  ]);
  assert.deepEqual(extractHlsCandidates(playInfo).map(({ format, codec }) => ({ format, codec })), [
    { format: 'ts', codec: 'avc' },
    { format: 'ts', codec: 'avc' },
    { format: 'ts', codec: 'hevc' },
    { format: 'fmp4', codec: 'avc' },
  ]);
});

// 请求档位和实际档位是两回事。每个 codec 只提供一个实际档位，
// url_info 中的多个条目是该流的 CDN 候选，不是不同画质。
for (const actualQn of [80, 250]) {
  test(`API requests qn=80 and preserves signed stream candidates when upstream returns qn=${actualQn}`, async (t) => {
    const requests: URL[] = [];
    t.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
      const url = new URL(input instanceof Request ? input.url : input);
      requests.push(url);

      if (url.pathname === '/room/v1/Room/get_info') {
        return Response.json({ code: 0, data: { title: 'Lofi Girl', live_status: 1 } });
      }

      assert.equal(url.pathname, '/xlive/web-room/v2/index/getRoomPlayInfo');
      assert.equal(url.searchParams.get('room_id'), '27519423');
      assert.equal(url.searchParams.get('qn'), '80');
      return Response.json({
        code: 0,
        data: {
          playurl_info: {
            playurl: {
              stream: [
                { protocol: 'http_stream', format: 'flv', path: '/live.flv' },
                { protocol: 'http_hls', format: 'ts', path: '/live.m3u8' },
              ].map(({ protocol, format, path }) => ({
                protocol_name: protocol,
                format: [{
                  format_name: format,
                  codec: [{
                    codec_name: 'avc',
                    current_qn: actualQn,
                    base_url: path,
                    url_info: [
                      { host: 'https://primary.example.com', extra: '?token=primary' },
                      { host: 'https://backup.example.com', extra: '?token=backup' },
                    ],
                  }],
                }],
              })),
            },
          },
        },
      });
    });

    const response = await GET(new NextRequest('http://localhost/api/bilibili-stream?room_id=27519423'));
    const body = await response.json();

    assert.equal(requests.length, 2);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(body.success, true);
    assert.equal(body.flv_url, 'https://primary.example.com/live.flv?token=primary');
    assert.equal(body.hls_url, 'https://primary.example.com/live.m3u8?token=primary');
    assert.deepEqual(body.backup_urls, ['https://backup.example.com/live.flv?token=backup']);
    assert.deepEqual(body.hls_backup_urls, ['https://backup.example.com/live.m3u8?token=backup']);
    assert.deepEqual(body.hls_candidates, [
      { url: body.hls_url, format: 'ts', codec: 'avc' },
      { url: body.hls_backup_urls[0], format: 'ts', codec: 'avc' },
    ]);
  });
}
