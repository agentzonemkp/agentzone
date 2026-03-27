import { NextRequest, NextResponse } from 'next/server';
import { graphqlClient, GET_AGENTS_QUERY, Agent } from '@/lib/graphql-client';
import { db } from '@/db';
import { agents, reputation } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const verified = searchParams.get('verified');
  const limit = parseInt(searchParams.get('limit') || '20');
  const source = searchParams.get('source') || 'graphql'; // 'graphql' or 'turso'

  try {
    if (source === 'turso') {
      // Fallback to Turso for demo/testing
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
        source: 'turso',
      });
    }

    // Primary: GraphQL from Envio indexer
    const data = await graphqlClient.request<{ Agent: Agent[] }>(GET_AGENTS_QUERY, {
      limit,
      offset: 0,
    });

    let filteredAgents = data.Agent;

    if (category) {
      filteredAgents = filteredAgents.filter(a => a.category === category);
    }

    if (verified === 'true') {
      filteredAgents = filteredAgents.filter(a => a.verified);
    }

    return NextResponse.json({
      agents: filteredAgents,
      source: 'graphql',
    });
  } catch (error: any) {
    console.error('Error fetching agents:', error);
    console.error('Error details:', error?.response?.errors || error?.message || 'Unknown error');
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}
