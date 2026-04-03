import type { Metadata } from "next";

import { homepageFaqs } from "./seo-content";

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
      apple: "/logo.svg",
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

export function buildRobotsConfig() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  } as const;
}

export function buildSitemapEntries() {
  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
  ];
}
