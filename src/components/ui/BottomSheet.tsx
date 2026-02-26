// ═══════════════════════════════════════════════════════════════════
// FitForge — Bottom Sheet Component (iOS 26 Style)
// Animated sheet with glass material + scale-behind effect
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springGentle, springSnappy } from '@/lib/motion/springs';
import { useSheetStore } from '@/store/useSheetStore';

interface BottomSheetProps {
  id: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  fullHeight?: boolean;
}

export function BottomSheet({
  id,
  open,
  onClose,
  children,
  title,
  fullHeight = false,
}: BottomSheetProps) {
  const { openSheet, closeSheet } = useSheetStore();

  useEffect(() => {
    if (open) {
      openSheet(id);
    } else {
      closeSheet();
    }
    return () => closeSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={springGentle}
            className="fixed left-0 right-0 bottom-0 z-50 flex flex-col glass-sheet"
            style={{
              maxHeight: fullHeight ? '95vh' : '80vh',
              borderRadius: '28px 28px 0 0',
            }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div
                className="w-9 h-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.20)' }}
              />
            </div>

            {/* Title */}
            {title && (
              <div className="flex items-center justify-between px-5 pb-3">
                <h2
                  className="text-[20px] font-bold"
                  style={{ color: '#F5F5F5' }}
                >
                  {title}
                </h2>
                <motion.button
                  onClick={onClose}
                  whileTap={{ scale: 0.9 }}
                  transition={springSnappy}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.10)' }}
                >
                  <span style={{ color: '#F5F5F5', fontSize: 16 }}>✕</span>
                </motion.button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
