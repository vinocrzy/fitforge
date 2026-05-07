'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { springDefault, springSnappy, springGentle } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────

interface OffApiResult {
  name: string;
  brand?: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  barcode: string;
}

export interface BarcodeScreenProps {
  slot: string;
  date: string;
}

// ─── Open Food Facts lookup ───────────────────────────────────────

async function lookupBarcode(barcode: string): Promise<OffApiResult | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,brands,nutriments`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json() as {
      status: number;
      product?: {
        product_name?: string;
        brands?: string;
        nutriments?: {
          'energy-kcal_100g'?: number;
          proteins_100g?: number;
          carbohydrates_100g?: number;
          fat_100g?: number;
        };
      };
    };
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;
    const n = p.nutriments ?? {};
    return {
      name: p.product_name?.trim() || 'Unknown Product',
      brand: p.brands?.split(',')[0]?.trim(),
      caloriesPer100g: Math.round(n['energy-kcal_100g'] ?? 0),
      proteinPer100g: Math.round((n.proteins_100g ?? 0) * 10) / 10,
      carbsPer100g: Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
      fatPer100g: Math.round((n.fat_100g ?? 0) * 10) / 10,
      barcode,
    };
  } catch {
    return null;
  }
}

// ─── MacroChip ────────────────────────────────────────────────────

function MacroChip({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex flex-col items-center glass rounded-xl px-4 py-3">
      <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--brand-text)' }}>
        {value}
      </span>
      <span className="text-[10px] mt-0.5" style={{ color: 'var(--brand-text-2)' }}>
        {unit}
      </span>
      <span className="text-[10px]" style={{ color: 'var(--brand-text-3)' }}>
        {label}
      </span>
    </div>
  );
}

// ─── Corner bracket SVG ───────────────────────────────────────────

function CornerBracket({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const size = 20;
  const strokeW = 2.5;
  const color = 'var(--brand-lime)';

  const posStyle: React.CSSProperties = {
    position: 'absolute',
    ...(position === 'tl' && { top: 12, left: 12 }),
    ...(position === 'tr' && { top: 12, right: 12 }),
    ...(position === 'bl' && { bottom: 12, left: 12 }),
    ...(position === 'br' && { bottom: 12, right: 12 }),
  };

  const rotate =
    position === 'tl' ? 0 :
    position === 'tr' ? 90 :
    position === 'bl' ? -90 :
    180;

  return (
    <motion.div
      style={posStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={springGentle}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: `rotate(${rotate}deg)` }}
        fill="none"
      >
        <path
          d={`M ${strokeW / 2} ${size} L ${strokeW / 2} ${strokeW / 2} L ${size} ${strokeW / 2}`}
          stroke={color}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
}

// ─── BarcodeScreen ────────────────────────────────────────────────

export function BarcodeScreen({ slot, date }: BarcodeScreenProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [manualBarcode, setManualBarcode] = useState('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'found' | 'not_found' | 'error' | 'no_support'>('idle');
  const [foundFood, setFoundFood] = useState<OffApiResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detectorRef = useRef<any>(null);
  const scanLoopRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  // ─── Camera scan loop ───────────────────────────────────────────

  useEffect(() => {
    if (mode !== 'scan') return;

    if (typeof window === 'undefined' || !('BarcodeDetector' in window)) {
      setStatus('no_support');
      return;
    }

    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'],
        });
        detectorRef.current = detector;
        setStatus('scanning');

        const scan = async () => {
          if (cancelled || !videoRef.current || videoRef.current.readyState < 2) {
            if (!cancelled) scanLoopRef.current = requestAnimationFrame(scan);
            return;
          }
          try {
            const codes: Array<{ rawValue: string }> = await detector.detect(videoRef.current);
            if (codes.length > 0 && !cancelled) {
              const code = codes[0].rawValue;
              setStatus('scanning');
              if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
              const result = await lookupBarcode(code);
              if (cancelled) return;
              if (result) {
                setFoundFood(result);
                setStatus('found');
              } else {
                setStatus('not_found');
              }
              return;
            }
          } catch { /* detector may throw on empty frames */ }
          if (!cancelled) scanLoopRef.current = requestAnimationFrame(scan);
        };

        scanLoopRef.current = requestAnimationFrame(scan);
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [mode]);

  // ─── Handlers ──────────────────────────────────────────────────

  const handleManualLookup = useCallback(async () => {
    if (!manualBarcode.trim()) return;
    setStatus('scanning');
    const result = await lookupBarcode(manualBarcode.trim());
    if (result) { setFoundFood(result); setStatus('found'); }
    else setStatus('not_found');
  }, [manualBarcode]);

  const handleUseFood = useCallback((food: OffApiResult) => {
    const params = new URLSearchParams({
      slot,
      date,
      name: food.name,
      ...(food.brand ? { brand: food.brand } : {}),
      barcode: food.barcode,
      cal: String(food.caloriesPer100g),
      prot: String(food.proteinPer100g),
      carb: String(food.carbsPer100g),
      fat: String(food.fatPer100g),
    });
    router.push(`/diet/log/barcode/confirm?${params.toString()}`);
  }, [slot, date, router]);

  const handleRetry = useCallback(() => {
    setFoundFood(null);
    setStatus('idle');
  }, []);

  const switchToManual = useCallback(() => {
    if (scanLoopRef.current) cancelAnimationFrame(scanLoopRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setMode('manual');
    setStatus('idle');
  }, []);

  const switchToScan = useCallback(() => {
    setFoundFood(null);
    setMode('scan');
    setStatus('idle');
  }, []);

  // ─── Status label ───────────────────────────────────────────────

  const statusLabel =
    status === 'idle' ? 'Point camera at barcode' :
    status === 'scanning' ? 'Scanning…' :
    status === 'not_found' ? 'Product not found' :
    status === 'error' ? 'Camera error — check permissions' :
    status === 'no_support' ? 'Scanner not supported on this browser' :
    '';

  const statusColor =
    status === 'not_found' || status === 'error' || status === 'no_support'
      ? 'var(--brand-danger)'
      : 'var(--brand-text-2)';

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'var(--brand-bg)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Header */}
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
          Scan Barcode
        </h1>
      </div>

      <div className="flex-1 px-4 py-4 flex flex-col gap-5">

        {/* ── Scan mode ── */}
        {mode === 'scan' && (
          <div className="flex flex-col gap-3">
            {/* Video viewport */}
            <div
              className="relative w-full rounded-2xl overflow-hidden"
              style={{ height: 280, background: '#000' }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {/* Corner brackets */}
              <CornerBracket position="tl" />
              <CornerBracket position="tr" />
              <CornerBracket position="bl" />
              <CornerBracket position="br" />
              {/* Status overlay */}
              <div
                className="absolute bottom-3 left-0 right-0 flex justify-center"
              >
                <motion.span
                  key={status}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springDefault}
                  className="text-xs font-medium px-3 py-1.5 rounded-full"
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    color: statusColor,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {statusLabel}
                </motion.span>
              </div>
            </div>

            {/* Enter manually link */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              transition={springSnappy}
              onClick={switchToManual}
              className="text-sm font-medium self-center"
              style={{ color: 'var(--brand-lime)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Enter barcode manually
            </motion.button>
          </div>
        )}

        {/* ── Manual mode ── */}
        {mode === 'manual' && (
          <div className="flex flex-col gap-4">
            {status === 'no_support' && (
              <div
                className="glass rounded-xl px-4 py-3 text-sm"
                style={{ color: 'var(--brand-danger)' }}
              >
                Barcode scanning is not supported on this browser. Enter a barcode number manually.
              </div>
            )}

            <div
              className="flex items-center gap-2 px-4 py-3 rounded-2xl glass"
            >
              <Icon name="barcode.viewfinder" size={20} color="var(--brand-text-2)" />
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                placeholder="e.g. 5000112637922"
                value={manualBarcode}
                onChange={e => setManualBarcode(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void handleManualLookup(); }}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'var(--brand-text)' }}
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              transition={springSnappy}
              onClick={() => void handleManualLookup()}
              disabled={!manualBarcode.trim() || status === 'scanning'}
              className="w-full py-4 rounded-2xl font-bold text-base"
              style={{
                background: manualBarcode.trim() ? 'var(--brand-lime)' : 'var(--brand-surface-2)',
                color: manualBarcode.trim() ? '#0B0B0B' : 'var(--brand-text-3)',
                border: 'none',
                cursor: manualBarcode.trim() ? 'pointer' : 'default',
              }}
            >
              {status === 'scanning' ? 'Looking up…' : 'Look Up'}
            </motion.button>

            {status === 'not_found' && (
              <p className="text-sm text-center" style={{ color: 'var(--brand-danger)' }}>
                Product not found in Open Food Facts.
              </p>
            )}

            {!('BarcodeDetector' in (typeof window !== 'undefined' ? window : {})) ? null : (
              <motion.button
                whileTap={{ scale: 0.96 }}
                transition={springSnappy}
                onClick={switchToScan}
                className="text-sm font-medium self-center"
                style={{ color: 'var(--brand-lime)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Use camera instead
              </motion.button>
            )}
          </div>
        )}

        {/* ── Found food card ── */}
        <AnimatePresence>
          {status === 'found' && foundFood && (
            <motion.div
              key="found-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={springDefault}
              className={cn('glass-elevated rounded-2xl p-5 flex flex-col gap-4')}
            >
              {/* Food name + brand */}
              <div>
                <p
                  className="font-bold leading-tight"
                  style={{ fontSize: 20, color: 'var(--brand-text)' }}
                >
                  {foundFood.name}
                </p>
                {foundFood.brand && (
                  <p
                    className="mt-0.5"
                    style={{ fontSize: 14, color: 'var(--brand-text-2)' }}
                  >
                    {foundFood.brand}
                  </p>
                )}
                <p
                  className="mt-1 text-xs"
                  style={{ color: 'var(--brand-text-3)' }}
                >
                  Per 100g
                </p>
              </div>

              {/* Macro grid */}
              <div className="grid grid-cols-4 gap-2">
                <MacroChip label="Calories" value={foundFood.caloriesPer100g} unit="kcal" />
                <MacroChip label="Protein" value={foundFood.proteinPer100g} unit="g" />
                <MacroChip label="Carbs" value={foundFood.carbsPer100g} unit="g" />
                <MacroChip label="Fat" value={foundFood.fatPer100g} unit="g" />
              </div>

              {/* Actions */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                transition={springSnappy}
                onClick={() => handleUseFood(foundFood)}
                className="w-full py-4 rounded-2xl font-bold text-base"
                style={{
                  background: 'var(--brand-lime)',
                  color: '#0B0B0B',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Use This Food
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                transition={springSnappy}
                onClick={handleRetry}
                className="w-full py-3.5 rounded-2xl font-semibold text-sm glass"
                style={{
                  color: 'var(--brand-text-2)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Scan Again
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
