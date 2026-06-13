import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { saveSetting, getSetting, deleteSetting } from '@/lib/db';
import { extractDominantHue, applyPalette, resetPalette, type CustomPalette } from '@/lib/palette';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  isDark: boolean;
  backgroundUrl: string | null;
  palette: CustomPalette | null;
  setBackground: (file: File) => Promise<void>;
  clearBackground: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  isDark: true,
  backgroundUrl: null,
  palette: null,
  setBackground: async () => {},
  clearBackground: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem('pp-theme') as Theme) || 'dark'
  );
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<CustomPalette | null>(() => {
    try {
      const raw = localStorage.getItem('pp-palette');
      return raw ? (JSON.parse(raw) as CustomPalette) : null;
    } catch { return null; }
  });

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Apply / remove dark class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Apply palette whenever palette or isDark changes
  useEffect(() => {
    if (palette) {
      applyPalette(palette, isDark);
    } else {
      resetPalette();
    }
  }, [palette, isDark]);

  // Load persisted background image from IndexedDB on mount
  useEffect(() => {
    getSetting<Blob>('backgroundBlob').then(blob => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setBackgroundUrl(url);
      }
    });
    return () => {
      if (backgroundUrl) URL.revokeObjectURL(backgroundUrl);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem('pp-theme', t);
  }

  const setBackground = useCallback(async (file: File) => {
    // Revoke previous URL
    if (backgroundUrl) URL.revokeObjectURL(backgroundUrl);

    const blob = file.slice(0, file.size, file.type);
    await saveSetting('backgroundBlob', blob);

    const url = URL.createObjectURL(blob);
    setBackgroundUrl(url);

    // Extract palette from image
    const extracted = await extractDominantHue(url);
    setPalette(extracted);
    localStorage.setItem('pp-palette', JSON.stringify(extracted));
  }, [backgroundUrl]);

  const clearBackground = useCallback(async () => {
    if (backgroundUrl) URL.revokeObjectURL(backgroundUrl);
    setBackgroundUrl(null);
    setPalette(null);
    localStorage.removeItem('pp-palette');
    await deleteSetting('backgroundBlob');
    resetPalette();
  }, [backgroundUrl]);

  return (
    <ThemeContext.Provider value={{
      theme, setTheme, isDark,
      backgroundUrl, palette,
      setBackground, clearBackground,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
