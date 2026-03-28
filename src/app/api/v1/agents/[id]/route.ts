import { NextRequest, NextResponse } from 'next/server';
import { graphqlClient, queries } from '@/lib/graphql-client';

function hexToString(hex: string): string {
  if (!hex || hex === '0x' || !hex.startsWith('0x')) return hex || '';
  const clean = hex.slice(2);
  if (clean.length === 0 || clean.length % 2 !== 0) return hex;
  try { return Buffer.from(clean, 'hex').toString('utf-8'); } catch { return hex; }
}
function decodeField(val: string): string {
  return typeof val === 'string' && val.startsWith('0x') && val.length > 2 ? hexToString(val) : val || '';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agentId = decodeURIComponent(id);

  try {
    const data: any = await graphqlClient.request(queries.getAgent, { id: agentId });
    const agents = data.Agent || [];

    if (agents.length === 0) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = agents[0];
    const reputations = agent.reputation || [];
    const avgReputation = reputations.length > 0
      ? reputations.reduce((sum: number, r: any) => sum + (r.reputation_score || 0), 0) / reputations.length
      : 0;
    const totalFeedback = reputations.reduce((sum: number, r: any) => sum + (r.feedback_count || 0), 0);

    return NextResponse.json({
      agent: {
        id: agent.id,
        wallet_address: agent.wallet_address,
        chain_id: agent.chain_id,
        contract_address: agent.contract_address,
        token_id: agent.token_id,
        name: decodeField(agent.name) || `Agent #${agent.token_id}`,
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
        pricing_model: agent.pricing_model || 'per_call',
        api_endpoint: agent.api_endpoint || '',
        avg_response_time_ms: agent.avg_response_time_ms || 0,
        rank_revenue: agent.rank_revenue || 0,
        rank_transactions: agent.rank_transactions || 0,
        rank_trust: agent.rank_trust || 0,
        growth_rate: agent.growth_rate || 0,
        created_at: agent.created_at || '',
        last_active_at: agent.last_active_at || '',
      },
      reputation: {
        avg_score: Math.round(avgReputation),
        total_feedback: totalFeedback,
        reviews: reputations.map((r: any) => ({
          client: r.client_address,
          score: r.reputation_score,
          feedback_count: r.feedback_count,
        })),
      },
      payments: (agent.payments || []).map((p: any) => ({
        id: p.id,
        tx_hash: p.tx_hash,
        customer: p.customer_address,
        amount_usdc: p.amount_usdc,
        service: p.service_name,
        status: p.status,
        timestamp: p.timestamp,
      })),
      source: 'graphql',
    });
  } catch (error: any) {
    console.error('[API] Error fetching agent:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch agent', details: error.message },
      { status: 500 }
    );
  }
}
