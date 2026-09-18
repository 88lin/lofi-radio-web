import type { Metadata, MetadataRoute } from "next";

import {
  homepageFaqs,
  howToStart,
  siteFacts,
  siteLastUpdated,
} from "./seo-content";
import { stations } from "./stations";

export const siteConfig = {
  name: "Lofi Radio",
  fullName: "Lofi Radio 在线专注音乐电台",
  url: "https://lofi.88lin.eu.org",
  author: "茉灵智库",
  creatorUrl: "https://blog.88lin.eu.org/",
  githubUrl: "https://github.com/88lin/lofi-radio-web",
  ogImage:
    "https://cdn.jsdmirror.com/gh/88lin/picx-images-hosting@master/hero-image-dark.jpg",
  description:
    "Lofi Radio 是一个免费、免注册的在线专注音乐电台，收录 ${COUNT} 个 Lofi、Chill、Jazz、Classical、Ambient 与白噪音电台，覆盖学习、编程、阅读、放松、办公与助眠场景，打开浏览器即可收听。".replace(
      "${COUNT}",
      String(stations.length),
    ),
  /** 内容最近一次实质更新的日期，见 seo-content.ts 的说明 */
  lastUpdated: siteLastUpdated,
  locale: "zh_CN",
} as const;

export const pagePaths = {
  home: "/",
  stations: "/stations",
  faq: "/faq",
  about: "/about",
} as const;

/**
 * 需要显式放行的 AI 抓取器。
 *
 * `User-agent: *` 里已经 `Allow: /`，下面这些显式声明本身不改变抓取结果，
 * 作用是：一旦将来为某个目录加了 Disallow，这些条目能防止误伤；
 * 同时它也是给排查的人看的文档——「我们是故意允许 AI 引用的」。
 * 反过来，CCBot（Common Crawl，纯训练集抓取）在这里保持默认允许，
 * 因为 Common Crawl 是多个 AI 检索后端的上游语料。
 */
const aiCrawlerUserAgents = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  "Google-Extended",
  "Applebot-Extended",
  "Meta-ExternalAgent",
  "cohere-ai",
  "AI2Bot",
  "Diffbot",
  "DuckAssistBot",
  "Bingbot",
];

const organizationId = `${siteConfig.url}#organization`;
const websiteId = `${siteConfig.url}#website`;

/**
 * Google 的 robots 指令。
 * `max-snippet: -1` / `max-image-preview: large` 决定 AI Overviews 与普通摘要
 * 能摘走多少正文——不写会被默认截断。
 */
const googleBotDirectives = {
  index: true,
  follow: true,
  "max-image-preview": "large" as const,
  "max-snippet": -1,
  "max-video-preview": -1,
};

export function buildSiteMetadata(): Metadata {
  const title = `Lofi Radio 在线专注音乐电台 - ${stations.length} 个精选电台免费收听`;

  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description: siteConfig.description,
    applicationName: siteConfig.name,
    keywords: [
      "lofi 电台",
      "lofi radio",
      "lofi 音乐",
      "专注音乐",
      "学习音乐",
      "工作背景音乐",
      "编程音乐",
      "阅读背景音乐",
      "助眠音乐",
      "白噪音",
      "在线电台",
      "chill radio",
      "jazz radio",
      "ambient music",
      "study music",
    ],
    authors: [{ name: siteConfig.author, url: siteConfig.creatorUrl }],
    creator: siteConfig.author,
    publisher: siteConfig.author,
    alternates: {
      canonical: pagePaths.home,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: googleBotDirectives,
    },
    icons: {
      icon: "/logo.svg",
      shortcut: "/logo.svg",
      apple: "/apple-touch-icon.png",
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: siteConfig.url,
      siteName: siteConfig.fullName,
      title,
      description: siteConfig.description,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: `${siteConfig.fullName} 首页视觉图`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: siteConfig.description,
      images: [{ url: siteConfig.ogImage, alt: `${siteConfig.fullName} 首页视觉图` }],
    },
    manifest: "/manifest.json",
    category: "music",
    referrer: "origin-when-cross-origin",
    appleWebApp: {
      capable: true,
      title: siteConfig.name,
      statusBarStyle: "black-translucent",
    },
    formatDetection: { telephone: false, address: false, email: false },
  };
}

