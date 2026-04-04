import { siteConfig } from "../src/lib/seo";

const INDEXNOW_API_KEY = "8ea956ec814946c98eaa4e3df18cf6fd";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const KEY_LOCATION = `${siteConfig.url}/${INDEXNOW_API_KEY}.txt`;

async function getSitemapUrls(): Promise<string[]> {
  const sitemapUrl = `${siteConfig.url}/sitemap.xml`;

  try {
    const response = await fetch(sitemapUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.status}`);
    }

    const xml = await response.text();
    const urls: string[] = [];
    const locRegex = /<loc>(.*?)<\/loc>/g;
    let match;

    while ((match = locRegex.exec(xml)) !== null) {
      urls.push(match[1]);
    }

    return urls;
  } catch (error) {
    console.error("Error fetching sitemap:", error);
    return [siteConfig.url];
  }
}

async function submitToIndexNow(urls: string[]): Promise<boolean> {
  const payload = {
    host: new URL(siteConfig.url).host,
    key: INDEXNOW_API_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 200 || response.status === 202) {
      console.log(`Successfully submitted ${urls.length} URLs to IndexNow`);
      return true;
    }

    console.error(`IndexNow API error: ${response.status} ${response.statusText}`);
    return false;
  } catch (error) {
    console.error("Failed to submit to IndexNow:", error);
    return false;
  }
}

async function main() {
  console.log("Starting IndexNow submission...");
  console.log(`Site: ${siteConfig.url}`);
  console.log(`Key Location: ${KEY_LOCATION}`);

  const urls = await getSitemapUrls();
  console.log(`Found ${urls.length} URLs in sitemap:`);
  urls.forEach((url) => console.log(`  - ${url}`));

  const success = await submitToIndexNow(urls);

  if (success) {
    console.log("\nIndexNow submission completed successfully!");
    console.log("Search engines will process the URLs shortly.");
  } else {
    console.error("\nIndexNow submission failed.");
    process.exit(1);
  }
}

main();
