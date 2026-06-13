import { useState, useEffect, useRef } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { X, Music2 } from 'lucide-react';

interface LyricsLine {
  time: number;
  text: string;
}

function parseLrc(lrc: string): LyricsLine[] {
  const lines: LyricsLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/g;
  let match;
  while ((match = regex.exec(lrc)) !== null) {
    const min = parseInt(match[1]);
    const sec = parseInt(match[2]);
    const ms = parseInt(match[3].padEnd(3, '0'));
    lines.push({ time: min * 60 + sec + ms / 1000, text: match[4].trim() });
  }
  return lines.sort((a, b) => a.time - b.time);
}

export default function LyricsPanel() {
  const { currentSong, progress, setLyricsOpen } = usePlayer();
  const [lyrics, setLyrics] = useState<LyricsLine[] | null>(null);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentSong) return;
    setLyrics(null); setPlainLyrics(null); setError(false); setLoading(true);
    const a = encodeURIComponent(currentSong.artist);
    const t = encodeURIComponent(currentSong.title);
    fetch(`https://lrclib.net/api/get?artist_name=${a}&track_name=${t}`)
      .then(r => r.json())
      .then(data => {
        if (data.syncedLyrics) setLyrics(parseLrc(data.syncedLyrics));
        else if (data.plainLyrics) setPlainLyrics(data.plainLyrics);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [currentSong?.id]);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [progress]);

  const activeIndex = lyrics ? lyrics.findLastIndex(l => l.time <= progress) : -1;

  return (
    <div
      className="absolute inset-0 z-10 flex flex-col"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(24px)' }}
      data-testid="lyrics-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <h3 className="m3-title-medium text-white">Lyrics</h3>
        <button
          onClick={() => setLyricsOpen(false)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white m3-ripple"
          data-testid="lyrics-close"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {loading && (
          <div className="text-center text-white/40 mt-12">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
            <p className="m3-body-medium">Finding lyrics…</p>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center mt-12 text-center text-white/40">
            <Music2 size={32} className="opacity-50 mb-3" />
            <p className="m3-body-large">No lyrics found</p>
            <p className="m3-body-small mt-1 opacity-60">Try a different song</p>
          </div>
        )}
        {lyrics && lyrics.map((line, i) => (
          <div
            key={i}
            ref={i === activeIndex ? activeRef : null}
            className={`text-center leading-relaxed transition-all duration-300 ${
              i === activeIndex
                ? 'm3-headline-small text-white scale-105 origin-center'
                : i < activeIndex
                ? 'm3-body-large text-white/25'
                : 'm3-body-large text-white/45'
            }`}
          >
            {line.text || '\u00A0'}
          </div>
        ))}
        {plainLyrics && (
          <pre className="m3-body-large text-white/70 text-center whitespace-pre-wrap font-sans leading-8">
            {plainLyrics}
          </pre>
        )}
      </div>
    </div>
  );
}
