import { NextResponse } from 'next/server';

export const runtime = 'edge';

// GitHub API 配置
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

// Base64 解码函数（Edge Runtime 兼容）
function decodeBase64(base64: string): string {
  // 处理 GitHub API 返回的 Base64 内容（可能有换行符）
  const cleanBase64 = base64.replace(/\n/g, '');
  const binaryString = atob(cleanBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

export async function GET() {
  try {
    // 使用 Next.js 的 fetch 缓存机制，每小时重新验证
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Lofi-Radio-Web',
      },
      // 使用 Next.js 的缓存控制：1小时后重新验证
      next: { revalidate: 3600 },
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const data: GitHubContent = await response.json();
    
    // 使用 Web API 解码 Base64 内容
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
