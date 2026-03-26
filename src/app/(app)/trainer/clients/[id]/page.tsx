// ═══════════════════════════════════════════════════════════════════
// FitForge — S-PT-06: Client Detail
// Trainer's deep-dive into client progress with tabs
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState, use } from 'react';
import { motion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { TopBar } from '@/components/layout/TopBar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ClientProgressView } from '@/components/trainer/ClientProgressView';
import { ClientWorkoutList } from '@/components/trainer/ClientWorkoutList';
import { SuggestRoutineSheet } from '@/components/trainer/SuggestRoutineSheet';
import { useClientPRs } from '@/hooks/useClientProgress';
import { Icon } from '@/components/ui/Icon';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'workouts', label: 'Workouts' },
  { id: 'prs', label: 'PRs' },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ClientDetailPage({ params }: PageProps): React.ReactElement {
  const { id: clientId } = use(params);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showSuggestSheet, setShowSuggestSheet] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <TopBar title="Client Detail" showBack />

      {/* Offset content below the fixed TopBar (44px nav + safe-area-inset-top) */}
      <div
        className="px-5 pb-32"
        style={{ paddingTop: 'calc(44px + env(safe-area-inset-top, 0px) + 16px)' }}
      >
        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-full glass mb-5">
          {TABS.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2 rounded-full text-[14px] font-medium text-center relative"
              style={{
                color: activeTab === tab.id ? '#0B0B0B' : 'rgba(245,245,245,0.55)',
              }}
              whileTap={{ scale: 0.95 }}
              transition={springSnappy}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="client-detail-tab"
                  className="absolute inset-0 rounded-full"
                  style={{ background: '#C5F74F' }}
                  transition={springSnappy}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <ClientProgressView clientId={clientId} />
        )}

        {activeTab === 'workouts' && (
          <ClientWorkoutList clientId={clientId} />
        )}

        {activeTab === 'prs' && (
          <PRsTab clientId={clientId} />
        )}

        {/* Suggest routine button */}
        <div className="mt-8">
          <PrimaryButton onClick={() => setShowSuggestSheet(true)}>
            SUGGEST A ROUTINE
          </PrimaryButton>
        </div>
      </div>

      <SuggestRoutineSheet
        clientId={clientId}
        open={showSuggestSheet}
        onClose={() => setShowSuggestSheet(false)}
      />
    </div>
  );
}

// ─── PRs Tab ──────────────────────────────────────────────────────

function PRsTab({ clientId }: { clientId: string }): React.ReactElement {
  const { data: prs, isLoading } = useClientPRs(clientId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl glass animate-pulse h-16" />
        ))}
      </div>
    );
  }

  if (!prs || prs.length === 0) {
    return (
      <div className="text-center py-12">
        <Icon name="trophy.fill" size={32} className="mx-auto mb-3 opacity-30" />
        <p
          className="text-[15px]"
          style={{ color: 'rgba(245,245,245,0.45)' }}
        >
          No personal records yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {prs.map((pr, i) => (
        <div key={`${pr.exerciseId}-${pr.type}-${i}`} className="rounded-2xl p-4 glass">
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-[15px] font-semibold"
                style={{ color: '#F5F5F5' }}
              >
                {pr.exerciseId}
              </p>
              <p
                className="text-[13px] mt-0.5 capitalize"
                style={{ color: 'rgba(245,245,245,0.45)' }}
              >
                {pr.type}
              </p>
            </div>
            <div className="text-right">
              <p
                className="text-[20px] font-bold"
                style={{ color: '#C5F74F' }}
              >
                {pr.value}
                <span className="text-[13px] font-normal ml-1" style={{ color: 'rgba(245,245,245,0.45)' }}>
                  {pr.type === 'weight' ? 'kg' : pr.type === 'reps' ? 'reps' : 'vol'}
                </span>
              </p>
              {pr.achievedAt && (
                <p className="text-[11px]" style={{ color: 'rgba(245,245,245,0.35)' }}>
                  {new Date(pr.achievedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
