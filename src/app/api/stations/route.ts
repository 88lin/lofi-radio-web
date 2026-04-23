import { NextResponse } from 'next/server';

const GITHUB_REPO = 'labilio/lofi-radio';
const STATIONS_FILE = 'stations.json';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents/${STATIONS_FILE}`;

interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  content: string;
  encoding: string;
  download_url: string;
}

function decodeBase64(base64: string): string {
  const cleanBase64 = base64.replace(/\n/g, '');
  return Buffer.from(cleanBase64, 'base64').toString('utf-8');
}

export async function GET() {
  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Lofi-Radio-Web',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data: GitHubContent = await response.json();
    const content = decodeBase64(data.content);
    const stations = JSON.parse(content);

    return NextResponse.json({
      stations,
      sha: data.sha,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch from GitHub:', error);

    return NextResponse.json(
      { error: 'Failed to fetch stations data' },
      { status: 500 }
    );
  }
}
