import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Song, RepeatMode } from '../types/music';
import { addToHistory } from '../lib/db';

interface PlayerContextType {
  currentSong: Song | null;
  queue: Song[];
  queueIndex: number;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  isFullPlayerOpen: boolean;
  isQueueOpen: boolean;
  isLyricsOpen: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  play: (song: Song, queue?: Song[], index?: number) => void;
  playQueue: (songs: Song[], index?: number) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  setFullPlayerOpen: (open: boolean) => void;
  setQueueOpen: (open: boolean) => void;
  setLyricsOpen: (open: boolean) => void;
  getFileForSong: (song: Song) => File | undefined;
  registerFileHandles: (map: Map<string, File>) => void;
}

const PlayerContext = createContext<PlayerContextType>({} as PlayerContextType);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [originalQueue, setOriginalQueue] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(() => parseFloat(localStorage.getItem('pp-volume') || '1'));
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [isFullPlayerOpen, setFullPlayerOpen] = useState(false);
  const [isQueueOpen, setQueueOpen] = useState(false);
  const [isLyricsOpen, setLyricsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileHandlesRef = useRef<Map<string, File>>(new Map());
  const progressIntervalRef = useRef<number | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    audio.addEventListener('ended', () => handleEnded());
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration || 0);
    });
    audio.addEventListener('error', () => {
      setIsPlaying(false);
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  function handleEnded() {
    if (repeatMode === 'one') {
      const audio = audioRef.current;
      if (audio) { audio.currentTime = 0; audio.play(); }
      return;
    }
    nextSong();
  }

  function startProgressTracking() {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = window.setInterval(() => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        setProgress(audio.currentTime);
      }
    }, 500);
  }

  function stopProgressTracking() {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }

  const loadAndPlay = useCallback(async (song: Song) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const file = fileHandlesRef.current.get(song.id);
    if (!file) {
      console.warn('No file handle for song:', song.title);
      return;
    }
    
    const url = URL.createObjectURL(file);
    audio.src = url;
    audio.volume = isMuted ? 0 : volume;
    
    setCurrentSong(song);
    setProgress(0);
    setDuration(0);
    
    try {
      await audio.play();
      setIsPlaying(true);
      startProgressTracking();
      addToHistory({ songId: song.id, playedAt: Date.now() });
    } catch {
      setIsPlaying(false);
    }
  }, [volume, isMuted]);

  const play = useCallback((song: Song, newQueue?: Song[], index?: number) => {
    const q = newQueue || [song];
    const idx = index ?? 0;
    setQueue(q);
    setOriginalQueue(q);
    setQueueIndex(idx);
    loadAndPlay(song);
  }, [loadAndPlay]);

  const playQueue = useCallback((songs: Song[], index = 0) => {
    setQueue(songs);
    setOriginalQueue(songs);
    setQueueIndex(index);
    if (songs[index]) loadAndPlay(songs[index]);
  }, [loadAndPlay]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    stopProgressTracking();
  }, []);

  const resume = useCallback(async () => {
    try {
      await audioRef.current?.play();
      setIsPlaying(true);
      startProgressTracking();
    } catch { /* ignore */ }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else resume();
  }, [isPlaying, pause, resume]);

  function nextSong() {
    setQueue(q => {
      setQueueIndex(idx => {
        let nextIdx = idx + 1;
        if (nextIdx >= q.length) {
          if (repeatMode === 'all') nextIdx = 0;
          else { setIsPlaying(false); stopProgressTracking(); return idx; }
        }
        const song = q[nextIdx];
        if (song) loadAndPlay(song);
        return nextIdx;
      });
      return q;
    });
  }

  const next = useCallback(() => nextSong(), [queue, queueIndex, repeatMode, loadAndPlay]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setProgress(0);
      return;
    }
    setQueueIndex(idx => {
      const prevIdx = Math.max(0, idx - 1);
      const song = queue[prevIdx];
      if (song) loadAndPlay(song);
      return prevIdx;
    });
  }, [queue, loadAndPlay]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) { audio.currentTime = time; setProgress(time); }
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    localStorage.setItem('pp-volume', String(v));
    if (audioRef.current && !isMuted) audioRef.current.volume = v;
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(m => {
      const next = !m;
      if (audioRef.current) audioRef.current.volume = next ? 0 : volume;
      return next;
    });
  }, [volume]);

  const toggleShuffle = useCallback(() => {
    setIsShuffled(s => {
      if (!s) {
        // Shuffle remaining songs after current
        setQueue(q => {
          const current = q[queueIndex];
          const rest = [...q.slice(queueIndex + 1)];
          for (let i = rest.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rest[i], rest[j]] = [rest[j], rest[i]];
          }
          return [...q.slice(0, queueIndex + 1), ...rest];
        });
      } else {
        setQueue(originalQueue);
        setQueueIndex(q => {
          const song = queue[q];
          if (song) {
            const idx = originalQueue.findIndex(s => s.id === song.id);
            return idx >= 0 ? idx : 0;
          }
          return 0;
        });
      }
      return !s;
    });
  }, [queue, queueIndex, originalQueue]);

  const cycleRepeat = useCallback(() => {
    setRepeatMode(m => m === 'none' ? 'all' : m === 'all' ? 'one' : 'none');
  }, []);

  const addToQueue = useCallback((song: Song) => {
    setQueue(q => [...q, song]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(q => q.filter((_, i) => i !== index));
    setQueueIndex(idx => index < idx ? idx - 1 : idx);
  }, []);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue(q => {
      const next = [...q];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setQueueIndex(0);
  }, []);

  const getFileForSong = useCallback((song: Song) => {
    return fileHandlesRef.current.get(song.id);
  }, []);

  const registerFileHandles = useCallback((map: Map<string, File>) => {
    for (const [k, v] of Array.from(map)) {
      fileHandlesRef.current.set(k, v);
    }
  }, []);

  return (
    <PlayerContext.Provider value={{
      currentSong, queue, queueIndex, isPlaying, progress, duration,
      volume, isMuted, isShuffled, repeatMode,
      isFullPlayerOpen, isQueueOpen, isLyricsOpen,
      play, playQueue, pause, resume, togglePlay, next, prev, seek,
      setVolume, toggleMute, toggleShuffle, cycleRepeat,
      addToQueue, removeFromQueue, reorderQueue, clearQueue,
      setFullPlayerOpen, setQueueOpen, setLyricsOpen,
      getFileForSong, registerFileHandles,
      audioRef,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