/** 子页面 metadata 构造器：避免每页重复 canonical / robots / OG 的样板。 */
export function buildPageMetadata({
  title,
  description,
  path,
  keywords,
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  const url = `${siteConfig.url}${path}`;

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: path },
    robots: {
      index: true,
      follow: true,
      googleBot: googleBotDirectives,
    },
    openGraph: {
      type: "article",
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.fullName,
      title,
      description,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: `${siteConfig.fullName} 首页视觉图`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: siteConfig.ogImage, alt: `${siteConfig.fullName} 首页视觉图` }],
    },
  };
}

/**
 * JSON-LD 序列化。
 *
 * 必须把 `<` 转成 `\u003c`：结果要塞进 `<script>` 标签，而 HTML 解析器只要遇到
 * `</script` 就会提前结束脚本块——哪怕这段字符出现在一个字符串字面量内部。
 *
 * 目前所有 schema 文案都是仓库内常量、不含用户输入，所以这不是当下的漏洞；
 * 加这一层是为了让「以后有人在描述里写一句带尖括号的话」不至于变成注入点。
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function buildOrganization() {
  return {
    "@type": "Organization",
    "@id": organizationId,
    name: siteConfig.author,
    alternateName: siteConfig.fullName,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: `${siteConfig.url}/logo.svg`,
      caption: `${siteConfig.fullName} Logo`,
    },
    sameAs: [siteConfig.creatorUrl, siteConfig.githubUrl],
  };
}

function buildWebsite() {
  return {
    "@type": "WebSite",
    "@id": websiteId,
    url: siteConfig.url,
    name: siteConfig.fullName,
    alternateName: siteConfig.name,
    description: siteConfig.description,
    publisher: { "@id": organizationId },
    inLanguage: "zh-CN",
  };
}

/**
 * 站点级实体图。由 root layout 输出，因此在每一条路由上都存在（含 /_not-found）。
 * 只放与具体页面无关的两类节点——把首页专属的 WebPage / FAQPage / ItemList
 * 放进 layout 会让 /stations 等页面同时声明「自己是首页」和一堆重复实体。
 */
export function buildSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [buildOrganization(), buildWebsite()],
  };
}

export function buildBreadcrumbSchema(
  trail: { name: string; path: string }[],
  id: string = `${siteConfig.url}#breadcrumb`,
) {
  return {
    "@type": "BreadcrumbList",
    "@id": id,
    itemListElement: trail.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: `${siteConfig.url}${entry.path}`,
    })),
  };
}

/** 电台实体。首页与 /stations 共用，保证两处描述一致。 */
export function buildStationEntities() {
  return stations.map((station, index) => {
    const nodeId = `${siteConfig.url}/stations#${station.id}`;

    return {
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "RadioStation",
        "@id": nodeId,
        identifier: station.id,
        name: station.name,
        url: station.url,
        genre: [station.style1, station.style2],
        description:
          station.description ||
          `${station.name} 是适合${station.scene}场景的 ${station.style1} / ${station.style2} 在线音乐电台。`,
        // bilibili 源的 url 是直播间页面地址，不是可直接播放的音频流。
        // 把它写成 AudioObject.contentUrl 再配一个 video/x-flv，
        // 对不做渲染的解析器是明确的误导——这类只保留 url，不声明 audio 子对象。
        ...(station.type === "bilibili"
          ? { inLanguage: "zh-CN" }
          : {
              audio: {
                "@type": "AudioObject",
                contentUrl: station.url,
                encodingFormat:
                  station.type === "m3u8"
                    ? "application/vnd.apple.mpegurl"
                    : "audio/mpeg",
              },
            }),
      },
    };
  });
}

