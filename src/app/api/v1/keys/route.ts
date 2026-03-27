import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { apiKeys } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import { getSession } from '@/lib/session';

// POST /api/v1/keys - Create API key
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.address) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { name, rateLimitPerMinute } = body;

    if (!name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const keyId = randomUUID();
    const apiKey = `agz_${randomUUID().replace(/-/g, '')}`;
    const keyHash = createHash('sha256').update(apiKey).digest('hex');

    await db.insert(apiKeys).values({
      id: keyId,
      key_hash: keyHash,
      name,
      owner_address: session.address,
      rate_limit_per_minute: rateLimitPerMinute || 60,
      active: true,
      created_at: new Date(),
      last_used: null,
    });

    return NextResponse.json({
      keyId,
      apiKey,
      message: 'API key created. Store it securely - it will not be shown again.',
    });
  } catch (error) {
    console.error('API key creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/v1/keys - List user API keys
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.address) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userKeys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        rateLimitPerMinute: apiKeys.rate_limit_per_minute,
        active: apiKeys.active,
        createdAt: apiKeys.created_at,
        lastUsed: apiKeys.last_used,
      })
      .from(apiKeys)
      .where(eq(apiKeys.owner_address, session.address));

    return NextResponse.json({ keys: userKeys });
  } catch (error) {
    console.error('API keys list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/v1/keys/:id - Revoke API key
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.address) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json({ error: 'Missing key ID' }, { status: 400 });
    }

    await db
      .update(apiKeys)
      .set({ active: false })
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.owner_address, session.address)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API key revoke error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
