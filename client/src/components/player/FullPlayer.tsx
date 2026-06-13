import { useState, useEffect } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { formatDuration, extractDominantColor } from '@/lib/metadata';
import {
  ChevronDown, Heart, ListMusic, Shuffle, SkipBack, Play, Pause,
  SkipForward, Repeat, Repeat1, Volume2, VolumeX, FileText, Music2,
} from 'lucide-react';
import LyricsPanel from './LyricsPanel';
import { AudioVisualizer } from './AudioVisualizer';
import { useLibrary } from '@/contexts/LibraryContext';
import { Slider } from '@/components/ui/slider';

export default function FullPlayer() {
  const {
    currentSong, isPlaying, progress, duration, volume, isMuted,
    isShuffled, repeatMode, isLyricsOpen,
    togglePlay, next, prev, seek, setVolume, toggleMute,
    toggleShuffle, cycleRepeat, setFullPlayerOpen, setQueueOpen, setLyricsOpen,
    audioRef,
  } = usePlayer();
  const { favorites, toggleFavorite } = useLibrary();
  const [bgColor, setBgColor] = useState('hsl(264, 43%, 15%)');
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  useEffect(() => {
    if (currentSong?.albumArtUrl) {
      extractDominantColor(currentSong.albumArtUrl).then(setBgColor);
    } else {
      setBgColor('hsl(264, 43%, 15%)');
    }
  }, [currentSong?.albumArtUrl]);

  if (!currentSong) return null;

  const isFav = favorites.has(currentSong.id);
  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: `linear-gradient(180deg, ${bgColor} 0%, hsl(264, 14%, 7%) 55%)`,
      }}
      onTouchStart={e => setTouchStartY(e.touches[0].clientY)}
      onTouchEnd={e => {
        if (touchStartY !== null && e.changedTouches[0].clientY - touchStartY > 80)
          setFullPlayerOpen(false);
        setTouchStartY(null);
      }}
      data-testid="full-player"
    >
      {/* Top app bar */}
      <div className="flex items-center justify-between px-2 pt-4 pb-2 shrink-0">
        <button
          onClick={() => setFullPlayerOpen(false)}
          className="w-12 h-12 flex items-center justify-center text-white/70 hover:text-white rounded-full m3-ripple"
          data-testid="full-player-close"
        >
          <ChevronDown size={26} />
        </button>
        <div className="text-center">
          <p className="m3-label-medium text-white/60 uppercase tracking-[0.12em]">Now Playing</p>
        </div>
        <div className="w-12" />
      </div>

      {/* Audio Visualizer */}
      <div className="px-6 py-4 shrink-0">
        <AudioVisualizer
          audioRef={audioRef}
          isPlaying={isPlaying}
          barCount={32}
          height={100}
        />
      </div>

      {/* Album art — fills available vertical space */}
      <div className="flex-1 flex items-center justify-center px-8 py-2 min-h-0">
        <div
          className={`w-full max-w-[320px] aspect-square rounded-[28px] overflow-hidden transition-all duration-500 ${
            isPlaying ? 'scale-100' : 'scale-92 opacity-85'
          }`}
          style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.7)' }}
        >
          {currentSong.albumArtUrl
            ? <img src={currentSong.albumArtUrl} alt="album" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--primary-container)' }}>
                <Music2 size={72} style={{ color: 'var(--on-primary-container)' }} />
              </div>}
        </div>
      </div>

      {/* Song info + heart */}
      <div className="flex items-center justify-between px-6 pb-2 shrink-0">
        <div className="flex-1 min-w-0 mr-4">
          <h2 className="m3-headline-small text-white truncate">{currentSong.title}</h2>
          <p className="m3-body-medium text-white/70 truncate mt-0.5">{currentSong.artist}</p>
          <p className="m3-body-small text-white/40 truncate">{currentSong.album}</p>
        </div>
        <button
          onClick={() => toggleFavorite(currentSong.id)}
          className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center m3-ripple transition-all ${
            isFav ? 'text-[#F2B8B5]' : 'text-white/50 hover:text-white/80'
          }`}
          data-testid="full-player-favorite"
        >
          <Heart size={22} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Seek bar */}
      <div className="px-6 pb-1 shrink-0">
        <div className="relative h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
          <div
            className="absolute left-0 top-0 h-full bg-white rounded-full"
            style={{ width: `${pct}%` }}
          />
          <input
            type="range" min={0} max={duration || 100} value={progress}
            onChange={e => seek(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="m3-label-small text-white/50 tabular-nums">{formatDuration(progress)}</span>
          <span className="m3-label-small text-white/50 tabular-nums">-{formatDuration(Math.max(0, duration - progress))}</span>
        </div>
      </div>

      {/* Main transport */}
      <div className="flex items-center justify-between px-8 py-3 shrink-0">
        <button
          onClick={toggleShuffle}
          className={`w-11 h-11 flex items-center justify-center rounded-full m3-ripple transition-colors ${
            isShuffled ? 'text-primary' : 'text-white/50'
          }`}
        ><Shuffle size={22} /></button>

        <button
          onClick={prev}
          className="w-12 h-12 flex items-center justify-center text-white hover:opacity-80 m3-ripple rounded-full"
        ><SkipBack size={30} fill="currentColor" /></button>

        <button
          onClick={togglePlay}
          className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform"
          data-testid="full-player-play"
        >
          {isPlaying
            ? <Pause size={30} className="text-gray-900" fill="currentColor" />
            : <Play size={30} className="text-gray-900 ml-1" fill="currentColor" />}
        </button>

        <button
          onClick={next}
          className="w-12 h-12 flex items-center justify-center text-white hover:opacity-80 m3-ripple rounded-full"
        ><SkipForward size={30} fill="currentColor" /></button>

        <button
          onClick={cycleRepeat}
          className={`w-11 h-11 flex items-center justify-center rounded-full m3-ripple transition-colors ${
            repeatMode !== 'none' ? 'text-primary' : 'text-white/50'
          }`}
        >
          {repeatMode === 'one' ? <Repeat1 size={22} /> : <Repeat size={22} />}
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3 px-6 pb-3 shrink-0">
        <button onClick={toggleMute} className="text-white/50 hover:text-white w-9 h-9 flex items-center justify-center rounded-full m3-ripple">
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <Slider
          min={0} max={1} step={0.01}
          value={[isMuted ? 0 : volume]}
          onValueChange={([v]) => setVolume(v)}
          className="flex-1"
        />
      </div>

      {/* Secondary actions row */}
      <div
        className="flex items-center justify-around px-6 py-3 shrink-0 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
      >
        <button
          onClick={() => setLyricsOpen(!isLyricsOpen)}
          className={`flex flex-col items-center gap-1 px-5 py-2 rounded-full m3-ripple transition-colors ${
            isLyricsOpen ? 'text-primary' : 'text-white/50 hover:text-white/80'
          }`}
          data-testid="full-player-lyrics"
        >
          <FileText size={20} />
          <span className="m3-label-small">Lyrics</span>
        </button>
        <button
          onClick={() => { setQueueOpen(true); setFullPlayerOpen(false); }}
          className="flex flex-col items-center gap-1 px-5 py-2 rounded-full m3-ripple text-white/50 hover:text-white/80 transition-colors"
          data-testid="full-player-queue"
        >
          <ListMusic size={20} />
          <span className="m3-label-small">Queue</span>
        </button>
      </div>

      {isLyricsOpen && <LyricsPanel />}
    </div>
  );
}
