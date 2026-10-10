"""Deterministic playback cancellation checks. Requires Python Playwright/Chromium.

Run against a running production build:
    python tests/browser/playback-lifecycle.py http://127.0.0.1:3100
All stream requests are intercepted; no Bilibili/CDN availability is required.
"""
import asyncio
import io
import json
import math
import re
import struct
import sys
import wave
from collections import Counter

from playwright.async_api import async_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:3100'


def audio_fixture():
    output = io.BytesIO()
    with wave.open(output, 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(8000)
        wav.writeframes(b''.join(struct.pack('<h', int(1000 * math.sin(i * 0.15))) for i in range(80000)))
    return output.getvalue()


async def check(browser, stage, switch):
    context = await browser.new_context()
    page = await context.new_page()
    counts = Counter()
    errors = []
    failures = []
    release = asyncio.Event()
    blocked = asyncio.Event()
    cdp = await context.new_cdp_session(page)
    await cdp.send('Network.enable')
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('requestfailed', lambda request: failures.append(request.url))
    # Keep the actual MediaSession registration but expose its callbacks for
    # deterministic action dispatch without depending on OS media-key support.
    await page.add_init_script('''
        window.mediaActions = {};
        const original = navigator.mediaSession.setActionHandler.bind(navigator.mediaSession);
        navigator.mediaSession.setActionHandler = (name, fn) => {
            window.mediaActions[name] = fn; original(name, fn);
        };
    ''')
    manifest = '#EXTM3U\n#EXT-X-TARGETDURATION:6\n#EXT-X-MEDIA-SEQUENCE:1\n#EXTINF:6,\nfixture.ts\n'

    async def route_request(route):
        url = route.request.url
        if '/api/bilibili-stream' in url:
            counts['resolver'] += 1
            if stage == 'resolver':
                blocked.set()
                await release.wait()
            payload = {
                'success': True, 'live_status': 1, 'flv_url': '',
                'hls_url': BASE + '/fixture.m3u8', 'hls_backup_urls': [],
                'hls_candidates': [{'url': BASE + '/fixture.m3u8', 'format': 'ts', 'codec': 'avc'}],
            }
            await route.fulfill(json=payload)
        elif '/fixture.m3u8' in url:
            counts['manifest'] += 1
            if stage == 'probe' or (stage == 'hls' and counts['manifest'] >= 2):
                blocked.set()
                await release.wait()
            await route.fulfill(content_type='application/vnd.apple.mpegurl', body=manifest)
        elif '/fixture.ts' in url:
            counts['fragment'] += 1
            await route.fulfill(status=404)
        elif 'streamafrica' in url:
            counts['audio'] += 1
            await route.fulfill(content_type='audio/wav', body=audio_fixture(), headers={'Access-Control-Allow-Origin': '*'})
        else:
            await route.continue_()

    await page.route('**/*', route_request)
    try:
        await page.goto(BASE + '/stations', wait_until='networkidle')
        await page.wait_for_selector('video', state='attached')
        await page.wait_for_timeout(500)
        assert counts['resolver'] == 0, ('unexpected preload', counts)
        await page.get_by_role('button', name='播放 Lofi Girl', exact=True).first.click()
        await asyncio.wait_for(blocked.wait(), timeout=10)

        if switch:
            await page.get_by_role('button', name='播放 Lofi Box', exact=True).first.click()
            await page.wait_for_function("!document.querySelector('video').paused && document.querySelector('video').currentTime > 0", timeout=4000)
        else:
            await page.get_by_role('button', name=re.compile('Lofi Girl .*点击停止')).first.click()
            await page.wait_for_function("!document.querySelector('video').hasAttribute('src')")

        # Release the old response after pause/switch. It must not start media,
        # overwrite the new source, report an error or restart the resolver.
        before = dict(counts)
        await page.wait_for_timeout(100)
        assert failures, ('old request was not cancelled', stage)
        release.set()
        await page.wait_for_timeout(900)
        assert dict(counts) == before, (stage, before, counts)
        if switch:
            assert await page.locator('video').evaluate('(v) => !v.paused && v.currentSrc.includes("streamafrica")')
            # A native pause must release intent and src, then a system play
            # action must create a new session and play successfully.
            await page.locator('video').evaluate('(v) => v.pause()')
            await page.wait_for_function("!document.querySelector('video').hasAttribute('src')")
            await page.evaluate("window.mediaActions.play()")
            await page.wait_for_function("!document.querySelector('video').paused && document.querySelector('video').currentTime > 0", timeout=4000)
            assert counts['audio'] == 2
            await page.evaluate("window.mediaActions.pause()")
            await page.wait_for_function("!document.querySelector('video').hasAttribute('src')")
        else:
            assert await page.locator('video').evaluate('(v) => v.paused && !v.hasAttribute("src")')
        assert not errors, errors
        print(json.dumps({'stage': stage, 'switch': switch, 'counts': dict(counts), 'result': 'PASS'}), flush=True)
    finally:
        release.set()
        await context.close()


async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        try:
            for stage in ['resolver', 'probe', 'hls']:
                for switch in [False, True]:
                    await check(browser, stage, switch)
        finally:
            await browser.close()


asyncio.run(main())
