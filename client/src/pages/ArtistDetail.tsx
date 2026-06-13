import { useParams } from 'wouter';
import { useLibrary } from '@/contexts/LibraryContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { formatTotalDuration } from '@/lib/metadata';
import { ChevronLeft, Play, Shuffle, Disc3 } from 'lucide-react';
import { Link } from 'wouter';

export default function ArtistDetail() {
  const { id } = useParams<{ id: string }>();
  const artistId = decodeURIComponent(id || '');
  const { artists, albums, songs } = useLibrary();
  const { playQueue } = usePlayer();

  const artist = artists.find(a => a.id === artistId);
  const artistSongs = songs.filter(s => (s.albumArtist || s.artist) === artistId);
  const artistAlbums = albums.filter(a => a.artist === artistId);

  if (!artist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <p className="m3-body-large">Artist not found</p>
        <Link href="/library?tab=artists">
          <span className="m3-label-large text-primary">Back to library</span>
        </Link>
      </div>
    );
  }

  const totalDuration = artistSongs.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div data-testid="artist-detail-page">
      {/* M3 Large top app bar variant — artist header */}
      <div
        className="relative px-4 pt-16 pb-6 text-center"
        style={{ background: 'linear-gradient(to bottom, var(--primary-container), var(--background))' }}
      >
        {/* Back button */}
        <Link href="/library?tab=artists">
          <button className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center text-foreground m3-ripple" style={{ background: 'var(--surface-container)' }}>
            <ChevronLeft size={22} />
          </button>
        </Link>

        {/* Avatar */}
        <div
          className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden shadow-lg"
          style={{ background: 'var(--primary-container)' }}
        >
          {artist.imageUrl
            ? <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
            : <span className="m3-display-small" style={{ color: 'var(--on-primary-container)' }}>
                {artist.name.charAt(0)}
              </span>}
        </div>

        <h1 className="m3-headline-medium text-foreground">{artist.name}</h1>
        <p className="m3-body-medium text-muted-foreground mt-1">
          {artist.albumCount} albums · {artist.songCount} songs · {formatTotalDuration(totalDuration)}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 px-4 mb-6">
        <button
          onClick={() => playQueue(artistSongs, 0)}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-full bg-primary text-primary-foreground m3-label-large m3-ripple"
          data-testid="artist-play-all"
        >
          <Play size={18} fill="currentColor" />
          Play all
        </button>
        <button
          onClick={() => playQueue([...artistSongs].sort(() => Math.random() - 0.5), 0)}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-full m3-label-large m3-ripple"
          style={{ background: 'var(--secondary-container)', color: 'var(--on-secondary-container)' }}
          data-testid="artist-shuffle"
        >
          <Shuffle size={18} />
          Shuffle
        </button>
      </div>

      {/* Albums */}
      {artistAlbums.length > 0 && (
        <div className="mb-4">
          <p className="m3-label-medium text-muted-foreground uppercase tracking-[0.1em] px-4 mb-1">Albums</p>
          {artistAlbums.map(album => (
            <Link key={album.id} href={`/album/${encodeURIComponent(album.id)}`}>
              <div
                className="flex items-center gap-4 px-4 py-3 m3-ripple cursor-pointer"
                style={{ minHeight: '72px' }}
                data-testid={`artist-album-${album.id}`}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ background: 'var(--surface-container-high)' }}>
                  {album.coverUrl
                    ? <img src={album.coverUrl} alt={album.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Disc3 size={22} className="text-muted-foreground opacity-40" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="m3-body-large text-foreground truncate">{album.name}</p>
                  <p className="m3-body-medium text-muted-foreground">
                    {album.songCount} songs{album.year ? ` · ${album.year}` : ''}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
