import { useState, useEffect } from 'react';
import { useSearch } from 'wouter';
import { useLibrary } from '@/contexts/LibraryContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { formatDuration } from '@/lib/metadata';
import { Music2, Disc3, Users, Tag, Folder, ListMusic, Plus, MoreVertical, Play, Shuffle, Trash2 } from 'lucide-react';
import { Link } from 'wouter';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Tab = 'songs' | 'albums' | 'artists' | 'genres' | 'folders' | 'playlists';

const TABS: { id: Tab; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'songs',     label: 'Songs',     Icon: Music2 },
  { id: 'albums',    label: 'Albums',    Icon: Disc3 },
  { id: 'artists',   label: 'Artists',   Icon: Users },
  { id: 'genres',    label: 'Genres',    Icon: Tag },
  { id: 'folders',   label: 'Folders',   Icon: Folder },
  { id: 'playlists', label: 'Playlists', Icon: ListMusic },
];

export default function Library() {
  const search = useSearch();
  const defaultTab = (new URLSearchParams(search).get('tab') as Tab) || 'songs';
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [newPlaylistOpen, setNewPlaylistOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const { songs, albums, artists, playlists, createPlaylist, deletePlaylist } = useLibrary();
  const { playQueue } = usePlayer();

  useEffect(() => {
    const t = new URLSearchParams(search).get('tab') as Tab;
    if (t) setActiveTab(t);
  }, [search]);

  const genres = [...new Map(songs.map(s => [s.genre, s])).entries()]
    .map(([g]) => ({ name: g, count: songs.filter(s => s.genre === g).length }))
    .sort((a, b) => b.count - a.count);

  const folders = [...new Map(songs.map(s => [s.folder, s])).entries()]
    .map(([f]) => ({ path: f, count: songs.filter(s => s.folder === f).length }))
    .sort((a, b) => a.path.localeCompare(b.path));

  return (
    <div className="flex flex-col" data-testid="library-page">
      {/* M3 Top App Bar */}
      <div className="px-4 pt-6 pb-1">
        <h1 className="m3-headline-small text-foreground">Library</h1>
      </div>

      {/* M3 Secondary Navigation Tabs */}
      <div
        className="sticky top-0 z-10 flex overflow-x-auto no-scrollbar border-b border-border"
        style={{ background: 'var(--background)' }}
      >
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`relative flex items-center gap-1.5 px-4 h-12 shrink-0 m3-label-large transition-colors m3-ripple ${
              activeTab === id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid={`tab-${id}`}
          >
            <Icon size={16} />
            {label}
            {activeTab === id && (
              <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'songs'     && <SongsTab songs={songs} playQueue={playQueue} />}
        {activeTab === 'albums'    && <AlbumsTab albums={albums} />}
        {activeTab === 'artists'   && <ArtistsTab artists={artists} />}
        {activeTab === 'genres'    && <GenresTab genres={genres} songs={songs} playQueue={playQueue} />}
        {activeTab === 'folders'   && <FoldersTab folders={folders} songs={songs} playQueue={playQueue} />}
        {activeTab === 'playlists' && (
          <PlaylistsTab playlists={playlists} songs={songs}
            onCreatePlaylist={() => setNewPlaylistOpen(true)}
            onDeletePlaylist={deletePlaylist} playQueue={playQueue} />
        )}
      </div>

      {/* New playlist dialog */}
      <Dialog open={newPlaylistOpen} onOpenChange={setNewPlaylistOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Playlist</DialogTitle></DialogHeader>
          <Input
            value={newPlaylistName}
            onChange={e => setNewPlaylistName(e.target.value)}
            placeholder="Playlist name"
            onKeyDown={e => {
              if (e.key === 'Enter' && newPlaylistName.trim()) {
                createPlaylist(newPlaylistName.trim());
                setNewPlaylistName(''); setNewPlaylistOpen(false);
              }
            }}
            data-testid="new-playlist-input"
          />
          <Button
            onClick={() => {
              if (newPlaylistName.trim()) {
                createPlaylist(newPlaylistName.trim());
                setNewPlaylistName(''); setNewPlaylistOpen(false);
              }
            }}
            className="w-full rounded-full"
            data-testid="new-playlist-create"
          >
            Create Playlist
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ──────────── Songs ──────────── */
function SongsTab({ songs, playQueue }: { songs: import('@/types/music').Song[]; playQueue: (s: import('@/types/music').Song[], i?: number) => void }) {
  if (!songs.length) return <EmptyState icon={<Music2 size={32} />} text="No songs yet" />;
  return (
    <div>
      {/* Sub-actions row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => playQueue(songs, 0)}
          className="flex items-center gap-1.5 h-8 px-4 rounded-full m3-label-medium m3-ripple"
          style={{ background: 'var(--secondary-container)', color: 'var(--on-secondary-container)' }}
          data-testid="songs-play-all"
        >
          <Play size={14} fill="currentColor" /> Play all ({songs.length})
        </button>
        <button
          onClick={() => playQueue([...songs].sort(() => Math.random() - 0.5), 0)}
          className="flex items-center gap-1.5 h-8 px-4 rounded-full border border-border m3-label-medium m3-ripple text-muted-foreground hover:text-foreground"
          data-testid="songs-shuffle"
        >
          <Shuffle size={14} /> Shuffle
        </button>
      </div>
      {songs.map((song, i) => <M3ListItem key={song.id} song={song} index={i} onPlay={() => playQueue(songs, i)} />)}
    </div>
  );
}

/* ──────────── Albums ──────────── */
function AlbumsTab({ albums }: { albums: import('@/types/music').Album[] }) {
  if (!albums.length) return <EmptyState icon={<Disc3 size={32} />} text="No albums" />;
  return (
    <div className="grid grid-cols-2 gap-4 px-4 py-4">
      {albums.map(album => (
        <Link key={album.id} href={`/album/${encodeURIComponent(album.id)}`}>
          <div className="cursor-pointer group" data-testid={`album-card-${album.id}`}>
            <div className="aspect-square rounded-[16px] overflow-hidden mb-2" style={{ background: 'var(--surface-container-high)' }}>
              {album.coverUrl
                ? <img src={album.coverUrl} alt={album.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><Disc3 size={36} className="text-muted-foreground opacity-30" /></div>}
            </div>
            <p className="m3-title-small text-foreground truncate">{album.name}</p>
            <p className="m3-body-small text-muted-foreground truncate">{album.artist}</p>
            <p className="m3-body-small text-muted-foreground">
              {album.songCount} songs{album.year ? ` · ${album.year}` : ''}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ──────────── Artists ──────────── */
function ArtistsTab({ artists }: { artists: import('@/types/music').Artist[] }) {
  if (!artists.length) return <EmptyState icon={<Users size={32} />} text="No artists" />;
  return (
    <div>
      {artists.map(artist => (
        <Link key={artist.id} href={`/artist/${encodeURIComponent(artist.id)}`}>
          <div className="flex items-center gap-4 px-4 py-3 m3-ripple cursor-pointer" style={{ minHeight: '72px' }} data-testid={`artist-row-${artist.id}`}>
            <div
              className="w-12 h-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
              style={{ background: 'var(--primary-container)' }}
            >
              {artist.imageUrl
                ? <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
                : <span className="m3-title-medium" style={{ color: 'var(--on-primary-container)' }}>
                    {artist.name.charAt(0)}
                  </span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="m3-body-large text-foreground truncate">{artist.name}</p>
              <p className="m3-body-medium text-muted-foreground">{artist.albumCount} albums · {artist.songCount} songs</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ──────────── Genres ──────────── */
function GenresTab({ genres, songs, playQueue }: { genres: { name: string; count: number }[]; songs: import('@/types/music').Song[]; playQueue: (s: import('@/types/music').Song[], i?: number) => void }) {
  if (!genres.length) return <EmptyState icon={<Tag size={32} />} text="No genres" />;
  return (
    <div className="grid grid-cols-2 gap-3 px-4 py-4">
      {genres.map(genre => {
        const gs = songs.filter(s => s.genre === genre.name);
        const cover = gs.find(s => s.albumArtUrl)?.albumArtUrl;
        return (
          <div
            key={genre.name}
            className="relative rounded-[16px] overflow-hidden h-28 cursor-pointer m3-ripple"
            onClick={() => playQueue(gs, 0)}
            data-testid={`genre-${genre.name}`}
          >
            {cover
              ? <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
              : <div className="absolute inset-0" style={{ background: 'var(--primary-container)' }} />}
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="m3-title-small text-white truncate">{genre.name}</p>
              <p className="m3-label-small text-white/70">{genre.count} songs</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ──────────── Folders ──────────── */
function FoldersTab({ folders, songs, playQueue }: { folders: { path: string; count: number }[]; songs: import('@/types/music').Song[]; playQueue: (s: import('@/types/music').Song[], i?: number) => void }) {
  if (!folders.length) return <EmptyState icon={<Folder size={32} />} text="No folders" />;
  return (
    <div>
      {folders.map(folder => {
        const fs = songs.filter(s => s.folder === folder.path);
        return (
          <div
            key={folder.path}
            className="flex items-center gap-4 px-4 py-3 m3-ripple cursor-pointer"
            style={{ minHeight: '72px' }}
            onClick={() => playQueue(fs, 0)}
            data-testid={`folder-${folder.path}`}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--secondary-container)' }}>
              <Folder size={22} style={{ color: 'var(--on-secondary-container)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="m3-body-large text-foreground truncate">{folder.path}</p>
              <p className="m3-body-medium text-muted-foreground">{folder.count} songs</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ──────────── Playlists ──────────── */
function PlaylistsTab({ playlists, songs, onCreatePlaylist, onDeletePlaylist, playQueue }: {
  playlists: import('@/types/music').Playlist[];
  songs: import('@/types/music').Song[];
  onCreatePlaylist: () => void;
  onDeletePlaylist: (id: string) => void;
  playQueue: (s: import('@/types/music').Song[], i?: number) => void;
}) {
  return (
    <div>
      {/* New playlist row */}
      <div
        className="flex items-center gap-4 px-4 py-3 m3-ripple cursor-pointer"
        style={{ minHeight: '72px' }}
        onClick={onCreatePlaylist}
        data-testid="create-playlist-btn"
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 border-dashed border-muted-foreground/30">
          <Plus size={22} className="text-primary" />
        </div>
        <p className="m3-body-large text-primary">New playlist</p>
      </div>

      {!playlists.length && <EmptyState icon={<ListMusic size={32} />} text="No playlists yet" />}

      {playlists.map(pl => {
        const plSongs = pl.songIds.map(id => songs.find(s => s.id === id)).filter(Boolean) as import('@/types/music').Song[];
        const cover = plSongs.find(s => s.albumArtUrl)?.albumArtUrl;
        return (
          <div key={pl.id} className="flex items-center gap-4 px-4 py-3 m3-ripple" style={{ minHeight: '72px' }} data-testid={`playlist-row-${pl.id}`}>
            <Link href={`/playlist/${pl.id}`} className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ background: 'var(--surface-container-high)' }}>
                {cover
                  ? <img src={cover} alt={pl.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><ListMusic size={22} className="text-muted-foreground opacity-40" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="m3-body-large text-foreground truncate">{pl.name}</p>
                <p className="m3-body-medium text-muted-foreground">{pl.songIds.length} songs</p>
              </div>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground m3-ripple shrink-0">
                  <MoreVertical size={20} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => playQueue(plSongs, 0)}>
                  <Play size={14} className="mr-2" /> Play
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDeletePlaylist(pl.id)} className="text-destructive">
                  <Trash2 size={14} className="mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}
    </div>
  );
}

/* ──────────── Shared ──────────── */
function M3ListItem({ song, index, onPlay }: { song: import('@/types/music').Song; index: number; onPlay: () => void }) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-2 m3-ripple cursor-pointer"
      style={{ minHeight: '72px' }}
      onClick={onPlay}
      data-testid={`song-row-${song.id}`}
    >
      <span className="w-5 m3-label-medium text-muted-foreground text-right shrink-0">{index + 1}</span>
      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ background: 'var(--surface-container-high)' }}>
        {song.albumArtUrl
          ? <img src={song.albumArtUrl} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Music2 size={20} className="text-muted-foreground opacity-40" /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="m3-body-large text-foreground truncate">{song.title}</p>
        <p className="m3-body-medium text-muted-foreground truncate">{song.artist} · {song.album}</p>
      </div>
      <span className="m3-label-small text-muted-foreground tabular-nums shrink-0">{formatDuration(song.duration)}</span>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
      <div className="opacity-30">{icon}</div>
      <p className="m3-body-large">{text}</p>
    </div>
  );
}
