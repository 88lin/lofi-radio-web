# 🎵 Lofi Radio Web

<div align="center">

![Lofi Radio](https://img.shields.io/badge/Lofi-Radio-8B5CF6?style=for-the-badge&logo=music&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Lofi 音乐被科学家认为是最适合专注工作学习的音乐**

macOS 风格灵动岛设计，16 个精选电台，打开即用，无需下载

[功能特性](#-功能特性) · [快速开始](#-快速开始) · [部署指南](#-部署指南) · [在线体验](#-在线体验)

</div>

---

## 📖 项目简介

Lofi Radio Web 是 [labilio/lofi-radio](https://github.com/labilio/lofi-radio) 的网页版实现，将原 Electron 桌面应用改造为现代化 Web 应用。

**就像把咖啡店的背景音乐搬进你的书房** —— 不需要本地音源，不需要选歌单，打开网页即可收听。

### 🎯 设计理念

- **专注体验** - 灵动岛设计，小巧玲珑，安静陪伴不打扰
- **跨平台** - 基于 Web 技术，支持桌面、移动端全平台访问
- **即开即用** - 无需注册登录，无需下载安装，打开即用
- **PWA 支持** - 可安装到桌面，像原生应用一样使用

---

## ✨ 功能特性

### 🎵 音乐播放

| 功能 | 描述 |
|------|------|
| **16 精选电台** | 涵盖 Lo-Fi、Chill、Jazz、Classical、Hip-Hop、Ambient 等多种风格 |
| **Bilibili 直播源** | 支持 Lofi Girl B站直播流，国内访问更稳定 |
| **高品质音频** | 支持 MP3 流媒体和 HLS 协议，流畅播放不卡顿 |
| **智能切换** | 一键切换电台，自动播放无缝衔接 |

### 🎨 界面设计

| 功能 | 描述 |
|------|------|
| **灵动岛播放器** | macOS 风格灵动岛设计，可自由拖动到屏幕任意位置 |
| **玻璃拟态效果** | 高斯模糊 + 透明度，精致美观 |
| **黑胶唱片动画** | 精美的黑胶唱片旋转动画，播放时自动旋转 |
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

- 记录每日专注时长（仅在播放时计时）
- 帮助培养高效工作习惯
- 数据本地存储，每日自动重置

---

## 📻 电台列表

| 电台 | 风格标签 | 适用场景 | 特点 |
|------|---------|---------|------|
| **Lofi Girl (B站)** | Lo-fi / Chill | 学习 / 工作 | 国内访问稳定，B站直播源 |
| **Lofi Box** | Lo-fi / Chill | 学习 / 工作 | 高性能 |
| **Chill Sky** | Chill / Electro | 阅读 | 放松氛围 |
| **Chill Wave** | Chill / Electro | 放松 | 电子氛围 |
| **Groove Salad** | Chill / Ambient | 编程 | 专注必备 |
| **ASP** | Ambient / Sleep | 助眠 | 深度放松 |
| **Paradise** | Chill / Alt | 休闲 | 多元风格 |
| **Drone Zone** | Ambient / Deep | 助眠 | 持续低音 |
| **Rain Sounds** | Ambient / Nature | 助眠 | 自然白噪音 |
| **Jazz Box** | Jazz / Smooth | 阅读 | 柔和爵士 |
| **Jazz Groove** | Jazz / Groove | 写作 | 律动爵士 |
| **Jazz Smooth** | Jazz / Mellow | 办公 | 轻柔爵士 |
| **Swiss Classic** | Classical / Symphony | 专注 | 交响乐 |
| **BBC 3** | Classical / Arts | 探索 | 艺术古典 |
| **Rap** | Hip-Hop / Beats | 运动 | 节奏驱动 |
| **KEXP** | Indie / Alt | 娱乐 | 独立音乐 |

---

## 🛠️ 技术栈

| 技术 | 描述 |
|------|------|
| [Next.js 16](https://nextjs.org/) | React 全栈框架，App Router |
| [React 19](https://react.dev/) | 用户界面库 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [Tailwind CSS v4](https://tailwindcss.com/) | 原子化 CSS |
| [Framer Motion](https://www.framer.com/motion/) | 动画库 |
| [Zustand](https://zustand-demo.pmnd.rs/) | 轻量级状态管理 |
| [HLS.js](https://hlsjs.org/) | HLS 流媒体播放 |
| [flv.js](https://github.com/bilibili/flv.js) | B站 FLV 直播流播放 |
| [Lucide Icons](https://lucide.dev/) | 图标库 |

---

## 🚀 快速开始

### 环境要求

- Node.js 20.9 或更高版本（Next.js 16 要求）
- npm、yarn、pnpm 或 bun

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/88lin/lofi-radio-web.git
cd lofi-radio-web

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开浏览器访问 http://localhost:3000

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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/88lin/lofi-radio-web)

1. 点击上方按钮，或访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 导入 GitHub 仓库 `lofi-radio-web`
3. Vercel 会自动检测 Next.js 并配置构建设置
4. 点击 "Deploy" 即可完成部署

### 部署到 Cloudflare Pages

[Cloudflare Pages](https://pages.cloudflare.com) 提供全球 CDN 加速，国内访问速度更快：

> ⚠️ **重要**: Next.js 16 要求 Node.js >= 20.9.0，需要在 Cloudflare 中指定 Node.js 版本。

#### 方式一：使用 Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 "Workers 和 Pages" → "创建" → "Pages" → "连接到 Git"
3. 授权 GitHub 并选择 `lofi-radio-web` 仓库
4. 配置构建设置：
   - **框架预设**: `Next.js`
   - **构建命令**: `npx @cloudflare/next-on-pages`
   - **构建输出目录**: `.vercel/output/static`
5. **关键步骤**：添加环境变量
   - `NODE_VERSION` = `20`（或 `22`）
6. 点击 "保存并部署"

#### 方式二：使用 Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 构建项目（需要 Node.js 20+）
npm run build

# 部署到 Cloudflare Pages
wrangler pages deploy .vercel/output/static --project-name=lofi-radio-web
```

> 💡 **提示**: 项目根目录已包含 `.node-version` 文件指定 Node.js 20，Cloudflare 会自动识别。

### 部署到 Netlify

[Netlify](https://www.netlify.com) 也是优秀的托管平台：

1. 登录 [Netlify](https://app.netlify.com)
2. 点击 "Add new site" > "Import an existing project"
3. 选择 GitHub 并授权
4. 选择 `lofi-radio-web` 仓库
5. 配置构建设置：
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
6. 点击 "Deploy site"

### Docker 部署

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

---

## 📁 项目结构

```
lofi-radio-web/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx             # 首页
│   │   ├── layout.tsx           # 根布局
│   │   ├── globals.css          # 全局样式
│   │   └── api/                 # API 路由
│   │       ├── bilibili-stream/ # B站直播流解析
│   │       └── stations/        # 电台同步 API
│   ├── components/              # 组件
│   │   ├── lofi/                # Lofi 相关组件
│   │   │   └── floating-player.tsx  # 浮动播放器
│   │   ├── ui/                  # UI 基础组件
│   │   └── theme-provider.tsx   # 主题提供者
│   ├── hooks/                   # 自定义 Hooks
│   │   ├── useAudioPlayer.ts    # 音频播放逻辑
│   │   ├── useFocusTimer.ts     # 专注计时
│   │   └── use-toast.ts         # Toast 提示
│   ├── lib/                     # 工具库
│   │   ├── stations.ts          # 电台配置
│   │   └── utils.ts             # 工具函数
│   └── store/                   # 状态管理
│       └── audioStore.ts        # 音频状态
├── public/                      # 静态资源
│   ├── logo.svg                 # Logo
│   ├── manifest.json            # PWA 配置
│   └── robots.txt               # 爬虫配置
├── package.json
├── tailwind.config.ts
├── next.config.ts
└── LICENSE
```

---

## 🔄 同步原项目更新

本项目基于 [labilio/lofi-radio](https://github.com/labilio/lofi-radio) 开发，你可以同步原项目的电台更新：

1. 查看原项目的 [stations.json](https://github.com/labilio/lofi-radio/blob/main/stations.json)
2. 更新 `src/lib/stations.ts` 中的 `stations` 数组
3. 提交更改

---

## 🤝 贡献指南

欢迎所有形式的贡献！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

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

- [提交 Issue](https://github.com/88lin/lofi-radio-web/issues)

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐ Star 支持一下！**

Made with ❤️ by [88lin](https://github.com/88lin)

</div>
