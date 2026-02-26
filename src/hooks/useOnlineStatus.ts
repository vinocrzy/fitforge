// ═══════════════════════════════════════════════════════════════════
// FitForge — Online Status Hook
// Listens to navigator.onLine + network events
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const setOnlineGlobal = useSettingsStore((s) => s.setOnline);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOnlineGlobal(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setOnlineGlobal(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineGlobal]);

  return isOnline;
}
