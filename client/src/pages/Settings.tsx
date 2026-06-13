import { useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLibrary } from '@/contexts/LibraryContext';
import { formatTotalDuration } from '@/lib/metadata';
import {
  Moon, Sun, Monitor, Trash2, FolderOpen, Music2,
  ChevronRight, ImagePlus, X, Palette,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Settings() {
  const { theme, setTheme, backgroundUrl, palette, setBackground, clearBackground } = useTheme();
  const { stats, clearLibrary, openFilePicker, loadDirectory } = useLibrary();
  const bgInputRef = useRef<HTMLInputElement>(null);

  function handleBgFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setBackground(file);
    e.target.value = '';
  }

  return (
    <div data-testid="settings-page">
      {/* M3 Top App Bar */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="m3-headline-small text-foreground">Settings</h1>
      </div>

      {/* ─── Personalize ─── */}
      <M3Section label="Personalize">
        {/* Background image picker */}
        <div
          className="mx-4 mb-2 rounded-[16px] overflow-hidden cursor-pointer m3-ripple"
          style={{ background: 'var(--surface-container)' }}
          onClick={() => bgInputRef.current?.click()}
          data-testid="settings-bg-image"
        >
          <input
            ref={bgInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBgFile}
          />

          {backgroundUrl ? (
            /* Current background preview */
            <div className="relative">
              <img
                src={backgroundUrl}
                alt="Background"
                className="w-full h-36 object-cover"
              />
              {/* Palette dot chips */}
              {palette && (
                <div className="absolute bottom-2 left-3 flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full border-2 border-white/60 shadow-md"
                    style={{ background: `hsl(${palette.hue}, ${palette.saturation}%, 60%)` }}
                  />
                  <span className="m3-label-small text-white/80 bg-black/40 px-2 py-0.5 rounded-full">
                    Colour extracted · hue {palette.hue}°
                  </span>
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-2">
                {/* Change */}
                <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur text-white px-3 h-8 rounded-full m3-label-small m3-ripple">
                  <ImagePlus size={14} /> Change
                </div>
                {/* Remove */}
                <button
                  onClick={e => { e.stopPropagation(); clearBackground(); }}
                  className="flex items-center gap-1.5 bg-black/50 backdrop-blur text-white px-3 h-8 rounded-full m3-label-small m3-ripple"
                  data-testid="settings-bg-remove"
                >
                  <X size={14} /> Remove
                </button>
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="flex items-center gap-4 px-4 py-3" style={{ minHeight: '72px' }}>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'var(--surface-container-high)' }}
              >
                <ImagePlus size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="m3-body-large text-foreground">Set background image</p>
                <p className="m3-body-medium text-muted-foreground">App colours will adapt to your image</p>
              </div>
              <ChevronRight size={18} className="text-muted-foreground shrink-0" />
            </div>
          )}
        </div>

        {/* Colour palette info (only when a palette is active) */}
        {palette && (
          <div
            className="mx-4 mb-1 rounded-[16px] px-4 py-3 flex items-center gap-3"
            style={{ background: 'var(--surface-container)' }}
          >
            <Palette size={18} className="text-primary shrink-0" />
            <div className="flex-1">
              <p className="m3-body-medium text-foreground">Dynamic colour active</p>
              <p className="m3-body-small text-muted-foreground">
                Theme colours have been extracted from your background image
              </p>
            </div>
            {/* Live palette swatches */}
            <div className="flex gap-1 shrink-0">
              {[85, 65, 45, 28].map((l, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border border-white/10"
                  style={{ background: `hsl(${palette.hue}, ${palette.saturation}%, ${l}%)` }}
                />
              ))}
            </div>
          </div>
        )}
      </M3Section>

      {/* ─── Appearance ─── */}
      <M3Section label="Appearance">
        <div className="mx-4 rounded-[16px] overflow-hidden" style={{ background: 'var(--surface-container)' }}>
          {([
            ['light', 'Light', Sun],
            ['dark',  'Dark',  Moon],
            ['system','System',Monitor],
          ] as const).map(([val, label, Icon], i, arr) => (
            <button
              key={val}
              onClick={() => setTheme(val)}
              className={`w-full flex items-center gap-4 px-4 py-4 m3-ripple transition-colors ${
                i < arr.length - 1 ? 'border-b border-border' : ''
              } ${theme === val ? 'text-primary' : 'text-foreground'}`}
              data-testid={`theme-${val}`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: theme === val ? 'var(--secondary-container)' : 'var(--surface-container-high)' }}
              >
                <Icon size={20} className={theme === val ? 'text-primary' : 'text-muted-foreground'} />
              </div>
              <span className="flex-1 text-left m3-body-large">{label}</span>
              {theme === val && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </M3Section>

      {/* ─── Library Stats ─── */}
      <M3Section label="Library">
        <div className="mx-4 rounded-[16px] overflow-hidden" style={{ background: 'var(--surface-container)' }}>
          {[
            { label: 'Songs',          value: stats.totalSongs.toLocaleString() },
            { label: 'Albums',         value: stats.totalAlbums.toLocaleString() },
            { label: 'Artists',        value: stats.totalArtists.toLocaleString() },
            { label: 'Total duration', value: formatTotalDuration(stats.totalDuration) },
            ...(stats.topGenre ? [{ label: 'Top genre', value: stats.topGenre }] : []),
          ].map((row, i, arr) => (
            <div
              key={row.label}
              className={`flex items-center justify-between px-4 py-3.5 ${
                i < arr.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <span className="m3-body-large text-muted-foreground">{row.label}</span>
              <span className="m3-label-large text-foreground">{row.value}</span>
            </div>
          ))}
        </div>
      </M3Section>

      {/* ─── Music Import ─── */}
      <M3Section label="Music Import">
        <M3ActionItem
          icon={<FolderOpen size={20} className="text-primary" />}
          label="Open music folder"
          supporting="Import all audio files from a folder"
          onClick={loadDirectory}
          data-testid="settings-open-folder"
        />
        <M3ActionItem
          icon={<Music2 size={20} className="text-primary" />}
          label="Add files"
          supporting="Pick individual audio files"
          onClick={openFilePicker}
          data-testid="settings-add-files"
        />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div>
              <M3ActionItem
                icon={<Trash2 size={20} className="text-destructive" />}
                label="Clear library"
                supporting={`Remove all ${stats.totalSongs.toLocaleString()} songs`}
                destructive
                data-testid="settings-clear-library"
              />
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear library?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes all {stats.totalSongs.toLocaleString()} songs permanently.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={clearLibrary}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Clear
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </M3Section>

      {/* ─── About ─── */}
      <M3Section label="About">
        <div className="mx-4 rounded-[16px] p-4" style={{ background: 'var(--surface-container)' }}>
          <div className="flex items-center gap-4 mb-3">
            <img src="/echo-company-logo.png" alt="Echo Company" className="w-14 h-14 object-contain shrink-0" />
            <div>
              <p className="m3-title-medium text-foreground">PixelPlayer</p>
              <p className="m3-body-small text-muted-foreground">Created by Echo Company</p>
            </div>
          </div>
          <p className="m3-body-medium text-muted-foreground leading-relaxed">
            Plays your local music files directly in the browser. Your music never leaves your device.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {['FLAC', 'MP3', 'AAC', 'OGG', 'WAV', 'M4A', 'OPUS'].map(fmt => (
              <span
                key={fmt}
                className="m3-label-small px-3 h-6 rounded-full flex items-center"
                style={{ background: 'var(--surface-container-high)', color: 'var(--muted-foreground)' }}
              >
                {fmt}
              </span>
            ))}
          </div>
        </div>
      </M3Section>
    </div>
  );
}

function M3Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="m3-label-medium text-muted-foreground uppercase tracking-[0.1em] px-4 mb-2">{label}</p>
      {children}
    </div>
  );
}

function M3ActionItem({ icon, label, supporting, onClick, destructive, 'data-testid': testId }: {
  icon: React.ReactNode;
  label: string;
  supporting: string;
  onClick?: () => void;
  destructive?: boolean;
  'data-testid'?: string;
}) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-3 m3-ripple cursor-pointer mx-4 mb-1 rounded-[16px]"
      style={{ background: 'var(--surface-container)', minHeight: '72px' }}
      onClick={onClick}
      data-testid={testId}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'var(--surface-container-high)' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`m3-body-large ${destructive ? 'text-destructive' : 'text-foreground'}`}>{label}</p>
        <p className="m3-body-medium text-muted-foreground">{supporting}</p>
      </div>
      <ChevronRight size={18} className="text-muted-foreground shrink-0" />
    </div>
  );
}
