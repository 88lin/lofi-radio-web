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
    // head 的 capture listener 先启动；必须等 React 的普通 listener 才算就绪。
    if (type === 'beforeinstallprompt' && args[1] !== true) window.__pwaReady = true;
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
    if (![6000, 8000, 12000].includes(delay)) return schedule(callback, delay, ...args);
    const id = schedule(() => {}, 2147483647);
    timers.set(id, { callback, args, delay, due: now + delay });
    return id;
  };
  window.clearTimeout = (id) => { timers.delete(id); cancel(id); };
  const showTimers = () => [...timers.values()].filter((timer) => [6000, 12000].includes(timer.delay));
  window.__hasPwaShowTimer = () => showTimers().length > 0;
  window.__pwaShowTimerCount = () => showTimers().length;
  window.__pwaShowWait = () => Math.max(0, Math.min(...showTimers().map((timer) => timer.due - now))) + 100;
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
        ).or_(
            page.get_by_role('heading', name='添加到桌面', exact=True),
        )

    def fire(self, page, outcome='accepted', fail=False):
        assert page.evaluate(INSTALL_EVENT, {'outcome': outcome, 'fail': fail}), 'Native prompt was not prevented'

    def hidden(self, page):
        expect(self.prompt(page)).not_to_be_visible(timeout=3000)

    def shown(self, page):
        # 生产构建的路由过渡可能晚于 URL 更新才提交 effect，按计时器就绪条件等待。
        page.wait_for_function("""() => window.__hasPwaShowTimer() ||
          [...document.querySelectorAll('h3')].some((heading) =>
            ['安装 Lofi Radio', '获取完整体验', '添加到桌面'].includes(heading.textContent))""")
        if page.evaluate('window.__hasPwaShowTimer()'):
            self.advance(page, page.evaluate('window.__pwaShowWait()'))
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
            page.wait_for_timeout(100)
            assert page.evaluate('window.__pwaShowTimerCount()') == 1, 'Native event duplicated the manual wait timer'
            self.shown(page)
            expect(page.get_by_role('button', name='立即安装', exact=True)).to_be_visible()
            assert page.evaluate("localStorage.getItem('pwa-install-manual-shown')") is None
            assert page.evaluate("Number(localStorage.getItem('pwa-install-dismissed')) > 0")

    def manual_guide(self, automatic=False, setup=''):
        with self.session(setup=setup) as (_, page):
            self.goto(page)
            self.advance(page)
            self.hidden(page)
            self.shown(page)
            expect(page.get_by_role('heading', name='添加到桌面', exact=True)).to_be_visible()
            expect(page.get_by_text('浏览器菜单', exact=True)).to_be_visible()
            expect(page.get_by_role('button', name='立即安装', exact=True)).to_have_count(0)
            if automatic:
                self.advance(page, 8500)
            else:
                page.get_by_role('button', name='关闭', exact=True).click()
            self.hidden(page)
            for path in ['/faq', '/about', '/']:
                self.navigate(page, path)
                self.advance(page, 12500)
                self.hidden(page)
            self.goto(page)
            self.advance(page, 12500)
            self.hidden(page)
            self.fire(page)
            self.advance(page, 12500)
            self.hidden(page)

    def manual_new_session(self):
        with self.session() as (context, page):
            self.goto(page)
            self.shown(page)
            assert page.evaluate("localStorage.getItem('pwa-install-manual-shown') === 'true'")
            page.evaluate("localStorage.setItem('pwa-install-dismissed', String(Date.now() - 30 * 86400000))")
            other = context.new_page()
            self.goto(other)
            self.advance(other, 12500)
            self.hidden(other)
            # 手动说明永久抑制；安装事件的原有七天冷却不受这个标记影响。
            self.fire(other)
            self.shown(other)
            expect(other.get_by_role('button', name='立即安装', exact=True)).to_be_visible()

    def manual_late_event(self, install=False):
        with self.session() as (_, page):
            self.goto(page)
            self.shown(page)
            recorded = page.evaluate("localStorage.getItem('pwa-install-dismissed')")
            self.advance(page, 3000)
            self.fire(page)
            expect(page.get_by_role('button', name='立即安装', exact=True)).to_be_visible()
            expect(page.get_by_role('heading', name='添加到桌面', exact=True)).to_have_count(0)
            assert page.evaluate('window.__pwaShowTimerCount()') == 0, 'Late event scheduled another card'
            assert page.evaluate("localStorage.getItem('pwa-install-dismissed')") == recorded, 'Late event consumed another exposure'
            if install:
                page.get_by_role('button', name='立即安装', exact=True).click()
                assert page.evaluate('window.__promptCalls') == 1
                assert page.evaluate("localStorage.getItem('pwa-installed') === 'true'")
            else:
                self.advance(page, 5500)
            self.hidden(page)
            self.fire(page)
            self.advance(page, 12500)
            self.hidden(page)

    def manual_content_page(self, path):
        with self.session() as (_, page):
            self.goto(page, path)
            self.advance(page, 12500)
            self.hidden(page)
            assert page.evaluate("localStorage.getItem('pwa-install-manual-shown')") is None
            self.navigate(page, '/')
            self.shown(page)
            expect(page.get_by_role('heading', name='添加到桌面', exact=True)).to_be_visible()

    def manual_suppressed(self, setup):
        # init_script 也会跑在初始 about:blank；只给有站点 origin 的文档预置存储。
        with self.session(setup=f"if (location.protocol !== 'about:') {{ {setup} }}") as (_, page):
            self.goto(page)
            self.advance(page, 12500)
            self.hidden(page)

    def manual_cross_tab(self):
        with self.session() as (context, page):
            self.goto(page)
            other = context.new_page()
            self.goto(other, '/faq')
            other.evaluate("localStorage.setItem('pwa-install-manual-shown', 'true')")
            self.advance(page, 12500)
            self.hidden(page)

    def before_hydration(self, mode='prompt'):
        device = 'desktop' if mode == 'desktop' else 'android'
        with self.session(device) as (context, page):
            # 阻塞客户端 bundle，确定事件发生在 head 已执行、React 尚未启动的窗口。
            # 不注入生产 HTML，也不依赖机器加载速度制造竞态。
            pending = []
            context.route('**/_next/**/*.js', lambda route: pending.append(route))
            page.goto(self.url + '/', wait_until='commit')
            page.wait_for_function('window.__lofiPwaInstall !== undefined')
            assert not page.evaluate('window.__pwaReady === true'), 'React started before early event'
            if mode == 'cooldown':
                page.evaluate("localStorage.setItem('pwa-install-dismissed', String(Date.now()))")
            prevented = page.evaluate(INSTALL_EVENT, {})
            assert prevented == (device == 'android'), 'Early native prompt handled for wrong device'
            if mode == 'installed':
                page.evaluate("window.dispatchEvent(new Event('appinstalled'))")

            context.unroute('**/_next/**/*.js')
            for route in pending:
                route.continue_()
            page.wait_for_load_state('networkidle')
            page.wait_for_function('window.__pwaReady === true')

            if mode == 'prompt':
                self.shown(page)
                # 缓存的必须是仍可消费的同一个安装事件，而不只是一个展示标记。
                page.get_by_role('button', name='立即安装', exact=True).click()
                self.hidden(page)
                assert page.evaluate('window.__promptCalls') == 1
                assert page.evaluate("localStorage.getItem('pwa-installed') === 'true'")
            else:
                self.advance(page)
                self.hidden(page)
                if mode == 'installed':
                    assert page.evaluate("localStorage.getItem('pwa-installed') === 'true'")
                    self.fire(page)
                    self.advance(page)
                    self.hidden(page)

    def content_page(self, path):
        with self.session() as (_, page):
            self.goto(page, path)
            self.fire(page)
            self.advance(page)
            self.hidden(page)
            self.navigate(page, '/')
            self.advance(page)
            self.shown(page)

    def navigation(self, pending, native=True):
        with self.session() as (_, page):
            self.goto(page)
            if native:
                self.fire(page)
            if not pending:
                self.shown(page)
            self.navigate(page, '/faq')
            self.advance(page, 12500)
            self.hidden(page)
            self.navigate(page, '/about')
            if native:
                self.fire(page)
            self.advance(page, 12500)
            self.hidden(page)
            self.navigate(page, '/')
            if pending:
                self.shown(page)
            else:
                self.advance(page, 12500)
                self.hidden(page)

    def navigation_before_cleanup(self, native=True):
        with self.session() as (_, page):
            self.goto(page)
            if native:
                self.fire(page)
            page.wait_for_function('window.__hasPwaShowTimer()')
            # Next 的原生 History API 集成异步通知 React，旧 effect 此刻还未清理。
            recorded = page.evaluate("""() => {
              history.pushState({}, '', '/faq');
              window.__advancePwaTimers(12500);
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

    def installed(self, pending, native=True):
        with self.session() as (_, page):
            self.goto(page)
            if native:
                self.fire(page)
            if not pending:
                self.shown(page)
            page.evaluate("window.dispatchEvent(new Event('appinstalled'))")
            self.advance(page, 12500)
            self.hidden(page)
            assert page.evaluate("localStorage.getItem('pwa-installed') === 'true'")
            page.evaluate("""() => {
              localStorage.setItem('pwa-install-dismissed', String(Date.now() - 365 * 86400000));
              sessionStorage.clear();
            }""")
            self.goto(page)
            self.fire(page)
            self.advance(page, 12500)
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
                assert not page.evaluate(INSTALL_EVENT, {}), 'Desktop native prompt was prevented'
                self.advance(page)
                self.hidden(page)

    def all(self):
        self.run('Android event during manual wait: one native timer and usable button', self.first_visit)
        self.run('Manual Android guide: close, navigate and refresh without repeat', self.manual_guide)
        self.run('Manual Android guide: auto-hide and no repeat after late event', lambda: self.manual_guide(True))
        self.run('Manual Android guide: sessionStorage fallback survives refresh', lambda: self.manual_guide(setup=BLOCK_LOCAL))
        self.run('Manual Android guide: localStorage survives blocked sessionStorage', lambda: self.manual_guide(setup=BLOCK_SESSION))
        self.run('Manual Android guide: new tab after 30 days suppresses guide, permits native', self.manual_new_session)
        self.run('Manual Android guide: late event upgrades without resetting auto-hide', self.manual_late_event)
        self.run('Manual Android guide: late event remains installable', lambda: self.manual_late_event(True))
        for path in ['/faq', '/about', '/stations']:
            self.run(f'Manual Android guide: {path} has no card or exposure record', lambda path=path: self.manual_content_page(path))
        self.run('Manual Android guide: navigate while pending', lambda: self.navigation(True, False))
        self.run('Manual Android guide: navigate while visible and return', lambda: self.navigation(False, False))
        self.run('Manual Android guide: URL changes before timer cleanup', lambda: self.navigation_before_cleanup(False))
        self.run('Manual Android guide: install while pending', lambda: self.installed(True, False))
        self.run('Manual Android guide: install while visible', lambda: self.installed(False, False))
        self.run('Manual Android guide: existing cooldown is respected', lambda: self.manual_suppressed("localStorage.setItem('pwa-install-dismissed', String(Date.now()))"))
        self.run('Manual Android guide: storage unavailable stays quiet', lambda: self.manual_suppressed(BLOCK_LOCAL + BLOCK_SESSION))
        self.run('Manual Android guide: another tab records guide while waiting', self.manual_cross_tab)
        self.run('Early Android install event survives hydration and remains usable', self.before_hydration)
        self.run('Early appinstalled survives hydration and suppresses later events', lambda: self.before_hydration('installed'))
        self.run('Early Android event respects existing cooldown', lambda: self.before_hydration('cooldown'))
        self.run('Early desktop event preserves native prompt', lambda: self.before_hydration('desktop'))
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
        self.run('Desktop Chrome UA: preserve native prompt on all pages', lambda: self.desktop('desktop'))
        self.run('Desktop Safari UA: preserve native prompt on all pages', lambda: self.desktop('mac'))


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
