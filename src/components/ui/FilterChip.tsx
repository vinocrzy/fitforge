// ═══════════════════════════════════════════════════════════════════
// FitForge — Filter Chip Component
// Horizontal scrollable filter chips
// ═══════════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';

interface FilterChipProps {
  label: string;
  active: boolean;
  onToggle: () => void;
}

export function FilterChip({ label, active, onToggle }: FilterChipProps) {
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.95 }}
      animate={{
        backgroundColor: active
          ? 'rgba(197,247,79,0.15)'
          : 'rgba(255,255,255,0.07)',
        borderColor: active
          ? '#C5F74F'
          : 'rgba(255,255,255,0.10)',
      }}
      transition={springSnappy}
      className="shrink-0 h-[34px] px-4 rounded-full text-[14px] font-medium whitespace-nowrap"
      style={{
        border: active
          ? '1.5px solid #C5F74F'
          : '1px solid rgba(255,255,255,0.10)',
        color: active ? '#C5F74F' : '#F5F5F5',
      }}
    >
      {label}
    </motion.button>
  );
}

interface FilterChipBarProps {
  options: string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  allLabel?: string;
}

export function FilterChipBar({
  options,
  selected,
  onSelect,
  allLabel = 'All',
}: FilterChipBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto py-3 hide-scrollbar">
      <FilterChip
        label={allLabel}
        active={selected === null}
        onToggle={() => onSelect(null)}
      />
      {options.map((opt) => (
        <FilterChip
          key={opt}
          label={opt.charAt(0).toUpperCase() + opt.slice(1)}
          active={selected === opt}
          onToggle={() => onSelect(selected === opt ? null : opt)}
        />
      ))}
    </div>
  );
}
