import { useLibrary } from '@/contexts/LibraryContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { formatDuration, formatTotalDuration } from '@/lib/metadata';
import { FolderOpen, Music2, Disc3, Users, ListMusic, Play, Shuffle } from 'lucide-react';
import { Link } from 'wouter';

export default function Home() {
  const { songs, albums, stats, isLoading, loadingProgress, openFilePicker, loadDirectory } = useLibrary();
  const { playQueue } = usePlayer();

  if (songs.length === 0) {
    return <EmptyHome onPickFiles={openFilePicker} onPickFolder={loadDirectory} isLoading={isLoading} progress={loadingProgress} />;
  }

  const recentSongs = [...songs].sort((a, b) => b.addedAt - a.addedAt).slice(0, 12);

  return (
    <div data-testid="home-page">
      {/* M3 Small Top App Bar */}
      <div className="px-4 pt-6 pb-2">
        <h1 className="m3-headline-small text-foreground">PixelPlayer</h1>
        <p className="m3-body-small text-muted-foreground mt-0.5">
          {stats.totalSongs.toLocaleString()} songs · {formatTotalDuration(stats.totalDuration)}
        </p>
      </div>

      {/* Hero action row — M3 Filled + Tonal buttons */}
      <div className="flex gap-3 px-4 mb-5">
        <button
          onClick={() => playQueue(songs, 0)}
          className="flex-1 flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground h-10 m3-label-large m3-ripple hover:opacity-90 transition"
          data-testid="home-play-all"
        >
          <Play size={18} fill="currentColor" />
          Play all
        </button>
        <button
          onClick={() => playQueue([...songs].sort(() => Math.random() - 0.5), 0)}
          className="flex-1 flex items-center justify-center gap-2 rounded-full h-10 m3-label-large m3-ripple hover:opacity-90 transition"
          style={{ background: 'var(--secondary-container)', color: 'var(--on-secondary-container)' }}
          data-testid="home-shuffle"
        >
          <Shuffle size={18} />
          Shuffle
        </button>
      </div>

      {/* M3 stat chips row */}
      <div className="flex gap-2 px-4 mb-6 overflow-x-auto no-scrollbar">
        <Link href="/library?tab=albums">
          <StatChip icon={<Disc3 size={16} className="text-primary" />} label={`${stats.totalAlbums} Albums`} />
        </Link>
        <Link href="/library?tab=artists">
          <StatChip icon={<Users size={16} className="text-primary" />} label={`${stats.totalArtists} Artists`} />
        </Link>
        <Link href="/library?tab=songs">
          <StatChip icon={<Music2 size={16} className="text-primary" />} label={`${stats.totalSongs} Songs`} />
        </Link>
        <Link href="/library?tab=playlists">
          <StatChip icon={<ListMusic size={16} className="text-primary" />} label="Playlists" />
        </Link>
      </div>

      {/* Albums row */}
      {albums.length > 0 && (
        <Section title="Albums" linkTo="/library?tab=albums">
          <div className="flex gap-4 overflow-x-auto px-4 pb-2 no-scrollbar">
            {albums.slice(0, 12).map(album => (
              <Link key={album.id} href={`/album/${encodeURIComponent(album.id)}`}>
                <div className="w-36 shrink-0 cursor-pointer" data-testid={`home-album-${album.id}`}>
                  <div className="w-36 h-36 rounded-[16px] overflow-hidden mb-2" style={{ background: 'var(--surface-container-high)' }}>
                    {album.coverUrl
                      ? <img src={album.coverUrl} alt={album.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <Disc3 size={36} className="text-muted-foreground opacity-40" />
                        </div>}
                  </div>
                  <p className="m3-title-small text-foreground truncate">{album.name}</p>
                  <p className="m3-body-small text-muted-foreground truncate">{album.artist}</p>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Recently added — M3 List */}
      {recentSongs.length > 0 && (
        <Section title="Recently Added" linkTo="/library?tab=songs">
          <div>
            {recentSongs.map((song, i) => (
              <M3SongRow
                key={song.id}
                song={song}
                onPlay={() => playQueue(songs, songs.findIndex(s => s.id === song.id))}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Add more music — M3 Outlined button */}
      <div className="px-4 mt-4 pb-2">
        <button
          onClick={openFilePicker}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-full border border-border text-primary m3-label-large m3-ripple hover:bg-primary/5 transition"
          data-testid="home-add-music"
        >
          <FolderOpen size={18} />
          Add more music
        </button>
      </div>
    </div>
  );
}

function StatChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 h-8 rounded-full shrink-0 cursor-pointer m3-ripple border border-border"
      style={{ background: 'var(--surface-container)' }}
    >
      {icon}
      <span className="m3-label-medium text-foreground">{label}</span>
    </div>
  );
}

function Section({ title, linkTo, children }: { title: string; linkTo?: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="m3-title-medium text-foreground">{title}</h2>
        {linkTo && (
          <Link href={linkTo}>
            <span className="m3-label-medium text-primary hover:underline">See all</span>
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function M3SongRow({ song, onPlay }: {
  song: { id: string; title: string; artist: string; albumArtUrl: string | null; duration: number };
  onPlay: () => void;
}) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-2 m3-ripple cursor-pointer"
      onClick={onPlay}
      data-testid={`song-row-${song.id}`}
      style={{ minHeight: '72px' }}
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ background: 'var(--surface-container-high)' }}>
        {song.albumArtUrl
          ? <img src={song.albumArtUrl} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <Music2 size={20} className="text-muted-foreground opacity-50" />
            </div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="m3-body-large text-foreground truncate">{song.title}</p>
        <p className="m3-body-medium text-muted-foreground truncate">{song.artist}</p>
      </div>
      <span className="m3-label-medium text-muted-foreground tabular-nums shrink-0">{formatDuration(song.duration)}</span>
    </div>
  );
}

function EmptyHome({ onPickFiles, onPickFolder, isLoading, progress }: {
  onPickFiles: () => void;
  onPickFolder: () => Promise<void>;
  isLoading: boolean;
  progress: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-8 text-center" data-testid="empty-home">
      {/* Echo Company logo */}
      <img
        src="/echo-company-logo.png"
        alt="Echo Company"
        className="w-28 h-28 object-contain mb-5 drop-shadow-xl"
      />

      <h1 className="m3-headline-medium text-foreground mb-1">PixelPlayer</h1>
      <p className="m3-label-medium text-muted-foreground mb-5">Created by Echo Company</p>
      <p className="m3-body-large text-muted-foreground mb-8 leading-relaxed">
        Your music, beautifully played.<br />Add songs to get started.
      </p>

      {isLoading ? (
        <div className="w-full max-w-xs">
          {/* M3 Linear progress indicator */}
          <div className="h-1 rounded-full overflow-hidden mb-3" style={{ background: 'var(--surface-container-high)' }}>
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="m3-body-medium text-muted-foreground">Scanning… {progress}%</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {/* M3 Filled button */}
          <button
            onClick={onPickFolder}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-full bg-primary text-primary-foreground m3-label-large m3-ripple"
            data-testid="empty-pick-folder"
          >
            <FolderOpen size={20} />
            Open Music Folder
          </button>
          {/* M3 Tonal button */}
          <button
            onClick={onPickFiles}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-full m3-label-large m3-ripple"
            style={{ background: 'var(--secondary-container)', color: 'var(--on-secondary-container)' }}
            data-testid="empty-pick-files"
          >
            <Music2 size={20} />
            Select Files
          </button>
        </div>
      )}
    </div>
  );
}
