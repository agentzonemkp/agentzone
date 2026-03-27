import { NextRequest, NextResponse } from 'next/server';
import { graphqlClient, queries } from '@/lib/graphql-client';
import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
    }

    // Try GraphQL first
    try {
      const data: any = await graphqlClient.request(queries.searchAgents, {
        search: `%${query}%`,
        limit,
      });

      if (data.Agent && data.Agent.length > 0) {
        return NextResponse.json({
          agents: data.Agent,
          source: 'graphql',
        });
      }
    } catch (graphqlError) {
      console.error('[API] GraphQL search failed:', graphqlError);
    }

    // Fallback to Turso
    const result = await turso.execute({
      sql: `
        SELECT * FROM agents
        WHERE name LIKE ? OR description LIKE ? OR wallet_address LIKE ?
        ORDER BY trust_score DESC
        LIMIT ?
      `,
      args: [`%${query}%`, `%${query}%`, `%${query}%`, limit],
    });

    return NextResponse.json({
      agents: result.rows,
      source: 'turso',
    });
  } catch (error: any) {
    console.error('[API] Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error.message },
      { status: 500 }
    );
  }
}
