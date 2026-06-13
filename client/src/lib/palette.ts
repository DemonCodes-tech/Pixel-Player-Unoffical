/**
 * Dynamic M3 palette generation from a background image.
 * Extracts dominant hue/saturation and generates a full set of
 * M3-compatible CSS custom property values for dark and light themes.
 */

export interface CustomPalette {
  hue: number;
  saturation: number;
}

/** Sample pixels to find the most vibrant dominant hue. */
export function extractDominantHue(imgUrl: string): Promise<CustomPalette> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const SIZE = 100;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE; canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve({ hue: 264, saturation: 60 }); return; }
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      const data = ctx.getImageData(0, 0, SIZE, SIZE).data;

      // 36 hue buckets (every 10°), weighted by saturation
      const buckets = new Array(36).fill(0);
      const satSamples: number[] = [];

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const l = (max + min) / 2;
        if (l < 0.08 || l > 0.92) continue; // skip near-black / near-white
        const d = max - min;
        if (d < 0.08) continue; // skip near-grey
        const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (s < 0.12) continue;

        let h = 0;
        if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b - r) / d + 2) / 6;
        else                h = ((r - g) / d + 4) / 6;

        const hDeg = Math.round(h * 360) % 360;
        buckets[Math.floor(hDeg / 10)] += s;
        satSamples.push(s * 100);
      }

      // Smooth buckets (blend neighbours)
      const smooth = buckets.map((v, i) =>
        (buckets[(i + 35) % 36] * 0.25 + v * 0.5 + buckets[(i + 1) % 36] * 0.25)
      );

      const maxIdx = smooth.indexOf(Math.max(...smooth));
      const dominantHue = maxIdx * 10 + 5;
      const avgSat = satSamples.length > 0
        ? satSamples.reduce((a, b) => a + b, 0) / satSamples.length
        : 60;

      resolve({ hue: dominantHue, saturation: Math.round(Math.min(avgSat * 1.3, 95)) });
    };
    img.onerror = () => resolve({ hue: 264, saturation: 65 });
    img.src = imgUrl;
  });
}

