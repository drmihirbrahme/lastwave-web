# LastWave Web / iOS PWA

> **Next-Gen YouTube Music Client with Algorithmic Smart Playlist Generator, Real-Time Synced Lyrics & Last.fm Scrobbler for iOS, Web & Desktop.**

An open-source web application and Progressive Web App (PWA) port inspired by [Clash-Projects/LastWave-native](https://github.com/Clash-Projects/LastWave-native).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdrmihirbrahme%2Flastwave-web)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/drmihirbrahme/lastwave-web)

---

## ✨ Features

- **Ad-Free YouTube Music Streaming:** Instant search, high-efficiency Opus/AAC audio streams, auto-advance queues, and shuffle/repeat.
- **Continuous iOS Background Audio:** HTML5 audio engine with uninterrupted background playback when locking your screen or switching apps.
- **Lock Screen, Control Center & Dynamic Island Controls:** Powered by the Web **Media Session API** (`navigator.mediaSession`) with real-time scrub bar and track metadata.
- **Real-Time Millisecond Synced Lyrics:** Powered by [LRCLIB](https://lrclib.net) with dynamic line highlighting, auto-scroll, and tap-to-seek karaoke physics.
- **Algorithmic Smart Playlist Generator:** Synthesizes custom mood and genre radios (Energetic, Chill, Deep Focus, Melancholic, Workout, Discovery).
- **In-App Last.fm Scrobbler & Taste Radar:** Real-time "Now Playing" updates, automatic scrobbling at 50% song completion, recent scrobbles, top artists, and friends feed.
- **Cross-Platform Playlist Importer:** Import playlists from public Spotify or Apple Music links and match them directly on YouTube Music.
- **Dynamic Ambient Album Glow:** Extracts dynamic color palettes from album artwork to tint the interface.
- **Offline Mode (IndexedDB):** Automatically caches tracks and playlists locally for offline, zero-data playback.
- **iOS Standalone PWA:** Install directly to your iPhone Home Screen with no address bars, full viewport safe area support, and tactile responsive design.

---

## ⚡ 1-Click Deployment (Vercel)

Click the button below to deploy your own instance of LastWave Web directly to Vercel for free:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdrmihirbrahme%2Flastwave-web)

Or visit: **[Deploy on Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdrmihirbrahme%2Flastwave-web)**

---

## 🚀 Quick Start (Local Run)

```bash
cd lastwave-web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing on your iPhone / iPad locally:
1. Ensure your iPhone is connected to the same Wi-Fi as your computer.
2. Run `npm run dev -- -H 0.0.0.0`
3. On your iPhone Safari, open `http://<YOUR_LOCAL_IP>:3000` (e.g. `http://192.168.1.50:3000`).

---

## 📱 How to Install as an App on iOS

1. Open your deployed URL (or local network URL) in **Safari** on your iPhone.
2. Tap the **Share** button (the box with an upward arrow at the bottom).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add**. LastWave will now launch as a standalone, full-screen iOS app!
