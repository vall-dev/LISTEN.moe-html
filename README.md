# 🎵 Anime Radio — listen.moe Player

> A beautiful, premium anime music radio player powered by **listen.moe** — available 24/7 with live song metadata.

![Preview](https://img.shields.io/badge/Stream-LISTEN.moe-ff6b9d?style=for-the-badge&logo=radio&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-7c4dff?style=for-the-badge&logo=github&logoColor=white)

---

## ✨ Features

- 🎶 **Live Stream** — JPOP & KPOP stations from listen.moe
- 📡 **Real-time Metadata** — Song title, artist, album art via WebSocket API
- 🎨 **Glassmorphism UI** — Dark premium theme inspired by listen.moe
- 🌊 **Audio Visualizer** — Real-time frequency bars (Web Audio API)
- ❤️ **Favorites** — Save songs, stored in localStorage
- 🕘 **History** — Recently played tracks
- 📱 **Responsive** — Works on mobile & desktop
- 🌟 **Animated Background** — Album art blur background

## 🚀 Deploy to GitHub Pages

1. Fork or upload this repo to GitHub
2. Go to **Settings → Pages**
3. Source: **Deploy from a branch → main → / (root)**
4. Save — your site will be live at `https://yourusername.github.io/ANIME_RADIO/`

## 📁 Files

```
ANIME_RADIO/
├── index.html   ← Main HTML structure
├── style.css    ← Dark glassmorphism styles
├── app.js       ← Stream + WebSocket + Visualizer logic
├── mascot.png   ← Anime mascot character
└── README.md    ← This file
```

## 🎙️ Stream Sources

| Station | Stream URL | WebSocket |
|---------|-----------|-----------|
| JPOP | `https://listen.moe/stream` | `wss://listen.moe/gateway_v2` |
| KPOP | `https://listen.moe/kpop/stream` | `wss://listen.moe/kpop/gateway_v2` |

## 🛠️ Tech Stack

- Pure HTML + CSS + Vanilla JavaScript
- [listen.moe](https://listen.moe) public API
- Web Audio API for visualizer
- Google Fonts: Inter + Noto Sans JP
- FontAwesome icons

---

<p align="center">Made with ❤️ for anime music lovers</p>
