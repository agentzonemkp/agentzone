import { NextRequest, NextResponse } from 'next/server';
import { graphqlClient, queries } from '@/lib/graphql-client';
import { createClient } from '@libsql/client';
import { batchResolveMetadata } from '@/lib/metadata-resolver';

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
    // Search query — proxy to /api/v1/search which has proper semantic scoring
    if (search) {
      // Build internal search URL
      const searchUrl = new URL('/api/v1/search', request.url);
      searchUrl.searchParams.set('q', search);
      searchUrl.searchParams.set('limit', String(limit));
      searchUrl.searchParams.set('mode', 'hybrid');

      try {
        const searchRes = await fetch(searchUrl.toString());
        const searchData = await searchRes.json();
        // Enrich search results with reputation data from GraphQL
        const searchAgents = searchData.agents || [];
        const agentIds = searchAgents.map((a: any) => a.id).filter(Boolean);
        let repMap = new Map<string, { avg: number; count: number }>();
        if (agentIds.length > 0) {
          try {
            const repData: any = await graphqlClient.request(`
              query GetReps($ids: [String!]) {
                Agent(where: {id: {_in: $ids}}) {
                  id
                  reputation { reputation_score feedback_count }
                }
              }
            `, { ids: agentIds });
            for (const a of (repData.Agent || [])) {
              const reps = a.reputation || [];
              const avg = reps.length > 0
                ? reps.reduce((s: number, r: any) => s + (r.reputation_score || 0), 0) / reps.length
                : 0;
              const count = reps.reduce((s: number, r: any) => s + (r.feedback_count || 0), 0);
              repMap.set(a.id, { avg: Math.round(avg), count });
            }
          } catch {}
        }
        const agents = searchAgents.map((a: any) => {
          const rep = repMap.get(a.id) || { avg: 0, count: 0 };
          return {
            ...a,
            verified: a.has_erc8004_identity,
            avg_reputation: rep.avg,
            total_feedback: rep.count,
            success_rate: 0,
            unique_customers: 0,
            revenue_30d: 0,
            tx_count_30d: 0,
            base_price_usdc: 0,
            avg_response_time_ms: 0,
            rank_trust: 0,
            last_active_at: '',
          };
        });
        return NextResponse.json({ agents, count: agents.length, source: 'graphql' });
      } catch {
        // Fall through to standard list if search proxy fails
      }
    }

    // Standard list — for ranking sort, fetch agents with reputation first
    let data: any;
    if (sort_by === 'ranking' || sort_by === 'reputation') {
      // Two-pass: first get agents that have reputation, then fill remaining slots
      const repData: any = await graphqlClient.request(`
        query RankedAgents($limit: Int) {
          Reputation(order_by: {reputation_score: desc_nulls_last}, limit: 200) {
            agent_id
            reputation_score
            feedback_count
          }
        }
      `, { limit: 200 });
      const repEntries = repData.Reputation || [];
      const uniqueAgentIds = [...new Set(repEntries.map((r: any) => r.agent_id))].slice(0, limit);
      
      if (uniqueAgentIds.length > 0) {
        const agentData: any = await graphqlClient.request(`
          query AgentsByIds($ids: [String!]) {
            Agent(where: {id: {_in: $ids}}) {
              id wallet_address chain_id token_id name description category
              has_erc8004_identity verified trust_score success_rate
              total_revenue_usdc transaction_count unique_customers
              revenue_30d tx_count_30d base_price_usdc avg_response_time_ms
              rank_trust created_at last_active_at
              reputation { reputation_score feedback_count client_address }
            }
          }
        `, { ids: uniqueAgentIds });
        data = agentData;
      } else {
        const query = verified_only ? queries.getVerifiedAgents : queries.getAgents;
        data = await graphqlClient.request(query, { limit, offset });
      }
    } else {
      const query = verified_only ? queries.getVerifiedAgents : queries.getAgents;
      data = await graphqlClient.request(query, { limit, offset });
    }
    let agents = (data.Agent || []).map(mapAgent);

    // Enrich agents that have generic names with on-chain metadata
    const needsEnrich = agents.filter((a: any) => {
      const n = a.name || '';
      return !n || /^Agent \d+$/.test(n) || (n.startsWith('0x') && n.length > 10);
    });
    if (needsEnrich.length > 0) {
      const metadata = await batchResolveMetadata(needsEnrich, 10);
      for (const agent of agents) {
        const key = `${agent.chain_id}_${agent.token_id}`;
        const meta = metadata.get(key);
        if (meta) {
          if (meta.name) agent.name = meta.name;
          if (meta.description) agent.description = meta.description;
          if (meta.category) agent.category = meta.category;
        }
      }
    }

    // Filter by min trust score
    if (min_trust_score > 0) {
      agents = agents.filter((a: any) => a.trust_score >= min_trust_score);
    }

    // Sort — default: compound rank (reputation + usage), otherwise by specified field
    if (sort_by === 'transaction_count') {
      agents.sort((a: any, b: any) => (b.transaction_count || 0) - (a.transaction_count || 0));
    } else if (sort_by === 'reputation') {
      agents.sort((a: any, b: any) => (b.avg_reputation || 0) - (a.avg_reputation || 0));
    } else {
      // Default compound sort: reputation desc → transaction_count desc → trust_score desc
      agents.sort((a: any, b: any) => {
        const repDiff = (b.avg_reputation || 0) - (a.avg_reputation || 0);
        if (repDiff !== 0) return repDiff;
        const txDiff = (b.transaction_count || 0) - (a.transaction_count || 0);
        if (txDiff !== 0) return txDiff;
        return (b.trust_score || 0) - (a.trust_score || 0);
      });
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
