// ═══════════════════════════════════════════════════════════════════
// FitForge — (app) Route Group Layout
// Wraps all main app pages with AppLayout (nav, transitions)
// ═══════════════════════════════════════════════════════════════════

import { AppLayout } from '@/components/layout/AppLayout';

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
