import assert from 'node:assert/strict';
import test from 'node:test';

import nextConfig from '../next.config';
import { buildLlmsFullTxt, buildLlmsTxt, buildPricingMarkdown } from '../src/lib/llms';
import {
  buildHomeMetadata,
  buildHomepageSchema,
  buildRobotsConfig,
  buildSiteMetadata,
  buildSiteSchema,
  buildSitemapEntries,
  buildStationEntities,
  serializeJsonLd,
  siteConfig,
} from '../src/lib/seo';
import { homepageFaqs, sceneComparison, siteLastUpdated } from '../src/lib/seo-content';
import { getSceneList, stations } from '../src/lib/stations';

test('sitemap only lists indexable pages and every URL is absolute', () => {
  const entries = buildSitemapEntries();

  assert.ok(entries.length >= 2, 'sitemap 至少应包含首页与一个子页面');
  for (const entry of entries) {
    assert.ok(
      entry.url.startsWith('https://'),
      `sitemap URL 必须是绝对地址，实际为 ${entry.url}`,
    );
    // llms.txt / pricing.md 这类文本文件不该进 sitemap
    assert.ok(
      !/\.(txt|md|json|xml)$/.test(new URL(entry.url).pathname),
      `sitemap 不应包含非页面资源：${entry.url}`,
    );
  }
  assert.equal(
    new Set(entries.map((entry) => entry.url)).size,
    entries.length,
    'sitemap 中存在重复 URL',
  );
});

test('sitemap lastmod uses the declared content date rather than build time', () => {
  const [home] = buildSitemapEntries();
  // lastModified 在 Next 的类型里是 string | Date，统一走 Date 构造避免分支
  assert.equal(new Date(home.lastModified!).toISOString().slice(0, 10), siteLastUpdated);
});

test('robots allows AI crawlers and blocks the server API', () => {
  const robots = buildRobotsConfig();
  const rules = Array.isArray(robots.rules) ? robots.rules : [robots.rules];

  for (const agent of ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended']) {
    const rule = rules.find((r) => r.userAgent === agent);
    assert.ok(rule, `robots.txt 缺少 ${agent} 的显式规则`);
    assert.deepEqual(rule.disallow, ['/api/'], `${agent} 的 disallow 应为 /api/`);
  }

  const wildcard = rules.find((r) => r.userAgent === '*');
  assert.ok(wildcard, 'robots.txt 缺少通配符规则');
  assert.deepEqual(wildcard.disallow, ['/api/']);
});

test('homepage JSON-LD is serialisable and covers the core entities', () => {
  const schema = buildHomepageSchema() as {
    '@graph': { '@type': string }[];
  };

  // 序列化失败会让整个 JSON-LD 静默失效
  assert.doesNotThrow(() => JSON.stringify(schema));

  const types = schema['@graph'].map((node) => node['@type']);
  for (const expected of [
    'WebPage',
    'SoftwareApplication',
    'ItemList',
    'FAQPage',
    'BreadcrumbList',
  ]) {
    assert.ok(types.includes(expected), `首页 JSON-LD 缺少 ${expected}`);
  }
  for (const forbidden of ['Organization', 'WebSite']) {
    assert.ok(!types.includes(forbidden), `页面级 schema 不应再重复 ${forbidden}`);
  }
});

test('homepage FAQ schema matches the rendered FAQ copy', () => {
  const schema = buildHomepageSchema() as {
    '@graph': { '@type': string; mainEntity?: { name: string; acceptedAnswer: { text: string } }[] }[];
  };
  const faq = schema['@graph'].find((node) => node['@type'] === 'FAQPage');

  assert.ok(faq?.mainEntity, 'FAQPage 缺少 mainEntity');
  assert.equal(faq.mainEntity.length, homepageFaqs.length);
  for (const question of faq.mainEntity) {
    assert.ok(question.name.length > 0, 'FAQ 问题不能为空');
    // 空答案会让 Google 直接丢弃整块 FAQPage
    assert.ok(question.acceptedAnswer.text.length > 20, `FAQ 答案过短：${question.name}`);
  }
});

