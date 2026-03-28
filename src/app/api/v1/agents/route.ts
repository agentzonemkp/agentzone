import { NextRequest, NextResponse } from 'next/server';
import { graphqlClient, queries } from '@/lib/graphql-client';
import { createClient } from '@libsql/client';
import { batchResolveMetadata } from '@/lib/metadata-resolver';
import { getBatchX402PaymentData } from '@/lib/x402-data';

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
        let agents = searchAgents.map((a: any) => {
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
        
        // Enrich search results with x402 payment data
        try {
          const walletAddrs = agents.map((a: any) => a.wallet_address).filter(Boolean);
          const x402Data = await getBatchX402PaymentData(walletAddrs);
          for (const agent of agents) {
            const paymentData = x402Data.get(agent.wallet_address?.toLowerCase());
            if (paymentData) {
              agent.transaction_count = paymentData.tx_count;
              agent.total_revenue_usdc = paymentData.total_volume_usdc;
              agent.unique_customers = paymentData.unique_buyers;
              agent.last_active_at = paymentData.last_tx || agent.last_active_at;
            }
          }
        } catch (error: any) {
          console.error('[agents/search] Error enriching with x402 data:', error.message);
        }
        
        return NextResponse.json({ agents, count: agents.length, source: 'graphql' });
      } catch {
        // Fall through to standard list if search proxy fails
      }
    }

    // APPROACH: Get x402 seller wallets from Turso (fast, local), 
    // then batch-verify ERC-8004 identity via GraphQL.
    // Only the intersection gets listed: verified identity + real transactions.
    
    // Step 1: Get top x402 sellers (sorted by volume, with tx > 0)
    const x402Result = await turso.execute(
      'SELECT * FROM x402_payments WHERE tx_count > 0 ORDER BY total_volume_usdc DESC LIMIT 5000'
    );
    const x402Map = new Map<string, any>();
    for (const row of x402Result.rows) {
      x402Map.set(String(row.wallet_address).toLowerCase(), row);
    }
    const x402Wallets = [...x402Map.keys()];

    // Step 2: Check ERC-8004 identity in parallel batches (50 per query)
    let agents: any[] = [];
    const batchSize = 50;
    const batchPromises = [];
    for (let i = 0; i < x402Wallets.length; i += batchSize) {
      const batch = x402Wallets.slice(i, i + batchSize);
      batchPromises.push(
        graphqlClient.request(`
          query FindVerifiedSellers($wallets: [String!]) {
            Agent(where: {wallet_address: {_in: $wallets}, has_erc8004_identity: {_eq: true}}) {
              id wallet_address chain_id token_id name description category
              has_erc8004_identity verified trust_score success_rate
              total_revenue_usdc transaction_count unique_customers
              revenue_30d tx_count_30d base_price_usdc avg_response_time_ms
              rank_trust created_at last_active_at original_minter
              reputation { reputation_score feedback_count client_address }
            }
          }
        `, { wallets: batch }).catch((e: any) => {
          console.error(`[agents] GraphQL batch ${i} failed:`, e.message);
          return { Agent: [] };
        })
      );
    }
    const results = await Promise.all(batchPromises);
    for (const data of results) {
      const found = ((data as any).Agent || []).map(mapAgent);
      agents.push(...found);
    }

    // Step 3: Deduplicate (same wallet might have multiple tokens across chains)
    const seen = new Set<string>();
    agents = agents.filter(a => {
      const key = a.wallet_address?.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Step 4: Overlay x402 transaction data onto ERC-8004 agents
    for (const agent of agents) {
      const x402 = x402Map.get(agent.wallet_address?.toLowerCase());
      if (x402) {
        agent.transaction_count = Number(x402.tx_count) || 0;
        agent.total_revenue_usdc = Number(x402.total_volume_usdc) || 0;
        agent.unique_customers = Number(x402.unique_buyers) || 0;
        agent.revenue_30d = Number(x402.total_volume_usdc) || 0;
        agent.tx_count_30d = Number(x402.tx_count) || 0;
        agent.last_active_at = x402.last_tx_at ? String(x402.last_tx_at) : agent.last_active_at;
      }
    }

    // Step 5: Enrich generic names with on-chain metadata
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

    // STRICT: both ERC-8004 reputation AND x402 transactions must be > 0
    // If either is zero, agent is not listed. No exceptions.
    agents = agents.filter((a: any) => {
      const hasReputation = (a.avg_reputation || 0) > 0 || (a.total_feedback || 0) > 0;
      const hasTransactions = (a.transaction_count || 0) > 0;
      return hasReputation && hasTransactions;
    });

    // Sort — default: composite rank (reputation × usage), otherwise by specified field
    // Ranking formula: weighted composite of reputation, x402 transactions, feedback count, and trust
    // Agents with zero transactions get a significant penalty — reputation alone isn't enough
    const computeRankScore = (a: any) => {
      const rep = a.avg_reputation || 0;
      const txCount = a.transaction_count || 0;
      const feedbackCount = a.total_feedback || 0;
      const trust = a.trust_score || 0;

      // Normalize reputation to 0-100 scale (scores can be 0-5000+)
      const repNorm = Math.min(rep / 50, 100);
      // Transaction activity (log scale — 1 tx = 0, 10 = 23, 100 = 46, 1000 = 69)
      const txScore = txCount > 0 ? Math.log10(txCount) * 23 : 0;
      // Feedback diversity (more unique reviewers = more credible)
      const feedbackScore = Math.min(feedbackCount * 10, 50);
      // Trust baseline
      const trustNorm = trust;

      // Composite: 30% reputation + 35% transactions + 15% feedback diversity + 20% trust
      // Agents with zero transactions cap at 45/100 max (rep + feedback only)
      return (repNorm * 0.30) + (txScore * 0.35) + (feedbackScore * 0.15) + (trustNorm * 0.20);
    };

    if (sort_by === 'transaction_count') {
      agents.sort((a: any, b: any) => (b.transaction_count || 0) - (a.transaction_count || 0));
    } else if (sort_by === 'reputation') {
      agents.sort((a: any, b: any) => (b.avg_reputation || 0) - (a.avg_reputation || 0));
    } else {
      // Default: composite rank score
      agents.sort((a: any, b: any) => computeRankScore(b) - computeRankScore(a));
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
