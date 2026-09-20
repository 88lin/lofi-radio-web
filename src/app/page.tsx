import type { Metadata } from "next";

import HomeClient from "@/components/lofi/home-client";
import { JsonLd } from "@/components/seo/site-chrome";
import { buildHomeMetadata, buildHomepageSchema } from "@/lib/seo";

/**
 * 首页本体是客户端组件（播放器、专注计时、睡眠定时、主题切换都依赖浏览器状态），
 * 但页面级 JSON-LD 必须出现在首屏 HTML 里，AI 抓取器大多不执行 JS。
 *
 * 所以这里用一个服务端组件包一层：只负责输出首页专属的结构化数据
 * （WebPage / ItemList / FAQPage / BreadcrumbList / SoftwareApplication），
 * 站点级的 Organization + WebSite 由 root layout 统一输出。
 */
export const metadata: Metadata = buildHomeMetadata();

export default function HomePage() {
  return (
    <>
      <JsonLd data={buildHomepageSchema()} />
      <HomeClient />
    </>
  );
}
