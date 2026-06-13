import { useParams } from 'wouter';
import { useLibrary } from '@/contexts/LibraryContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { formatDuration, formatTotalDuration } from '@/lib/metadata';
import { ChevronLeft, Play, Shuffle, X, Music2, ListMusic } from 'lucide-react';
import { Link } from 'wouter';

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const { playlists, songs, removeFromPlaylist } = useLibrary();
  const { playQueue } = usePlayer();

  const playlist = playlists.find(p => p.id === id);
  const playlistSongs = (playlist?.songIds || [])
    .map(sid => songs.find(s => s.id === sid))
    .filter(Boolean) as import('@/types/music').Song[];

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <ListMusic size={40} className="opacity-30" />
        <p className="m3-body-large">Playlist not found</p>
        <Link href="/library?tab=playlists">
          <span className="m3-label-large text-primary">Back to library</span>
        </Link>
      </div>
    );
  }

  const totalDuration = playlistSongs.reduce((sum, s) => sum + s.duration, 0);
  const cover = playlistSongs.find(s => s.albumArtUrl)?.albumArtUrl;

  return (
    <div data-testid="playlist-detail-page">
      {/* Hero */}
      <div className="relative">
        <div className="w-full aspect-square max-h-52 overflow-hidden" style={{ background: 'var(--surface-container-high)' }}>
          {cover
            ? <img src={cover} alt={playlist.name} className="w-full h-full object-cover blur-sm scale-110" />
            : <div className="w-full h-full flex items-center justify-center">
                <ListMusic size={64} className="text-muted-foreground opacity-20" />
              </div>}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, var(--background) 100%)' }} />
        </div>

        <Link href="/library?tab=playlists">
          <button className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center text-white m3-ripple" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
            <ChevronLeft size={22} />
          </button>
        </Link>
      </div>

      {/* Info */}
      <div className="px-4 pt-1 pb-4">
        <h1 className="m3-headline-small text-foreground">{playlist.name}</h1>
        <p className="m3-body-small text-muted-foreground mt-0.5">
          {playlistSongs.length} songs{totalDuration > 0 ? ` · ${formatTotalDuration(totalDuration)}` : ''}
        </p>
      </div>

      {/* Actions */}
      {playlistSongs.length > 0 && (
        <div className="flex gap-3 px-4 mb-4">
          <button
            onClick={() => playQueue(playlistSongs, 0)}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-full bg-primary text-primary-foreground m3-label-large m3-ripple"
            data-testid="playlist-play"
          >
            <Play size={18} fill="currentColor" />
            Play
          </button>
          <button
            onClick={() => playQueue([...playlistSongs].sort(() => Math.random() - 0.5), 0)}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-full m3-label-large m3-ripple"
            style={{ background: 'var(--secondary-container)', color: 'var(--on-secondary-container)' }}
            data-testid="playlist-shuffle"
          >
            <Shuffle size={18} />
            Shuffle
          </button>
        </div>
      )}

      {/* Songs */}
      {!playlistSongs.length ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Music2 size={36} className="opacity-25" />
          <p className="m3-body-large">No songs in this playlist</p>
          <Link href="/library?tab=songs">
            <span className="m3-label-large text-primary">Browse library</span>
          </Link>
        </div>
      ) : (
        playlistSongs.map((song, i) => (
          <div
            key={`${song.id}-${i}`}
            className="flex items-center gap-4 px-4 py-2 m3-ripple cursor-pointer group"
            style={{ minHeight: '72px' }}
            onClick={() => playQueue(playlistSongs, i)}
            data-testid={`playlist-song-${song.id}`}
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ background: 'var(--surface-container-high)' }}>
              {song.albumArtUrl
                ? <img src={song.albumArtUrl} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Music2 size={20} className="text-muted-foreground opacity-40" /></div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="m3-body-large text-foreground truncate">{song.title}</p>
              <p className="m3-body-medium text-muted-foreground truncate">{song.artist} · {song.album}</p>
            </div>
            <span className="m3-label-small text-muted-foreground tabular-nums group-hover:hidden shrink-0">
              {formatDuration(song.duration)}
            </span>
            <button
              onClick={e => { e.stopPropagation(); removeFromPlaylist(playlist.id, song.id); }}
              className="hidden group-hover:flex w-9 h-9 rounded-full items-center justify-center text-muted-foreground hover:text-destructive m3-ripple shrink-0"
              data-testid={`playlist-remove-${song.id}`}
            >
              <X size={16} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
