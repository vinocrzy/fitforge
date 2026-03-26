// ═══════════════════════════════════════════════════════════════════
// FitForge — Trainer API: List + Enroll
//
// GET  /api/trainers  — list trainers (public directory)
// POST /api/trainers  — enroll as trainer (authenticated)
// ═══════════════════════════════════════════════════════════════════

import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  ensureTrainerDb,
  listTrainers,
  getTrainerDoc,
  putTrainerDoc,
} from '@/lib/db/trainerDb';
import type { TrainerSpecialization } from '@/types';

const VALID_SPECIALIZATIONS: TrainerSpecialization[] = [
  'strength', 'cardio', 'flexibility', 'weight_loss', 'bodybuilding',
  'powerlifting', 'rehabilitation', 'sports_performance', 'general_fitness',
];

// ─── GET /api/trainers ────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = request.nextUrl;
    const search = url.searchParams.get('search') ?? undefined;
    const specialization = url.searchParams.get('specialization') ?? undefined;
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 100);
    const skip = Number(url.searchParams.get('skip') ?? 0);

    if (specialization && !VALID_SPECIALIZATIONS.includes(specialization as TrainerSpecialization)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_FILTER', message: 'Invalid specialization filter' } },
        { status: 400 },
      );
    }

    await ensureTrainerDb();
    const { trainers, total } = await listTrainers({ search, specialization, limit, skip });

    // Strip internal CouchDB fields
    const cleaned = trainers.map(({ _rev, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      data: cleaned,
      pagination: { total, page: Math.floor(skip / limit) + 1, pageSize: limit, hasMore: total >= limit },
    });
  } catch (error) {
    console.error('[GET /api/trainers] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to list trainers' } },
      { status: 500 },
    );
  }
}

// ─── POST /api/trainers ───────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required' } },
      { status: 401 },
    );
  }

  try {
    const body = await request.json() as {
      displayName?: string;
      bio?: string;
      specializations?: string[];
      certifications?: { name: string; issuedBy: string; year: number }[];
      experienceYears?: number;
    };

    // Validate required fields
    if (!body.displayName?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'Display name is required' } },
        { status: 400 },
      );
    }

    if (!body.bio?.trim() || body.bio.trim().length > 500) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'Bio is required (max 500 chars)' } },
        { status: 400 },
      );
    }

    if (!body.specializations?.length || body.specializations.length > 3) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'Select 1-3 specializations' } },
        { status: 400 },
      );
    }

    const invalidSpecs = body.specializations.filter(
      (s) => !VALID_SPECIALIZATIONS.includes(s as TrainerSpecialization),
    );
    if (invalidSpecs.length > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: `Invalid specializations: ${invalidSpecs.join(', ')}` } },
        { status: 400 },
      );
    }

    if (typeof body.experienceYears !== 'number' || body.experienceYears < 0 || body.experienceYears > 50) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'Experience years must be 0-50' } },
        { status: 400 },
      );
    }

    // Validate certifications
    const certifications = (body.certifications ?? []).map((c) => ({
      name: String(c.name ?? '').trim().slice(0, 100),
      issuedBy: String(c.issuedBy ?? '').trim().slice(0, 100),
      year: Math.max(1950, Math.min(new Date().getFullYear(), Number(c.year) || 2020)),
    })).filter((c) => c.name.length > 0);

    await ensureTrainerDb();

    // Check if already enrolled
    const docId = `trainer_${userId}`;
    const existing = await getTrainerDoc(docId);
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_EXISTS', message: 'Already enrolled as trainer' } },
        { status: 409 },
      );
    }

    // Get Clerk user for photo
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    const now = new Date().toISOString();
    const trainerDoc = {
      _id: docId,
      type: 'trainer_profile',
      clerkUserId: userId,
      displayName: body.displayName.trim().slice(0, 100),
      bio: body.bio.trim().slice(0, 500),
      specializations: body.specializations as TrainerSpecialization[],
      certifications,
      experienceYears: Math.floor(body.experienceYears),
      photoUrl: clerkUser.imageUrl ?? undefined,
      status: 'active',
      availability: 'accepting',
      clientCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await putTrainerDoc(trainerDoc);

    // Set trainer role in Clerk metadata
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: 'trainer' },
    });

    return NextResponse.json({ success: true, data: { ...trainerDoc, _rev: undefined } }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/trainers] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to enroll as trainer' } },
      { status: 500 },
    );
  }
}
