import { parseBlob } from 'music-metadata-browser';
import { Song } from '../types/music';
import { storeAlbumArt } from './db';

export async function parseSongMetadata(file: File): Promise<Song> {
  const id = `${file.name}-${file.size}-${file.lastModified}`;
  
  let title = file.name.replace(/\.[^/.]+$/, '');
  let artist = 'Unknown Artist';
  let albumArtist = 'Unknown Artist';
  let album = 'Unknown Album';
  let genre = 'Unknown';
  let year: number | null = null;
  let duration = 0;
  let track: number | null = null;
  let disc: number | null = null;
  let albumArtUrl: string | null = null;

  try {
    const metadata = await parseBlob(file, {
      skipCovers: false,
      duration: true,
    });
    
    const tags = metadata.common;
    const format = metadata.format;
    
    if (tags.title) title = tags.title;
    if (tags.artist) artist = tags.artist;
    if (tags.albumartist) albumArtist = tags.albumartist;
    if (tags.album) album = tags.album;
    if (tags.genre && tags.genre.length > 0) genre = tags.genre[0];
    if (tags.year) year = tags.year;
    if (format.duration) duration = format.duration;
    if (tags.track?.no) track = tags.track.no;
    if (tags.disk?.no) disc = tags.disk.no;
    
    // Store album art
    if (tags.picture && tags.picture.length > 0) {
      const pic = tags.picture[0];
      const blob = new Blob([new Uint8Array(pic.data.buffer as ArrayBuffer)], { type: pic.format });
      await storeAlbumArt(id, blob);
      albumArtUrl = URL.createObjectURL(blob);
    }
  } catch {
    // Use filename as title if parsing fails
  }

  // Extract folder from file path (webkitRelativePath)
  const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
  const pathParts = relativePath.split('/');
  const folder = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '/';

  return {
    id,
    title,
    artist,
    albumArtist,
    album,
    genre,
    year,
    duration,
    track,
    disc,
    filePath: relativePath,
    fileName: file.name,
    folder,
    albumArtUrl,
    addedAt: Date.now(),
  };
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatTotalDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// Extract dominant color from image URL using canvas
export function extractDominantColor(imgUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 50;
      canvas.height = 50;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve('hsl(264, 80%, 20%)'); return; }
      ctx.drawImage(img, 0, 0, 50, 50);
      const data = ctx.getImageData(0, 0, 50, 50).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 16) {
        r += data[i]; g += data[i+1]; b += data[i+2]; count++;
      }
      r = Math.round(r/count); g = Math.round(g/count); b = Math.round(b/count);
      // Convert to HSL for a darker, more saturated version
      const max = Math.max(r, g, b) / 255;
      const min = Math.min(r, g, b) / 255;
      const l = (max + min) / 2;
      let h = 0, s = 0;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        const rn = r/255, gn = g/255, bn = b/255;
        const maxV = Math.max(rn, gn, bn);
        if (maxV === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        else if (maxV === gn) h = ((bn - rn) / d + 2) / 6;
        else h = ((rn - gn) / d + 4) / 6;
      }
      const hDeg = Math.round(h * 360);
      const sPct = Math.round(Math.min(s * 150, 80)); // boost saturation
      const lPct = Math.round(Math.max(l * 30, 12)); // keep dark
      resolve(`hsl(${hDeg}, ${sPct}%, ${lPct}%)`);
    };
    img.onerror = () => resolve('hsl(264, 80%, 15%)');
    img.src = imgUrl;
  });
}

export function isAudioFile(file: File): boolean {
  const audioExts = ['.mp3', '.flac', '.aac', '.ogg', '.wav', '.m4a', '.opus', '.wma', '.aiff', '.aif'];
  const name = file.name.toLowerCase();
  return audioExts.some(ext => name.endsWith(ext)) || file.type.startsWith('audio/');
}
