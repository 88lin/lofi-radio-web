import { buildLlmsFullTxt, textResponse } from "@/lib/llms";

/** `/llms-full.txt`：llms.txt 的全量版本，供需要完整上下文的 AI 检索系统读取。 */
export const dynamic = "force-static";

export function GET() {
  return textResponse(buildLlmsFullTxt());
}