export function buildHomepageSchema() {
  const softwareApplication = {
    "@type": "SoftwareApplication",
    "@id": `${siteConfig.url}#app`,
    name: siteConfig.fullName,
    alternateName: siteConfig.name,
    url: siteConfig.url,
    applicationCategory: "MultimediaApplication",
    applicationSubCategory: "Internet Radio Player",
    operatingSystem: "Any（现代浏览器：Chrome / Edge / Safari / Firefox）",
    browserRequirements: "需要支持 HTML5 Audio 或 MSE 的现代浏览器",
    softwareVersion: "1.0.0",
    description: siteConfig.description,
    inLanguage: "zh-CN",
    isAccessibleForFree: true,
    image: siteConfig.ogImage,
    screenshot: {
      "@type": "ImageObject",
      url: siteConfig.ogImage,
      caption: `${siteConfig.fullName} 首页截图`,
    },
    keywords:
      "lofi radio, lofi 音乐, 专注音乐, 学习音乐, 编程音乐, 助眠音乐, 白噪音, 在线电台",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CNY",
      availability: "https://schema.org/InStock",
    },
    featureList: [
      `在线收听 ${stations.length} 个 Lofi、Chill、Jazz、Classical、Ambient 与白噪音电台`,
      "按学习、编程、阅读、写作、办公、放松、运动、娱乐、助眠场景分类",
      "支持 MP3、HLS/M3U8 与 Bilibili 直播流",
      "移动端播放器、睡眠定时（15–480 分钟）与每日专注时长记录",
      "键盘快捷键、亮/暗主题、PWA 安装",
      "免注册、免下载、无广告",
    ],
    publisher: { "@id": organizationId },
    author: { "@id": organizationId },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganization(),
      buildWebsite(),
      {
        "@type": "WebPage",
        "@id": `${siteConfig.url}#webpage`,
        url: siteConfig.url,
        name: `${siteConfig.fullName} - 首页`,
        description: siteConfig.description,
        isPartOf: { "@id": websiteId },
        about: { "@id": `${siteConfig.url}#app` },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: siteConfig.ogImage,
        },
        dateModified: siteConfig.lastUpdated,
        inLanguage: "zh-CN",
        breadcrumb: { "@id": `${siteConfig.url}#breadcrumb` },
      },
      softwareApplication,
      {
        "@type": "ItemList",
        "@id": `${siteConfig.url}#stations`,
        name: `Lofi Radio 精选电台列表（共 ${stations.length} 个）`,
        description: `Lofi Radio 当前整理了 ${stations.length} 个适合学习、工作、编程、阅读、放松和助眠的在线音乐电台。`,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        numberOfItems: stations.length,
        itemListElement: buildStationEntities(),
      },
      buildBreadcrumbSchema([{ name: siteConfig.fullName, path: pagePaths.home }]),
      {
        "@type": "FAQPage",
        "@id": `${siteConfig.url}#faq`,
        mainEntity: homepageFaqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };
}

export function buildStationsPageSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganization(),
      buildWebsite(),
      {
        "@type": "CollectionPage",
        "@id": `${siteConfig.url}${pagePaths.stations}#webpage`,
        url: `${siteConfig.url}${pagePaths.stations}`,
        name: `Lofi Radio 电台列表（${stations.length} 个在线电台）`,
        description: `Lofi Radio 全部 ${stations.length} 个在线电台清单，含风格标签、使用场景、音源类型与音源地址。`,
        isPartOf: { "@id": websiteId },
        dateModified: siteConfig.lastUpdated,
        inLanguage: "zh-CN",
        breadcrumb: { "@id": `${siteConfig.url}${pagePaths.stations}#breadcrumb` },
        mainEntity: { "@id": `${siteConfig.url}${pagePaths.stations}#stations` },
      },
      {
        "@type": "ItemList",
        "@id": `${siteConfig.url}${pagePaths.stations}#stations`,
        name: `Lofi Radio 全部电台（${stations.length} 个）`,
        numberOfItems: stations.length,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: buildStationEntities(),
      },
      buildBreadcrumbSchema([
        { name: siteConfig.fullName, path: pagePaths.home },
        { name: "电台列表", path: pagePaths.stations },
      ]),
    ],
  };
}

