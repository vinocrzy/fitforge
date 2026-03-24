// ═══════════════════════════════════════════════════════════════════
// FitForge — Cloud Sync Register Page (Phase 7)
// Create a new sync account (email + password + CouchDB server URL).
// When NEXT_PUBLIC_COUCHDB_URL is set the managed server is the
// default; users can toggle to supply their own CouchDB URL instead.
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { springGentle, springSnappy } from '@/lib/motion/springs';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Icon } from '@/components/ui/Icon';
import { useAuthStore } from '@/store/useAuthStore';
import type { CloudAccount } from '@/types';

const MANAGED_SERVER = process.env.NEXT_PUBLIC_COUCHDB_URL ?? '';
const HAS_MANAGED_SERVER = MANAGED_SERVER.length > 0;

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [useOwnServer, setUseOwnServer] = useState(!HAS_MANAGED_SERVER);
  const [customUrl, setCustomUrl] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resolvedUrl = useOwnServer ? customUrl : MANAGED_SERVER;
  const passwordsMatch = password === confirmPassword;
  const isValid =
    email.trim().length > 0 &&
    password.length >= 6 &&
    passwordsMatch &&
    resolvedUrl.trim().length > 0;

  const handleRegister = async () => {
    setError(null);
    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const trimmedUrl = resolvedUrl.trim().replace(/\/$/, '');
      const urlObj = new URL(trimmedUrl);
      const couchDbUrl = `${urlObj.protocol}//${encodeURIComponent(email.trim())}:${encodeURIComponent(password)}@${urlObj.host}${urlObj.pathname}`;

      const account: CloudAccount = {
        userId: email.trim(),
        email: email.trim(),
        displayName: displayName.trim() || undefined,
        couchDbUrl,
        createdAt: new Date().toISOString(),
      };

      // For self-hosted CouchDB, the user already exists on the server.
      // We simply persist the credentials and start syncing.
      login(account);
      router.push('/profile');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid server URL — check the format');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0B0B0B] px-6 pt-safe-top pb-8 overflow-y-auto">
      {/* Back */}
      <div className="pt-4">
        <motion.button
          whileTap={{ scale: 0.92 }}
          transition={springSnappy}
          onClick={() => router.back()}
          className="flex items-center gap-1.5 h-10"
        >
          <Icon name="chevron.left" size={18} color="rgba(245,245,245,0.55)" />
          <span className="text-[17px]" style={{ color: 'rgba(245,245,245,0.55)' }}>
            Back
          </span>
        </motion.button>
      </div>

      <motion.div
        className="mt-8 flex flex-col gap-6"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={springGentle}
      >
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div
            className="w-[56px] h-[56px] rounded-[16px] flex items-center justify-center mb-2"
            style={{ background: 'rgba(197,247,79,0.10)' }}
          >
            <Icon name="person.crop.circle.badge.plus" size={28} color="#C5F74F" />
          </div>
          <h1 className="text-[34px] font-extrabold tracking-tight" style={{ color: '#F5F5F5' }}>
            Set Up Sync
          </h1>
          <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(245,245,245,0.55)' }}>
            Enter your CouchDB credentials to enable cross-device sync.
          </p>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-3">
          <FormField
            label="Display Name (optional)"
            type="text"
            value={displayName}
            onChange={setDisplayName}
            placeholder="Alex Smith"
            autoComplete="name"
          />
          <FormField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <FormField
            label="Password (min 6 chars)"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete="new-password"
          />
          <FormField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="••••••••"
            autoComplete="new-password"
            hasError={confirmPassword.length > 0 && !passwordsMatch}
          />

          {/* Server selector — only shown when a managed server is configured */}
          {HAS_MANAGED_SERVER && (
            <ServerToggle
              useOwnServer={useOwnServer}
              onToggle={setUseOwnServer}
            />
          )}

          {/* Custom URL field — always shown in self-hosted mode, conditionally in managed mode */}
          <AnimatePresence initial={false}>
            {useOwnServer && (
              <motion.div
                key="custom-url"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                <FormField
                  label="Your CouchDB Server URL"
                  type="url"
                  value={customUrl}
                  onChange={setCustomUrl}
                  placeholder="https://my-couch.example.com"
                  autoComplete="url"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(245,245,245,0.35)' }}>
            {useOwnServer
              ? 'Tip: You can self-host CouchDB for free. See docs.couchdb.org for setup.'
              : 'Your data will sync to the shared app server.'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-[12px] flex items-center gap-2"
            style={{ background: 'rgba(255,69,58,0.12)', border: '1px solid rgba(255,69,58,0.25)' }}
          >
            <Icon name="exclamationmark.circle.fill" size={16} color="#FF453A" />
            <p className="text-[14px]" style={{ color: '#FF453A' }}>
              {error}
            </p>
          </motion.div>
        )}

        {/* CTA */}
        <PrimaryButton onClick={handleRegister} disabled={!isValid || loading}>
          {loading ? 'Saving…' : 'Enable Sync'}
        </PrimaryButton>

        {/* Login link */}
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-[15px]" style={{ color: 'rgba(245,245,245,0.45)' }}>
            Already have an account?
          </span>
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={springSnappy}
            onClick={() => router.push('/login')}
            className="text-[15px] font-semibold"
            style={{ color: '#C5F74F' }}
          >
            Sign in
          </motion.button>
        </div>

        {/* Skip */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          transition={springSnappy}
          onClick={() => router.push('/profile')}
          className="text-center text-[14px]"
          style={{ color: 'rgba(245,245,245,0.35)' }}
        >
          Skip for now
        </motion.button>
      </motion.div>
    </div>
  );
}

// ─── Server Toggle ────────────────────────────────────────────────

function ServerToggle({
  useOwnServer,
  onToggle,
}: {
  useOwnServer: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p
        className="text-[13px] font-semibold uppercase tracking-[0.06em]"
        style={{ color: 'rgba(245,245,245,0.45)' }}
      >
        Server
      </p>
      <div
        className="flex rounded-[14px] p-1 gap-1"
        style={{ background: 'rgba(255,255,255,0.07)' }}
      >
        {[
          { label: 'App Server', value: false, icon: 'icloud.fill' },
          { label: 'My Server', value: true, icon: 'gear' },
        ].map((opt) => (
          <motion.button
            key={String(opt.value)}
            whileTap={{ scale: 0.97 }}
            transition={springSnappy}
            onClick={() => onToggle(opt.value)}
            className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-[10px] text-[14px] font-semibold"
            style={{
              background: useOwnServer === opt.value ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: useOwnServer === opt.value ? '#F5F5F5' : 'rgba(245,245,245,0.45)',
            }}
          >
            <Icon
              name={opt.icon}
              size={14}
              color={useOwnServer === opt.value ? '#C5F74F' : 'rgba(245,245,245,0.35)'}
            />
            {opt.label}
          </motion.button>
        ))}
      </div>
      {!useOwnServer && (
        <p className="text-[11px]" style={{ color: 'rgba(245,245,245,0.30)' }}>
          Using the app’s shared CouchDB instance.
        </p>
      )}
    </div>
  );
}

// ─── Form Field ──────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  hasError?: boolean;
}

function FormField({ label, type, value, onChange, placeholder, autoComplete, hasError }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-[13px] font-semibold uppercase tracking-[0.06em]"
        style={{ color: 'rgba(245,245,245,0.45)' }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-[52px] rounded-[14px] px-4 text-[17px] outline-none"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: `1px solid ${hasError ? 'rgba(255,69,58,0.50)' : 'rgba(255,255,255,0.10)'}`,
          color: '#F5F5F5',
          caretColor: '#C5F74F',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = hasError ? 'rgba(255,69,58,0.70)' : 'rgba(197,247,79,0.45)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = hasError ? 'rgba(255,69,58,0.50)' : 'rgba(255,255,255,0.10)';
        }}
      />
    </div>
  );
}
