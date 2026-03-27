import { NextRequest, NextResponse } from 'next/server';
import { graphqlClient, SEARCH_AGENTS_QUERY, Agent } from '@/lib/graphql-client';
import { searchSimilar } from '@/lib/embeddings';
import { db } from '@/db';
import { agents } from '@/db/schema';
import { inArray } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');
    const source = searchParams.get('source') || 'graphql';

    if (!query) {
      return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
    }

    if (source === 'turso') {
      // Fallback: Turso semantic search
      const similar = await searchSimilar(query, limit, 0.6);

      if (similar.length === 0) {
        return NextResponse.json({ agents: [], source: 'turso' });
      }

      const agentIds = similar.map((s) => s.metadata.agentId).filter(Boolean);

      const agentRecords = await db
        .select()
        .from(agents)
        .where(inArray(agents.id, agentIds));

      const results = agentRecords.map((agent) => {
        const match = similar.find((s) => s.metadata.agentId === agent.id);
        return {
          ...agent,
          relevanceScore: match?.score || 0,
        };
      });

      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      return NextResponse.json({ agents: results, source: 'turso' });
    }

    // Primary: GraphQL text search
    const searchTerm = `%${query}%`;
    const data = await graphqlClient.request<{ Agent: Agent[] }>(SEARCH_AGENTS_QUERY, {
      searchTerm,
    });

    return NextResponse.json({ agents: data.Agent, source: 'graphql' });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
