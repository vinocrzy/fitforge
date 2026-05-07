'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { springDefault, springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { useFoodSearch } from '@/hooks/useFoodSearch';
import type { FoodLibraryItem, FoodItem } from '@/types';

interface Props {
  slot: string;
  date: string;
}

const CATEGORIES = ['All', 'Protein', 'Grains', 'Dairy', 'Fruit', 'Vegetables', 'Snack', 'Custom'];

// ─── Skeleton row ─────────────────────────────────────────────────

function SkeletonRow({ index }: { index: number }) {
  return (
    <motion.div
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: index * 0.15 }}
      className="flex items-center justify-between px-4 py-3 rounded-xl"
      style={{ background: 'var(--brand-surface-2)' }}
    >
      <div className="space-y-2 flex-1">
        <div className="h-3.5 w-2/3 rounded-md" style={{ background: 'var(--brand-surface-3)' }} />
        <div className="h-2.5 w-1/3 rounded-md" style={{ background: 'var(--brand-surface-3)' }} />
      </div>
      <div className="h-3.5 w-14 rounded-md ml-3" style={{ background: 'var(--brand-surface-3)' }} />
    </motion.div>
  );
}

// ─── FoodResultRow ────────────────────────────────────────────────

interface FoodResultRowProps {
  item: FoodLibraryItem | FoodItem;
  slot: string;
  date: string;
}

function FoodResultRow({ item, slot, date }: FoodResultRowProps) {
  const router = useRouter();
  const isCustom = item.isCustom;
  const foodId = isCustom ? (item as FoodItem)._id : (item as FoodLibraryItem).id;
  const name = item.name;
  const cal = item.per100g.calories;

  const handleTap = () => {
    const params = new URLSearchParams({
      foodId,
      slot,
      date,
      name: encodeURIComponent(name),
      ...(isCustom ? { custom: 'true' } : {}),
    });
    router.push(`/diet/log/portion?${params.toString()}`);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      transition={springSnappy}
      onClick={handleTap}
      className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left"
      style={{ background: 'var(--brand-surface-2)' }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--brand-text)' }}>
            {name}
          </p>
          {item.brand && (
            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--brand-text-2)' }}>
              {item.brand}
            </p>
          )}
        </div>
        {/* Category chip */}
        <span
          className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full glass"
          style={{ color: 'var(--brand-text-2)' }}
        >
          {item.category}
        </span>
      </div>
      <span
        className="ml-3 shrink-0 text-sm tabular-nums font-semibold"
        style={{ color: 'var(--brand-text-2)' }}
      >
        {cal} kcal
      </span>
    </motion.button>
  );
}

// ─── FoodSearchScreen ─────────────────────────────────────────────

export function FoodSearchScreen({ slot, date }: Props) {
  const router = useRouter();
  const { query, setQuery, results, isLoading } = useFoodSearch();

  const slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1);

  const handleCategoryTap = (cat: string) => {
    setQuery(cat === 'All' ? '' : cat);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'var(--brand-bg)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <motion.button
          whileTap={{ scale: 0.92 }}
          transition={springSnappy}
          onClick={() => router.back()}
          className="flex items-center justify-center w-9 h-9 rounded-full glass"
          aria-label="Go back"
        >
          <Icon name="chevron.left" size={20} color="var(--brand-text)" />
        </motion.button>

        <h1
          className="flex-1 font-bold text-lg"
          style={{ color: 'var(--brand-text)', letterSpacing: '-0.02em' }}
        >
          Add Food ({slotLabel})
        </h1>

        <motion.button
          whileTap={{ scale: 0.92 }}
          transition={springSnappy}
          onClick={() => router.push(`/diet/log/barcode?slot=${slot}&date=${date}`)}
          className="flex items-center justify-center w-9 h-9 rounded-full glass"
          aria-label="Scan barcode"
        >
          <Icon name="barcode.viewfinder" size={20} color="var(--brand-text-2)" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.92 }}
          transition={springSnappy}
          onClick={() => router.push(`/diet/food/new?slot=${slot}&date=${date}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs font-semibold"
          style={{ color: 'var(--brand-lime)' }}
          aria-label="Create new custom food"
        >
          <Icon name="plus" size={14} color="var(--brand-lime)" />
          New
        </motion.button>
      </div>

      {/* Search input */}
      <div className="px-4 pt-2 pb-3">
        <div
          className="flex items-center gap-2 px-3 py-3 rounded-2xl glass"
        >
          <Icon name="magnifyingglass" size={18} color="var(--brand-text-2)" />
          <input
            type="text"
            autoFocus
            placeholder="Search foods…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--brand-text)' }}
          />
          <AnimatePresence>
            {query.length > 0 && (
              <motion.button
                key="clear"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={springSnappy}
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <Icon name="xmark" size={16} color="var(--brand-text-2)" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Category quick-filter */}
      <div className="px-4 pb-3 overflow-x-auto">
        <div className="flex gap-2 w-max">
          {CATEGORIES.map((cat) => {
            const isActive =
              cat === 'All' ? query === '' : query.toLowerCase() === cat.toLowerCase();
            return (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.94 }}
                transition={springSnappy}
                onClick={() => handleCategoryTap(cat)}
                className={cn('px-3 py-1.5 rounded-full text-xs font-semibold shrink-0', isActive ? 'glass-active-pill' : 'glass')}
                style={{ color: isActive ? 'var(--brand-lime)' : 'var(--brand-text-2)' }}
              >
                {cat}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 space-y-2">
        {isLoading ? (
          <>
            <SkeletonRow index={0} />
            <SkeletonRow index={1} />
            <SkeletonRow index={2} />
          </>
        ) : results.length === 0 && query.trim() === '' ? (
          <>
            <SkeletonRow index={0} />
            <SkeletonRow index={1} />
            <SkeletonRow index={2} />
          </>
        ) : results.length === 0 && query.trim() !== '' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={springDefault}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Icon name="magnifyingglass" size={32} color="var(--brand-text-3)" />
            <p className="text-sm mt-3" style={{ color: 'var(--brand-text-2)' }}>
              No foods found &mdash; try a different name or
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              transition={springSnappy}
              onClick={() => router.push(`/diet/food/new?slot=${slot}&date=${date}`)}
              className="mt-2 text-sm font-semibold"
              style={{ color: 'var(--brand-lime)' }}
            >
              create a custom food
            </motion.button>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {results.map((item) => {
              const key = item.isCustom ? (item as FoodItem)._id : (item as FoodLibraryItem).id;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={springDefault}
                >
                  <FoodResultRow item={item} slot={slot} date={date} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