/** Apply a custom palette by injecting CSS custom properties on <html>. */
export function applyPalette(palette: CustomPalette, isDark: boolean): void {
  const { hue: h, saturation: rawS } = palette;
  // Clamp saturation to readable ranges
  const ps  = Math.max(45, Math.min(rawS, 92));        // primary saturation
  const cs  = Math.max(35, Math.min(rawS * 0.8, 75)); // container saturation
  const ss  = Math.max(6,  Math.min(rawS * 0.18, 18)); // surface saturation
  const root = document.documentElement;

  if (isDark) {
    set(root, {
      '--primary':                    `${h} ${ps}% 85%`,
      '--primary-foreground':         `${h} ${ps}% 18%`,
      '--secondary':                  `${h} ${Math.round(ss * 2)}% 27%`,
      '--secondary-foreground':       `${h} ${Math.round(ps * 0.7)}% 90%`,
      '--background':                 `${h} ${Math.round(ss)}% 7%`,
      '--foreground':                 `${h} 5% 90%`,
      '--card':                       `${h} ${Math.round(ss * 0.9)}% 12%`,
      '--card-foreground':            `${h} 5% 90%`,
      '--card-border':                `${h} ${Math.round(ss)}% 26%`,
      '--popover':                    `${h} ${Math.round(ss * 0.9)}% 12%`,
      '--popover-foreground':         `${h} 5% 90%`,
      '--popover-border':             `${h} ${Math.round(ss)}% 26%`,
      '--muted':                      `${h} ${Math.round(ss * 0.6)}% 16%`,
      '--muted-foreground':           `${h} 5% 68%`,
      '--border':                     `${h} ${Math.round(ss)}% 26%`,
      '--input':                      `${h} ${Math.round(ss * 0.6)}% 16%`,
      '--ring':                       `${h} ${ps}% 85%`,
      '--accent':                     `${h} ${Math.round(ss * 2)}% 27%`,
      '--accent-foreground':          `${h} ${Math.round(ps * 0.7)}% 90%`,
    });
    setFull(root, {
      '--surface-container-low':      `hsl(${h}, ${Math.round(ss)}%, 10%)`,
      '--surface-container':          `hsl(${h}, ${Math.round(ss * 0.9)}%, 13%)`,
      '--surface-container-high':     `hsl(${h}, ${Math.round(ss * 0.7)}%, 16%)`,
      '--surface-container-highest':  `hsl(${h}, ${Math.round(ss * 0.5)}%, 21%)`,
      '--primary-container':          `hsl(${h}, ${Math.round(cs)}%, 28%)`,
      '--on-primary-container':       `hsl(${h}, ${ps}%, 92%)`,
      '--secondary-container':        `hsl(${h}, ${Math.round(ss * 2)}%, 27%)`,
      '--on-secondary-container':     `hsl(${h}, ${Math.round(ps * 0.6)}%, 90%)`,
      '--outline':                    `hsl(${h}, 5%, 55%)`,
    });
  } else {
    set(root, {
      '--primary':                    `${h} ${ps}% 38%`,
      '--primary-foreground':         `0 0% 100%`,
      '--secondary':                  `${h} ${Math.round(cs * 0.5)}% 88%`,
      '--secondary-foreground':       `${h} ${Math.round(ps * 0.6)}% 14%`,
      '--background':                 `${h} 30% 99%`,
      '--foreground':                 `${h} 8% 10%`,
      '--card':                       `${h} 22% 95%`,
      '--card-foreground':            `${h} 8% 10%`,
      '--card-border':                `${h} 10% 82%`,
      '--popover':                    `${h} 22% 95%`,
      '--popover-foreground':         `${h} 8% 10%`,
      '--popover-border':             `${h} 10% 82%`,
      '--muted':                      `${h} 16% 92%`,
      '--muted-foreground':           `${h} 8% 36%`,
      '--border':                     `${h} 10% 80%`,
      '--input':                      `${h} 16% 92%`,
      '--ring':                       `${h} ${ps}% 38%`,
      '--accent':                     `${h} ${Math.round(cs * 0.5)}% 88%`,
      '--accent-foreground':          `${h} ${Math.round(ps * 0.6)}% 14%`,
    });
    setFull(root, {
      '--surface-container-low':      `hsl(${h}, 25%, 97%)`,
      '--surface-container':          `hsl(${h}, 20%, 95%)`,
      '--surface-container-high':     `hsl(${h}, 15%, 92%)`,
      '--surface-container-highest':  `hsl(${h}, 12%, 89%)`,
      '--primary-container':          `hsl(${h}, ${Math.round(cs * 0.7)}%, 88%)`,
      '--on-primary-container':       `hsl(${h}, ${ps}%, 14%)`,
      '--secondary-container':        `hsl(${h}, ${Math.round(cs * 0.5)}%, 88%)`,
      '--on-secondary-container':     `hsl(${h}, ${Math.round(cs * 0.5)}%, 14%)`,
      '--outline':                    `hsl(${h}, 5%, 50%)`,
    });
  }
}

/** Remove all dynamic palette overrides, restoring the default M3 baseline. */
export function resetPalette(): void {
  const vars = [
    '--primary', '--primary-foreground',
    '--secondary', '--secondary-foreground',
    '--background', '--foreground',
    '--card', '--card-foreground', '--card-border',
    '--popover', '--popover-foreground', '--popover-border',
    '--muted', '--muted-foreground',
    '--border', '--input', '--ring',
    '--accent', '--accent-foreground',
    '--surface-container-low', '--surface-container',
    '--surface-container-high', '--surface-container-highest',
    '--primary-container', '--on-primary-container',
    '--secondary-container', '--on-secondary-container', '--outline',
  ];
  const root = document.documentElement;
  vars.forEach(v => root.style.removeProperty(v));
}

function set(root: HTMLElement, vars: Record<string, string>) {
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
}
function setFull(root: HTMLElement, vars: Record<string, string>) {
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
}
