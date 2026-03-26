// ═══════════════════════════════════════════════════════════════════
// FitForge — TrainerDashboard Component
// Stats overview, pending requests, and client list for trainers
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { ConnectionRequestCard } from '@/components/trainer/ConnectionRequestCard';
import { ClientCard } from '@/components/trainer/ClientCard';
import { useMyTrainerProfile } from '@/hooks/useTrainers';
import { useConnections, useClients } from '@/hooks/useConnections';

function StatBox({ value, label, color }: { value: string; label: string; color: string }): React.ReactElement {
  return (
    <div className="rounded-2xl p-4 flex flex-col items-center justify-center" style={{ background: '#141414' }}>
      <span className="text-[28px] font-extrabold tabular-nums" style={{ color }}>{value}</span>
      <span className="text-[12px] font-medium mt-0.5" style={{ color: 'rgba(245,245,245,0.55)' }}>{label}</span>
    </div>
  );
}

export function TrainerDashboard(): React.ReactElement {
  const router = useRouter();
  const { data: profile } = useMyTrainerProfile();
  const { data: pendingConnections = [] } = useConnections({ role: 'trainer', status: 'pending' });
  const { data: clients = [] } = useClients('active');

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const displayName = profile?.displayName?.split(' ')[0] ?? 'Trainer';

  return (
    <div className="flex flex-col gap-5">
      {/* Greeting */}
      <motion.div
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <h1
          className="text-[34px] font-extrabold tracking-tight leading-tight"
          style={{ color: '#F5F5F5' }}
        >
          Good {greeting}, {displayName}
        </h1>
        <p className="text-[17px]" style={{ color: 'rgba(245,245,245,0.55)' }}>
          Trainer Hub
        </p>
      </motion.div>

      {/* Quick Stats Grid */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.08 }}
      >
        <div className="grid grid-cols-2 gap-3">
          <StatBox value={String(clients.length)} label="Active Clients" color="#C5F74F" />
          <StatBox value={String(pendingConnections.length)} label="Pending" color="#FF9F0A" />
        </div>
      </motion.div>

      {/* Pending Requests */}
      {pendingConnections.length > 0 && (
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.14 }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-medium tracking-wide uppercase" style={{ color: 'rgba(245,245,245,0.45)' }}>
              Pending Requests ({pendingConnections.length})
            </span>
            {pendingConnections.length > 3 && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                transition={springSnappy}
                onClick={() => router.push('/trainer/requests')}
                className="text-[13px] font-semibold"
                style={{ color: '#C5F74F' }}
              >
                View All
              </motion.button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {pendingConnections.slice(0, 3).map((conn, i) => (
              <ConnectionRequestCard key={conn._id} connection={conn} index={i} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Client List */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.20 }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] font-medium tracking-wide uppercase" style={{ color: 'rgba(245,245,245,0.45)' }}>
            Your Clients ({clients.length})
          </span>
          {clients.length > 5 && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              transition={springSnappy}
              onClick={() => router.push('/trainer/clients')}
              className="text-[13px] font-semibold"
              style={{ color: '#C5F74F' }}
            >
              View All
            </motion.button>
          )}
        </div>

        {clients.length === 0 ? (
          <div className="glass rounded-2xl p-8 flex flex-col items-center gap-3">
            <Icon name="person.crop.circle.fill" size={40} color="rgba(245,245,245,0.15)" />
            <p className="text-[15px] font-semibold" style={{ color: 'rgba(245,245,245,0.50)' }}>
              No clients yet
            </p>
            <p className="text-[13px] text-center" style={{ color: 'rgba(245,245,245,0.35)' }}>
              When users subscribe to you, they&apos;ll appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {clients.slice(0, 5).map((client, i) => (
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
      </motion.div>
    </div>
  );
}
