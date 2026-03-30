import { NextRequest, NextResponse } from 'next/server';
import { graphqlClient, queries } from '@/lib/graphql-client';
import { resolveMetadata } from '@/lib/metadata-resolver';
import { getX402PaymentData } from '@/lib/x402-data';
import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
});

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
    // Try GraphQL first
    let agent: any = null;
    let reputations: any[] = [];
    let payments: any[] = [];
    let source = 'graphql';

    try {
      const data: any = await graphqlClient.request(queries.getAgent, { id: agentId });
      const agents = data.Agent || [];
      if (agents.length > 0) {
        agent = agents[0];
        reputations = agent.reputation || [];
        payments = agent.payments || [];
      }
    } catch (gqlErr: any) {
      console.error('[API] GraphQL error, trying Turso:', gqlErr.message);
    }

    // Fallback: try Turso agents_unified by wallet address or id
    if (!agent) {
      source = 'turso';
      const result = await turso.execute({
        sql: `SELECT * FROM agents_unified WHERE wallet_address = ? LIMIT 1`,
        args: [agentId.toLowerCase()],
      });
      if (result.rows.length > 0) {
        const row = result.rows[0];
        agent = {
          id: String(row.wallet_address || row.id),
          wallet_address: String(row.wallet_address),
          chain_id: Number(row.chain_id) || 8453,
          contract_address: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
          token_id: String(row.token_id || ''),
          name: String(row.name || ''),
          description: String(row.description || ''),
          category: String(row.category || ''),
          has_erc8004_identity: Boolean(row.has_erc8004_identity),
          trust_score: Number(row.trust_score) || 0,
          total_revenue_usdc: Number(row.total_revenue_usdc) || 0,
          transaction_count: Number(row.transaction_count) || 0,
          avg_reputation: Number(row.avg_reputation) || 0,
          total_feedback: Number(row.total_feedback) || 0,
          has_x402: Boolean(row.has_x402),
          x402_tx_count: Number(row.x402_tx_count) || 0,
          x402_volume: Number(row.x402_volume) || 0,
          x402_buyers: Number(row.x402_buyers) || 0,
        };
      }
    }

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const avgReputation = reputations.length > 0
      ? reputations.reduce((sum: number, r: any) => sum + (r.reputation_score || 0), 0) / reputations.length
      : (agent.avg_reputation || 0);
    const totalFeedback = reputations.length > 0
      ? reputations.reduce((sum: number, r: any) => sum + (r.feedback_count || 0), 0)
      : (agent.total_feedback || 0);

    // Resolve on-chain metadata if name is generic
    let resolvedName = decodeField(agent.name);
    let resolvedDesc = decodeField(agent.description);
    let resolvedCategory = decodeField(agent.category);
    let resolvedEndpoint = agent.api_endpoint || '';
    let resolvedImage = '';
    let resolvedUrl = '';
    let resolvedServices: any[] = [];

    if (!resolvedName || /^Agent \d+$/.test(resolvedName) || resolvedName.startsWith('0x')) {
      try {
        const meta = await resolveMetadata(agent.chain_id || 8453, agent.token_id);
        if (meta) {
          resolvedName = meta.name || resolvedName;
          resolvedDesc = meta.description || resolvedDesc;
          resolvedCategory = meta.category || resolvedCategory;
          resolvedEndpoint = meta.services?.[0]?.url || resolvedEndpoint;
          resolvedImage = meta.image || '';
          resolvedUrl = meta.external_url || '';
          resolvedServices = meta.services || [];
        }
      } catch {}
    }

    // Get x402 payment data
    const walletAddr = agent.wallet_address || agentId;
    let x402Data = null;
    try {
      x402Data = await getX402PaymentData(walletAddr);
    } catch {}

    const hasX402 = agent.has_x402 || (x402Data && x402Data.tx_count > 0);
    const txCount = (x402Data?.tx_count || agent.x402_tx_count || agent.transaction_count || 0);
    const volume = (x402Data?.total_volume_usdc || agent.x402_volume || agent.total_revenue_usdc || 0);
    const buyers = (x402Data?.unique_buyers || agent.x402_buyers || agent.unique_customers || 0);

    // Populate services array if has x402 data
    const services = [];
    if (hasX402 && x402Data && x402Data.tx_count > 0) {
      services.push({
        id: `x402_${walletAddr}`,
        name: 'x402 Payment Service',
        description: 'On-chain payment processing via x402 protocol',
        price_usdc: volume > 0 && txCount > 0 ? Math.round((volume / txCount) * 100) / 100 : 0,
        endpoint: resolvedEndpoint || null,
        active: true,
        total_volume: volume,
        total_transactions: txCount,
        unique_customers: buyers,
      });
    }

    // Add resolved metadata services
    if (resolvedServices && resolvedServices.length > 0) {
      services.push(...resolvedServices.map((s: any) => ({
        id: s.id || `service_${crypto.randomUUID()}`,
        name: s.name || 'Service',
        description: s.description || '',
        price_usdc: s.price || 0,
        endpoint: s.url || resolvedEndpoint || null,
        active: true,
      })));
    }

    return NextResponse.json({
      agent: {
        id: agent.id,
        wallet_address: walletAddr,
        chain_id: agent.chain_id || 8453,
        contract_address: agent.contract_address || '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
        token_id: agent.token_id || '',
        name: resolvedName || `Agent #${agent.token_id || 'Unknown'}`,
        description: resolvedDesc,
        category: resolvedCategory,
        image: resolvedImage,
        external_url: resolvedUrl,
        services,
        has_erc8004_identity: agent.has_erc8004_identity || false,
        has_x402: hasX402 || false,
        verified: agent.verified || agent.has_erc8004_identity || false,
        trust_score: agent.trust_score || 0,
        success_rate: agent.success_rate || 0,
        total_revenue_usdc: volume,
        transaction_count: txCount,
        unique_customers: buyers,
        revenue_30d: agent.revenue_30d || 0,
        tx_count_30d: agent.tx_count_30d || 0,
        base_price_usdc: agent.base_price_usdc || 0,
        pricing_model: agent.pricing_model || 'per_call',
        api_endpoint: resolvedEndpoint,
        avg_response_time_ms: agent.avg_response_time_ms || 0,
        rank_revenue: agent.rank_revenue || 0,
        rank_transactions: agent.rank_transactions || 0,
        rank_trust: agent.rank_trust || 0,
        growth_rate: agent.growth_rate || 0,
        created_at: agent.created_at || '',
        last_active_at: x402Data?.last_tx || agent.last_active_at || '',
        is_soulbound: true,
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
      payments: payments.map((p: any) => ({
        id: p.id,
        tx_hash: p.tx_hash,
        customer: p.customer_address,
        amount_usdc: p.amount_usdc,
        service: p.service_name,
        status: p.status,
        timestamp: p.timestamp,
      })),
      x402: x402Data ? {
        tx_count: x402Data.tx_count,
        total_volume_usdc: x402Data.total_volume_usdc,
        unique_buyers: x402Data.unique_buyers,
        first_tx: x402Data.first_tx,
        last_tx: x402Data.last_tx,
      } : null,
      source,
    });
  } catch (error: any) {
    console.error('[API] Error fetching agent:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch agent', details: error.message },
      { status: 500 }
    );
  }
}