test('llms.txt and pricing.md stay in sync with the station data', () => {
  const llms = buildLlmsTxt();
  const full = buildLlmsFullTxt();
  const pricing = buildPricingMarkdown();

  assert.ok(llms.startsWith('# '), 'llms.txt 必须以一级标题开头');
  assert.ok(llms.includes(siteConfig.url), 'llms.txt 必须给出官网地址');
  assert.ok(llms.includes(siteLastUpdated), 'llms.txt 必须标注内容更新日期');

  for (const station of stations) {
    assert.ok(llms.includes(station.name), `llms.txt 缺少电台 ${station.name}`);
    assert.ok(pricing.includes(String(stations.length)), 'pricing.md 的电台数量不是最新值');
  }

  // 全量版必须包含精简版的内容
  assert.ok(full.length > llms.length, 'llms-full.txt 应比 llms.txt 更长');
  assert.ok(full.includes(llms.split('---')[0].trim()), 'llms-full.txt 应包含 llms.txt 的正文');

  for (const faq of homepageFaqs) {
    assert.ok(full.includes(faq.question), `llms-full.txt 缺少 FAQ：${faq.question}`);
  }
});

test('every station belongs to exactly one scene bucket in the directory', () => {
  const scenes = getSceneList();
  const total = scenes.reduce((sum, scene) => sum + scene.count, 0);

  assert.equal(total, stations.length, '场景计数之和与电台总数不一致');
  const slugs = scenes.map((scene) => scene.slug);
  assert.equal(
    new Set(slugs).size,
    slugs.length,
    '存在重复的场景 slug，锚点会互相覆盖',
  );
  for (const slug of slugs) {
    assert.match(slug, /^[a-z-]+$/, `场景 slug 必须是 ASCII 小写：${slug}`);
  }
});

test('scene comparison only names real stations and scenes', () => {
  const knownScenes = new Set(getSceneList().map((scene) => scene.scene));
  const knownStations = new Set(stations.map((station) => station.name));

  for (const row of sceneComparison.rows) {
    assert.ok(knownScenes.has(row.scene), `对照表出现了不存在的场景：${row.scene}`);
    for (const name of row.picks.split('、').map((item) => item.trim()).filter(Boolean)) {
      assert.ok(knownStations.has(name), `对照表推荐了不存在的电台：${name}`);
    }
  }
});

test('layout-level schema stays page-agnostic', () => {
  const types = (buildSiteSchema()['@graph'] as { '@type': string }[]).map((n) => n['@type']);

  assert.deepEqual(types, ['Organization', 'WebSite']);
  // 页面级节点一旦进入 layout，每个子页面都会多声明一份「自己是首页」
  for (const forbidden of ['WebPage', 'CollectionPage', 'FAQPage', 'AboutPage', 'ItemList']) {
    assert.ok(!types.includes(forbidden), `站点级 schema 不应包含 ${forbidden}`);
  }
});

test('inline JSON-LD cannot break out of the script element', () => {
  const json = serializeJsonLd({ text: '</script><script>alert(1)</script>' });

  assert.ok(!json.includes('<'), 'serializeJsonLd 必须把 < 全部转义');
  assert.ok(!json.includes('</script'), '未转义的 </script 会提前结束脚本块');
  assert.deepEqual(JSON.parse(json), { text: '</script><script>alert(1)</script>' });
});

test('robots host is a bare hostname, not a URL', () => {
  const host = buildRobotsConfig().host!;

  assert.equal(host, new URL(siteConfig.url).host);
  assert.ok(!host.startsWith('http'), `Host 指令要裸主机名，实际为 ${host}`);
});

