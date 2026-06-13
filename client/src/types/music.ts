export interface Song {
  id: string;
  title: string;
  artist: string;
  albumArtist: string;
  album: string;
  genre: string;
  year: number | null;
  duration: number; // seconds
  track: number | null;
  disc: number | null;
  filePath: string; // used as identifier for file handles
  fileName: string;
  folder: string;
  albumArtUrl: string | null; // blob URL from embedded art
  addedAt: number; // timestamp
}

export interface Album {
  id: string;
  name: string;
  artist: string;
  year: number | null;
  genre: string;
  songCount: number;
  coverUrl: string | null;
}

export interface Artist {
  id: string;
  name: string;
  albumCount: number;
  songCount: number;
  imageUrl: string | null;
}

export interface Playlist {
  id: string;
  name: string;
  songIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface PlaybackHistory {
  songId: string;
  playedAt: number;
}

export type RepeatMode = 'none' | 'one' | 'all';

export type SortBy = 'title' | 'artist' | 'album' | 'duration' | 'addedAt';
export type SortDir = 'asc' | 'desc';

export interface LibraryStats {
  totalSongs: number;
  totalDuration: number;
  topGenre: string | null;
  totalAlbums: number;
  totalArtists: number;
}
