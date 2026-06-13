import { useState } from 'react';
import { useLibrary } from '@/contexts/LibraryContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { formatDuration } from '@/lib/metadata';
import { Search as SearchIcon, Music2, Disc3, Users, X } from 'lucide-react';
import { Link } from 'wouter';

export default function Search() {
  const [query, setQuery] = useState('');
  const { searchSongs, albums, artists } = useLibrary();
  const { playQueue } = usePlayer();

  const songs = query.trim() ? searchSongs(query) : [];
  const matchedAlbums = query.trim()
    ? albums.filter(a =>
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.artist.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];
  const matchedArtists = query.trim()
    ? artists.filter(a => a.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : [];

  const hasResults = songs.length + matchedAlbums.length + matchedArtists.length > 0;

  return (
    <div className="flex flex-col" data-testid="search-page">
      {/* M3 search bar area */}
      <div className="px-4 pt-6 pb-3">
        <div
          className="flex items-center gap-3 rounded-full px-4 h-14"
          style={{ background: 'var(--surface-container-high)' }}
        >
          <SearchIcon size={20} className="text-muted-foreground shrink-0" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Songs, albums, artists…"
            className="flex-1 bg-transparent m3-body-large text-foreground placeholder:text-muted-foreground outline-none"
            data-testid="search-input"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground m3-ripple shrink-0"
              data-testid="search-clear"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div>
        {query.trim() && !hasResults && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <SearchIcon size={40} className="opacity-20" />
            <p className="m3-body-large">No results for "{query}"</p>
          </div>
        )}

        {!query.trim() && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
            <SearchIcon size={48} className="opacity-15" />
            <p className="m3-body-large">Search your library</p>
          </div>
        )}

        {matchedArtists.length > 0 && (
          <ResultSection title={`Artists (${matchedArtists.length})`}>
            {matchedArtists.map(artist => (
              <Link key={artist.id} href={`/artist/${encodeURIComponent(artist.id)}`}>
                <div className="flex items-center gap-4 px-4 py-3 m3-ripple cursor-pointer" style={{ minHeight: '72px' }} data-testid={`search-artist-${artist.id}`}>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'var(--primary-container)' }}
                  >
                    <span className="m3-title-medium" style={{ color: 'var(--on-primary-container)' }}>
                      {artist.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="m3-body-large text-foreground truncate">{artist.name}</p>
                    <p className="m3-body-medium text-muted-foreground">{artist.songCount} songs</p>
                  </div>
                  <Users size={18} className="text-muted-foreground shrink-0" />
                </div>
              </Link>
            ))}
          </ResultSection>
        )}

        {matchedAlbums.length > 0 && (
          <ResultSection title={`Albums (${matchedAlbums.length})`}>
            {matchedAlbums.map(album => (
              <Link key={album.id} href={`/album/${encodeURIComponent(album.id)}`}>
                <div className="flex items-center gap-4 px-4 py-3 m3-ripple cursor-pointer" style={{ minHeight: '72px' }} data-testid={`search-album-${album.id}`}>
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ background: 'var(--surface-container-high)' }}>
                    {album.coverUrl
                      ? <img src={album.coverUrl} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Disc3 size={20} className="text-muted-foreground opacity-40" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="m3-body-large text-foreground truncate">{album.name}</p>
                    <p className="m3-body-medium text-muted-foreground">{album.artist} · {album.songCount} songs</p>
                  </div>
                </div>
              </Link>
            ))}
          </ResultSection>
        )}

        {songs.length > 0 && (
          <ResultSection title={`Songs (${songs.length})`}>
            {songs.map((song, i) => (
              <div
                key={song.id}
                className="flex items-center gap-4 px-4 py-3 m3-ripple cursor-pointer"
                style={{ minHeight: '72px' }}
                onClick={() => playQueue(songs, i)}
                data-testid={`search-song-${song.id}`}
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
                <span className="m3-label-small text-muted-foreground tabular-nums shrink-0">
                  {formatDuration(song.duration)}
                </span>
              </div>
            ))}
          </ResultSection>
        )}
      </div>
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="px-4 pt-3 pb-1">
        <p className="m3-label-medium text-muted-foreground uppercase tracking-[0.1em]">{title}</p>
      </div>
      {children}
    </div>
  );
}
