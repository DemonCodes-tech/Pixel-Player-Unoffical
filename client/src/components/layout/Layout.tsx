import { usePlayer } from '@/contexts/PlayerContext';
import { useTheme } from '@/contexts/ThemeContext';
import BottomNav from './BottomNav';
import MiniPlayer from '@/components/player/MiniPlayer';
import FullPlayer from '@/components/player/FullPlayer';
import QueueSheet from '@/components/player/QueueSheet';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentSong, isFullPlayerOpen, isQueueOpen } = usePlayer();
  const { backgroundUrl } = useTheme();

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Custom background image with overlay */}
      {backgroundUrl && (
        <>
          <div
            className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundUrl})` }}
            aria-hidden
          />
          {/* Dark scrim so the app stays readable */}
          <div
            className="fixed inset-0 z-0"
            style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(2px)' }}
            aria-hidden
          />
        </>
      )}

      {/* App content sits above the background */}
      <main
        className="relative z-10 flex-1 overflow-y-auto"
        style={{ paddingBottom: currentSong ? '8.5rem' : '5rem' }}
      >
        {children}
      </main>

      <div className="relative z-20">
        {currentSong && <MiniPlayer />}
        <BottomNav />
      </div>

      {isFullPlayerOpen && <FullPlayer />}
      {isQueueOpen && <QueueSheet />}
    </div>
  );
}
