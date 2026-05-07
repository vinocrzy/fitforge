// ═══════════════════════════════════════════════════════════════════
// FitForge — Recipes Screen
// Browse, log, and delete saved recipes
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { springDefault, springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useRecipes, useDeleteRecipe, useLogRecipe } from '@/hooks/useRecipes';
import type { Recipe, MealSlot, MacroTargets } from '@/types';

// ─── Constants ───────────────────────────────────────────────────

const SLOT_COLORS: Record<MealSlot, string> = {
  breakfast: '#FF9F0A',
  lunch: '#32D74B',
  dinner: '#0A84FF',
  snack: '#BF5AF2',
};

// ─── Helpers ─────────────────────────────────────────────────────

function scaleMacros(base: MacroTargets, factor: number): MacroTargets {
  return {
    calories: Math.round(base.calories * factor),
    proteinG: Math.round(base.proteinG * factor * 10) / 10,
    carbsG: Math.round(base.carbsG * factor * 10) / 10,
    fatG: Math.round(base.fatG * factor * 10) / 10,
  };
}

// ─── RecipeCard ───────────────────────────────────────────────────

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
  onPress: (r: Recipe) => void;
}

function RecipeCard({ recipe, index, onPress }: RecipeCardProps) {
  const [showDelete, setShowDelete] = useState(false);
  const deleteRecipe = useDeleteRecipe();
  const m = recipe.perServingMacros;

  const handlePanEnd = useCallback(
    (_e: unknown, info: { offset: { x: number } }) => {
      if (info.offset.x < -80) setShowDelete(true);
    },
    [],
  );

  const handleDelete = useCallback(() => {
    setShowDelete(false);
    deleteRecipe.mutate({ id: recipe._id, rev: recipe._rev ?? '' });
  }, [recipe, deleteRecipe]);

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
            aria-label="Delete recipe"
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
            onPress(recipe);
          }
        }}
      >
        {/* Row 1: name + serving count */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <span
            className="font-bold truncate flex-1"
            style={{ fontSize: 16, color: 'var(--brand-text)' }}
          >
            {recipe.name}
          </span>
          <span style={{ fontSize: 12, color: 'var(--brand-text-2)', whiteSpace: 'nowrap' }}>
            {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Row 2: macro summary per serving */}
        <p style={{ fontSize: 13, color: 'var(--brand-text-2)', margin: '2px 0' }}>
          {m.calories} kcal &middot; P {m.proteinG}g &middot; C {m.carbsG}g &middot; F {m.fatG}g
        </p>

        {/* Row 3: ingredient count + chevron */}
        <div className="flex items-center justify-between mt-1">
          <p style={{ fontSize: 12, color: 'var(--brand-text-3)' }}>
            {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}
          </p>
          <Icon name="chevron.right" size={16} color="var(--brand-text-3)" />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── RecipesScreen ────────────────────────────────────────────────

export function RecipesScreen() {
  const router = useRouter();
  const { data: recipes = [], isLoading } = useRecipes();
  const logRecipe = useLogRecipe();

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [logServings, setLogServings] = useState(1);
  const [logSlot, setLogSlot] = useState<MealSlot>('breakfast');
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));

  const todayISO = new Date().toISOString().slice(0, 10);
  const minDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const handleSelectRecipe = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setLogServings(1);
    setLogSlot('breakfast');
    setLogDate(new Date().toISOString().slice(0, 10));
    setIsLogOpen(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setIsLogOpen(false);
  }, []);

  const scaledMacros = selectedRecipe
    ? scaleMacros(selectedRecipe.perServingMacros, logServings)
    : null;

  return (
    <div
      className={cn('min-h-screen')}
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
          className="font-black flex-1"
          style={{ fontSize: 22, color: 'var(--brand-text)', letterSpacing: '-0.02em' }}
        >
          Recipes
        </h1>
        <motion.button
          whileTap={{ scale: 0.94 }}
          transition={springSnappy}
          onClick={() => router.push('/diet/recipes/new')}
          style={{
            background: 'var(--brand-lime)',
            border: 'none',
            borderRadius: 20,
            padding: '8px 16px',
            fontWeight: 700,
            fontSize: 14,
            color: '#0B0B0B',
            cursor: 'pointer',
          }}
        >
          New Recipe
        </motion.button>
      </div>

      {/* Loading spinner */}
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
      {!isLoading && recipes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springDefault}
          className="glass rounded-2xl p-8 flex flex-col items-center text-center mt-8"
        >
          <span style={{ fontSize: 48, lineHeight: 1, marginBottom: 16 }}>🍳</span>
          <p
            className="font-bold mb-2"
            style={{ fontSize: 17, color: 'var(--brand-text)' }}
          >
            No recipes yet
          </p>
          <p style={{ fontSize: 14, color: 'var(--brand-text-2)', maxWidth: 260 }}>
            Build a recipe to quickly log multi-ingredient meals.
          </p>
        </motion.div>
      )}

      {/* Recipe list */}
      {!isLoading && recipes.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {recipes.map((recipe, i) => (
              <RecipeCard
                key={recipe._id}
                recipe={recipe}
                index={i}
                onPress={handleSelectRecipe}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Log Recipe BottomSheet */}
      <BottomSheet
        id="log-recipe-sheet"
        open={isLogOpen}
        onClose={handleCloseSheet}
        title="Log Recipe"
      >
        {selectedRecipe && scaledMacros && (
          <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Recipe name + per-serving info */}
            <div className="glass rounded-xl p-3">
              <p
                className="font-bold"
                style={{ fontSize: 18, color: 'var(--brand-text)', marginBottom: 4 }}
              >
                {selectedRecipe.name}
              </p>
              <p style={{ fontSize: 13, color: 'var(--brand-text-2)' }}>
                {selectedRecipe.perServingMacros.calories} kcal &middot; P{' '}
                {selectedRecipe.perServingMacros.proteinG}g &middot; C{' '}
                {selectedRecipe.perServingMacros.carbsG}g &middot; F{' '}
                {selectedRecipe.perServingMacros.fatG}g
              </p>
              <p style={{ fontSize: 12, color: 'var(--brand-text-3)', marginTop: 2 }}>per serving</p>
            </div>

            {/* Date picker */}
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

            {/* Meal slot pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, color: 'var(--brand-text-2)', fontWeight: 600 }}>
                Meal slot
              </label>
              <div className="flex gap-2">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealSlot[]).map(slot => {
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

            {/* Servings stepper */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, color: 'var(--brand-text-2)', fontWeight: 600 }}>
                Servings
              </label>
              <div className="flex items-center gap-3">
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  transition={springSnappy}
                  onClick={() =>
                    setLogServings(prev => Math.max(0.5, parseFloat((prev - 0.5).toFixed(1))))
                  }
                  className="glass rounded-xl flex items-center justify-center"
                  style={{
                    width: 44,
                    height: 44,
                    fontSize: 20,
                    color: 'var(--brand-text)',
                    border: 'none',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  aria-label="Decrease servings"
                >
                  −
                </motion.button>
                <input
                  type="number"
                  value={logServings}
                  min={0.5}
                  max={10}
                  step={0.5}
                  onChange={e => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && v >= 0.5 && v <= 10) setLogServings(v);
                  }}
                  style={{
                    flex: 1,
                    background: 'var(--brand-surface-2)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    color: 'var(--brand-text)',
                    fontSize: 16,
                    textAlign: 'center',
                    outline: 'none',
                  }}
                />
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  transition={springSnappy}
                  onClick={() =>
                    setLogServings(prev => Math.min(10, parseFloat((prev + 0.5).toFixed(1))))
                  }
                  className="glass rounded-xl flex items-center justify-center"
                  style={{
                    width: 44,
                    height: 44,
                    fontSize: 20,
                    color: 'var(--brand-text)',
                    border: 'none',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  aria-label="Increase servings"
                >
                  +
                </motion.button>
                <span style={{ fontSize: 14, color: 'var(--brand-text-2)', flexShrink: 0 }}>
                  servings
                </span>
              </div>
            </div>

            {/* Total macros preview */}
            <p
              style={{
                fontSize: 13,
                color: 'var(--brand-lime)',
                textAlign: 'center',
                fontWeight: 600,
              }}
            >
              Total: {scaledMacros.calories} kcal &middot; P {scaledMacros.proteinG}g &middot; C{' '}
              {scaledMacros.carbsG}g &middot; F {scaledMacros.fatG}g
            </p>

            {/* Log CTA */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              transition={springSnappy}
              onClick={() => {
                logRecipe.mutate(
                  { recipe: selectedRecipe, date: logDate, slot: logSlot, servings: logServings },
                  {
                    onSuccess: () => {
                      setIsLogOpen(false);
                      router.push('/diet');
                    },
                  },
                );
              }}
              disabled={logRecipe.isPending}
              className="rounded-2xl"
              style={{
                background: 'var(--brand-lime)',
                border: 'none',
                padding: '15px',
                fontWeight: 700,
                fontSize: 16,
                color: '#0B0B0B',
                cursor: logRecipe.isPending ? 'not-allowed' : 'pointer',
                opacity: logRecipe.isPending ? 0.7 : 1,
              }}
            >
              {logRecipe.isPending ? 'Logging\u2026' : 'Log Recipe'}
            </motion.button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
