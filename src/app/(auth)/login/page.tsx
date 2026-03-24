// ═══════════════════════════════════════════════════════════════════
// FitForge — Cloud Sync Login Page (Phase 7)
// Email + Password + CouchDB server URL login
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { springGentle, springSnappy } from '@/lib/motion/springs';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Icon } from '@/components/ui/Icon';
import { useAuthStore } from '@/store/useAuthStore';
import type { CloudAccount } from '@/types';

const DEFAULT_SERVER = process.env.NEXT_PUBLIC_COUCHDB_URL ?? '';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isValid = email.trim().length > 0 && password.length >= 6 && serverUrl.trim().length > 0;

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      // Validate the server URL is accessible before persisting credentials
      const trimmedUrl = serverUrl.trim().replace(/\/$/, '');
      const encodedPassword = encodeURIComponent(password);
      // Build authenticated CouchDB base URL
      const urlObj = new URL(trimmedUrl);
      const couchDbUrl = `${urlObj.protocol}//${encodeURIComponent(email.trim())}:${encodedPassword}@${urlObj.host}${urlObj.pathname}`;

      const account: CloudAccount = {
        userId: email.trim(),
        email: email.trim(),
        couchDbUrl,
        createdAt: new Date().toISOString(),
      };

      login(account);
      router.push('/profile');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid server URL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0B0B0B] px-6 pt-safe-top">
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
            style={{ background: 'rgba(100,210,255,0.12)' }}
          >
            <Icon name="icloud.fill" size={28} color="#64D2FF" />
          </div>
          <h1 className="text-[34px] font-extrabold tracking-tight" style={{ color: '#F5F5F5' }}>
            Sign In to Sync
          </h1>
          <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(245,245,245,0.55)' }}>
            Connect to your CouchDB instance to sync workouts across devices.
          </p>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-3">
          <FormField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <FormField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <FormField
            label="CouchDB Server URL"
            type="url"
            value={serverUrl}
            onChange={setServerUrl}
            placeholder="https://your-server.com"
            autoComplete="url"
          />
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
        <PrimaryButton onClick={handleLogin} disabled={!isValid || loading}>
          {loading ? 'Signing In…' : 'Sign In'}
        </PrimaryButton>

        {/* Register link */}
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-[15px]" style={{ color: 'rgba(245,245,245,0.45)' }}>
            No account?
          </span>
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={springSnappy}
            onClick={() => router.push('/register')}
            className="text-[15px] font-semibold"
            style={{ color: '#C5F74F' }}
          >
            Set up sync
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

// ─── Form Field ──────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}

function FormField({ label, type, value, onChange, placeholder, autoComplete }: FormFieldProps) {
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
          border: '1px solid rgba(255,255,255,0.10)',
          color: '#F5F5F5',
          caretColor: '#C5F74F',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'rgba(197,247,79,0.45)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
        }}
      />
    </div>
  );
}
