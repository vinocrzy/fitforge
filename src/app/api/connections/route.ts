// ═══════════════════════════════════════════════════════════════════
// FitForge — Connections API: Create + List
//
// POST /api/connections        — user sends subscription request
// GET  /api/connections        — list own connections (role-aware)
// GET  /api/connections/active — user's current active connection
// ═══════════════════════════════════════════════════════════════════

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  ensureConnectionDb,
  putConnectionDoc,
  listConnections,
  findActiveConnection,
  findConnectionBetween,
} from '@/lib/db/connectionDb';
import { getTrainerDoc, ensureTrainerDb } from '@/lib/db/trainerDb';
import { createTrainerNotification } from '@/lib/db/notificationDb';

// ─── GET /api/connections ─────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required' } },
      { status: 401 },
    );
  }

  try {
    await ensureConnectionDb();

    const url = request.nextUrl;
    const status = url.searchParams.get('status') ?? undefined;
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 100);
    const skip = Number(url.searchParams.get('skip') ?? 0);

    const isTrainer = (sessionClaims?.metadata as Record<string, unknown> | undefined)?.role === 'trainer';

    // If user is a trainer viewing their connections, filter by trainerId
    // Otherwise filter by clientId
    const queryOptions = isTrainer && url.searchParams.get('role') === 'trainer'
      ? { trainerId: userId, status, limit, skip }
      : { clientId: userId, status, limit, skip };

    const { connections, total } = await listConnections(queryOptions);

    // Strip CouchDB internals
    const cleaned = connections.map(({ _rev, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      data: cleaned,
      pagination: { total, page: Math.floor(skip / limit) + 1, pageSize: limit, hasMore: total >= limit },
    });
  } catch (error) {
    console.error('[GET /api/connections] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to list connections' } },
      { status: 500 },
    );
  }
}

// ─── POST /api/connections ────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Sign in required' } },
      { status: 401 },
    );
  }

  try {
    const body = await request.json() as { trainerId?: string };

    if (!body.trainerId?.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'trainerId is required' } },
        { status: 400 },
      );
    }

    const trainerId = body.trainerId.trim();

    // Can't subscribe to yourself
    if (trainerId === userId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION', message: 'Cannot subscribe to yourself' } },
        { status: 400 },
      );
    }

    await ensureTrainerDb();
    await ensureConnectionDb();

    // Verify trainer exists and is active
    const trainerDoc = await getTrainerDoc(`trainer_${trainerId}`);
    if (!trainerDoc || trainerDoc.status !== 'active') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Trainer not found or inactive' } },
        { status: 404 },
      );
    }

    // Check if trainer is accepting clients
    if (trainerDoc.availability === 'full' || trainerDoc.availability === 'paused') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAVAILABLE', message: 'Trainer is not accepting new clients' } },
        { status: 400 },
      );
    }

    // Check for existing active/pending connection with this trainer
    const existingWithTrainer = await findConnectionBetween(trainerId, userId);
    if (existingWithTrainer) {
      const status = existingWithTrainer.status as string;
      if (status === 'active') {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE', message: 'Already connected to this trainer' } },
          { status: 409 },
        );
      }
      if (status === 'pending') {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE', message: 'Request already pending with this trainer' } },
          { status: 409 },
        );
      }
    }

    // Check if user already has an active connection with another trainer
    const activeConnection = await findActiveConnection(userId);
    if (activeConnection) {
      return NextResponse.json(
        { success: false, error: { code: 'LIMIT', message: 'You can only have one active trainer subscription. End your current connection first.' } },
        { status: 400 },
      );
    }

    // Create the connection
    const now = new Date().toISOString();
    const connectionDoc = {
      _id: `connection_${trainerId}_${userId}_${Date.now()}`,
      type: 'trainer_connection',
      trainerId,
      clientId: userId,
      status: 'pending',
      requestedAt: now,
      sharedData: {
        workoutHistory: true,
        personalRecords: true,
        bodyStats: false,
        streakData: true,
      },
    };

    await putConnectionDoc(connectionDoc);

    // Notify the trainer about the new request
    void createTrainerNotification({
      trainerId,
      notificationType: 'new_connection_request',
      title: 'New Connection Request',
      body: 'A new client wants to connect with you.',
      referenceId: connectionDoc._id,
      clientId: userId,
    });

    return NextResponse.json({
      success: true,
      data: connectionDoc,
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/connections] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to create connection' } },
      { status: 500 },
    );
  }
}
