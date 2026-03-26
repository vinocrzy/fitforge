// ═══════════════════════════════════════════════════════════════════
// FitForge — Trainer API: Single Trainer
//
// GET /api/trainers/[trainerId]  — get trainer detail (public)
// PUT /api/trainers/[trainerId]  — update own trainer profile
// ═══════════════════════════════════════════════════════════════════

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { ensureTrainerDb, getTrainerDoc, putTrainerDoc } from '@/lib/db/trainerDb';
import type { TrainerSpecialization, AvailabilityStatus } from '@/types';

const VALID_SPECIALIZATIONS: TrainerSpecialization[] = [
  'strength', 'cardio', 'flexibility', 'weight_loss', 'bodybuilding',
  'powerlifting', 'rehabilitation', 'sports_performance', 'general_fitness',
];

const VALID_AVAILABILITY: AvailabilityStatus[] = ['accepting', 'full', 'paused'];

interface RouteContext {
  params: Promise<{ trainerId: string }>;
}

// ─── GET /api/trainers/[trainerId] ────────────────────────────────

export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { trainerId } = await context.params;
    const docId = trainerId.startsWith('trainer_') ? trainerId : `trainer_${trainerId}`;

    await ensureTrainerDb();
    const doc = await getTrainerDoc(docId);

    if (!doc || doc.status === 'suspended') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Trainer not found' } },
        { status: 404 },
      );
    }

    const { _rev, ...cleaned } = doc;
    return NextResponse.json({ success: true, data: cleaned });
  } catch (error) {
    console.error('[GET /api/trainers/[id]] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to get trainer' } },
      { status: 500 },
    );
  }
}

// ─── PUT /api/trainers/[trainerId] ────────────────────────────────

export async function PUT(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required' } },
      { status: 401 },
    );
  }

  try {
    const { trainerId } = await context.params;
    const docId = trainerId.startsWith('trainer_') ? trainerId : `trainer_${trainerId}`;

    // Only own profile
    if (docId !== `trainer_${userId}`) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Can only update your own profile' } },
        { status: 403 },
      );
    }

    await ensureTrainerDb();
    const existing = await getTrainerDoc(docId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Trainer profile not found' } },
        { status: 404 },
      );
    }

    const body = await request.json() as Record<string, unknown>;

    // Allowlist of updatable fields
    const updates: Record<string, unknown> = {};

    if (typeof body.displayName === 'string' && body.displayName.trim()) {
      updates.displayName = (body.displayName as string).trim().slice(0, 100);
    }
    if (typeof body.bio === 'string' && body.bio.trim().length <= 500) {
      updates.bio = (body.bio as string).trim();
    }
    if (Array.isArray(body.specializations) && body.specializations.length >= 1 && body.specializations.length <= 3) {
      const valid = body.specializations.every((s: unknown) =>
        VALID_SPECIALIZATIONS.includes(s as TrainerSpecialization),
      );
      if (valid) updates.specializations = body.specializations;
    }
    if (Array.isArray(body.certifications)) {
      updates.certifications = (body.certifications as { name?: string; issuedBy?: string; year?: number }[])
        .map((c) => ({
          name: String(c.name ?? '').trim().slice(0, 100),
          issuedBy: String(c.issuedBy ?? '').trim().slice(0, 100),
          year: Math.max(1950, Math.min(new Date().getFullYear(), Number(c.year) || 2020)),
        }))
        .filter((c) => c.name.length > 0);
    }
    if (typeof body.experienceYears === 'number' && body.experienceYears >= 0 && body.experienceYears <= 50) {
      updates.experienceYears = Math.floor(body.experienceYears);
    }
    if (typeof body.availability === 'string' && VALID_AVAILABILITY.includes(body.availability as AvailabilityStatus)) {
      updates.availability = body.availability;
    }

    const updatedDoc = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await putTrainerDoc(updatedDoc);

    const { _rev: _discardRev, ...cleaned } = updatedDoc as Record<string, unknown>;
    return NextResponse.json({ success: true, data: cleaned });
  } catch (error) {
    console.error('[PUT /api/trainers/[id]] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to update trainer' } },
      { status: 500 },
    );
  }
}
