// ═══════════════════════════════════════════════════════════════════
// FitForge — Top Bar (iOS 26 Liquid Glass Navigation Bar)
// Floating glass nav bar with optional back button
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { springSnappy } from '@/lib/motion/springs';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

export function TopBar({
  title,
  showBack = false,
  rightAction,
  transparent = false,
}: TopBarProps) {
  const router = useRouter();

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-40
        safe-top
        ${transparent ? '' : 'glass-nav-bar'}
      `}
      style={{
        height: 'calc(44px + env(safe-area-inset-top, 0px))',
      }}
    >
      <div className="flex items-center justify-between h-11 px-4 mt-[env(safe-area-inset-top,0px)]">
        {/* Left: back button or spacer */}
        <div className="w-10">
          {showBack && (
            <motion.button
              onClick={() => router.back()}
              whileTap={{ scale: 0.9 }}
              transition={springSnappy}
              className="flex items-center justify-center w-10 h-10 -ml-2"
            >
              <Icon
                name="chevron.left"
                size={22}
                color="rgba(245,245,245,0.70)"
                weight="regular"
              />
            </motion.button>
          )}
        </div>

        {/* Center: inline title */}
        {title && (
          <span className="text-[17px] font-semibold text-[#F5F5F5] truncate max-w-[60%]">
            {title}
          </span>
        )}

        {/* Right: action slot or spacer */}
        <div className="w-10 flex justify-end">
          {rightAction}
        </div>
      </div>
    </header>
  );
}
