import assert from 'node:assert/strict';
import test from 'node:test';

import { buildLlmsFullTxt, buildLlmsTxt, buildPricingMarkdown } from '../src/lib/llms';
import {
  buildHomepageSchema,
  buildRobotsConfig,
  buildSiteSchema,
  buildSitemapEntries,
  siteConfig,
} from '../src/lib/seo';
import { homepageFaqs, siteLastUpdated } from '../src/lib/seo-content';
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
    'Organization',
    'WebSite',
    'WebPage',
    'SoftwareApplication',
    'ItemList',
    'FAQPage',
    'BreadcrumbList',
  ]) {
    assert.ok(types.includes(expected), `首页 JSON-LD 缺少 ${expected}`);
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

test('layout-level schema stays page-agnostic', () => {
  const types = (buildSiteSchema()['@graph'] as { '@type': string }[]).map((n) => n['@type']);

  assert.deepEqual(types, ['Organization', 'WebSite']);
  // 页面级节点一旦进入 layout，每个子页面都会多声明一份「自己是首页」
  for (const forbidden of ['WebPage', 'CollectionPage', 'FAQPage', 'AboutPage', 'ItemList']) {
    assert.ok(!types.includes(forbidden), `站点级 schema 不应包含 ${forbidden}`);
  }
});
