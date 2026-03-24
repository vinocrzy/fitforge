// ═══════════════════════════════════════════════════════════════════
// FitForge — Conflict Resolver Sheet (Phase 7)
// Diff-style merge view shown when a routine document has a sync
// conflict (two devices edited the same routine while offline).
//
// User chooses: Keep Mine | Keep Theirs
// The winning version is written back to PouchDB; the losing rev
// is deleted, resolving the CouchDB conflict.
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Icon } from '@/components/ui/Icon';
import { springSnappy } from '@/lib/motion/springs';
import {
  resolveConflictKeepLocal,
  resolveConflictKeepRemote,
} from '@/lib/db/couchSync';
import type { RoutineConflict, Routine } from '@/types';

interface ConflictResolverSheetProps {
  conflict: RoutineConflict | null;
  onClose: () => void;
  onResolved: (id: string) => void;
}

function routineSummary(doc: unknown): {
  name: string;
  exercises: number;
  updatedAt: string;
} {
  const r = doc as Partial<Routine & { updatedAt?: string; createdAt?: string }>;
  const exercises =
    (r.warmUp?.length ?? 0) + (r.workout?.length ?? 0) + (r.stretch?.length ?? 0);
  return {
    name: r.name ?? 'Unnamed Routine',
    exercises,
    updatedAt: r.updatedAt ?? r.createdAt ?? 'Unknown',
  };
}

export function ConflictResolverSheet({
  conflict,
  onClose,
  onResolved,
}: ConflictResolverSheetProps) {
  const [resolving, setResolving] = useState<'local' | 'remote' | null>(null);

  if (!conflict) return null;

  const local = routineSummary(conflict.local);
  const remote = routineSummary(conflict.remote);

  const handleKeepLocal = async () => {
    setResolving('local');
    try {
      await resolveConflictKeepLocal(conflict);
      onResolved(conflict.id);
      onClose();
    } catch (e) {
      console.error('[ConflictResolver] keep local failed:', e);
    } finally {
      setResolving(null);
    }
  };

  const handleKeepRemote = async () => {
    setResolving('remote');
    try {
      await resolveConflictKeepRemote(conflict);
      onResolved(conflict.id);
      onClose();
    } catch (e) {
      console.error('[ConflictResolver] keep remote failed:', e);
    } finally {
      setResolving(null);
    }
  };

  return (
    <BottomSheet
      id="conflict-resolver"
      open={!!conflict}
      onClose={onClose}
      title="Sync Conflict"
      fullHeight={false}
    >
      <div className="p-4 pb-8 flex flex-col gap-4">
        {/* Explanation */}
        <div
          className="p-3 rounded-[12px] flex items-start gap-2"
          style={{ background: 'rgba(255,159,10,0.10)', border: '1px solid rgba(255,159,10,0.20)' }}
        >
          <Icon name="exclamationmark.triangle.fill" size={18} color="#FF9F0A" />
          <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(245,245,245,0.75)' }}>
            Two different versions of <strong style={{ color: '#F5F5F5' }}>{local.name}</strong>{' '}
            were saved on separate devices. Choose which version to keep.
          </p>
        </div>

        {/* Side-by-side versions */}
        <div className="grid grid-cols-2 gap-3">
          {/* Local */}
          <VersionCard
            label="This Device"
            name={local.name}
            exercises={local.exercises}
            updatedAt={local.updatedAt}
            color="#C5F74F"
            icon="iphone"
          />
          {/* Remote */}
          <VersionCard
            label="Another Device"
            name={remote.name}
            exercises={remote.exercises}
            updatedAt={remote.updatedAt}
            color="#64D2FF"
            icon="icloud.fill"
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 mt-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={springSnappy}
            onClick={handleKeepLocal}
            disabled={resolving !== null}
            className="h-[52px] rounded-full font-semibold text-[15px] flex items-center justify-center gap-2"
            style={{
              background: resolving === 'local' ? 'rgba(197,247,79,0.40)' : '#C5F74F',
              color: '#0B0B0B',
            }}
          >
            <Icon name="iphone" size={18} color="#0B0B0B" />
            {resolving === 'local' ? 'Saving…' : "Keep This Device’s Version"}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={springSnappy}
            onClick={handleKeepRemote}
            disabled={resolving !== null}
            className="h-[52px] rounded-full font-semibold text-[15px] flex items-center justify-center gap-2"
            style={{
              background: resolving === 'remote' ? 'rgba(100,210,255,0.30)' : 'rgba(100,210,255,0.15)',
              color: '#64D2FF',
              border: '1px solid rgba(100,210,255,0.30)',
            }}
          >
            <Icon name="icloud.fill" size={18} color="#64D2FF" />
            {resolving === 'remote' ? 'Saving…' : "Keep Other Device’s Version"}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={springSnappy}
            onClick={onClose}
            disabled={resolving !== null}
            className="h-[44px] rounded-full text-[14px] font-medium"
            style={{ color: 'rgba(245,245,245,0.45)' }}
          >
            Decide Later
          </motion.button>
        </div>
      </div>
    </BottomSheet>
  );
}

// ─── VersionCard ────────────────────────────────────────────────────

interface VersionCardProps {
  label: string;
  name: string;
  exercises: number;
  updatedAt: string;
  color: string;
  icon: string;
}

function VersionCard({ label, name, exercises, updatedAt, color, icon }: VersionCardProps) {
  const dateStr = (() => {
    try {
      return new Date(updatedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return updatedAt;
    }
  })();

  return (
    <div
      className="p-3 rounded-[14px] flex flex-col gap-2"
      style={{
        background: `${color}10`,
        border: `1px solid ${color}30`,
      }}
    >
      <div className="flex items-center gap-1.5">
        <Icon name={icon} size={14} color={color} />
        <p className="text-[11px] uppercase font-semibold" style={{ color, letterSpacing: '0.5px' }}>
          {label}
        </p>
      </div>
      <p className="text-[14px] font-semibold leading-snug" style={{ color: '#F5F5F5' }}>
        {name}
      </p>
      <p className="text-[11px]" style={{ color: 'rgba(245,245,245,0.45)' }}>
        {exercises} exercise{exercises !== 1 ? 's' : ''}
      </p>
      <p className="text-[10px]" style={{ color: 'rgba(245,245,245,0.30)' }}>
        {dateStr}
      </p>
    </div>
  );
}
