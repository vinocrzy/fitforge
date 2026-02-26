// ═══════════════════════════════════════════════════════════════════
// FitForge — ExerciseGif Component (Architecture §2.7)
// Progressive loading: skeleton → WebP thumbnail / full GIF
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExerciseGifProps {
  exerciseId: string;
  alt: string;
  /** true = full animated GIF; false = static WebP thumbnail */
  animated?: boolean;
  className?: string;
}

export function ExerciseGif({
  exerciseId,
  alt,
  animated = false,
  className = '',
}: ExerciseGifProps) {
  const [loaded, setLoaded] = useState(false);

  const src = animated
    ? `/data/gifs/${exerciseId}.gif`
    : `/data/previews/${exerciseId}.webp`;

  return (
    <div
      className={`relative w-full aspect-square overflow-hidden rounded-xl bg-[#1E1E1E] ${className}`}
    >
      {/* Skeleton shimmer until image loads */}
      <AnimatePresence>
        {!loaded && (
          <motion.div
            key="skeleton"
            className="absolute inset-0 shimmer"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      <motion.img
        key={src}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
