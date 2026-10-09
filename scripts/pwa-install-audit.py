"""PWA 安装提示的浏览器回归检查，使用独立临时上下文，不读写日常浏览器资料。

先启动本地服务，再运行：
  python scripts/pwa-install-audit.py --url http://127.0.0.1:3100
  python scripts/pwa-install-audit.py --browser webkit
  python scripts/pwa-install-audit.py --channel msedge

需要 Python playwright 及所选浏览器；--executable-path 可指定已有测试浏览器。
系统安装事件、设备 UA 和独立窗口状态为模拟信号，不会实际安装桌面应用。
"""

import argparse
from contextlib import contextmanager
import json
import sys
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright


READY_SCRIPT = """(() => {
  const addListener = window.addEventListener.bind(window);
  window.addEventListener = (type, ...args) => {
    addListener(type, ...args);
    if (type === 'beforeinstallprompt') window.__pwaReady = true;
  };
})();"""

# 仅控制安装卡片的等待/收起计时，保持 performance.now、rAF 和 Web Animations 的真实时钟。
# 整页快进会让 Framer Motion 的动画时钟与浏览器原生动画错位，产生假失败。
PWA_TIMERS_SCRIPT = """(() => {
  const schedule = window.setTimeout.bind(window);
  const cancel = window.clearTimeout.bind(window);
  const timers = new Map();
  let now = 0;
  window.setTimeout = (callback, delay, ...args) => {
    if (delay !== 6000 && delay !== 8000) return schedule(callback, delay, ...args);
    const id = schedule(() => {}, 2147483647);
    timers.set(id, { callback, args, delay, due: now + delay });
    return id;
  };
  window.clearTimeout = (id) => { timers.delete(id); cancel(id); };
  window.__hasPwaShowTimer = () => [...timers.values()].some((timer) => timer.delay === 6000);
  window.__advancePwaTimers = (duration) => {
    const end = now + duration;
    while (true) {
      const next = [...timers].sort((a, b) => a[1].due - b[1].due)[0];
      if (!next || next[1].due > end) break;
      const [id, timer] = next;
      timers.delete(id);
      cancel(id);
      now = timer.due;
      timer.callback(...timer.args);
    }
    now = end;
  };
})();"""

INSTALL_EVENT = """({ outcome = 'accepted', fail = false } = {}) => {
  const event = new Event('beforeinstallprompt', { cancelable: true });
  event.prompt = async () => {
    window.__promptCalls = (window.__promptCalls || 0) + 1;
    if (fail) throw new Error('Simulated install failure');
  };
  event.userChoice = Promise.resolve({ outcome });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}"""

DISPLAY_MODE_SCRIPT = """(() => {
  const original = window.matchMedia.bind(window);
  const mode = new EventTarget();
  mode.matches = INITIAL_MODE;
  mode.media = '(display-mode: standalone)';
  mode.addListener = (fn) => mode.addEventListener('change', fn);
  mode.removeListener = (fn) => mode.removeEventListener('change', fn);
  window.matchMedia = (query) => query === mode.media ? mode : original(query);
  window.__setStandalone = (matches) => {
    mode.matches = matches;
    mode.dispatchEvent(new Event('change'));
  };
})();"""

BLOCK_LOCAL = """Object.defineProperty(window, 'localStorage', {
  get() { throw new DOMException('Blocked', 'SecurityError'); }
});"""
BLOCK_SESSION = BLOCK_LOCAL.replace('localStorage', 'sessionStorage')


