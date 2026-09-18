import { buildPricingMarkdown, MARKDOWN_TEXT, textResponse } from "@/lib/llms";

/**
 * `/pricing.md`
 *
 * AI 代理在为人类做产品比较时，读不到「藏在 JS 渲染的页面里」的信息就会跳过你。
 * 本站免费，用一个纯 Markdown 文件把价格、限制、自部署条件写清楚，
 * 任何 LLM 都能零成本解析。
 */
export const dynamic = "force-static";

export function GET() {
  // 后缀是 .md，且 layout 里 <link rel="alternate" type="text/markdown"> 已声明过，
  // 这里必须给 text/markdown，否则实际响应类型与声明不一致。
  return textResponse(buildPricingMarkdown(), MARKDOWN_TEXT);
}
