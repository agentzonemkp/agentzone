import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { webhooks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getSession } from '@/lib/session';

// POST /api/v1/webhooks - Create webhook subscription
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.address) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { url, events, agentId } = body;

    if (!url || !events || !Array.isArray(events)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const webhookId = randomUUID();
    const secret = `whsec_${randomUUID().replace(/-/g, '')}`;

    await db.insert(webhooks).values({
      id: webhookId,
      agent_id: agentId || null,
      url,
      events: JSON.stringify(events),
      secret,
      active: true,
      created_by: session.address,
      created_at: new Date(),
    });

    return NextResponse.json({
      webhookId,
      secret,
      message: 'Webhook created. Store the secret securely - it will not be shown again.',
    });
  } catch (error) {
    console.error('Webhook creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/v1/webhooks - List user webhooks
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.address) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userWebhooks = await db
      .select({
        id: webhooks.id,
        agentId: webhooks.agent_id,
        url: webhooks.url,
        events: webhooks.events,
        active: webhooks.active,
        createdAt: webhooks.created_at,
      })
      .from(webhooks)
      .where(eq(webhooks.created_by, session.address));

    return NextResponse.json({
      webhooks: userWebhooks.map((w) => ({
        ...w,
        events: JSON.parse(w.events as string),
      })),
    });
  } catch (error) {
    console.error('Webhook list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/v1/webhooks/:id - Delete webhook
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.address) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const webhookId = searchParams.get('id');

    if (!webhookId) {
      return NextResponse.json({ error: 'Missing webhook ID' }, { status: 400 });
    }

    await db
      .delete(webhooks)
      .where(and(eq(webhooks.id, webhookId), eq(webhooks.created_by, session.address)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
