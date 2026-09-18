import { buildLlmsTxt, textResponse } from "@/lib/llms";

/**
 * `/llms.txt`
 *
 * 用路由处理器而不是 public/ 下的静态文件：电台数量、场景分类、FAQ 条数
 * 全部从 stations.ts / seo-content.ts 派生，改数据时不会忘记同步，也不会
 * 出现「llms.txt 说 21 个、站点其实 25 个」这种 AI 最容易被带偏的错误。
 */
export const dynamic = "force-static";

export function GET() {
  return textResponse(buildLlmsTxt());
}
