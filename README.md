# 🎵 Lofi Radio Web

<div align="center">

![Lofi Radio](https://img.shields.io/badge/Lofi-Radio-8B5CF6?style=for-the-badge&logo=music&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Lofi 音乐被科学家认为是最适合专注工作学习的音乐**

macOS 风格灵动岛设计，16 个精选电台，打开即用，无需下载

[在线体验](#-在线体验) · [功能特性](#-功能特性) · [快速开始](#-快速开始) · [部署指南](#-部署指南) · [同步更新](#-同步原项目更新)

![Screenshot](https://via.placeholder.com/800x450?text=Lofi+Radio+Web+Screenshot)

</div>

---

## 📖 项目简介

Lofi Radio Web 是 [labilio/lofi-radio](https://github.com/labilio/lofi-radio) 的网页版实现，保留了原项目桌面版的核心功能，同时利用现代 Web 技术带来了跨平台、免安装的优势。

原项目是一个 Lofi Girl 桌面版播放器，让所有热爱 lofi 音乐的朋友每天打开电脑一键启动电台。本项目将其改造为网页版，让用户无需下载安装，打开浏览器即可享受高品质的专注音乐。

### 🎯 设计理念

- **专注体验** - 简洁优雅的界面设计，不打扰你的专注时光
- **跨平台** - 基于 Web 技术，支持桌面、移动端全平台访问
- **灵动岛设计** - 借鉴 macOS 灵动岛设计理念，小巧精致
- **即开即用** - 无需注册登录，无需下载安装，打开即用

---

## ✨ 功能特性

### 🎵 音乐播放

| 功能 | 描述 |
|------|------|
| **16 精选电台** | 涵盖 Lo-Fi、Chill、Jazz、Classical、Hip-Hop、Ambient 等多种风格 |
| **高品质音频** | 支持 MP3 流媒体和 HLS 协议，流畅播放不卡顿 |
| **黑胶唱片动画** - 精美的黑胶唱片旋转动画，播放时自动旋转 |
| **智能切换** - 一键切换电台，无缝衔接 |

### 🎨 界面设计

| 功能 | 描述 |
|------|------|
| **灵动岛播放器** | macOS 风格灵动岛设计，小巧精致，可自由拖动 |
| **全屏播放模式** | 沉浸式播放体验，展示完整播放控制 |
| **暗色/亮色主题** | 支持一键切换，自动跟随系统主题 |
| **响应式设计** | 完美适配桌面端和移动端 |

### ⌨️ 快捷键支持

| 快捷键 | 功能 |
|--------|------|
| `Space` | 播放 / 暂停 |
| `←` | 上一首 |
| `→` | 下一首 |
| `M` | 静音 / 取消静音 |
| `T` | 切换主题（暗色/亮色） |

### 📊 专注计时

- 记录每日专注时长
- 帮助培养高效工作习惯
- 数据本地存储，隐私安全

### 📻 电台分类

| 分类 | 电台 |
|------|------|
| **Lo-Fi** | Lofi Girl, Lofi Box |
| **Chill** | Chill Sky, Chill Wave, Groove Salad, ASP, Paradise, Drone Zone |
| **Jazz** | Jazz Box, Jazz Groove, Jazz Smooth |
| **Classical** | Swiss Classic, BBC 3 |
| **Ambient** | Rain Sounds |
| **Hip-Hop** | Rap Beats |
| **Rock/Indie** | KEXP |

### 🎭 适用场景

- 📚 **学习** - Lo-fi 音乐帮助你集中注意力
- 💻 **编程** - 氛围音乐激发创作灵感
- 📖 **阅读** - 轻柔爵士陪伴你的阅读时光
- 🌙 **放松** - 自然白噪音帮助你入眠

---

## 🛠️ 技术栈

| 技术 | 描述 |
|------|------|
| [Next.js 16](https://nextjs.org/) | React 全栈框架 |
| [React 19](https://react.dev/) | 用户界面库 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [Tailwind CSS v4](https://tailwindcss.com/) | 原子化 CSS |
| [Framer Motion](https://www.framer.com/motion/) | 动画库 |
| [Zustand](https://zustand-demo.pmnd.rs/) | 状态管理 |
| [HLS.js](https://hlsjs.org/) | HLS 流媒体播放 |
| [Lucide Icons](https://lucide.dev/) | 图标库 |

---

## 🚀 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- npm、yarn 或 pnpm

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/lofi-radio-web.git
cd lofi-radio-web

# 安装依赖
npm install
# 或
yarn install
# 或
pnpm install

# 启动开发服务器
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

```bash
# 构建
npm run build

# 启动生产服务器
npm run start
```

---

## 📦 部署指南

### 部署到 Vercel（推荐）

[Vercel](https://vercel.com) 是 Next.js 的官方部署平台，部署最简单：

#### 方法一：一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/lofi-radio-web)

1. 点击上方按钮
2. 登录 Vercel 账号（支持 GitHub、GitLab、Bitbucket）
3. 选择你的 GitHub 账号
4. 点击 "Create"
5. 等待部署完成，获得你的专属域名

#### 方法二：通过 CLI 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署
vercel

# 部署到生产环境
vercel --prod
```

#### 方法三：通过 GitHub 集成

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 导入你的 GitHub 仓库 `lofi-radio-web`
4. Vercel 会自动检测 Next.js 并配置构建设置
5. 点击 "Deploy"

### 部署到 Cloudflare Pages

[Cloudflare Pages](https://pages.cloudflare.com) 提供全球 CDN 加速：

#### 方法一：通过 Dashboard 部署

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 "Pages" 页面
3. 点击 "Create a project"
4. 选择 "Connect to Git"
5. 授权 GitHub 并选择 `lofi-radio-web` 仓库
6. 配置构建设置：
   - **Framework preset**: `Next.js`
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
7. 点击 "Save and Deploy"

#### 方法二：通过 Wrangler CLI 部署

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 构建项目
npm run build

# 部署
wrangler pages deploy .next --project-name=lofi-radio-web
```

> ⚠️ **注意**: Cloudflare Pages 对 Next.js 的支持有限，建议使用 `@cloudflare/next-on-pages` 适配器。详见 [Cloudflare Next.js 指南](https://developers.cloudflare.com/pages/framework-guides/nextjs)。

### 部署到 Netlify

[Netlify](https://www.netlify.com) 也是优秀的静态站点托管平台：

1. 登录 [Netlify](https://app.netlify.com)
2. 点击 "Add new site" > "Import an existing project"
3. 选择 GitHub 并授权
4. 选择 `lofi-radio-web` 仓库
5. 配置构建设置：
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
6. 点击 "Deploy site"

### 部署到自托管服务器

#### 使用 Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# 构建镜像
docker build -t lofi-radio-web .

# 运行容器
docker run -p 3000:3000 lofi-radio-web
```

#### 使用 PM2

```bash
# 安装 PM2
npm install -g pm2

# 构建
npm run build

# 启动
pm2 start npm --name "lofi-radio-web" -- start

# 设置开机自启
pm2 startup
pm2 save
```

---

## 🔄 同步原项目更新

本项目基于 [labilio/lofi-radio](https://github.com/labilio/lofi-radio) 开发，你可以同步原项目的电台更新：

### 方法一：手动同步电台配置

原项目的电台配置位于 `stations.json`，本项目的配置位于 `src/lib/stations.ts`。

1. 查看原项目的 [stations.json](https://github.com/labilio/lofi-radio/blob/main/stations.json)
2. 更新 `src/lib/stations.ts` 中的 `stations` 数组
3. 提交更改

### 方法二：使用 API 动态获取

项目内置了 `/api/stations` 接口，可以从 GitHub 动态获取最新电台列表：

```typescript
// 访问 /api/stations 获取最新电台
const response = await fetch('/api/stations');
const stations = await response.json();
```

### 方法三：设置自动同步（推荐）

创建 GitHub Actions 工作流，定期检查原项目更新：

```yaml
# .github/workflows/sync-upstream.yml
name: Sync Upstream

on:
  schedule:
    - cron: '0 0 * * 0'  # 每周检查一次
  workflow_dispatch:  # 手动触发

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Fetch upstream stations
        run: |
          curl -s https://raw.githubusercontent.com/labilio/lofi-radio/main/stations.json \
            -o upstream_stations.json
      
      - name: Check for changes
        id: check
        run: |
          if git diff --quiet upstream_stations.json original_stations.json 2>/dev/null; then
            echo "has_changes=false" >> $GITHUB_OUTPUT
          else
            echo "has_changes=true" >> $GITHUB_OUTPUT
          fi
      
      - name: Create PR if changes detected
        if: steps.check.outputs.has_changes == 'true'
        run: |
          # 创建 PR 逻辑
          echo "检测到电台更新，请手动审核合并"
```

---

## 📁 项目结构

```
lofi-radio-web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # 首页
│   │   ├── layout.tsx         # 根布局
│   │   ├── globals.css        # 全局样式
│   │   └── api/               # API 路由
│   │       └── stations/      # 电台同步 API
│   ├── components/            # 组件
│   │   ├── lofi/              # Lofi 相关组件
│   │   │   └── floating-player.tsx  # 浮动播放器
│   │   ├── ui/                # UI 基础组件
│   │   └── theme-provider.tsx # 主题提供者
│   ├── hooks/                 # 自定义 Hooks
│   │   ├── useAudioPlayer.ts  # 音频播放逻辑
│   │   └── useFocusTimer.ts   # 专注计时
│   ├── lib/                   # 工具库
│   │   ├── stations.ts        # 电台配置
│   │   └── utils.ts           # 工具函数
│   └── store/                 # 状态管理
│       └── audioStore.ts      # 音频状态
├── public/                    # 静态资源
├── package.json
├── tailwind.config.ts
├── next.config.ts
└── tsconfig.json
```

---

## 🤝 贡献指南

欢迎所有形式的贡献！

### 如何贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 开发指南

- 使用 TypeScript 编写代码
- 遵循 ESLint 规则
- 组件命名使用 PascalCase
- 函数命名使用 camelCase
- 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)

---

## 📄 开源协议

本项目基于 [MIT](LICENSE) 协议开源。

原项目 [labilio/lofi-radio](https://github.com/labilio/lofi-radio) 同样采用 MIT 协议。

---

## 🙏 致谢

- [labilio/lofi-radio](https://github.com/labilio/lofi-radio) - 原项目作者，提供了优秀的电台资源和桌面版实现
- [Lofi Girl](https://www.youtube.com/c/LofiGirl) - 提供优质的 Lofi 音乐直播
- 所有电台提供商

---

## 📮 联系方式

如有问题或建议，欢迎：

- [提交 Issue](https://github.com/YOUR_USERNAME/lofi-radio-web/issues)
- [参与讨论](https://github.com/YOUR_USERNAME/lofi-radio-web/discussions)

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐ Star 支持一下！**

Made with ❤️ for focus lovers

</div>
