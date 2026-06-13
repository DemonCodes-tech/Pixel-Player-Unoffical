import { openDB, IDBPDatabase } from 'idb';
import { Song, Playlist, PlaybackHistory } from '../types/music';

const DB_NAME = 'pixel-player';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('songs')) {
          const songStore = db.createObjectStore('songs', { keyPath: 'id' });
          songStore.createIndex('album', 'album');
          songStore.createIndex('artist', 'artist');
          songStore.createIndex('genre', 'genre');
          songStore.createIndex('folder', 'folder');
        }
        if (!db.objectStoreNames.contains('playlists')) {
          db.createObjectStore('playlists', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('history')) {
          const histStore = db.createObjectStore('history', { autoIncrement: true });
          histStore.createIndex('songId', 'songId');
          histStore.createIndex('playedAt', 'playedAt');
        }
        if (!db.objectStoreNames.contains('albumArt')) {
          db.createObjectStore('albumArt', { keyPath: 'songId' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

// Songs
export async function addSongs(songs: Song[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('songs', 'readwrite');
  for (const song of songs) {
    await tx.store.put(song);
  }
  await tx.done;
}

export async function getAllSongs(): Promise<Song[]> {
  const db = await getDb();
  return db.getAll('songs');
}

export async function deleteSong(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('songs', id);
}

export async function clearAllSongs(): Promise<void> {
  const db = await getDb();
  await db.clear('songs');
  await db.clear('albumArt');
}

// Album art blobs
export async function storeAlbumArt(songId: string, blob: Blob): Promise<void> {
  const db = await getDb();
  await db.put('albumArt', { songId, blob });
}

export async function getAlbumArt(songId: string): Promise<string | null> {
  const db = await getDb();
  const record = await db.get('albumArt', songId);
  if (!record) return null;
  return URL.createObjectURL(record.blob);
}

// Playlists
export async function savePlaylists(playlists: Playlist[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('playlists', 'readwrite');
  await tx.store.clear();
  for (const pl of playlists) {
    await tx.store.put(pl);
  }
  await tx.done;
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  const db = await getDb();
  return db.getAll('playlists');
}

// Playback history
export async function addToHistory(entry: PlaybackHistory): Promise<void> {
  const db = await getDb();
  await db.add('history', entry);
  const tx = db.transaction('history', 'readwrite');
  const count = await tx.store.count();
  if (count > 500) {
    const cursor = await tx.store.openCursor();
    if (cursor) await cursor.delete();
  }
  await tx.done;
}

export async function getHistory(limit = 50): Promise<PlaybackHistory[]> {
  const db = await getDb();
  const all = await db.getAllFromIndex('history', 'playedAt');
  return all.reverse().slice(0, limit);
}

export async function clearHistory(): Promise<void> {
  const db = await getDb();
  await db.clear('history');
}

// Generic settings key/value store
export async function saveSetting(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  await db.put('settings', value, key);
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const db = await getDb();
  const val = await db.get('settings', key);
  return (val ?? null) as T | null;
}

export async function deleteSetting(key: string): Promise<void> {
  const db = await getDb();
  await db.delete('settings', key);
}
