import { NextRequest, NextResponse } from 'next/server';
import { searchSimilar } from '@/lib/embeddings';
import { db } from '@/db';
import { agents } from '@/db/schema';
import { inArray } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
    }

    // Semantic search
    const similar = await searchSimilar(query, limit, 0.6);

    if (similar.length === 0) {
      return NextResponse.json({ agents: [] });
    }

    // Fetch full agent records
    const agentIds = similar.map((s) => s.metadata.agentId).filter(Boolean);

    const agentRecords = await db
      .select()
      .from(agents)
      .where(inArray(agents.id, agentIds));

    // Merge scores
    const results = agentRecords.map((agent) => {
      const match = similar.find((s) => s.metadata.agentId === agent.id);
      return {
        ...agent,
        relevanceScore: match?.score || 0,
      };
    });

    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({ agents: results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