class Audit:
    def __init__(self, playwright, browser, url, match=''):
        self.playwright = playwright
        self.browser = browser
        self.url = url.rstrip('/')
        self.results = []
        self.match = match.lower()

    def options(self, device):
        profiles = {
            'android': 'Pixel 7',
            'iphone': 'iPhone 13',
            'ipad': 'iPad Mini',
            'desktop': 'Desktop Chrome',
            'mac': 'Desktop Safari',
        }
        options = dict(self.playwright.devices[profiles[device]])
        # Firefox 不支持 isMobile；UA、触摸与屏幕尺寸仍可用于检查设备分支。
        if self.browser.browser_type.name == 'firefox':
            options.pop('is_mobile', None)
        return options

    @contextmanager
    def session(self, device='android', setup=''):
        context = self.browser.new_context(**self.options(device))
        allowed_host = urlparse(self.url).hostname
        context.route('**/*', lambda route: route.continue_()
                      if (urlparse(route.request.url).hostname == allowed_host
                          and not urlparse(route.request.url).path.startswith('/api/'))
                      else route.abort())
        context.add_init_script(READY_SCRIPT)
        context.add_init_script(PWA_TIMERS_SCRIPT)
        if setup:
            context.add_init_script(setup)
        errors = []
        context.on('page', lambda page: page.on('pageerror', lambda error: errors.append(str(error))))
        page = context.new_page()
        try:
            yield context, page
            assert not errors, f'Uncaught page errors: {errors}'
        finally:
            context.close()

    def goto(self, page, path='/'):
        page.goto(self.url + path, wait_until='networkidle')
        page.wait_for_function('window.__pwaReady === true')

    def navigate(self, page, path):
        page.locator(f'a[href="{path}"]').first.click()
        page.wait_for_url(self.url + path)
        page.wait_for_load_state('networkidle')

    def advance(self, page, milliseconds=6500):
        # 等待事件驱动的 React effect 注册计时器，然后只推进安装提示的等待时间。
        page.wait_for_timeout(100)
        page.evaluate('window.__advancePwaTimers', milliseconds)
        page.wait_for_timeout(100)

    def prompt(self, page):
        return page.get_by_role('heading', name='安装 Lofi Radio', exact=True).or_(
            page.get_by_role('heading', name='获取完整体验', exact=True),
        )

    def fire(self, page, outcome='accepted', fail=False):
        assert page.evaluate(INSTALL_EVENT, {'outcome': outcome, 'fail': fail}), 'Native prompt was not prevented'

    def hidden(self, page):
        expect(self.prompt(page)).not_to_be_visible(timeout=3000)

    def shown(self, page):
        # 生产构建的路由过渡可能晚于 URL 更新才提交 effect，按计时器就绪条件等待。
        page.wait_for_function("""() => window.__hasPwaShowTimer() ||
          [...document.querySelectorAll('h3')].some((heading) =>
            ['安装 Lofi Radio', '获取完整体验'].includes(heading.textContent))""")
        if page.evaluate('window.__hasPwaShowTimer()'):
            self.advance(page)
        expect(self.prompt(page)).to_be_visible(timeout=3000)

    def run(self, name, scenario):
        if self.match and self.match not in name.lower():
            return
        try:
            scenario()
            result = {'scenario': name, 'passed': True}
        except Exception as error:
            result = {'scenario': name, 'passed': False, 'error': str(error)}
        self.results.append(result)
        print(json.dumps(result, ensure_ascii=False), flush=True)

    def first_visit(self):
        with self.session() as (_, page):
            self.goto(page)
            self.advance(page)
            self.hidden(page)
            self.fire(page)
            self.advance(page)
            self.shown(page)
            assert page.evaluate("Number(localStorage.getItem('pwa-install-dismissed')) > 0")

    def content_page(self, path):
        with self.session() as (_, page):
            self.goto(page, path)
            self.fire(page)
            self.advance(page)
            self.hidden(page)
            self.navigate(page, '/')
            self.advance(page)
            self.shown(page)

    def navigation(self, pending):
        with self.session() as (_, page):
            self.goto(page)
            self.fire(page)
            if not pending:
                self.advance(page)
                self.shown(page)
            self.navigate(page, '/faq')
            self.advance(page)
            self.hidden(page)
            self.navigate(page, '/about')
            self.fire(page)
            self.advance(page)
            self.hidden(page)
            self.navigate(page, '/')
            self.advance(page)
            if pending:
                self.shown(page)
            else:
                self.hidden(page)

    def navigation_before_cleanup(self):
        with self.session() as (_, page):
            self.goto(page)
            self.fire(page)
            page.wait_for_function('window.__hasPwaShowTimer()')
            # Next 的原生 History API 集成异步通知 React，旧 effect 此刻还未清理。
            recorded = page.evaluate("""() => {
              history.pushState({}, '', '/faq');
              window.__advancePwaTimers(6500);
              return localStorage.getItem('pwa-install-dismissed');
            }""")
            assert recorded is None, 'Old route timer consumed the home prompt after URL changed'
            self.hidden(page)

    def dismissal(self, automatic):
        with self.session() as (_, page):
            self.goto(page)
            for _ in range(3):
                self.fire(page)
            self.advance(page)
            self.shown(page)
            if automatic:
                self.advance(page, 8500)
            else:
                page.get_by_role('button', name='稍后', exact=True).click()
            self.hidden(page)
            self.fire(page)
            self.advance(page)
            self.hidden(page)

    def refresh(self, setup=''):
        with self.session(setup=setup) as (_, page):
            self.goto(page)
            self.fire(page)
            self.advance(page)
            self.shown(page)
            self.goto(page)
            self.fire(page)
            self.advance(page)
            self.hidden(page)

    def installed(self, pending):
        with self.session() as (_, page):
            self.goto(page)
            self.fire(page)
            if not pending:
                self.advance(page)
                self.shown(page)
            page.evaluate("window.dispatchEvent(new Event('appinstalled'))")
            self.advance(page)
            self.hidden(page)
            assert page.evaluate("localStorage.getItem('pwa-installed') === 'true'")
            page.evaluate("""() => {
              localStorage.setItem('pwa-install-dismissed', String(Date.now() - 365 * 86400000));
              sessionStorage.clear();
            }""")
            self.goto(page)
            self.fire(page)
            self.advance(page)
            self.hidden(page)

    def standalone(self, device, initial):
        setup = DISPLAY_MODE_SCRIPT.replace('INITIAL_MODE', 'true' if initial else 'false')
        with self.session(device, setup) as (_, page):
            self.goto(page)
            self.fire(page)
            if not initial:
                page.evaluate('window.__setStandalone(true)')
            self.advance(page)
            self.hidden(page)
            assert page.evaluate("localStorage.getItem('pwa-installed') === 'true'")

    def storage_unavailable(self, write_only=False):
        setup = ("""(() => {
          const original = Storage.prototype.setItem;
          Storage.prototype.setItem = function(key, value) {
            if (key.startsWith('pwa-')) throw new Error('Quota exceeded');
            return original.call(this, key, value);
          };
        })();"""
                 if write_only else BLOCK_LOCAL + BLOCK_SESSION)
        with self.session(setup=setup) as (_, page):
            self.goto(page)
            self.fire(page)
            self.advance(page)
            self.hidden(page)

    def native_choice(self, outcome, fail=False):
        with self.session() as (_, page):
            self.goto(page)
            self.fire(page, outcome, fail)
            self.advance(page)
            self.shown(page)
            page.get_by_role('button', name='立即安装', exact=True).evaluate('(button) => { button.click(); button.click(); }')
            self.hidden(page)
            assert page.evaluate('window.__promptCalls') == 1
            if outcome == 'accepted' and not fail:
                assert page.evaluate("localStorage.getItem('pwa-installed') === 'true'")
            self.fire(page)
            self.advance(page)
            self.hidden(page)

    def cross_tab(self, installed):
        with self.session() as (context, page):
            self.goto(page)
            other = context.new_page()
            self.goto(other, '/faq')
            self.fire(page)
            if installed:
                other.evaluate("window.dispatchEvent(new Event('appinstalled'))")
            else:
                other.evaluate("localStorage.setItem('pwa-install-dismissed', String(Date.now()))")
            self.advance(page)
            self.hidden(page)

    def ios(self, device, desktop_ipad=False):
        setup = ''
        if desktop_ipad:
            setup = """Object.defineProperty(navigator, 'platform', { value: 'MacIntel' });
              Object.defineProperty(navigator, 'maxTouchPoints', { value: 5 });"""
        with self.session(device, setup) as (_, page):
            self.goto(page, '/about')
            self.advance(page)
            self.hidden(page)
            self.navigate(page, '/')
            self.advance(page)
            self.shown(page)
            self.navigate(page, '/faq')
            self.hidden(page)
            # 模拟旧版记录和新会话：iOS 即使七天已过也不再自动引导。
            page.evaluate("""() => {
              localStorage.setItem('pwa-install-dismissed', String(Date.now() - 30 * 86400000));
              sessionStorage.clear();
            }""")
            self.goto(page)
            self.advance(page)
            self.hidden(page)

    def ios_standalone(self):
        with self.session('iphone', "Object.defineProperty(navigator, 'standalone', { value: true });") as (_, page):
            self.goto(page)
            self.advance(page)
            self.hidden(page)
            assert page.evaluate("localStorage.getItem('pwa-installed') === 'true'")

    def desktop(self, device):
        with self.session(device) as (_, page):
            for path in ['/', '/faq', '/about', '/stations']:
                self.goto(page, path)
                self.fire(page)
                self.advance(page)
                self.hidden(page)

    def all(self):
        self.run('Android waits for installability, then shows once', self.first_visit)
        for path in ['/faq', '/about', '/stations']:
            self.run(f'{path}: no card; captured event usable on home', lambda path=path: self.content_page(path))
        self.run('Navigate while timer pending', lambda: self.navigation(True))
        self.run('Navigate with visible card and return', lambda: self.navigation(False))
        self.run('URL changes before React cleans up old timer', self.navigation_before_cleanup)
        self.run('Repeated events after manual dismiss', lambda: self.dismissal(False))
        self.run('Repeated events after automatic dismiss', lambda: self.dismissal(True))
        self.run('Refresh immediately after exposure', self.refresh)
        self.run('Install completes before show timer', lambda: self.installed(True))
        self.run('Install completes with visible card', lambda: self.installed(False))
        self.run('Launch in standalone mode', lambda: self.standalone('android', True))
        self.run('Switch to standalone while pending', lambda: self.standalone('android', False))
        self.run('localStorage blocked, refresh uses session fallback', lambda: self.refresh(BLOCK_LOCAL))
        self.run('sessionStorage blocked, refresh uses localStorage', lambda: self.refresh(BLOCK_SESSION))
        self.run('All storage blocked', self.storage_unavailable)
        self.run('Storage readable but writes fail', lambda: self.storage_unavailable(True))
        self.run('Accept native install, double click consumes once', lambda: self.native_choice('accepted'))
        self.run('Decline native install', lambda: self.native_choice('dismissed'))
        self.run('Native install fails', lambda: self.native_choice('accepted', True))
        self.run('Another tab shows a prompt while waiting', lambda: self.cross_tab(False))
        self.run('Another tab completes installation', lambda: self.cross_tab(True))
        self.run('iPhone manual guide is home only and shown once', lambda: self.ios('iphone'))
        self.run('iPad manual guide is home only and shown once', lambda: self.ios('ipad'))
        self.run('iPad desktop UA with touch detection', lambda: self.ios('mac', True))
        self.run('iOS navigator.standalone installation', self.ios_standalone)
        self.run('Desktop Chrome UA: no auto card on all pages', lambda: self.desktop('desktop'))
        self.run('Desktop Safari UA: no auto card on all pages', lambda: self.desktop('mac'))


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='http://127.0.0.1:3100')
    parser.add_argument('--browser', choices=['chromium', 'firefox', 'webkit'], default='chromium')
    parser.add_argument('--channel', help='Chromium channel, for example chrome or msedge')
    parser.add_argument('--executable-path')
    parser.add_argument('--match', default='', help='Only run scenario names containing this text')
    args = parser.parse_args()
    with sync_playwright() as playwright:
        options = {'headless': True}
        if args.channel:
            options['channel'] = args.channel
        if args.executable_path:
            options['executable_path'] = args.executable_path
        browser = getattr(playwright, args.browser).launch(**options)
        try:
            audit = Audit(playwright, browser, args.url, args.match)
            audit.all()
            failures = [result for result in audit.results if not result['passed']]
            print(json.dumps({'browser': args.channel or args.browser, 'passed': len(audit.results) - len(failures),
                              'failed': len(failures)}, ensure_ascii=False), flush=True)
            return bool(failures) or not audit.results
        finally:
            browser.close()


if __name__ == '__main__':
    raise SystemExit(main())
