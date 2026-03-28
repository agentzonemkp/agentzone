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
  const search = searchParams.get('search') || '';
  const sort_by = searchParams.get('sort_by') || 'trust_score';

  try {
    // Search query
    if (search) {
      const data: any = await graphqlClient.request(queries.searchAgents, {
        search: `%${search}%`,
        limit,
      });
      const agents = (data.Agent || []).map(mapAgent);
      return NextResponse.json({ agents, count: agents.length, source: 'graphql' });
    }

    // Standard list
    const query = verified_only ? queries.getVerifiedAgents : queries.getAgents;
    const data: any = await graphqlClient.request(query, { limit, offset });
    let agents = (data.Agent || []).map(mapAgent);

    // Filter by min trust score
    if (min_trust_score > 0) {
      agents = agents.filter((a: any) => a.trust_score >= min_trust_score);
    }

    // Sort
    if (sort_by === 'transaction_count') {
      agents.sort((a: any, b: any) => b.transaction_count - a.transaction_count);
    } else if (sort_by === 'reputation') {
      agents.sort((a: any, b: any) => (b.avg_reputation || 0) - (a.avg_reputation || 0));
    }

    return NextResponse.json({
      agents,
      count: agents.length,
      source: 'graphql',
    });
  } catch (error: any) {
    console.error('[API] GraphQL error, falling back to Turso:', error.message);

    // Turso fallback
    try {
      const result = await turso.execute({
        sql: `SELECT * FROM agents WHERE trust_score >= ? ORDER BY trust_score DESC LIMIT ? OFFSET ?`,
        args: [min_trust_score, limit, offset],
      });
      return NextResponse.json({
        agents: result.rows,
        count: result.rows.length,
        source: 'turso_fallback',
      });
    } catch (fallbackError: any) {
      return NextResponse.json(
        { error: 'Failed to fetch agents', details: fallbackError.message },
        { status: 500 }
      );
    }
  }
}

// Decode hex-encoded bytes to UTF-8 string
function hexToString(hex: string): string {
  if (!hex || hex === '0x' || !hex.startsWith('0x')) return hex || '';
  const clean = hex.slice(2);
  if (clean.length === 0 || clean.length % 2 !== 0) return hex;
  try {
    const bytes = Buffer.from(clean, 'hex');
    return bytes.toString('utf-8');
  } catch {
    return hex;
  }
}

function decodeField(val: string): string {
  if (typeof val === 'string' && val.startsWith('0x') && val.length > 2) {
    return hexToString(val);
  }
  return val || '';
}

// Map GraphQL agent to a normalized shape for the frontend
function mapAgent(agent: any) {
  const reputations = agent.reputation || [];
  const avgReputation = reputations.length > 0
    ? reputations.reduce((sum: number, r: any) => sum + (r.reputation_score || 0), 0) / reputations.length
    : 0;
  const totalFeedback = reputations.reduce((sum: number, r: any) => sum + (r.feedback_count || 0), 0);

  return {
    id: agent.id,
    wallet_address: agent.wallet_address,
    chain_id: agent.chain_id || 8453,
    token_id: agent.token_id,
    name: decodeField(agent.name),
    description: decodeField(agent.description),
    category: decodeField(agent.category),
    has_erc8004_identity: agent.has_erc8004_identity,
    verified: agent.verified || agent.has_erc8004_identity,
    trust_score: agent.trust_score || 0,
    success_rate: agent.success_rate || 0,
    total_revenue_usdc: agent.total_revenue_usdc || 0,
    transaction_count: agent.transaction_count || 0,
    unique_customers: agent.unique_customers || 0,
    revenue_30d: agent.revenue_30d || 0,
    tx_count_30d: agent.tx_count_30d || 0,
    base_price_usdc: agent.base_price_usdc || 0,
    avg_response_time_ms: agent.avg_response_time_ms || 0,
    rank_trust: agent.rank_trust || 0,
    last_active_at: agent.last_active_at || '',
    avg_reputation: Math.round(avgReputation),
    total_feedback: totalFeedback,
  };
}
