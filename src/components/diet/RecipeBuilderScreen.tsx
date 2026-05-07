// ═══════════════════════════════════════════════════════════════════
// FitForge — Recipe Builder Screen
// Step-by-step recipe creation with food search + portion input
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { springDefault, springSnappy, springGentle } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useFoodSearch } from '@/hooks/useFoodSearch';
import { useCreateRecipe } from '@/hooks/useRecipes';
import type { RecipeIngredient, FoodLibraryItem, FoodItem, MacroTargets } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────

function scaleMacros(per100g: MacroTargets, portionG: number): MacroTargets {
  return {
    calories: Math.round((per100g.calories * portionG) / 100),
    proteinG: Math.round(((per100g.proteinG * portionG) / 100) * 10) / 10,
    carbsG: Math.round(((per100g.carbsG * portionG) / 100) * 10) / 10,
    fatG: Math.round(((per100g.fatG * portionG) / 100) * 10) / 10,
  };
}

function totalMacros(ings: RecipeIngredient[]): MacroTargets {
  return ings.reduce(
    (acc, ing) => ({
      calories: acc.calories + ing.macros.calories,
      proteinG: acc.proteinG + ing.macros.proteinG,
      carbsG: acc.carbsG + ing.macros.carbsG,
      fatG: acc.fatG + ing.macros.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

// ─── MacroChip ────────────────────────────────────────────────────

interface MacroChipProps {
  label: string;
  value: string;
  color: string;
}

function MacroChip({ label, value, color }: MacroChipProps) {
  return (
    <div
      className="flex-1 rounded-xl p-2 flex flex-col items-center gap-0.5"
      style={{ background: color + '1A', border: `1px solid ${color}33` }}
    >
      <span style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 14, color: 'var(--brand-text)', fontWeight: 700 }}>{value}</span>
    </div>
  );
}

// ─── RecipeBuilderScreen ──────────────────────────────────────────

export function RecipeBuilderScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState(1);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodLibraryItem | FoodItem | null>(null);
  const [portionG, setPortionG] = useState(100);

  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results,
    isLoading: isSearchLoading,
  } = useFoodSearch('');
  const createRecipe = useCreateRecipe();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Autofocus search input when sheet opens on step 1
  useEffect(() => {
    if (isAddIngredientOpen && !selectedFood) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [isAddIngredientOpen, selectedFood]);

  const total = totalMacros(ingredients);
  const perSrv: MacroTargets =
    servings > 0
      ? {
          calories: Math.round(total.calories / servings),
          proteinG: Math.round((total.proteinG / servings) * 10) / 10,
          carbsG: Math.round((total.carbsG / servings) * 10) / 10,
          fatG: Math.round((total.fatG / servings) * 10) / 10,
        }
      : total;

  const liveMacros = selectedFood ? scaleMacros(selectedFood.per100g, portionG) : null;

  const isSaveDisabled = !name.trim() || ingredients.length === 0 || createRecipe.isPending;

  const handleSave = useCallback(() => {
    if (!name.trim() || ingredients.length === 0) return;
    createRecipe.mutate(
      { name: name.trim(), description: description.trim() || undefined, servings, ingredients },
      { onSuccess: () => router.replace('/diet/recipes') },
    );
  }, [name, description, servings, ingredients, createRecipe, router]);

  const handleSelectFood = useCallback((food: FoodLibraryItem | FoodItem) => {
    setSelectedFood(food);
    setPortionG(food.defaultPortion?.weightG ?? 100);
  }, []);

  const handleAddIngredient = useCallback(() => {
    if (!selectedFood) return;
    const isCustom = selectedFood.isCustom;
    const foodId = isCustom
      ? (selectedFood as FoodItem)._id
      : (selectedFood as FoodLibraryItem).id;
    const ingredient: RecipeIngredient = {
      foodId,
      isCustomFood: isCustom,
      foodName: selectedFood.name,
      portionWeightG: portionG,
      macros: scaleMacros(selectedFood.per100g, portionG),
    };
    setIngredients(prev => [...prev, ingredient]);
    setSelectedFood(null);
    setSearchQuery('');
    setPortionG(100);
    setIsAddIngredientOpen(false);
  }, [selectedFood, portionG, setSearchQuery]);

  const handleCloseSheet = useCallback(() => {
    setIsAddIngredientOpen(false);
    setSelectedFood(null);
    setSearchQuery('');
    setPortionG(100);
  }, [setSearchQuery]);

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
          New Recipe
        </h1>
        <motion.button
          whileTap={{ scale: 0.94 }}
          transition={springSnappy}
          onClick={handleSave}
          disabled={isSaveDisabled}
          style={{
            background: isSaveDisabled ? 'var(--brand-surface-2)' : 'var(--brand-lime)',
            border: 'none',
            borderRadius: 20,
            padding: '8px 16px',
            fontWeight: 700,
            fontSize: 14,
            color: isSaveDisabled ? 'var(--brand-text-3)' : '#0B0B0B',
            cursor: isSaveDisabled ? 'not-allowed' : 'pointer',
          }}
        >
          {createRecipe.isPending ? 'Saving\u2026' : 'Save'}
        </motion.button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Section 1 — Recipe info */}
        <div
          className="glass rounded-2xl p-4"
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <p
            className="font-bold"
            style={{
              fontSize: 13,
              color: 'var(--brand-text-2)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Recipe Info
          </p>
          <input
            type="text"
            placeholder="Recipe name"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              background: 'var(--brand-surface-2)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12,
              padding: '12px 16px',
              color: 'var(--brand-text)',
              fontSize: 16,
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          <input
            type="text"
            placeholder="Short description\u2026 (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{
              background: 'var(--brand-surface-2)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12,
              padding: '12px 16px',
              color: 'var(--brand-text)',
              fontSize: 16,
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          {/* Servings stepper */}
          <div className="flex items-center justify-between gap-3">
            <span style={{ fontSize: 14, color: 'var(--brand-text-2)' }}>
              Servings this recipe makes
            </span>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.88 }}
                transition={springSnappy}
                onClick={() => setServings(prev => Math.max(1, prev - 1))}
                className="glass rounded-lg flex items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  fontSize: 18,
                  color: 'var(--brand-text)',
                  border: 'none',
                  cursor: 'pointer',
                }}
                aria-label="Decrease servings"
              >
                −
              </motion.button>
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: 'var(--brand-text)',
                  minWidth: 28,
                  textAlign: 'center',
                }}
              >
                {servings}
              </span>
              <motion.button
                whileTap={{ scale: 0.88 }}
                transition={springSnappy}
                onClick={() => setServings(prev => Math.min(20, prev + 1))}
                className="glass rounded-lg flex items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  fontSize: 18,
                  color: 'var(--brand-text)',
                  border: 'none',
                  cursor: 'pointer',
                }}
                aria-label="Increase servings"
              >
                +
              </motion.button>
            </div>
          </div>
        </div>

        {/* Section 2 — Ingredients */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p className="font-bold" style={{ fontSize: 15, color: 'var(--brand-text)' }}>
            Ingredients ({ingredients.length})
          </p>

          <AnimatePresence initial={false}>
            {ingredients.map((ing, i) => (
              <motion.div
                key={`${ing.foodId}-${i}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={springDefault}
                className="glass rounded-xl flex items-center gap-3 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold truncate"
                    style={{ fontSize: 14, color: 'var(--brand-text)' }}
                  >
                    {ing.foodName}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--brand-text-2)' }}>
                    {ing.portionWeightG}g &middot; {ing.macros.calories} kcal
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  transition={springSnappy}
                  onClick={() => setIngredients(prev => prev.filter((_, idx) => idx !== i))}
                  style={{
                    background: 'var(--brand-danger)',
                    border: 'none',
                    borderRadius: 8,
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  aria-label={`Remove ${ing.foodName}`}
                >
                  <Icon name="xmark" size={14} color="white" />
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add Ingredient button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={springSnappy}
            onClick={() => setIsAddIngredientOpen(true)}
            className="glass rounded-2xl"
            style={{
              border: '1.5px dashed var(--brand-lime)',
              background: 'transparent',
              padding: '14px',
              fontWeight: 700,
              fontSize: 15,
              color: 'var(--brand-lime)',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            + Add Ingredient
          </motion.button>
        </div>

        {/* Totals card */}
        {ingredients.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springGentle}
            className="glass rounded-2xl p-4"
          >
            <div className="flex gap-4">
              <div className="flex-1">
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--brand-text-3)',
                    marginBottom: 4,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                  }}
                >
                  TOTAL
                </p>
                <p style={{ fontSize: 15, color: 'var(--brand-lime)', fontWeight: 700 }}>
                  {total.calories} kcal
                </p>
                <p style={{ fontSize: 13, color: 'var(--brand-text-2)' }}>
                  P {total.proteinG}g &middot; C {total.carbsG}g &middot; F {total.fatG}g
                </p>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
              <div className="flex-1">
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--brand-text-3)',
                    marginBottom: 4,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                  }}
                >
                  PER SERVING
                </p>
                <p style={{ fontSize: 15, color: 'var(--brand-lime)', fontWeight: 700 }}>
                  {perSrv.calories} kcal
                </p>
                <p style={{ fontSize: 13, color: 'var(--brand-text-2)' }}>
                  P {perSrv.proteinG}g &middot; C {perSrv.carbsG}g &middot; F {perSrv.fatG}g
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Add Ingredient BottomSheet */}
      <BottomSheet
        id="add-ingredient-sheet"
        open={isAddIngredientOpen}
        onClose={handleCloseSheet}
        title="Add Ingredient"
        fullHeight={true}
      >
        <div
          style={{
            padding: '0 16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            minHeight: 400,
          }}
        >
          <AnimatePresence mode="wait">
            {!selectedFood ? (
              /* Step 1 — Food search */
              <motion.div
                key="search"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={springSnappy}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search foods\u2026"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    background: 'var(--brand-surface-2)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    color: 'var(--brand-text)',
                    fontSize: 16,
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />

                {/* Loading skeleton */}
                {isSearchLoading && searchQuery.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: i * 0.15,
                        }}
                        className="rounded-xl"
                        style={{ height: 56, background: 'var(--brand-surface-2)' }}
                      />
                    ))}
                  </div>
                )}

                {/* Results list */}
                {!isSearchLoading && results.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {results.map(food => {
                      const key = food.isCustom
                        ? (food as FoodItem)._id
                        : (food as FoodLibraryItem).id;
                      return (
                        <motion.button
                          key={key}
                          whileTap={{ scale: 0.98 }}
                          transition={springSnappy}
                          onClick={() => handleSelectFood(food)}
                          className="glass rounded-xl text-left"
                          style={{
                            padding: '12px 16px',
                            border: 'none',
                            cursor: 'pointer',
                            width: '100%',
                          }}
                        >
                          <p
                            style={{ fontSize: 15, fontWeight: 600, color: 'var(--brand-text)' }}
                          >
                            {food.name}
                          </p>
                          <p style={{ fontSize: 12, color: 'var(--brand-text-2)' }}>
                            {food.per100g?.calories ?? 0} kcal per 100g
                            {food.brand ? ` \u00b7 ${food.brand}` : ''}
                          </p>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* No results */}
                {!isSearchLoading && searchQuery.length > 0 && results.length === 0 && (
                  <p
                    style={{
                      fontSize: 14,
                      color: 'var(--brand-text-3)',
                      textAlign: 'center',
                      padding: '16px 0',
                    }}
                  >
                    No results for &ldquo;{searchQuery}&rdquo;
                  </p>
                )}

                {searchQuery.length === 0 && (
                  <p
                    style={{
                      fontSize: 14,
                      color: 'var(--brand-text-3)',
                      textAlign: 'center',
                      padding: '16px 0',
                    }}
                  >
                    Start typing to search the food library
                  </p>
                )}
              </motion.div>
            ) : (
              /* Step 2 — Portion selection */
              <motion.div
                key="portion"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={springSnappy}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                {/* Back + food name */}
                <div className="flex items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    transition={springSnappy}
                    onClick={() => {
                      setSelectedFood(null);
                      setPortionG(100);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Icon name="chevron.left" size={16} color="var(--brand-lime)" />
                    <span style={{ fontSize: 14, color: 'var(--brand-lime)', fontWeight: 600 }}>
                      Back
                    </span>
                  </motion.button>
                  <p
                    className="font-bold flex-1 truncate"
                    style={{ fontSize: 16, color: 'var(--brand-text)' }}
                  >
                    {selectedFood.name}
                  </p>
                </div>

                {/* Live macro chips */}
                {liveMacros && (
                  <div className="flex gap-2">
                    <MacroChip label="Cal" value={`${liveMacros.calories}`} color="#FF9F0A" />
                    <MacroChip label="Protein" value={`${liveMacros.proteinG}g`} color="#30D158" />
                    <MacroChip label="Carbs" value={`${liveMacros.carbsG}g`} color="#64D2FF" />
                    <MacroChip label="Fat" value={`${liveMacros.fatG}g`} color="#FF6B6B" />
                  </div>
                )}

                {/* Portion stepper */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, color: 'var(--brand-text-2)', fontWeight: 600 }}>
                    Portion (grams)
                  </label>
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      transition={springSnappy}
                      onClick={() => setPortionG(prev => Math.max(5, prev - 10))}
                      className="glass rounded-xl flex items-center justify-center"
                      style={{
                        width: 52,
                        height: 48,
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--brand-text)',
                        border: 'none',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      aria-label="Decrease portion by 10g"
                    >
                      −10
                    </motion.button>
                    <input
                      type="number"
                      value={portionG}
                      min={5}
                      max={2000}
                      step={1}
                      onChange={e => {
                        const v = parseInt(e.target.value, 10);
                        if (!isNaN(v) && v >= 5 && v <= 2000) setPortionG(v);
                      }}
                      style={{
                        flex: 1,
                        background: 'var(--brand-surface-2)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 12,
                        padding: '12px 16px',
                        color: 'var(--brand-text)',
                        fontSize: 18,
                        fontWeight: 700,
                        textAlign: 'center',
                        outline: 'none',
                      }}
                    />
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      transition={springSnappy}
                      onClick={() => setPortionG(prev => Math.min(2000, prev + 10))}
                      className="glass rounded-xl flex items-center justify-center"
                      style={{
                        width: 52,
                        height: 48,
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--brand-text)',
                        border: 'none',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      aria-label="Increase portion by 10g"
                    >
                      +10
                    </motion.button>
                  </div>
                </div>

                {/* Add to Recipe CTA */}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  transition={springSnappy}
                  onClick={handleAddIngredient}
                  className="rounded-2xl"
                  style={{
                    background: 'var(--brand-lime)',
                    border: 'none',
                    padding: '15px',
                    fontWeight: 700,
                    fontSize: 16,
                    color: '#0B0B0B',
                    cursor: 'pointer',
                    marginTop: 8,
                  }}
                >
                  Add to Recipe
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </BottomSheet>
    </div>
  );
}
