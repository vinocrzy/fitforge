// ═══════════════════════════════════════════════════════════════════
// FitForge — PrivacySettingsSheet Component
// Toggle what data is shared with trainer (sheet overlay)
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springDefault } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { useUpdatePrivacy } from '@/hooks/useConnections';
import type { SharedDataSettings } from '@/types';
import { useSheetStore } from '@/store/useSheetStore';

export interface PrivacySettingsSheetProps {
  connectionId: string;
  currentSettings: SharedDataSettings;
}

const PRIVACY_OPTIONS: { key: keyof SharedDataSettings; label: string; description: string; icon: string }[] = [
  { key: 'workoutHistory', label: 'Workout History', description: 'Recent sessions, duration, calories', icon: 'clock.arrow.circlepath' },
  { key: 'personalRecords', label: 'Personal Records', description: 'PRs for weight, reps, volume', icon: 'trophy.fill' },
  { key: 'bodyStats', label: 'Body Stats', description: 'Weight and body measurements', icon: 'scalemass.fill' },
  { key: 'streakData', label: 'Streak Data', description: 'Workout streaks and consistency', icon: 'flame.fill' },
];

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }): React.ReactElement {
  return (
    <motion.button
      onClick={onToggle}
      className="relative w-[51px] h-[31px] rounded-full flex-shrink-0"
      style={{
        background: enabled ? '#C5F74F' : 'rgba(255,255,255,0.12)',
      }}
      animate={{ background: enabled ? '#C5F74F' : 'rgba(255,255,255,0.12)' }}
      transition={springDefault}
    >
      <motion.div
        className="absolute top-[2px] w-[27px] h-[27px] rounded-full"
        style={{ background: enabled ? '#0B0B0B' : '#F5F5F5' }}
        animate={{ left: enabled ? 22 : 2 }}
        transition={springDefault}
      />
    </motion.button>
  );
}

export function PrivacySettingsSheet({ connectionId, currentSettings }: PrivacySettingsSheetProps): React.ReactElement {
  const { isOpen, activeSheet, closeSheet } = useSheetStore();
  const isVisible = isOpen && activeSheet === 'privacy-settings';
  const updatePrivacy = useUpdatePrivacy();

  const [settings, setSettings] = useState<SharedDataSettings>(currentSettings);

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  const handleToggle = (key: keyof SharedDataSettings): void => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    updatePrivacy.mutate({ connectionId, sharedData: newSettings });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(0,0,0,0.60)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSheet}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[61] glass-sheet"
            style={{
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={springDefault}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-9 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.20)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4">
              <h3 className="text-[20px] font-bold" style={{ color: '#F5F5F5' }}>Privacy Settings</h3>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={closeSheet}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.10)' }}
              >
                <Icon name="xmark" size={16} color="rgba(245,245,245,0.60)" />
              </motion.button>
            </div>

            <p className="px-5 pb-4 text-[14px]" style={{ color: 'rgba(245,245,245,0.55)' }}>
              Control what your trainer can see. Changes apply immediately.
            </p>

            {/* Toggles */}
            <div className="px-5 flex flex-col gap-1">
              {PRIVACY_OPTIONS.map((option) => (
                <div
                  key={option.key}
                  className="flex items-center gap-3 py-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(197,247,79,0.10)' }}
                  >
                    <Icon name={option.icon} size={18} color="#C5F74F" weight="fill" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold" style={{ color: '#F5F5F5' }}>{option.label}</p>
                    <p className="text-[12px]" style={{ color: 'rgba(245,245,245,0.45)' }}>{option.description}</p>
                  </div>
                  <Toggle enabled={settings[option.key]} onToggle={() => handleToggle(option.key)} />
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
