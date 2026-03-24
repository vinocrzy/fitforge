// ═══════════════════════════════════════════════════════════════════
// FitForge — User Select Screen (Phase 7)
// Shown when the device has multiple accounts or the app is locked.
// Tapping a profile without a PIN switches immediately.
// Tapping a PIN-protected profile opens the numeric PIN pad.
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { springDefault, springSnappy, springCelebration } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { useAuthStore } from '@/store/useAuthStore';
import { verifyPin } from '@/lib/auth/pin';
import type { CloudAccount } from '@/types';

const PIN_LENGTH = 6;

export default function UserSelectPage() {
  const router = useRouter();
  const accounts = useAuthStore((s) => s.accounts);
  const setActiveUser = useAuthStore((s) => s.setActiveUser);

  // Redirect to register if no accounts exist on this device
  useEffect(() => {
    if (accounts.length === 0) {
      router.replace('/register');
    }
  }, [accounts.length, router]);

  const [pending, setPending] = useState<CloudAccount | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSelectAccount = useCallback(
    (account: CloudAccount) => {
      if (!account.appPinHash) {
        // No PIN — switch immediately
        setActiveUser(account.userId);
        router.replace('/');
        return;
      }
      // PIN required — open PIN pad
      setPending(account);
      setPin('');
      setPinError(false);
    },
    [setActiveUser, router],
  );

  const submitPin = useCallback(
    async (fullPin: string) => {
      if (!pending) return;
      setVerifying(true);
      const ok = await verifyPin(fullPin, pending.userId, pending.appPinHash!);
      if (ok) {
        setActiveUser(pending.userId);
        router.replace('/');
      } else {
        setPinError(true);
        setPin('');
      }
      setVerifying(false);
    },
    [pending, setActiveUser, router],
  );

  const handleDigit = useCallback(
    (d: string) => {
      if (!pending || verifying) return;
      const next = pin + d;
      setPin(next);
      setPinError(false);
      if (next.length === PIN_LENGTH) {
        submitPin(next);
      }
    },
    [pending, verifying, pin, submitPin],
  );

  const handleBackspace = () => {
    setPin((p) => p.slice(0, -1));
    setPinError(false);
  };

  return (
    <div
      className="fixed inset-0 flex flex-col bg-[#0B0B0B]"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
      }}
    >
      <AnimatePresence mode="wait">
        {!pending ? (
          /* ────────────────── User Picker ────────────────── */
          <motion.div
            key="picker"
            className="flex flex-col flex-1 px-6 pt-10 overflow-y-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={springDefault}
          >
            {/* Logo mark */}
            <div
              className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-8"
              style={{ background: 'rgba(197,247,79,0.12)' }}
            >
              <Icon name="dumbbell.fill" size={24} color="#C5F74F" />
            </div>

            <h1
              className="text-[34px] font-extrabold tracking-tight mb-1"
              style={{ color: '#F5F5F5' }}
            >
              Who&apos;s working out?
            </h1>
            <p className="text-[15px] mb-8" style={{ color: 'rgba(245,245,245,0.45)' }}>
              Pick your profile to continue.
            </p>

            <div className="flex flex-col gap-3">
              {accounts.map((account, i) => (
                <motion.button
                  key={account.userId}
                  className="flex items-center gap-4 p-4 rounded-[20px] text-left w-full"
                  style={{ background: '#141414' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springSnappy, delay: i * 0.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelectAccount(account)}
                >
                  {/* Avatar */}
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-[20px] font-bold flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #C5F74F, #8BC34A)',
                      color: '#0B0B0B',
                    }}
                  >
                    {getInitials(account)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[17px] font-semibold truncate"
                      style={{ color: '#F5F5F5' }}
                    >
                      {account.displayName}
                    </div>
                    {/* Always show @couchUsername — guaranteed unique per server, resolves same-name collisions */}
                    <div
                      className="text-[13px] mt-0.5 truncate"
                      style={{ color: 'rgba(245,245,245,0.40)' }}
                    >
                      @{account.couchUsername}
                      <span style={{ color: 'rgba(245,245,245,0.20)' }}>
                        {' '}·{' '}{maskServerUrl(account.couchDbUrl)}
                      </span>
                    </div>
                  </div>

                  {account.appPinHash ? (
                    <Icon name="lock.fill" size={15} color="rgba(245,245,245,0.30)" />
                  ) : (
                    <Icon name="chevron.right" size={13} color="rgba(245,245,245,0.20)" />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Add account */}
            <motion.button
              className="mt-4 flex items-center justify-center gap-2 h-14 rounded-[20px] w-full"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px dashed rgba(255,255,255,0.10)',
              }}
              whileTap={{ scale: 0.97 }}
              transition={springSnappy}
              onClick={() => router.push('/register')}
            >
              <Icon name="person.badge.plus" size={18} color="rgba(245,245,245,0.35)" />
              <span className="text-[15px] font-medium" style={{ color: 'rgba(245,245,245,0.45)' }}>
                Add Account
              </span>
            </motion.button>
          </motion.div>
        ) : (
          /* ────────────────── PIN Pad ────────────────── */
          <motion.div
            key="pin"
            className="flex flex-col flex-1 px-6 pt-10 items-center"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={springDefault}
          >
            {/* Back */}
            <motion.button
              className="self-start flex items-center gap-1.5 h-10 mb-8"
              whileTap={{ scale: 0.92 }}
              transition={springSnappy}
              onClick={() => { setPending(null); setPin(''); setPinError(false); }}
            >
              <Icon name="chevron.left" size={18} color="rgba(245,245,245,0.55)" />
              <span className="text-[17px]" style={{ color: 'rgba(245,245,245,0.55)' }}>
                Back
              </span>
            </motion.button>

            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-[28px] font-bold mb-4"
              style={{ background: 'linear-gradient(135deg, #C5F74F, #8BC34A)', color: '#0B0B0B' }}
            >
              {getInitials(pending)}
            </div>
            <div className="text-[22px] font-bold mb-1" style={{ color: '#F5F5F5' }}>
              {pending.displayName}
            </div>
            <div className="text-[14px] mb-10" style={{ color: 'rgba(245,245,245,0.45)' }}>
              Enter your {PIN_LENGTH}-digit PIN
            </div>

            {/* PIN dots */}
            <div className="flex gap-4 mb-3">
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-4 h-4 rounded-full"
                  animate={{
                    scale: pinError ? [1, 1.4, 1] : i < pin.length ? [1, 1.15, 1] : 1,
                    backgroundColor:
                      pinError
                        ? '#FF453A'
                        : i < pin.length
                        ? '#C5F74F'
                        : 'rgba(255,255,255,0.18)',
                  }}
                  transition={pinError ? springCelebration : springSnappy}
                />
              ))}
            </div>

            <AnimatePresence>
              {pinError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[13px] mb-3"
                  style={{ color: '#FF453A' }}
                >
                  Incorrect PIN — try again
                </motion.p>
              )}
            </AnimatePresence>

            {/* Numeric keypad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, idx) => {
                if (key === '') return <div key={`${idx}-empty`} />;

                const isBackspace = key === '⌫';
                return (
                  <motion.button
                    key={key}
                    className="h-16 rounded-[18px] flex items-center justify-center text-[24px] font-medium"
                    style={{
                      background: isBackspace ? 'transparent' : 'rgba(255,255,255,0.08)',
                      color: '#F5F5F5',
                    }}
                    whileTap={{ scale: 0.91 }}
                    transition={springSnappy}
                    disabled={verifying}
                    onClick={() => (isBackspace ? handleBackspace() : handleDigit(key))}
                    aria-label={isBackspace ? 'Delete' : key}
                  >
                    {isBackspace && verifying ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                        style={{ display: 'inline-flex' }}
                      >
                        <Icon
                          name="arrow.triangle.2.circlepath"
                          size={20}
                          color="rgba(245,245,245,0.55)"
                        />
                      </motion.span>
                    ) : isBackspace ? (
                      <Icon name="delete.left" size={20} color="rgba(245,245,245,0.70)" />
                    ) : (
                      key
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────

function getInitials(account: CloudAccount): string {
  const parts = account.displayName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return account.displayName.slice(0, 2).toUpperCase();
}

/** Strip embedded Basic Auth credentials from CouchDB URL for display. */
function maskServerUrl(couchDbUrl: string): string {
  try {
    const u = new URL(couchDbUrl);
    return u.host;
  } catch {
    return '';
  }
}
