import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agents, reputation } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const verified = searchParams.get('verified');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    let query = db
      .select({
        agent: agents,
        reputation: reputation,
      })
      .from(agents)
      .leftJoin(reputation, eq(agents.id, reputation.agent_id))
      .limit(limit);

    if (category) {
      query = query.where(eq(agents.category, category)) as any;
    }

    if (verified === 'true') {
      query = query.where(eq(agents.verified, true)) as any;
    }

    const results = await query;

    return NextResponse.json({
      agents: results.map(r => ({
        ...r.agent,
        reputation: r.reputation,
      })),
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
