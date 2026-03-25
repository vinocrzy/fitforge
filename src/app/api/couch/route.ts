// ═══════════════════════════════════════════════════════════════════
// CouchDB proxy — root endpoint handler
//
// PouchDB pings the remote root URL to verify connectivity.
// Return a minimal CouchDB-compatible welcome response.
// ═══════════════════════════════════════════════════════════════════

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    couchdb: 'Welcome',
    vendor: { name: 'FitForge Proxy' },
    version: '1.0.0',
  });
}
