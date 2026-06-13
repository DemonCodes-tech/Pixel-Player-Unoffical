import React, { useEffect, useRef, useState } from 'react';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  pixelSize?: number;
  barCount?: number;
  height?: number;
}

/**
 * Pixel-art style audio visualizer that reacts to music in real-time.
 * Uses Web Audio API to analyze frequency data and render pixelated bars.
 * 
 * Design: Retro 8-bit aesthetic with blocky, square pixels forming vertical bars
 * that respond to different frequency bands of the audio.
 */
export function AudioVisualizer({
  audioRef,
  isPlaying,
  pixelSize = 8,
  barCount = 32,
  height = 120,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Web Audio API
  useEffect(() => {
    if (!audioRef.current) return;

    const initAudio = () => {
      if (audioContextRef.current) return; // Already initialized

      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 256; // 128 frequency bins
        analyzer.smoothingTimeConstant = 0.85; // Smooth transitions

        const source = (audioContext as any).createMediaElementAudioSource(audioRef.current!);
        source.connect(analyzer);
        analyzer.connect(audioContext.destination);

        audioContextRef.current = audioContext;
        analyzerRef.current = analyzer;
        dataArrayRef.current = new Uint8Array(analyzer.frequencyBinCount);
        sourceRef.current = source;
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Web Audio API:', error);
      }
    };

    // Initialize on first user interaction (browsers require this)
    const handleUserInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [audioRef]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !isInitialized || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      if (!analyzerRef.current || !dataArrayRef.current) {
        animationIdRef.current = requestAnimationFrame(animate);
        return;
      }

      // Get frequency data
      analyzerRef.current.getByteFrequencyData(dataArrayRef.current);

      // Clear canvas with dark background
      ctx.fillStyle = '#0f0f1e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw pixelated bars
      const barWidth = Math.floor(canvas.width / barCount);
      const barSpacing = 2;
      const effectiveBarWidth = barWidth - barSpacing;

      for (let i = 0; i < barCount; i++) {
        // Get frequency data for this bar (sample from different frequency bands)
        const frequencyIndex = Math.floor((i / barCount) * dataArrayRef.current.length);
        const frequency = dataArrayRef.current[frequencyIndex];

        // Map frequency (0-255) to bar height (0-canvas.height)
        const barHeight = (frequency / 255) * canvas.height;

        // Calculate bar position
        const x = i * barWidth + barSpacing / 2;
        const y = canvas.height - barHeight;

        // Create gradient color based on frequency
        const hue = (i / barCount) * 360; // Rainbow gradient
        const saturation = 80 + (frequency / 255) * 20; // More saturated for louder frequencies
        const lightness = 50 + (frequency / 255) * 10; // Brighter for louder frequencies

        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

        // Draw pixelated bar (rounded squares for pixel effect)
        if (barHeight > 0) {
          // Draw main bar
          ctx.fillRect(x, y, effectiveBarWidth, barHeight);

          // Add pixel grid effect by drawing subtle grid lines
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 0.5;
          for (let py = 0; py < barHeight; py += pixelSize) {
            ctx.strokeRect(x, y + py, effectiveBarWidth, pixelSize);
          }
        }

        // Draw a small glow effect at the top of each bar
        if (barHeight > pixelSize) {
          ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${Math.min(100, lightness + 30)}%)`;
          ctx.fillRect(x, y - pixelSize, effectiveBarWidth, pixelSize);
        }
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animationIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isPlaying, isInitialized, barCount, pixelSize]);

  // Stop animation when not playing
  useEffect(() => {
    if (!isPlaying && animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;

      // Clear canvas with fade-out effect
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0f0f1e';
          ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    }
  }, [isPlaying]);

  return (
    <div className="w-full bg-gradient-to-b from-slate-900 to-slate-950 rounded-lg overflow-hidden border border-purple-500/30">
      <canvas
        ref={canvasRef}
        width={512}
        height={height}
        className="w-full h-full block"
        style={{
        imageRendering: 'pixelated' as const,
        } as React.CSSProperties}
      />
    </div>
  );
}
