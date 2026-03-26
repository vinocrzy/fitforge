// ═══════════════════════════════════════════════════════════════════
// FitForge — ClientCard Component
// Trainer's client list item with quick stats
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';

export interface ClientCardProps {
  clientId: string;
  connectionId: string;
  connectedAt: string;
  index?: number;
}

function getTimeSince(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getInitials(id: string): string {
  return id.slice(-4, -2).toUpperCase();
}

export function ClientCard({ clientId, connectedAt, index = 0 }: ClientCardProps): React.ReactElement {
  const router = useRouter();

  return (
    <motion.div
      className="glass rounded-2xl p-4 flex items-center gap-3 cursor-pointer"
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.06 }}
      onClick={() => router.push(`/trainer/clients/${clientId}`)}
      whileTap={{ scale: 0.98 }}
    >
      {/* Avatar */}
      <div
        className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-[16px] font-bold"
        style={{ background: 'linear-gradient(135deg, #C5F74F, #8BC34A)', color: '#0B0B0B' }}
      >
        {getInitials(clientId)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[16px] font-semibold truncate" style={{ color: '#F5F5F5' }}>
          Client {clientId.slice(-6)}
        </p>
        <p className="text-[13px]" style={{ color: 'rgba(245,245,245,0.50)' }}>
          Connected {getTimeSince(connectedAt)}
        </p>
      </div>

      {/* Chevron */}
      <div className="flex-shrink-0">
        <Icon name="chevron.right" size={16} color="rgba(245,245,245,0.30)" />
      </div>
    </motion.div>
  );
}
