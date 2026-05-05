'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { springDefault, springSnappy, springGentle } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useMealTemplates, useDeleteTemplate, useLogTemplate } from '@/hooks/useMealTemplates';
import type { MealTemplate, MealSlot } from '@/types';

// ─── Slot colours ─────────────────────────────────────────────────

const SLOT_COLORS: Record<MealSlot, string> = {
  breakfast: '#FF9F0A',
  lunch: '#32D74B',
  dinner: '#0A84FF',
  snack: '#BF5AF2',
};

// ─── SlotPill ────────────────────────────────────────────────────

interface SlotPillProps {
  slot: MealSlot;
}

function SlotPill({ slot }: SlotPillProps) {
  const color = SLOT_COLORS[slot];
  return (
    <span
      style={{
        background: color + '26',
        color,
        border: `1px solid ${color}4D`,
        borderRadius: 20,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'capitalize',
        display: 'inline-block',
        lineHeight: '1.4',
      }}
    >
      {slot}
    </span>
  );
}

// ─── TemplateCard ─────────────────────────────────────────────────

interface TemplateCardProps {
  template: MealTemplate;
  index: number;
  onPress: (t: MealTemplate) => void;
}

function TemplateCard({ template, index, onPress }: TemplateCardProps) {
  const [showDelete, setShowDelete] = useState(false);
  const deleteTemplate = useDeleteTemplate();

  const handlePanEnd = useCallback(
    (_e: unknown, info: { offset: { x: number } }) => {
      if (info.offset.x < -80) {
        setShowDelete(true);
      }
    },
    [],
  );

  const handleDelete = useCallback(() => {
    setShowDelete(false);
    deleteTemplate.mutate({ id: template._id, rev: template._rev ?? '' });
  }, [template, deleteTemplate]);

  const { totalMacros: m, items } = template;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ ...springDefault, delay: index * 0.05 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Red delete button revealed on swipe */}
      <AnimatePresence>
        {showDelete && (
          <motion.button
            key="delete-btn"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={springSnappy}
            onClick={handleDelete}
            className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-20 rounded-r-2xl z-10"
            style={{ background: 'var(--brand-danger)' }}
            aria-label="Delete template"
          >
            <Icon name="trash" size={20} color="white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Card face */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        onPanEnd={handlePanEnd}
        animate={{ x: showDelete ? -80 : 0 }}
        transition={springDefault}
        className="glass rounded-2xl p-4"
        onClick={() => {
          if (showDelete) {
            setShowDelete(false);
          } else {
            onPress(template);
          }
        }}
      >
        {/* Row 1: name + slot pill */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <span
            className="font-bold truncate flex-1"
            style={{ fontSize: 16, color: 'var(--brand-text)' }}
          >
            {template.name}
          </span>
          <SlotPill slot={template.slot} />
        </div>

        {/* Row 2: macro summary */}
        <p style={{ fontSize: 13, color: 'var(--brand-text-2)', margin: '2px 0' }}>
          {m.calories} kcal &middot; P {m.proteinG}g &middot; C {m.carbsG}g &middot; F {m.fatG}g
        </p>

        {/* Row 3: item count */}
        <p style={{ fontSize: 12, color: 'var(--brand-text-3)', marginTop: 2 }}>
          {items.length} item{items.length !== 1 ? 's' : ''}
        </p>
      </motion.div>
    </motion.div>
  );
}

// ─── TemplatesScreen ──────────────────────────────────────────────

export function TemplatesScreen() {
  const router = useRouter();
  const { data: templates = [], isLoading } = useMealTemplates();
  const logTemplate = useLogTemplate();

  const [selectedTemplate, setSelectedTemplate] = useState<MealTemplate | null>(null);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [logSlot, setLogSlot] = useState<MealSlot>('breakfast');

  const todayISO = new Date().toISOString().slice(0, 10);
  const minDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const handleSelectTemplate = useCallback((t: MealTemplate) => {
    setSelectedTemplate(t);
    setLogSlot(t.slot);
    setLogDate(new Date().toISOString().slice(0, 10));
    setIsQuickLogOpen(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setIsQuickLogOpen(false);
  }, []);

  const handleLog = useCallback(() => {
    if (!selectedTemplate) return;
    logTemplate.mutate(
      { template: selectedTemplate, date: logDate, slot: logSlot },
      {
        onSuccess: () => {
          setIsQuickLogOpen(false);
          router.push('/diet');
        },
      },
    );
  }, [selectedTemplate, logDate, logSlot, logTemplate, router]);

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'var(--brand-bg)',
        paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 112,
      }}
    >
      {/* Sticky header */}
      <div className="flex items-center gap-3 mb-6">
        <motion.button
          whileTap={{ scale: 0.88 }}
          transition={springSnappy}
          onClick={() => router.back()}
          className="glass rounded-xl flex items-center justify-center"
          style={{ width: 36, height: 36 }}
          aria-label="Back"
        >
          <Icon name="chevron.left" size={18} color="var(--brand-text)" />
        </motion.button>
        <h1
          className="font-black"
          style={{ fontSize: 22, color: 'var(--brand-text)', letterSpacing: '-0.02em' }}
        >
          Meal Templates
        </h1>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-10 h-10 rounded-full"
            style={{ background: 'var(--brand-surface-2)' }}
          />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && templates.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springDefault}
          className="glass rounded-2xl p-8 flex flex-col items-center text-center mt-8"
        >
          <span style={{ fontSize: 48, lineHeight: 1, marginBottom: 16 }}>🍽</span>
          <p
            className="font-bold mb-2"
            style={{ fontSize: 17, color: 'var(--brand-text)' }}
          >
            No templates yet
          </p>
          <p style={{ fontSize: 14, color: 'var(--brand-text-2)', maxWidth: 260 }}>
            Tap &ldquo;Save as Template&rdquo; in any meal slot to save a set of foods for quick re-logging.
          </p>
        </motion.div>
      )}

      {/* Template list */}
      {!isLoading && templates.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {templates.map((t, i) => (
              <TemplateCard
                key={t._id}
                template={t}
                index={i}
                onPress={handleSelectTemplate}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Quick Log Sheet */}
      <BottomSheet
        id="quick-log-template"
        open={isQuickLogOpen}
        onClose={handleCloseSheet}
        title="Quick Log"
      >
        {selectedTemplate && (
          <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Template summary */}
            <div className="glass rounded-xl p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate" style={{ fontSize: 15, color: 'var(--brand-text)' }}>
                  {selectedTemplate.name}
                </p>
                <p style={{ fontSize: 13, color: 'var(--brand-text-2)', marginTop: 2 }}>
                  {selectedTemplate.totalMacros.calories} kcal &middot; P {selectedTemplate.totalMacros.proteinG}g &middot; C {selectedTemplate.totalMacros.carbsG}g &middot; F {selectedTemplate.totalMacros.fatG}g
                </p>
              </div>
              <SlotPill slot={selectedTemplate.slot} />
            </div>

            {/* Date selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, color: 'var(--brand-text-2)', fontWeight: 600 }}>
                Date
              </label>
              <input
                type="date"
                value={logDate}
                min={minDate}
                max={todayISO}
                onChange={e => setLogDate(e.target.value)}
                style={{
                  background: 'var(--brand-surface-2)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  color: 'var(--brand-text)',
                  fontSize: 16,
                  outline: 'none',
                  colorScheme: 'dark',
                }}
              />
            </div>

            {/* Slot selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, color: 'var(--brand-text-2)', fontWeight: 600 }}>
                Log to
              </label>
              <div className="flex gap-2">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealSlot[]).map((slot) => {
                  const isActive = logSlot === slot;
                  const color = SLOT_COLORS[slot];
                  return (
                    <motion.button
                      key={slot}
                      whileTap={{ scale: 0.88 }}
                      transition={springSnappy}
                      onClick={() => setLogSlot(slot)}
                      style={{
                        flex: 1,
                        borderRadius: 20,
                        padding: '6px 4px',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        border: `1px solid ${color}4D`,
                        background: isActive ? color : color + '1A',
                        color: isActive ? '#0B0B0B' : color,
                        cursor: 'pointer',
                      }}
                    >
                      {slot}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              transition={springSnappy}
              onClick={handleLog}
              disabled={logTemplate.isPending}
              className="rounded-2xl"
              style={{
                background: 'var(--brand-lime)',
                border: 'none',
                padding: '15px',
                fontWeight: 700,
                fontSize: 16,
                color: '#0B0B0B',
                cursor: logTemplate.isPending ? 'not-allowed' : 'pointer',
                opacity: logTemplate.isPending ? 0.7 : 1,
              }}
            >
              {logTemplate.isPending
                ? 'Logging\u2026'
                : `Log ${selectedTemplate.items.length} Item${selectedTemplate.items.length !== 1 ? 's' : ''}`}
            </motion.button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
