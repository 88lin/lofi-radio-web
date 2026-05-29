import type { Metadata, MetadataRoute } from "next";

import { homepageFaqs } from "./seo-content";
import { stations } from "./stations";

export const siteConfig = {
  name: "Lofi Radio",
  url: "https://lofi.88lin.eu.org",
  author: "茉灵智库",
  creatorUrl: "https://blog.88lin.eu.org/",
  githubUrl: "https://github.com/88lin/lofi-radio-web",
  ogImage:
    "https://cdn.jsdmirror.com/gh/88lin/picx-images-hosting@master/hero-image-dark.jpg",
  description:
    "Lofi Radio 是一个可在线收听的专注音乐电台网站，提供 Lofi、Chill、Jazz、Ambient 和白噪音音乐，适合学习、工作、编程、阅读与助眠场景。",
} as const;

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
  "Bingbot",
];

export function buildSiteMetadata(): Metadata {
  const title = "Lofi Radio - 专注音乐电台";

  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description: siteConfig.description,
    applicationName: siteConfig.name,
    keywords: [
      "lofi 电台",
      "lofi radio",
      "专注音乐",
      "学习音乐",
      "工作背景音乐",
      "编程音乐",
      "助眠音乐",
      "白噪音",
      "在线电台",
      "jazz radio",
      "ambient music",
    ],
    authors: [{ name: siteConfig.author, url: siteConfig.creatorUrl }],
    creator: siteConfig.author,
    publisher: siteConfig.author,
    alternates: {
      canonical: "/",
    },
    icons: {
      icon: "/logo.svg",
      shortcut: "/logo.svg",
      apple: "/apple-touch-icon.png",
    },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      url: siteConfig.url,
      siteName: siteConfig.name,
      title,
      description: siteConfig.description,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: "Lofi Radio 首页视觉图",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: siteConfig.description,
      images: [siteConfig.ogImage],
    },
    manifest: "/manifest.json",
    category: "music",
    referrer: "origin-when-cross-origin",
  };
}

export function buildHomepageSchema() {
  const softwareApplication = {
    "@type": "SoftwareApplication",
    "@id": `${siteConfig.url}#app`,
    name: siteConfig.name,
    url: siteConfig.url,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web browser",
    description: siteConfig.description,
    inLanguage: "zh-CN",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CNY",
      availability: "https://schema.org/InStock",
    },
    featureList: [
      "在线收听 Lofi、Chill、Jazz、Ambient 和白噪音电台",
      "支持学习、工作、编程、阅读、放松和助眠场景",
      "支持移动端播放器、睡眠定时和专注时间记录",
      "免注册、免下载，浏览器打开即可使用",
    ],
    publisher: {
      "@id": `${siteConfig.url}#organization`,
    },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}#organization`,
        name: siteConfig.author,
        url: siteConfig.url,
        logo: `${siteConfig.url}/logo.svg`,
        sameAs: [siteConfig.creatorUrl, siteConfig.githubUrl],
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        description: siteConfig.description,
        publisher: {
          "@id": `${siteConfig.url}#organization`,
        },
        inLanguage: "zh-CN",
      },
      {
        "@type": "WebPage",
        "@id": `${siteConfig.url}#webpage`,
        url: siteConfig.url,
        name: `${siteConfig.name} 首页`,
        description: siteConfig.description,
        isPartOf: {
          "@id": `${siteConfig.url}#website`,
        },
        about: {
          "@id": `${siteConfig.url}#organization`,
        },
        primaryImageOfPage: siteConfig.ogImage,
        inLanguage: "zh-CN",
      },
      softwareApplication,
      {
        "@type": "ItemList",
        "@id": `${siteConfig.url}#stations`,
        name: "Lofi Radio 精选电台列表",
        description: `Lofi Radio 当前整理了 ${stations.length} 个适合学习、工作、编程、阅读、放松和助眠的在线音乐电台。`,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        numberOfItems: stations.length,
        itemListElement: stations.map((station, index) => {
          const radioStation = {
            "@type": "RadioStation",
            "@id": `${siteConfig.url}#station-${station.id}`,
            name: station.name,
            url: station.url,
            genre: [station.style1, station.style2],
            description:
              station.description ||
              `${station.name} 是适合${station.scene}场景的 ${station.style1} / ${station.style2} 在线音乐电台。`,
            ...(station.type === "bilibili" ? { inLanguage: "zh-CN" } : {}),
          };

          return {
            "@type": "ListItem",
            position: index + 1,
            item: radioStation,
          };
        }),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${siteConfig.url}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: siteConfig.name,
            item: siteConfig.url,
          },
        ],
      },
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

export function buildRobotsConfig(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      ...aiCrawlerUserAgents.map((userAgent) => ({
        userAgent,
        allow: "/",
      })),
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}

export function buildSitemapEntries(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: `${siteConfig.url}/llms.txt`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];
}
