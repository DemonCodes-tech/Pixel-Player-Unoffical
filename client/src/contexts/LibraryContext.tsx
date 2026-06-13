import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Song, Album, Artist, Playlist, LibraryStats } from '../types/music';
import { addSongs, getAllSongs, clearAllSongs, getAllPlaylists, savePlaylists } from '../lib/db';
import { parseSongMetadata, isAudioFile } from '../lib/metadata';
import { v4 as uuidv4 } from 'uuid';

interface LibraryContextType {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  stats: LibraryStats;
  isLoading: boolean;
  loadingProgress: number;
  loadFiles: (files: FileList) => Promise<void>;
  loadDirectory: () => Promise<void>;
  openFilePicker: () => void;
  clearLibrary: () => Promise<void>;
  createPlaylist: (name: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, songId: string) => void;
  removeFromPlaylist: (playlistId: string, songId: string) => void;
  reorderPlaylist: (playlistId: string, songIds: string[]) => void;
  getSongById: (id: string) => Song | undefined;
  searchSongs: (query: string) => Song[];
  favorites: Set<string>;
  toggleFavorite: (songId: string) => void;
  fileHandles: Map<string, File>;
}

const LibraryContext = createContext<LibraryContextType>({} as LibraryContextType);

function buildAlbums(songs: Song[]): Album[] {
  const map = new Map<string, Album>();
  for (const song of songs) {
    const key = `${song.album}__${song.albumArtist || song.artist}`;
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        name: song.album,
        artist: song.albumArtist || song.artist,
        year: song.year,
        genre: song.genre,
        songCount: 0,
        coverUrl: song.albumArtUrl,
      });
    }
    const album = map.get(key)!;
    album.songCount++;
    if (!album.coverUrl && song.albumArtUrl) album.coverUrl = song.albumArtUrl;
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function buildArtists(songs: Song[]): Artist[] {
  const map = new Map<string, Artist>();
  const albumsByArtist = new Map<string, Set<string>>();
  for (const song of songs) {
    const name = song.albumArtist || song.artist;
    if (!map.has(name)) {
      map.set(name, { id: name, name, albumCount: 0, songCount: 0, imageUrl: null });
      albumsByArtist.set(name, new Set());
    }
    map.get(name)!.songCount++;
    albumsByArtist.get(name)!.add(song.album);
  }
  for (const [name, albums] of albumsByArtist) {
    map.get(name)!.albumCount = albums.size;
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function buildStats(songs: Song[]): LibraryStats {
  const genreCount = new Map<string, number>();
  let totalDuration = 0;
  const albumSet = new Set<string>();
  const artistSet = new Set<string>();
  for (const s of songs) {
    totalDuration += s.duration;
    genreCount.set(s.genre, (genreCount.get(s.genre) || 0) + 1);
    albumSet.add(`${s.album}__${s.albumArtist}`);
    artistSet.add(s.albumArtist || s.artist);
  }
  let topGenre: string | null = null;
  let topCount = 0;
  for (const [genre, count] of genreCount) {
    if (count > topCount && genre !== 'Unknown') { topGenre = genre; topCount = count; }
  }
  return {
    totalSongs: songs.length,
    totalDuration,
    topGenre,
    totalAlbums: albumSet.size,
    totalArtists: artistSet.size,
  };
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [stats, setStats] = useState<LibraryStats>({ totalSongs: 0, totalDuration: 0, topGenre: null, totalAlbums: 0, totalArtists: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('pp-favorites') || '[]')); } catch { return new Set(); }
  });
  const fileHandlesRef = useRef<Map<string, File>>(new Map());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load library from IndexedDB on mount
  useEffect(() => {
    (async () => {
      const dbSongs = await getAllSongs();
      const dbPlaylists = await getAllPlaylists();
      if (dbSongs.length > 0) {
        setSongs(dbSongs);
        setAlbums(buildAlbums(dbSongs));
        setArtists(buildArtists(dbSongs));
        setStats(buildStats(dbSongs));
      }
      if (dbPlaylists.length > 0) setPlaylists(dbPlaylists);
    })();
  }, []);

  const updateLibrary = useCallback((newSongs: Song[]) => {
    setSongs(newSongs);
    setAlbums(buildAlbums(newSongs));
    setArtists(buildArtists(newSongs));
    setStats(buildStats(newSongs));
  }, []);

  const loadFiles = useCallback(async (files: FileList) => {
    const audioFiles = Array.from(files).filter(isAudioFile);
    if (audioFiles.length === 0) return;
    setIsLoading(true);
    setLoadingProgress(0);
    const parsed: Song[] = [];
    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      try {
        const song = await parseSongMetadata(file);
        fileHandlesRef.current.set(song.id, file);
        parsed.push(song);
      } catch { /* skip bad files */ }
      setLoadingProgress(Math.round(((i + 1) / audioFiles.length) * 100));
    }
    await addSongs(parsed);
    const allSongs = await getAllSongs();
    updateLibrary(allSongs);
    setIsLoading(false);
  }, [updateLibrary]);

  const loadDirectory = useCallback(async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as Window & { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();
        const files: File[] = [];
        const collectFiles = async (handle: FileSystemDirectoryHandle) => {
          for await (const entry of (handle as unknown as { values(): AsyncIterable<FileSystemHandle> }).values()) {
            if (entry.kind === 'file') {
              const fh = entry as FileSystemFileHandle;
              const file = await fh.getFile();
              if (isAudioFile(file)) files.push(file);
            } else if (entry.kind === 'directory') {
              await collectFiles(entry as FileSystemDirectoryHandle);
            }
          }
        }
        await collectFiles(dirHandle);
        const dt = new DataTransfer();
        files.forEach(f => dt.items.add(f));
        await loadFiles(dt.files);
      } catch {
        // user cancelled
      }
    } else {
      openFilePicker();
    }
  }, [loadFiles]);

  const openFilePicker = useCallback(() => {
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'audio/*,.mp3,.flac,.aac,.ogg,.wav,.m4a,.opus,.wma,.aiff';
      (input as HTMLInputElement & { webkitdirectory?: boolean }).webkitdirectory = false;
      input.onchange = async (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files) await loadFiles(files);
      };
      fileInputRef.current = input;
    }
    fileInputRef.current.click();
  }, [loadFiles]);

  const clearLibrary = useCallback(async () => {
    await clearAllSongs();
    setSongs([]);
    setAlbums([]);
    setArtists([]);
    setStats({ totalSongs: 0, totalDuration: 0, topGenre: null, totalAlbums: 0, totalArtists: 0 });
    fileHandlesRef.current.clear();
  }, []);

  const createPlaylist = useCallback((name: string) => {
    const pl: Playlist = { id: uuidv4(), name, songIds: [], createdAt: Date.now(), updatedAt: Date.now() };
    setPlaylists(prev => {
      const next = [...prev, pl];
      savePlaylists(next);
      return next;
    });
  }, []);

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists(prev => {
      const next = prev.filter(p => p.id !== id);
      savePlaylists(next);
      return next;
    });
  }, []);

  const addToPlaylist = useCallback((playlistId: string, songId: string) => {
    setPlaylists(prev => {
      const next = prev.map(p => p.id === playlistId ? { ...p, songIds: [...p.songIds, songId], updatedAt: Date.now() } : p);
      savePlaylists(next);
      return next;
    });
  }, []);

  const removeFromPlaylist = useCallback((playlistId: string, songId: string) => {
    setPlaylists(prev => {
      const next = prev.map(p => p.id === playlistId ? { ...p, songIds: p.songIds.filter(id => id !== songId), updatedAt: Date.now() } : p);
      savePlaylists(next);
      return next;
    });
  }, []);

  const reorderPlaylist = useCallback((playlistId: string, songIds: string[]) => {
    setPlaylists(prev => {
      const next = prev.map(p => p.id === playlistId ? { ...p, songIds, updatedAt: Date.now() } : p);
      savePlaylists(next);
      return next;
    });
  }, []);

  const getSongById = useCallback((id: string) => songs.find(s => s.id === id), [songs]);

  const searchSongs = useCallback((query: string) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return songs.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      s.album.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [songs]);

  const toggleFavorite = useCallback((songId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      localStorage.setItem('pp-favorites', JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  return (
    <LibraryContext.Provider value={{
      songs, albums, artists, playlists, stats, isLoading, loadingProgress,
      loadFiles, loadDirectory, openFilePicker, clearLibrary,
      createPlaylist, deletePlaylist, addToPlaylist, removeFromPlaylist, reorderPlaylist,
      getSongById, searchSongs, favorites, toggleFavorite,
      fileHandles: fileHandlesRef.current,
    }}>
      {children}
    </LibraryContext.Provider>
  );
}

export const useLibrary = () => useContext(LibraryContext);
