# Pixel Player

A feature-rich web music player that lets users play their local audio files directly in the browser — no uploads, no backend, all private. Built with React, Vite, and TailwindCSS.

🎵 **Live Demo:** [GitHub Pages](https://demonCodes-tech.github.io/Pixel-Player/)

## Features

- **Local File Playback** — Play MP3, FLAC, AAC, OGG, WAV, M4A, OPUS, WMA, AIFF audio files directly from your device
- **No Backend Required** — Everything runs in the browser; your music never leaves your device
- **Library Management** — Browse music by Songs, Albums, Artists, Genres, Folders, or Playlists
- **Full-Featured Player** — Shuffle, repeat (none/all/one), seek, volume control, and queue management
- **Mini Player** — Persistent player bar while browsing your library
- **Synced Lyrics** — Fetch and display synced (LRC) and plain lyrics from LRCLIB
- **Pixel-Art Visualizer** — Dynamic audio visualizer with real-time frequency response
- **Dark/Light Theme** — Toggle between dark and light modes (or follow system preference)
- **Persistent Storage** — Library data stored in IndexedDB; survives page reloads
- **Playlist Management** — Create, edit, and manage custom playlists

## Tech Stack

- **Frontend:** React 19 + Vite + TypeScript
- **Styling:** TailwindCSS 4 + shadcn/ui
- **Routing:** Wouter (client-side)
- **State Management:** React Context (PlayerContext, LibraryContext, ThemeContext)
- **Persistence:** IndexedDB via `idb`
- **Metadata:** `music-metadata-browser`
- **Audio Analysis:** Web Audio API (for visualizer)
- **Lyrics:** LRCLIB API (free, no auth required)

## Getting Started

### Prerequisites

- Node.js 22+ and pnpm 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/DemonCodes-tech/Pixel-Player.git
cd Pixel-Player

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

The app will be available at `http://localhost:3000/`

### Building for Production

```bash
# Build the project
pnpm run build

# Preview the production build
pnpm run preview
```

## Project Structure

```
client/src/
  App.tsx                        — Router + context providers
  contexts/
    PlayerContext.tsx            — Audio playback state & controls
    LibraryContext.tsx           — Music library management (IndexedDB)
    ThemeContext.tsx             — Dark/light/system theme
  pages/
    Home.tsx                     — Home screen with quick actions
    Library.tsx                  — Tabbed library view
    Search.tsx                   — Search across songs/albums/artists
    Settings.tsx                 — Library stats, import, appearance
    AlbumDetail.tsx              — Album track listing
    ArtistDetail.tsx             — Artist albums + play all
    PlaylistDetail.tsx           — Playlist management
  components/
    layout/Layout.tsx            — Main shell (MiniPlayer + BottomNav)
    layout/BottomNav.tsx         — Navigation tabs
    player/FullPlayer.tsx        — Full-screen player with album art
    player/MiniPlayer.tsx        — Persistent mini player bar
    player/AudioVisualizer.tsx   — Pixel-art audio visualizer
    player/QueueSheet.tsx        — Full-screen queue list
    player/LyricsPanel.tsx       — Synced/plain lyrics display
  lib/
    db.ts                        — IndexedDB helpers
    metadata.ts                  — Audio metadata parsing + color extraction
  types/music.ts                 — Song, Album, Artist, Playlist types
  index.css                      — Global styles (dark/light theme)
```

## How It Works

### Music Import

Users can import music via two methods:

1. **File System Access API** (Chrome/Edge/Opera) — Select a folder and import all audio files recursively
2. **File Input Fallback** (all browsers) — Select individual files or multiple files at once

### Metadata Extraction

The app uses `music-metadata-browser` to parse audio metadata (title, artist, album, duration, cover art) without uploading files anywhere.

### Persistence

- **Library Data:** Parsed metadata + album art stored in IndexedDB
- **Playback State:** Current song, queue, progress, volume, theme preference
- **File Handles:** Browser keeps file handles for re-access each session (no re-selection needed)

### Lyrics

Synced lyrics are fetched from [LRCLIB](https://lrclib.net/) — a free, community-driven lyrics database. No authentication required.

### Audio Visualizer

The visualizer uses the Web Audio API to analyze frequency data in real-time:

- **128 Frequency Bins** — Analyzes audio spectrum
- **32 Animated Bars** — Each bar represents a frequency band
- **Rainbow Gradient** — Colors shift across the spectrum
- **Glow Effect** — Peak frequencies glow brighter
- **Smooth Transitions** — 0.85 smoothing constant for natural motion

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Playback | ✓ | ✓ | ✓ | ✓ |
| File System Access API | ✓ | ✗ | ✗ | ✓ |
| Web Audio API | ✓ | ✓ | ✓ | ✓ |
| IndexedDB | ✓ | ✓ | ✓ | ✓ |

*Note: Firefox and Safari fall back to file input for music import.*

## Deployment

### GitHub Pages

This project is configured for automatic deployment to GitHub Pages via GitHub Actions:

1. Push to `main` branch
2. GitHub Actions builds the project
3. Automatically deployed to `https://demonCodes-tech.github.io/Pixel-Player/`

### Manus WebDev

The project is also deployed on Manus WebDev at:
- **URL:** https://pixelplay-mfcdvczg.manus.space

## Architecture Decisions

- **Pure Frontend** — No backend required; all processing happens in the browser
- **IndexedDB for Persistence** — Survives page reloads; no server-side storage
- **Web Audio API** — Native browser API for audio analysis and visualization
- **LRCLIB for Lyrics** — Free, community-driven lyrics database (no auth)
- **Blob URLs for Album Art** — Embedded cover art served as blob URLs to avoid re-parsing

## Known Limitations

- `music-metadata-browser` is deprecated but still functional for browser use
- File System Access API not supported in Firefox/Safari (uses file input fallback)
- Album art Blob URLs are session-specific; regenerated on each page load
- No cloud sync; library data stored locally only

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT

## Credits

- **Music Metadata:** [music-metadata-browser](https://github.com/Borewit/music-metadata-browser)
- **Lyrics:** [LRCLIB](https://lrclib.net/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Styling:** [TailwindCSS](https://tailwindcss.com/)

---

**Enjoy your music! 🎵**
