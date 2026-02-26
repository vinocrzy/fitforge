// ═══════════════════════════════════════════════════════════════════
// FitForge — Search Bar Component (iOS 26 Style)
// Debounced input with clear button
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search exercises…',
  debounceMs = 250,
}: SearchBarProps) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (val: string) => {
    setLocal(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(val), debounceMs);
  };

  const handleClear = () => {
    setLocal('');
    onChange('');
  };

  return (
    <div
      className="flex items-center gap-3 h-[44px] rounded-[14px] px-[14px]"
      style={{ background: '#1E1E1E' }}
    >
      <Icon
        name="magnifyingglass"
        size={17}
        color="rgba(245,245,245,0.40)"
      />
      <input
        type="search"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[17px] placeholder:text-[rgba(245,245,245,0.30)] outline-none"
        style={{ color: '#F5F5F5' }}
      />
      <AnimatePresence>
        {local.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={springSnappy}
            onClick={handleClear}
          >
            <Icon
              name="xmark"
              size={17}
              color="rgba(245,245,245,0.40)"
            />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
