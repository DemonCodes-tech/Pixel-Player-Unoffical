import { useParams } from 'wouter';
import { useLibrary } from '@/contexts/LibraryContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { formatDuration, formatTotalDuration } from '@/lib/metadata';
import { ChevronLeft, Play, Shuffle, Music2, Disc3 } from 'lucide-react';
import { Link } from 'wouter';

export default function AlbumDetail() {
  const { id } = useParams<{ id: string }>();
  const albumId = decodeURIComponent(id || '');
  const { albums, songs } = useLibrary();
  const { playQueue } = usePlayer();

  const album = albums.find(a => a.id === albumId);
  const albumSongs = songs
    .filter(s => `${s.album}__${s.albumArtist || s.artist}` === albumId)
    .sort((a, b) => {
      if (a.disc !== b.disc) return (a.disc || 0) - (b.disc || 0);
      return (a.track || 0) - (b.track || 0);
    });

  if (!album) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <Disc3 size={40} className="opacity-30" />
        <p className="m3-body-large">Album not found</p>
        <Link href="/library?tab=albums">
          <span className="m3-label-large text-primary">Back to library</span>
        </Link>
      </div>
    );
  }

  const totalDuration = albumSongs.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div data-testid="album-detail-page">
      {/* Hero artwork */}
      <div className="relative">
        <div className="w-full aspect-square max-h-64 overflow-hidden" style={{ background: 'var(--surface-container-high)' }}>
          {album.coverUrl
            ? <img src={album.coverUrl} alt={album.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center">
                <Disc3 size={80} className="text-muted-foreground opacity-20" />
              </div>}
          {/* Gradient scrim */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, var(--background) 100%)' }} />
        </div>

        {/* M3 back button — icon button on scrim */}
        <Link href="/library?tab=albums">
          <button className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center text-white m3-ripple" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
            <ChevronLeft size={22} />
          </button>
        </Link>
      </div>

      {/* Album info */}
      <div className="px-4 pt-1 pb-4">
        <h1 className="m3-headline-small text-foreground">{album.name}</h1>
        <Link href={`/artist/${encodeURIComponent(album.artist)}`}>
          <p className="m3-title-medium text-primary hover:underline mt-0.5">{album.artist}</p>
        </Link>
        <p className="m3-body-small text-muted-foreground mt-1">
          {album.year && `${album.year} · `}{albumSongs.length} songs · {formatTotalDuration(totalDuration)}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 px-4 mb-4">
        <button
          onClick={() => playQueue(albumSongs, 0)}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-full bg-primary text-primary-foreground m3-label-large m3-ripple"
          data-testid="album-play-all"
        >
          <Play size={18} fill="currentColor" />
          Play
        </button>
        <button
          onClick={() => playQueue([...albumSongs].sort(() => Math.random() - 0.5), 0)}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-full m3-label-large m3-ripple"
          style={{ background: 'var(--secondary-container)', color: 'var(--on-secondary-container)' }}
          data-testid="album-shuffle"
        >
          <Shuffle size={18} />
          Shuffle
        </button>
      </div>

      {/* Track list */}
      <div>
        {albumSongs.map((song, i) => (
          <div
            key={song.id}
            className="flex items-center gap-4 px-4 py-2 m3-ripple cursor-pointer"
            style={{ minHeight: '64px' }}
            onClick={() => playQueue(albumSongs, i)}
            data-testid={`album-track-${song.id}`}
          >
            <span className="w-6 m3-label-medium text-muted-foreground text-center shrink-0">
              {song.track || i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="m3-body-large text-foreground truncate">{song.title}</p>
              {song.artist !== album.artist && (
                <p className="m3-body-medium text-muted-foreground truncate">{song.artist}</p>
              )}
            </div>
            <span className="m3-label-small text-muted-foreground tabular-nums shrink-0">
              {formatDuration(song.duration)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
