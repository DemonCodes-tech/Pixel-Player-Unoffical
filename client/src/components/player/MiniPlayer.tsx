import { usePlayer } from '@/contexts/PlayerContext';
import { formatDuration } from '@/lib/metadata';
import { Play, Pause, SkipForward, Music2 } from 'lucide-react';

export default function MiniPlayer() {
  const {
    currentSong, isPlaying, progress, duration,
    togglePlay, next, setFullPlayerOpen, seek,
  } = usePlayer();

  if (!currentSong) return null;

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div
      className="fixed left-0 right-0 z-30 mx-3 rounded-[28px] overflow-hidden shadow-xl"
      style={{
        bottom: 'calc(5rem + 6px)',
        background: 'var(--surface-container-highest)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
      }}
    >
      {/* Thin progress line */}
      <div className="relative h-0.5" style={{ background: 'var(--surface-container-high)' }}>
        <div
          className="absolute left-0 top-0 h-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range" min={0} max={duration || 100} value={progress}
          onChange={e => seek(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onClick={e => e.stopPropagation()}
        />
      </div>

      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer m3-ripple"
        onClick={() => setFullPlayerOpen(true)}
        data-testid="mini-player"
      >
        {/* Artwork */}
        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0" style={{ background: 'var(--primary-container)' }}>
          {currentSong.albumArtUrl
            ? <img src={currentSong.albumArtUrl} alt="cover" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center">
                <Music2 size={18} style={{ color: 'var(--on-primary-container)' }} />
              </div>}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="m3-title-small text-foreground truncate">{currentSong.title}</p>
          <p className="m3-body-small text-muted-foreground truncate">{currentSong.artist}</p>
        </div>

        {/* Time */}
        <span className="m3-label-small text-muted-foreground tabular-nums shrink-0">
          {formatDuration(progress)}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center m3-ripple hover:opacity-90 transition"
            data-testid="mini-player-play"
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>
          <button
            onClick={next}
            className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground m3-ripple transition"
            data-testid="mini-player-next"
          >
            <SkipForward size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
