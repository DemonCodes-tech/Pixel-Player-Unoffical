import { useEffect } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { useLibrary } from '@/contexts/LibraryContext';

export function PlayerSyncBridge() {
  const { registerFileHandles } = usePlayer();
  const { fileHandles } = useLibrary();

  useEffect(() => {
    registerFileHandles(fileHandles);
  }, [fileHandles, registerFileHandles]);

  return null;
}
