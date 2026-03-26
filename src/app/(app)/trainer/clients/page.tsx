// ═══════════════════════════════════════════════════════════════════
// FitForge — S-PT-05: Client List
// Trainer's full client list with status filter
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { TopBar } from '@/components/layout/TopBar';
import { ClientCard } from '@/components/trainer/ClientCard';
import { Icon } from '@/components/ui/Icon';
import { useClients } from '@/hooks/useConnections';

const TABS = [
  { id: 'active', label: 'Active' },
  { id: 'pending', label: 'Pending' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ClientListPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabId>('active');
  const { data: clients = [], isLoading } = useClients(activeTab);

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <TopBar title="My Clients" showBack />

      <div className="px-4 pt-[calc(44px+env(safe-area-inset-top,0px)+8px)] pb-28">
        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.96 }}
                transition={springSnappy}
                onClick={() => setActiveTab(tab.id)}
                className="relative px-5 h-9 rounded-full text-[14px] font-semibold"
                style={{
                  background: isActive ? 'rgba(197,247,79,0.15)' : 'rgba(255,255,255,0.06)',
                  color: isActive ? '#C5F74F' : 'rgba(245,245,245,0.50)',
                }}
              >
                {tab.label}
              </motion.button>
            );
          })}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl shimmer"
                style={{ background: '#141414' }}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && clients.length === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Icon name="person.crop.circle.fill" size={48} color="rgba(245,245,245,0.15)" />
            <p className="text-[17px] font-semibold mt-4" style={{ color: 'rgba(245,245,245,0.55)' }}>
              No {activeTab} clients
            </p>
            <p className="mt-1 text-[15px] text-center" style={{ color: 'rgba(245,245,245,0.35)' }}>
              {activeTab === 'active'
                ? 'Accepted clients will appear here.'
                : 'Pending requests will appear here.'}
            </p>
          </motion.div>
        )}

        {/* Client List */}
        {!isLoading && clients.length > 0 && (
          <div className="flex flex-col gap-2">
            {clients.map((client, i) => (
              <ClientCard
                key={client.connectionId}
                clientId={client.clientId}
                connectionId={client.connectionId}
                connectedAt={client.connectedAt}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