export function buildFaqPageSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganization(),
      buildWebsite(),
      {
        "@type": "FAQPage",
        "@id": `${siteConfig.url}${pagePaths.faq}#webpage`,
        url: `${siteConfig.url}${pagePaths.faq}`,
        name: "Lofi Radio 常见问题",
        description: `关于 Lofi Radio 的 ${homepageFaqs.length} 个常见问题：是否收费、电台数量、场景选型、播放失败排查、隐私与版权说明。`,
        isPartOf: { "@id": websiteId },
        dateModified: siteConfig.lastUpdated,
        inLanguage: "zh-CN",
        breadcrumb: { "@id": `${siteConfig.url}${pagePaths.faq}#breadcrumb` },
        mainEntity: homepageFaqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
      {
        "@type": "HowTo",
        "@id": `${siteConfig.url}${pagePaths.faq}#howto`,
        name: howToStart.name,
        description: howToStart.description,
        totalTime: "PT2M",
        step: howToStart.steps.map((step, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          name: step.name,
          text: step.text,
        })),
      },
      buildBreadcrumbSchema(
        [
          { name: siteConfig.fullName, path: pagePaths.home },
          { name: "常见问题", path: pagePaths.faq },
        ],
        `${siteConfig.url}${pagePaths.faq}#breadcrumb`,
      ),
    ],
  };
}

export function buildAboutPageSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganization(),
      buildWebsite(),
      {
        "@type": "AboutPage",
        "@id": `${siteConfig.url}${pagePaths.about}#webpage`,
        url: `${siteConfig.url}${pagePaths.about}`,
        name: "关于 Lofi Radio",
        description: `Lofi Radio 的项目背景、电台筛选方法、第三方音源与版权说明，维护者为${siteConfig.author}。`,
        isPartOf: { "@id": websiteId },
        about: { "@id": organizationId },
        dateModified: siteConfig.lastUpdated,
        inLanguage: "zh-CN",
        breadcrumb: { "@id": `${siteConfig.url}${pagePaths.about}#breadcrumb` },
      },
      buildBreadcrumbSchema([
        { name: siteConfig.fullName, path: pagePaths.home },
        { name: "关于", path: pagePaths.about },
      ]),
    ],
  };
}

export function buildRobotsConfig(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // 服务端 API 不是内容，放进来只会产生无意义的抓取与索引噪声
        disallow: ["/api/"],
      },
      ...aiCrawlerUserAgents.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/api/"],
      })),
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    // Host 是 Yandex 的指令，它要的是裸主机名；带 scheme 会被当成无效值忽略。
    // Google 直接忽略这一行，所以写错没有代价，写对只是顺手。
    host: new URL(siteConfig.url).host,
  };
}

export function buildSitemapEntries(): MetadataRoute.Sitemap {
  // 用真实的「内容更新日期」而不是构建时间：每次构建都刷新 lastmod
  // 会让抓取器认为站点在无意义地抖动，反而弱化新鲜度信号。
  const lastModified = new Date(siteConfig.lastUpdated);

  return [
    {
      url: siteConfig.url,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: `${siteConfig.url}${pagePaths.stations}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}${pagePaths.faq}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${siteConfig.url}${pagePaths.about}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.4,
    },
  ];
}

/** 供页面渲染的站点速览数据。 */
export const siteSummary = siteFacts;
