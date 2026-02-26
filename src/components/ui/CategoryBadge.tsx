// ═══════════════════════════════════════════════════════════════════
// FitForge — Category Badge Component
// Gradient-bordered pill chip for exercise categories
// ═══════════════════════════════════════════════════════════════════

const CATEGORY_GRADIENTS: Record<string, string> = {
  strength: 'linear-gradient(135deg, #FF6B35, #FF3B30)',
  cardio: 'linear-gradient(135deg, #32D74B, #0A84FF)',
  stretching: 'linear-gradient(135deg, #BF5AF2, #A18CD1)',
  plyometrics: 'linear-gradient(135deg, #FFD60A, #FF9F0A)',
};

interface CategoryBadgeProps {
  category: string;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ category, size = 'sm' }: CategoryBadgeProps) {
  const gradient = CATEGORY_GRADIENTS[category] ?? CATEGORY_GRADIENTS.strength;
  const isSm = size === 'sm';

  return (
    <span
      className="inline-flex items-center font-medium capitalize"
      style={{
        height: isSm ? 26 : 30,
        padding: isSm ? '0 10px' : '0 14px',
        borderRadius: 100,
        fontSize: isSm ? 13 : 14,
        color: '#F5F5F5',
        border: '1.5px solid transparent',
        background: `linear-gradient(#0B0B0B, #0B0B0B) padding-box, ${gradient} border-box`,
      }}
    >
      {category}
    </span>
  );
}
