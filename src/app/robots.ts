import type { MetadataRoute } from "next";

import { buildRobotsConfig } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return buildRobotsConfig();
}
