// ═══════════════════════════════════════════════════════════════════
// FitForge — S-PT-11: Subscription Requests
// Full list of pending subscription requests for trainers
// ═══════════════════════════════════════════════════════════════════

'use client';

import { motion } from 'framer-motion';
import { TopBar } from '@/components/layout/TopBar';
import { ConnectionRequestCard } from '@/components/trainer/ConnectionRequestCard';
import { Icon } from '@/components/ui/Icon';
import { useConnections } from '@/hooks/useConnections';

export default function RequestsPage(): React.ReactElement {
  const { data: pendingConnections = [], isLoading } = useConnections({ role: 'trainer', status: 'pending' });

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <TopBar title="Pending Requests" showBack />

      <div className="px-4 pt-[calc(44px+env(safe-area-inset-top,0px)+8px)] pb-28">
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-16 rounded-2xl shimmer"
                style={{ background: '#141414' }}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && pendingConnections.length === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Icon name="checkmark.circle.fill" size={48} color="rgba(245,245,245,0.15)" />
            <p className="text-[17px] font-semibold mt-4" style={{ color: 'rgba(245,245,245,0.55)' }}>
              All caught up
            </p>
            <p className="mt-1 text-[15px]" style={{ color: 'rgba(245,245,245,0.35)' }}>
              No pending requests at the moment.
            </p>
          </motion.div>
        )}

        {/* Request Cards */}
        {!isLoading && pendingConnections.length > 0 && (
          <>
            <p className="text-[13px] font-medium mb-3" style={{ color: 'rgba(245,245,245,0.45)' }}>
              {pendingConnections.length} pending request{pendingConnections.length !== 1 ? 's' : ''}
            </p>
            <div className="flex flex-col gap-2">
              {pendingConnections.map((conn, i) => (
                <ConnectionRequestCard key={conn._id} connection={conn} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
