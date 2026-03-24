// ═══════════════════════════════════════════════════════════════════
// FitForge — Cloud Sync Login Page (Phase 7)
// App identity (display name) is separate from CouchDB credentials
// (couchUsername + couchPassword). Users can have a friendly name
// in the app while using a technical CouchDB username like "admin".
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { springGentle, springSnappy } from '@/lib/motion/springs';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Icon } from '@/components/ui/Icon';
import { useAuthStore } from '@/store/useAuthStore';
import { testCouchDbConnection, type ConnectionResult } from '@/lib/db/testCouchConnection';
import type { CloudAccount } from '@/types';

// Set in .env.local — points to a shared/managed CouchDB instance.
// If empty the app runs in self-hosted-only mode and the URL field is
// always visible.
const MANAGED_SERVER = process.env.NEXT_PUBLIC_COUCHDB_URL ?? '';
const HAS_MANAGED_SERVER = MANAGED_SERVER.length > 0;

type TestState = 'idle' | 'testing' | 'ok' | 'fail';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  // ── App identity (shown in the UI, not used for CouchDB auth) ──
  const [displayName, setDisplayName] = useState('');

  // ── CouchDB credentials (used for actual database auth) ──
  const [couchUsername, setCouchUsername] = useState('');
  const [couchPassword, setCouchPassword] = useState('');

  // ── Server selection ──
  const [useOwnServer, setUseOwnServer] = useState(!HAS_MANAGED_SERVER);
  const [customUrl, setCustomUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Connection test ──
  const [testState, setTestState] = useState<TestState>('idle');
  const [testResult, setTestResult] = useState<ConnectionResult | null>(null);

  const resolvedUrl = useOwnServer ? customUrl : MANAGED_SERVER;

  const resetTest = () => { setTestState('idle'); setTestResult(null); };

  const canTest =
    useOwnServer &&
    customUrl.trim().length > 0 &&
    couchUsername.trim().length > 0 &&
    couchPassword.length >= 1;

  const isValid =
    couchUsername.trim().length > 0 &&
    couchPassword.length >= 1 &&
    resolvedUrl.trim().length > 0 &&
    (!useOwnServer || testState === 'ok');

  const handleTestConnection = async () => {
    setTestState('testing');
    setTestResult(null);
    const result = await testCouchDbConnection(customUrl.trim(), couchUsername.trim(), couchPassword);
    setTestResult(result);
    setTestState(result.ok ? 'ok' : 'fail');
  };

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const trimmedUrl = resolvedUrl.trim().replace(/\/$/, '');
      const urlObj = new URL(trimmedUrl);
      const couchDbUrl = `${urlObj.protocol}//${encodeURIComponent(couchUsername.trim())}:${encodeURIComponent(couchPassword)}@${urlObj.host}${urlObj.pathname}`;

      const account: CloudAccount = {
        displayName: displayName.trim() || couchUsername.trim(),
        couchUsername: couchUsername.trim(),
        couchDbUrl,
        createdAt: new Date().toISOString(),
      };

      login(account);
      router.push('/profile');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid server URL — check the format');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col bg-[#0B0B0B] px-6 overflow-y-auto"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
      }}
    >
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

          {/* ── App identity ── */}
          <SectionDivider label="Your Profile" />
          <FormField
            label="Display Name"
            type="text"
            value={displayName}
            onChange={setDisplayName}
            placeholder="Alex Smith (optional)"
            autoComplete="name"
          />

          {/* ── CouchDB credentials ── */}
          <SectionDivider label="CouchDB Access" />
          <FormField
            label="CouchDB Username"
            type="text"
            value={couchUsername}
            onChange={(v) => { setCouchUsername(v); resetTest(); }}
            placeholder="admin"
            autoComplete="username"
          />
          <FormField
            label="CouchDB Password"
            type="password"
            value={couchPassword}
            onChange={(v) => { setCouchPassword(v); resetTest(); }}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          {/* ── Server ── */}
          <SectionDivider label="Server" />

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
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <FormField
                      label="Your CouchDB Server URL"
                      type="url"
                      value={customUrl}
                      onChange={(v) => { setCustomUrl(v); resetTest(); }}
                      placeholder="https://my-couch.example.com"
                      autoComplete="url"
                    />
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    transition={springSnappy}
                    onClick={handleTestConnection}
                    disabled={!canTest || testState === 'testing'}
                    className="h-[52px] px-4 rounded-[14px] font-semibold text-[14px] flex-shrink-0 flex items-center gap-1.5"
                    style={{
                      background:
                        testState === 'ok' ? 'rgba(48,209,88,0.15)' :
                        testState === 'fail' ? 'rgba(255,69,58,0.12)' :
                        'rgba(255,255,255,0.10)',
                      color:
                        testState === 'ok' ? '#30D158' :
                        testState === 'fail' ? '#FF453A' :
                        'rgba(245,245,245,0.70)',
                      border:
                        testState === 'ok' ? '1px solid rgba(48,209,88,0.30)' :
                        testState === 'fail' ? '1px solid rgba(255,69,58,0.25)' :
                        '1px solid rgba(255,255,255,0.10)',
                      opacity: (!canTest || testState === 'testing') ? 0.5 : 1,
                    }}
                  >
                    {testState === 'testing' && (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                        style={{ display: 'inline-flex' }}
                      >
                        <Icon name="arrow.triangle.2.circlepath" size={15} color="rgba(245,245,245,0.70)" />
                      </motion.span>
                    )}
                    {testState === 'ok' && <Icon name="checkmark.circle.fill" size={15} color="#30D158" />}
                    {testState === 'fail' && <Icon name="exclamationmark.circle.fill" size={15} color="#FF453A" />}
                    {testState === 'idle' && <Icon name="arrow.triangle.2.circlepath" size={15} color="rgba(245,245,245,0.70)" />}
                    {testState === 'testing' ? 'Testing…' :
                     testState === 'ok' ? 'Connected' :
                     testState === 'fail' ? 'Failed' : 'Test'}
                  </motion.button>
                </div>

                {/* Connection result banner */}
                <AnimatePresence>
                  {testResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="mt-2 p-3 rounded-[12px] flex items-start gap-2"
                      style={{
                        background: testResult.ok ? 'rgba(48,209,88,0.10)' : 'rgba(255,69,58,0.10)',
                        border: `1px solid ${testResult.ok ? 'rgba(48,209,88,0.25)' : 'rgba(255,69,58,0.25)'}`,
                      }}
                    >
                      <Icon
                        name={testResult.ok ? 'checkmark.circle.fill' : 'exclamationmark.circle.fill'}
                        size={16}
                        color={testResult.ok ? '#30D158' : '#FF453A'}
                      />
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[13px] font-semibold" style={{ color: testResult.ok ? '#30D158' : '#FF453A' }}>
                          {testResult.ok ? `Connected as ${testResult.username}` : 'Connection failed'}
                        </p>
                        <p className="text-[12px]" style={{ color: 'rgba(245,245,245,0.55)' }}>
                          {testResult.ok ? testResult.serverVersion : testResult.reason}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="text-[12px] mt-1.5" style={{ color: 'rgba(245,245,245,0.35)' }}>
                  Test the connection before signing in.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
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

// ─── Section Divider ─────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: 'rgba(245,245,245,0.30)' }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
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
