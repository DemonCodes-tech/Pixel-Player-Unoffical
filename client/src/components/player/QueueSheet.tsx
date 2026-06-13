import { usePlayer } from '@/contexts/PlayerContext';
import { formatDuration } from '@/lib/metadata';
import { X, GripVertical, Trash2, Music2 } from 'lucide-react';

export default function QueueSheet() {
  const { queue, queueIndex, setQueueOpen, removeFromQueue, clearQueue, play } = usePlayer();

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      data-testid="queue-sheet"
    >
      {/* M3 Top App Bar */}
      <div
        className="flex items-center gap-2 px-2 h-16 shrink-0 border-b border-border"
        style={{ background: 'var(--surface-container)' }}
      >
        <button
          onClick={() => setQueueOpen(false)}
          className="w-12 h-12 flex items-center justify-center rounded-full text-foreground m3-ripple"
          data-testid="queue-close"
        >
          <X size={22} />
        </button>
        <div className="flex-1">
          <h2 className="m3-title-large text-foreground">Queue</h2>
          <p className="m3-body-small text-muted-foreground">{queue.length} songs</p>
        </div>
        <button
          onClick={clearQueue}
          className="flex items-center gap-1.5 h-10 px-4 rounded-full text-destructive m3-ripple m3-label-large"
          style={{ background: 'var(--surface-container-high)' }}
          data-testid="queue-clear"
        >
          <Trash2 size={16} />
          Clear
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <Music2 size={40} className="opacity-30" />
            <p className="m3-body-large">Queue is empty</p>
          </div>
        ) : (
          <div className="py-2">
            {queue.map((song, index) => {
              const isActive = index === queueIndex;
              return (
                <div
                  key={`${song.id}-${index}`}
                  className={`flex items-center gap-3 px-4 py-2 m3-ripple transition-colors ${
                    isActive ? 'rounded-2xl mx-2' : ''
                  }`}
                  style={isActive ? { background: 'var(--secondary-container)' } : {}}
                  data-testid={`queue-item-${index}`}
                >
                  <GripVertical size={16} className="text-muted-foreground/40 shrink-0 cursor-grab" />

                  <div
                    className="w-12 h-12 rounded-xl overflow-hidden shrink-0 cursor-pointer"
                    style={{ background: 'var(--surface-container-high)' }}
                    onClick={() => play(song, queue, index)}
                  >
                    {song.albumArtUrl
                      ? <img src={song.albumArtUrl} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <Music2 size={20} className="text-muted-foreground" />
                        </div>}
                  </div>

                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => play(song, queue, index)}>
                    <p className={`m3-title-small truncate ${isActive ? 'text-secondary-foreground' : 'text-foreground'}`}>
                      {song.title}
                    </p>
                    <p className={`m3-body-small truncate ${isActive ? 'text-secondary-foreground/70' : 'text-muted-foreground'}`}>
                      {song.artist}
                    </p>
                  </div>

                  <span className="m3-label-small text-muted-foreground tabular-nums shrink-0">
                    {formatDuration(song.duration)}
                  </span>

                  <button
                    onClick={() => removeFromQueue(index)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive m3-ripple shrink-0"
                    data-testid={`queue-remove-${index}`}
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
