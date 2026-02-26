// ═══════════════════════════════════════════════════════════════════
// FitForge — Difficulty Dots Component
// Visual 3-dot difficulty indicator
// ═══════════════════════════════════════════════════════════════════

interface DifficultyDotsProps {
  level: 'beginner' | 'intermediate' | 'advanced';
  size?: number;
}

const LEVEL_MAP = { beginner: 1, intermediate: 2, advanced: 3 };

export function DifficultyDots({ level, size = 6 }: DifficultyDotsProps) {
  const filled = LEVEL_MAP[level] ?? 1;
  return (
    <div className="flex items-center" style={{ gap: size * 0.5 }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: size,
            height: size,
            background: i <= filled ? '#C5F74F' : 'rgba(255,255,255,0.20)',
          }}
        />
      ))}
    </div>
  );
}
