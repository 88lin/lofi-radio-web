import { chromium } from 'playwright';

const VIEWPORTS = [
  { name: 'iPhone SE  320', width: 320, height: 640 },
  { name: 'iPhone     375', width: 375, height: 812 },
  { name: 'iPhone Max 430', width: 430, height: 932 },
  { name: '平板       768', width: 768, height: 1024 },
  { name: '桌面      1280', width: 1280, height: 900 },
];
const PAGES = ['/', '/stations', '/faq', '/about'];

(async () => {
  const browser = await chromium.launch();
  let problems = 0;

  for (const theme of ['light', 'dark']) {
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
        isMobile: vp.width < 768,
        hasTouch: vp.width < 768,
      });
      const page = await ctx.newPage();
      if (theme === 'dark') {
        await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
      }

      for (const path of PAGES) {
        await page.goto('http://localhost:3100' + path, { waitUntil: 'networkidle' });
        await page.waitForTimeout(250);

        const r = await page.evaluate((vw) => {
          const doc = document.documentElement;
          const overflow = doc.scrollWidth - vw;

          // 哪些元素实际超出了视口右边界
          const culprits = [];
          document.querySelectorAll('body *').forEach((el) => {
            const b = el.getBoundingClientRect();
            if (b.width === 0 || b.height === 0) return;
            if (b.right > vw + 1) {
              const cs = getComputedStyle(el);
              if (cs.position === 'fixed') return; // 固定层不算页面溢出
              culprits.push({
                tag: el.tagName.toLowerCase(),
                cls: (el.className || '').toString().slice(0, 55),
                right: Math.round(b.right),
                w: Math.round(b.width),
              });
            }
          });

          // 触摸目标过小的可交互元素
          const small = [];
          document.querySelectorAll('a,button,summary,[role=button]').forEach((el) => {
            const b = el.getBoundingClientRect();
            if (b.width === 0 || b.height === 0) return;
            const cs = getComputedStyle(el);
            // inline 元素的 rect 不含 padding，但 padding 是可点击的——
            // 直接用 rect.height 会把「其实够大」的链接误报成小目标。
            const inline = cs.display === 'inline';
            const hit = inline
              ? b.height + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
              : b.height;
            // 句子里的行内链接按 WCAG 2.5.8 的 inline 例外豁免
            const inSentence = inline && el.parentElement
              && ['P', 'LI', 'DD', 'SPAN', 'DIV'].includes(el.parentElement.tagName)
              && el.parentElement.textContent.trim().length > el.textContent.trim().length + 8;
            if (hit < 24 && !inSentence) {
              small.push({
                tag: el.tagName.toLowerCase(),
                txt: (el.textContent || '').trim().slice(0, 18),
                h: Math.round(hit),
              });
            }
          });

          // 正文字号过小
          const tiny = new Set();
          document.querySelectorAll('p,li,dd,dt,td,th,span,div').forEach((el) => {
            if (!el.childNodes.length) return;
            const hasText = [...el.childNodes].some(
              (n) => n.nodeType === 3 && n.textContent.trim().length > 4,
            );
            if (!hasText) return;
            const b = el.getBoundingClientRect();
            if (b.width === 0 || b.height === 0) return; // 当前断点下不可见的不算
            const fs = parseFloat(getComputedStyle(el).fontSize);
            if (fs < 12.5) tiny.add(fs + 'px: ' + el.textContent.trim().slice(0, 24));
          });

          return { overflow, culprits: culprits.slice(0, 5), small: small.slice(0, 5), tiny: [...tiny].slice(0, 4) };
        }, vp.width);

        const tag = `[${theme}] ${vp.name} ${path}`;
        const issues = [];
        if (r.overflow > 1) issues.push(`横向溢出 +${r.overflow}px`);
        if (r.culprits.length) issues.push(`越界元素 ${r.culprits.length}`);
        if (r.small.length) issues.push(`小触摸目标 ${r.small.length}`);
        if (r.tiny.length) issues.push(`小字号 ${r.tiny.length}`);

        if (issues.length) {
          problems++;
          console.log('✗ ' + tag + '  ' + issues.join(' / '));
          r.culprits.forEach((c) => console.log(`    越界 <${c.tag}> right=${c.right} w=${c.w}  ${c.cls}`));
          r.small.forEach((s) => console.log(`    触摸 <${s.tag}> h=${s.h}px  "${s.txt}"`));
          r.tiny.forEach((t) => console.log(`    字号 ${t}`));
        } else {
          console.log('✓ ' + tag);
        }
      }
      await ctx.close();
    }
  }

  await browser.close();
  console.log(problems ? `\n=== ${problems} 个组合有问题 ===` : '\n=== 全部通过 ===');
})();
