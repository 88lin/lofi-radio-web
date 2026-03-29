import { NextResponse } from 'next/server';

export const runtime = 'edge';

// GitHub API 配置
const GITHUB_REPO = 'labilio/lofi-radio';
const STATIONS_FILE = 'stations.json';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents/${STATIONS_FILE}`;

// 缓存配置（使用 KV 存储会更好，但这里用内存缓存）
let cachedData: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 小时缓存

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

async function fetchFromGitHub() {
  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Lofi-Radio-Web',
      },
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const data: GitHubContent = await response.json();
    
    // 使用 Web API 解码 Base64 内容
    const content = decodeBase64(data.content);
    const stations = JSON.parse(content);
    
    return {
      stations,
      sha: data.sha,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to fetch from GitHub:', error);
    return null;
  }
}

export async function GET() {
  const now = Date.now();
  
  // 检查缓存
  if (cachedData && (now - lastFetchTime) < CACHE_DURATION) {
    return NextResponse.json({
      ...cachedData,
      cached: true,
    });
  }
  
  // 从 GitHub 获取最新数据
  const data = await fetchFromGitHub();
  
  if (data) {
    cachedData = data;
    lastFetchTime = now;
    
    return NextResponse.json({
      ...data,
      cached: false,
    });
  }
  
  // 如果 GitHub 获取失败，返回缓存数据（如果有）
  if (cachedData) {
    return NextResponse.json({
      ...cachedData,
      cached: true,
      error: 'Failed to fetch from GitHub, using cached data',
    });
  }
  
  // 如果都没有，返回错误
  return NextResponse.json(
    { error: 'Failed to fetch stations data' },
    { status: 500 }
  );
}
