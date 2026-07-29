# 🎵 Lofi Radio Web

<div align="center">

![Lofi Radio](https://img.shields.io/badge/Lofi-Radio-8B5CF6?style=for-the-badge&logo=music&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Lofi (Low Fidelity) music is widely recognized as the ideal background audio for focus-intensive scenarios like working and studying, and is considered by scientists to be the best music for deep concentration.**

Featuring a macOS-style Dynamic Island design and 21 curated radio stations. Ready to use immediately—no downloads required.

**[🎧 Live Experience](https://lofi.88lin.eu.org/)** · [📖 Features](#-features) · [🚀 Quick Start](#-quick-start) · [📦 Deployment Guide](#-deployment-guide) · [💬 Discussions](https://github.com/88lin/lofi-radio-web/discussions)

</div>

---

## 🖼️ Home Preview

<div align="center">

### Light Mode
![Lofi Radio Hero Light](https://cdn.jsdelivr.net/gh/88lin/picx-images-hosting@master/hero-image.jpg)

### Dark Mode
![Lofi Radio Hero Dark](https://cdn.jsdelivr.net/gh/88lin/picx-images-hosting@master/hero-image-dark.jpg)

</div>

---

## 📖 Project Introduction

Lofi Radio Web is a web-based implementation of [labilio/lofi-radio](https://github.com/labilio/lofi-radio), transforming the original Electron desktop application into a modern Web application.

**It's like bringing the background music of a coffee shop into your study** — no local audio files needed, no need to pick playlists, just open the page and listen.

### 🎯 Design Philosophy

- **Focus Experience** - Dynamic Island design: compact and unobtrusive companionship.
- **Cross-Platform** - Based on Web technology, supporting access across desktop and mobile platforms.
- **Instant Use** - No registration, no login, and no installation required.
- **PWA Support** - Can be installed to the desktop and used like a native application.

### 🧠 Why Lofi is Suitable for Focus

Lofi (Low Fidelity) music is often used for high-concentration tasks such as studying, programming, writing, and office work. Its typical characteristics include:

- **Slow and steady tempo** (usually 60-90 BPM)
- **Simple melodies with a strong sense of loop**
- **Minimal or no lyrics**
- **Soft tones**, often accompanied by rain sounds, vinyl crackle, or ambient noise
- **Restrained emotion**, avoiding artificial climaxes

The core reasons it is widely used for background focus are:

1. **No competition for attention with language brain regions**: Music with lyrics easily occupies language processing resources; Lofi's weak semantic features are better suited for long-term focus tasks.
2. **Predictable patterns help enter the "zone"**: The steady rhythm and looping structure provide psychological predictability, making it easier to enter Deep Work / Flow.
3. **Provides a sense of companionship and reduces anxiety**: Gentle emotional expression alleviates the tension brought by work or exams without interrupting the flow of thought.

---

## ✨ Features

### 🎵 Music Playback

| Feature | Description |
|------|------|
| **21 Curated Stations** | Covers various styles including Lofi, Chillhop, Jazz, Classical, Hip-Hop, Ambient, and more |
| **Bilibili Live Sources** | Supports Lofi Girl Bilibili live streams with automatic FLV/HLS fallback |
| **Global Streaming Sources** | Integrates sources like Lofi Cafe, SomaFM, Code Radio, Swiss Classic, etc. |
| **Smart Switching** | Switch stations with one click for seamless automatic playback |

### 🎨 Interface Design

| Feature | Description |
|------|------|
| **Dynamic Island Player** | macOS-style Dynamic Island design, freely draggable to any position on the screen |
| **Glassmorphism Effect** | Gaussian blur + transparency for a sophisticated look |
| **Vinyl Animation** | Beautiful rotating vinyl record animation that triggers during playback |
| **Dark/Light Themes** | One-click switching or automatic synchronization with system theme |
| **Responsive Design** | Perfectly adapted for both desktop and mobile devices |

### ⌨️ Keyboard Shortcuts

| Shortcut | Function |
|--------|------|
| `Space` | Play / Pause |
| `←` | Previous Station |
| `→` | Next Station |
| `M` | Mute / Unmute |
| `T` | Switch Theme (Dark/Light) |

### 📊 Focus Timer

- Tracks daily focus duration (only counts while playing)
- Helps cultivate efficient work habits
- Data stored locally, automatically resets daily

### 🌙 Sleep Timer

- Fast presets for 15/30/45/60/90/120 minutes
- Custom duration from 1 to 480 minutes
- Automatically pauses playback when the timer ends
- Sleep timer state supports local persistence

---

## 📻 Station List (21 Total)

### Study (3)

| Station | Genre Tags | Note |
|------|---------|------|
| **Lofi Girl** | Lofi / Chill | Bilibili live source, Bilibili-friendly |
| **Lofi Box** | Lofi / Chill | Classic Lofi stream |
| **Lofi Studying** | Lofi / Study | Specifically for studying scenarios |

### Programming (2)

| Station | Genre Tags | Note |
|------|---------|------|
| **Groove Salad** | Chill / Ambient | Friendly for long coding sessions |
| **Code Radio** | Lofi / Coding | freeCodeCamp programming radio |

### Reading (4)

| Station | Genre Tags | Note |
|------|---------|------|
| **Chill Sky** | Chill / Electro | Light electronic atmosphere |
| **Lofi Japanese** | Japanese / Lofi | Japanese-style Lofi vibes |
| **Jazz Box** | Jazz / Smooth | Smooth jazz stream |
| **B3cks Radio** | Lofi / Relax | Relaxation-oriented Lofi |

### Relaxing (3)

| Station | Genre Tags | Note |
|------|---------|------|
| **Chill Wave** | Chill / Electro | Ambient electronic |
| **Lofi Chilling** | Lofi / Chill | Low-pressure companion background audio |
| **Paradise** | Chill / Alt | Diverse relaxing styles |

### Sleep (4)

| Station | Genre Tags | Note |
|------|---------|------|
| **Rain Sounds** | Ambient / Nature | White noise and nature sounds |
| **Lofi Sleeping** | Lofi / Sleep | Low-stimulus stream for bedtime |
| **Drone Zone** | Ambient / Deep | Deep ambient sound wall |
| **ASP** | Ambient / Sleep | Minimalist sleep atmosphere |

### Focus (1)

| Station | Genre Tags | Note |
|------|---------|------|
| **Swiss Classic** | Classical / Symphony | Classical symphony for focus |

### Others (4)

| Station | Genre Tags | Scenario |
|------|---------|------|
| **Jazz Groove** | Jazz / Groove | Writing |
| **Jazz Smooth** | Jazz / Mellow | Office Work |
| **Rap Beats** | Hip-Hop / Beats | Exercise |
| **Lofi Gaming** | Lofi / Gaming | Entertainment |

---

## 🛠️ Tech Stack

| Tech | Description |
|------|------|
| [Next.js 16](https://nextjs.org/) | Full-stack React framework, App Router |
| [React 19](https://react.dev/) | UI Library |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS |
| [Framer Motion](https://www.framer.com/motion/) | Animation library |
| [Zustand](https://zustand-demo.pmnd.rs/) | Lightweight state management |
| [HLS.js](https://hlsjs.org/) | HLS streaming playback |
| [flv.js](https://github.com/bilibili/flv.js) | Bilibili FLV live stream playback |
| [Lucide Icons](https://lucide.dev/) | Icon library |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20.9 or higher (Required by Next.js 16)
- npm, yarn, pnpm, or bun

### Local Development

```bash
# Clone the repository
git clone https://github.com/88lin/lofi-radio-web.git
cd lofi-radio-web

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:3000 in your browser.

### Production Build

```bash
# Build the project
npm run build

# Start production server
npm run start
```

---

## 📦 Deployment Guide

> 📌 **First, fork this repository to your own GitHub account.**
>
> 1. Visit the [lofi-radio-web](https://github.com/88lin/lofi-radio-web) repository homepage.
> 2. Click the **Fork** button in the top right.
> 3. Once complete, you will see a copy of the `lofi-radio-web` repository under your own GitHub account.
>
> All the following deployment methods are based on your forked repository.

### Pre-deployment Checklist

The current verified deployment prerequisites are as follows:

- Runtime requirement: Node.js `>= 20.9.0`
- Application type: Standard Next.js server-side application (not a pure static site)
- API dependency: `/api/bilibili-stream` explicitly uses the Node.js runtime
- Outbound access: The deployment environment must allow server-side access to `api.live.bilibili.com` and `api.github.com`

This means the deployment platform must satisfy at least two things:

1. Support for Next.js server runtime mode.
2. Support for server-side outbound requests using Node.js 20+.

If a platform only supports pure static export or has limited support for Node.js runtime/outbound requests, it is not suitable as the default deployment path for this project.

### Deploy to Vercel (Recommended)

[Vercel](https://vercel.com) is currently the most recommended deployment method and the hosting platform that best matches this repository's structure.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/88lin/lofi-radio-web)

1. Click the button above, or visit the [Vercel Dashboard](https://vercel.com/dashboard).
2. Import your forked `lofi-radio-web` repository.
3. Keep the default Framework Preset as `Next.js`.
4. Use the default Build Command, or explicitly enter `npm run build`.
5. Use the default Install Command, or explicitly enter `npm install`.
6. Set the Node.js version to `20.x` or higher.
7. Current default public features usually don't require extra environment variables; just click `Deploy`.

If you later enable databases, authentication, or other extensions in your own branch, add the corresponding environment variables then.

### Deploy to Standard Node.js Server (Recommended)

If you use your own Linux server, cloud VM, PaaS, or panel, it is recommended to deploy as a standard Next.js Node service.

```bash
# Install dependencies
npm install

# Build
npm run build

# Start production service
npm run start
```

The default listening port is `3000`. If you need a reverse proxy, you can point Nginx / Caddy directly to this port.

A reference [Caddyfile](./Caddyfile) is included in the repository, suitable for reverse proxying in local or self-hosted scenarios.

### Docker Deployment (Recommended)

A ready-to-use [Dockerfile](./Dockerfile) is provided in the root directory.

```bash
# Build image
docker build -t lofi-radio-web .

# Run container
docker run -d --name lofi-radio-web -p 3000:3000 --restart unless-stopped lofi-radio-web
```

Once the container starts, the application will execute `npm run start` inside the container, exposing port `3000` by default.

### Cloudflare Pages / Netlify / Other Platforms

These platforms are not the primary recommended deployment paths for this repository. This is not because they "cannot" be used, but because:

- This project contains server-side APIs, not just pure static pages.
- `/api/bilibili-stream` relies on the Node.js runtime and server-side outbound requests.
- Different platforms vary significantly in their support for Next.js server runtime, adapters, Node.js versions, and network policies.

If you are very familiar with these platforms, you can verify a custom adaptation plan; otherwise, it is highly recommended to prioritize:

- Vercel
- Standard Node.js Server
- Docker + Reverse Proxy

The practice of listing fixed build configurations for certain platforms in previous READMEs was inaccurate, so templated parameters that have not been verified against the current repository are no longer provided here.

---

## 📁 Project Structure

```
lofi-radio-web/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx             # Home page
│   │   ├── layout.tsx           # Root layout
│   │   ├── globals.css          # Global styles
│   │   ├── robots.ts            # robots.txt route
│   │   ├── sitemap.ts           # sitemap.xml route
│   │   └── api/                 # API routes
│   │       ├── bilibili-stream/ # Bilibili live stream parsing
│   │       └── stations/        # Station synchronization API
│   ├── components/              # Components
│   │   ├── lofi/                # Lofi-related components
│   │   │   └── floating-player.tsx  # Floating player
│   │   ├── ui/                  # UI base components
│   │   └── theme-provider.tsx   # Theme provider
│   ├── hooks/                   # Custom Hooks
│   │   ├── useAudioPlayer.ts    # Audio playback logic
│   │   ├── useFocusTimer.ts     # Focus timer
│   │   ├── useSleepTimer.ts     # Sleep timer
│   │   └── use-toast.ts         # Toast notifications
│   ├── lib/                     # Utility libraries
│   │   ├── stations.ts          # Station configurations
│   │   ├── seo.ts               # SEO config and metadata/schema construction
│   │   ├── seo-content.ts       # SEO copy (e.g., FAQs)
│   │   └── utils.ts             # Utility functions
│   └── store/                   # State management
│       └── audioStore.ts        # Audio state
├── public/                      # Static assets
│   ├── logo.svg                 # Logo
│   └── manifest.json            # PWA configuration
├── scripts/                     # Build helper scripts
│   └── submit-indexnow.ts       # Manual IndexNow submission
├── package.json
├── Dockerfile
├── tailwind.config.ts
├── next.config.ts
└── LICENSE
```

---

## 🔄 Station Resource Maintenance

This project uses a "Base Source + Manually Curated Extensions" strategy for station resources:

- Base reference source: [labilio/lofi-radio](https://github.com/labilio/lofi-radio/blob/main/stations.json)
- Extension sources: Lofi Cafe, SomaFM, Code Radio, and other public streaming stations.

How to update:

1. Evaluate the availability and stability of a new station source.
2. Update the `stations` array in `src/lib/stations.ts`.
3. Synchronize the station list and total count in the README.
4. Submit the changes.

### SEO Related Files

- `src/lib/seo.ts`: Centrally manages metadata, Open Graph, Twitter, Schema, robots, and sitemap configurations.
- `src/lib/seo-content.ts`: Manages SEO-visible copy, such as home page FAQs.
- `src/app/robots.ts`: Generates `/robots.txt`.
- `src/app/sitemap.ts`: Generates `/sitemap.xml`.

---

## 💬 Feedback and Collaboration

To ensure your feedback is processed as quickly as possible, please choose the correct entry point based on the content:

- [💬 Discussions](https://github.com/88lin/lofi-radio-web/discussions):
  Usage questions, open discussions, idea exchanges, or issues where you're unsure if it's a bug.
- [🐛 Bug Report](https://github.com/88lin/lofi-radio-web/issues/new/choose):
  Reproducible functional anomalies, regressions, player or API failures.
- [🚀 Feature Request](https://github.com/88lin/lofi-radio-web/issues/new/choose):
  New features, interaction optimizations, or maintenance experience improvements.
- [🛠️ Deployment / Environment Issues](https://github.com/88lin/lofi-radio-web/issues/new/choose):
  Installation, build, deployment, environment variables, and platform compatibility issues.
- [📻 Station Suggestions / Content Maintenance](https://github.com/88lin/lofi-radio-web/issues/new/choose):
  Adding new stations, fixing dead links, or updating README / copy.

The repository uses structured Issue templates, PR templates, and an automated maintenance flow. The more complete your report, the faster it will be handled.

## 🤝 Contribution Guide

All forms of contribution are welcome, but please keep your changes focused and provide full context.

1. Fork this repository.
2. Create a branch, e.g., `fix/player-bug` or `feat/new-station-source`.
3. Complete the changes and perform local self-testing.
4. Push the branch and create a Pull Request.

Before submitting a PR, it is recommended to read [CONTRIBUTING.md](./CONTRIBUTING.md), which includes:

- Recommended submission flow for Issues / PRs.
- Local development and minimum verification commands.
- Precautions for station sources and content maintenance.
- Collaboration conventions friendly to new contributors.

---

## 📄 License

This project is open-sourced under the [MIT License](LICENSE).

- ✅ You are free to use, copy, modify, and distribute this project.
- 📝 Please retain the original author's copyright notice in derivative works.

---

## 🙏 Acknowledgments

- [labilio/lofi-radio](https://github.com/labilio/lofi-radio) - Provided rich station resources and creative inspiration.
- [Lofi Girl](https://www.youtube.com/c/LofiGirl) - Provided high-quality Lofi music streams.
- All station providers.

---

## 📮 Contact

If you have questions or suggestions, feel free to:

- [💬 Discussions](https://github.com/88lin/lofi-radio-web/discussions) - Participate in discussions and usage exchanges.
- [🐛 Submit Issue](https://github.com/88lin/lofi-radio-web/issues/new/choose) - Use the template to report problems or suggestions.
- [🤝 CONTRIBUTING](./CONTRIBUTING.md) - View collaboration standards and submission flow.
- [📝 Blog](https://blog.88lin.eu.org/) - Moling Knowledge Base.

---
## Star History

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/88lin/lofi-radio-web/star-history/assets/my-star-history/star-history-dark.svg">
  <img alt="Star History" src="https://raw.githubusercontent.com/88lin/lofi-radio-web/star-history/assets/my-star-history/star-history-light.svg">
</picture>

---

<div align="center">

**If this project helped you, please give it a ⭐ Star for support!**

Made with ❤️ by [Moling Knowledge Base](https://blog.88lin.eu.org/) · [GitHub](https://github.com/88lin)

</div>