test('mutable files are not served with immutable caching', async () => {
  const rules = await nextConfig.headers!();
  const cacheControl = (source: string) => {
    const rule = rules.find((entry) => entry.source === source);
    assert.ok(rule, `next.config.ts 缺少 ${source} 的缓存规则`);
    const header = rule!.headers.find((h) => h.key.toLowerCase() === 'cache-control');
    assert.ok(header, `${source} 没有 Cache-Control`);
    return header!.value;
  };

  // manifest.json 一改，已安装 PWA 的用户要等缓存过期才拿得到新版
  assert.ok(
    !cacheControl('/manifest.json').includes('immutable'),
    'manifest.json 不能用 immutable 长缓存',
  );

  const mutable = ['/llms.txt', '/llms-full.txt', '/pricing.md', '/robots.txt', '/sitemap.xml'];
  for (const path of mutable) {
    const value = cacheControl(path);
    const swr = /stale-while-revalidate=(\d+)/.exec(value);
    assert.ok(swr, `${path} 缺少 stale-while-revalidate`);
    assert.ok(
      Number(swr![1]) <= 86_400,
      `${path} 的陈旧期过长：${swr![1]} 秒，抓取器会读到过期的站点地图`,
    );
  }

  assert.ok(cacheControl('/icon-192.png').includes('immutable'), '图标应保持长缓存');
});

test('station entities describe a web page, not a raw audio stream', () => {
  const entities = buildStationEntities();
  assert.equal(entities.length, stations.length);

  for (const entry of entities) {
    const station = stations.find((s) => s.id === entry.item.identifier);
    assert.ok(station, `schema 里出现了未知电台：${entry.item.identifier}`);

    // RadioStation 在 schema.org 里是 LocalBusiness 的子类（有地址、营业时间的
    // 广播公司），genre 也不是它的合法属性。网络流要用 BroadcastChannel 这一支。
    assert.equal(entry.item['@type'], 'RadioChannel');
    // url 指的是「这个实体的网页」。写成音频流地址等于声明该电台的主页是个 .mp3；
    // 也不能带 #<id>——/stations 的表格与卡片互为 display:none，锚点只在单一视口有效
    assert.equal(entry.item.url, `${siteConfig.url}/stations`);
    assert.equal(entry.item['@id'], `${siteConfig.url}/stations#${station!.id}`);
    assert.equal(
      entry.item.potentialAction.target.urlTemplate,
      station!.url,
      `${station!.name} 的收听地址应保留在 ListenAction 里`,
    );
  }

  const bilibili = stations.find((station) => station.type === 'bilibili');
  assert.ok(bilibili, '数据集里应该存在 bilibili 类型的电台');
  const live = entities.find((entry) => entry.item.identifier === bilibili!.id);
  // 直播间给的是页面地址，不是可直接播放的流，别标成 audio/*
  assert.equal(live!.item.potentialAction.target.contentType, 'text/html');

  for (const station of stations.filter((entry) => entry.type !== 'bilibili')) {
    const direct = entities.find((entry) => entry.item.identifier === station.id);
    assert.match(
      direct!.item.potentialAction.target.contentType,
      /^(audio\/mpeg|application\/vnd\.apple\.mpegurl)$/,
      `${station.name} 是直连音频流，contentType 应如实标注`,
    );
  }
});

test('canonical and robots stay off the root layout', () => {
  // layout 的 metadata 会被每条未覆盖的路由继承，包括 Next 自动生成的 /_not-found。
  // 放在这里的结果是 404 页同时输出 noindex 与 index,follow，且 canonical 指向首页。
  const site = buildSiteMetadata();
  assert.equal(site.alternates, undefined, 'canonical 不应写在 root layout 上');
  assert.equal(site.robots, undefined, 'robots 不应写在 root layout 上');

  const home = buildHomeMetadata();
  assert.equal(home.alternates?.canonical, '/');
  assert.ok(home.robots, '首页仍然需要显式声明可索引');
});

test('the app schema names every scene the site actually has', () => {
  const app = (buildHomepageSchema()['@graph'] as { '@type': string; featureList?: string[] }[])
    .find((node) => node['@type'] === 'SoftwareApplication');
  const featureText = app!.featureList!.join('\n');

  for (const { scene } of getSceneList()) {
    assert.ok(
      featureText.includes(scene),
      `featureList 漏了「${scene}」场景，等于告诉抓取器站内没有这类电台`,
    );
  }
});
