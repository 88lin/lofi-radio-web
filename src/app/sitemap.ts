import type { MetadataRoute } from "next";

import { buildSitemapEntries } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemapEntries();
}
