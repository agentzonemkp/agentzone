import { NextRequest, NextResponse } from 'next/server';
import { graphqlClient, queries } from '@/lib/graphql-client';
import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const verified_only = searchParams.get('verified') === 'true';
  const min_trust_score = parseInt(searchParams.get('min_trust_score') || '0');
  const sort_by = searchParams.get('sort_by') || 'trust_score'; // trust_score | revenue_30d | transaction_count
  
  try {
    // Try GraphQL first
    const variables = { limit, offset };
    const query = verified_only ? queries.getVerifiedAgents : queries.getAgents;
    
    const data: any = await graphqlClient.request(query, variables);
    const agents = data.Agent || [];
    
    // Filter by min trust score if specified
    let filtered = agents;
    if (min_trust_score > 0) {
      filtered = agents.filter((a: any) => a.trust_score >= min_trust_score);
    }
    
    // Apply sort
    if (sort_by === 'revenue_30d') {
      filtered.sort((a: any, b: any) => BigInt(b.revenue_30d || 0) > BigInt(a.revenue_30d || 0) ? 1 : -1);
    } else if (sort_by === 'transaction_count') {
      filtered.sort((a: any, b: any) => b.transaction_count - a.transaction_count);
    }
    
    if (filtered.length > 0) {
      return NextResponse.json({ 
        agents: filtered,
        count: filtered.length,
        source: 'graphql'
      });
    }
    
    // Fallback to Turso if GraphQL returns empty
    console.log('[API] GraphQL returned no agents, falling back to Turso');
    
    let sql = `
      SELECT * FROM agents
      WHERE trust_score >= ?
    `;
    const params: any[] = [min_trust_score];
    
    if (verified_only) {
      sql += ` AND has_erc8004_identity = TRUE`;
    }
    
    sql += ` ORDER BY ${sort_by} DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const result = await turso.execute({ sql, args: params });
    
    return NextResponse.json({
      agents: result.rows,
      count: result.rows.length,
      source: 'turso'
    });
    
  } catch (error: any) {
    console.error('[API] Error fetching agents:', error);
    
    // Final fallback to Turso
    try {
      let sql = `SELECT * FROM agents WHERE trust_score >= ?`;
      const params: any[] = [min_trust_score];
      
      if (verified_only) {
        sql += ` AND has_erc8004_identity = TRUE`;
      }
      
      sql += ` ORDER BY ${sort_by} DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      
      const result = await turso.execute({ sql, args: params });
      
      return NextResponse.json({
        agents: result.rows,
        count: result.rows.length,
        source: 'turso_fallback',
        error: error.message
      });
    } catch (fallbackError: any) {
      return NextResponse.json(
        { error: 'Failed to fetch agents', details: fallbackError.message },
        { status: 500 }
      );
    }
  }
}
