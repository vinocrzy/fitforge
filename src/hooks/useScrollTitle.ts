// ═══════════════════════════════════════════════════════════════════
// FitForge — useScrollTitle Hook
// Collapses large title to compact title on scroll (iOS style)
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useRef } from 'react';

interface UseScrollTitleOptions {
  threshold?: number;
}

export function useScrollTitle({ threshold = 56 }: UseScrollTitleOptions = {}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      setIsCollapsed(el.scrollTop > threshold);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return { isCollapsed, containerRef };
}
