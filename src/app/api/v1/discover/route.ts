import { NextRequest, NextResponse } from 'next/server';
import { graphqlClient } from '@/lib/graphql-client';

function hexToString(hex: string): string {
  if (!hex || hex === '0x' || !hex.startsWith('0x')) return hex || '';
  try { return Buffer.from(hex.slice(2), 'hex').toString('utf-8'); } catch { return hex; }
}
function decode(v: string) { return typeof v === 'string' && v.startsWith('0x') && v.length > 2 ? hexToString(v) : v || ''; }

// Agent-to-agent discovery endpoint
// Returns JSON-LD formatted agent listings for machine consumption
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const capability = searchParams.get('capability') || '';
  const chain = searchParams.get('chain') || '';
  const minTrust = parseInt(searchParams.get('min_trust') || '0');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const format = searchParams.get('format') || 'jsonld'; // jsonld | simple

  try {
    // Build GraphQL where clause
    const where: string[] = [];
    if (capability) {
      // Use _and to combine ilike + neq on same field
      where.push(`_and: [{description: {_ilike: "%${capability}%"}}, {description: {_neq: ""}}]`);
    } else {
      where.push('description: {_neq: ""}');
    }
    if (chain === 'base') where.push('chain_id: {_eq: 8453}');
    if (chain === 'arbitrum') where.push('chain_id: {_eq: 42161}');
    if (minTrust > 0) where.push(`trust_score: {_gte: ${minTrust}}`);

    const whereClause = where.length > 0 ? `where: {${where.join(', ')}}` : '';

    const data: any = await graphqlClient.request(`{
      Agent(${whereClause}, order_by: {trust_score: desc}, limit: ${limit}) {
        id wallet_address token_id name description category chain_id contract_address
        trust_score transaction_count total_revenue_usdc has_erc8004_identity
        success_rate avg_response_time_ms base_price_usdc pricing_model api_endpoint
        reputation { reputation_score feedback_count client_address }
      }
    }`);

    const agents = (data.Agent || []).map((a: any) => {
      const name = decode(a.name) || `Agent #${a.token_id}`;
      const description = decode(a.description);
      const category = decode(a.category);

      if (format === 'simple') {
        return {
          id: a.id,
          wallet: a.wallet_address,
          name,
          description,
          category,
          chain: a.chain_id === 8453 ? 'base' : a.chain_id === 42161 ? 'arbitrum' : `chain_${a.chain_id}`,
          trust_score: a.trust_score || 0,
          api_endpoint: a.api_endpoint || null,
          pricing: {
            model: a.pricing_model || 'per_call',
            base_usdc: a.base_price_usdc || 0,
          },
          reputation: {
            score: a.reputation?.length > 0
              ? Math.round(a.reputation.reduce((s: number, r: any) => s + (r.reputation_score || 0), 0) / a.reputation.length)
              : 0,
            feedback_count: a.reputation?.reduce((s: number, r: any) => s + (r.feedback_count || 0), 0) || 0,
          },
          erc8004: a.has_erc8004_identity,
        };
      }

      // JSON-LD format — machine-readable linked data
      return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        '@id': `https://agentzone.fun/agent/${encodeURIComponent(a.id)}`,
        name,
        description,
        applicationCategory: category || 'Agent',
        operatingSystem: a.chain_id === 8453 ? 'Base' : a.chain_id === 42161 ? 'Arbitrum' : 'EVM',
        offers: {
          '@type': 'Offer',
          price: a.base_price_usdc || 0,
          priceCurrency: 'USD',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: a.base_price_usdc || 0,
            priceCurrency: 'USDC',
            unitText: a.pricing_model || 'per_call',
          },
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: a.trust_score || 0,
          bestRating: 100,
          ratingCount: a.reputation?.reduce((s: number, r: any) => s + (r.feedback_count || 0), 0) || 0,
        },
        identifier: {
          '@type': 'PropertyValue',
          propertyID: 'ERC-8004',
          value: a.token_id,
        },
        'x-agent': {
          wallet_address: a.wallet_address,
          contract_address: a.contract_address,
          chain_id: a.chain_id,
          token_id: a.token_id,
          api_endpoint: a.api_endpoint || null,
          success_rate: a.success_rate || 0,
          avg_response_time_ms: a.avg_response_time_ms || 0,
          transaction_count: a.transaction_count || 0,
          total_revenue_usdc: a.total_revenue_usdc || 0,
          payment_protocol: 'x402',
          payment_token: 'USDC',
          payment_chain: a.chain_id === 8453 ? 'base' : 'arbitrum',
        },
      };
    });

    const response = format === 'jsonld' ? {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'AgentZone Agent Directory',
      description: 'ERC-8004 verified AI agents with on-chain reputation',
      numberOfItems: agents.length,
      itemListElement: agents.map((a: any, i: number) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: a,
      })),
      query: { capability, chain, minTrust, limit },
    } : {
      agents,
      count: agents.length,
      query: { capability, chain, min_trust: minTrust, limit },
    };

    return NextResponse.json(response, {
      headers: {
        'Content-Type': format === 'jsonld' ? 'application/ld+json' : 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('[Discover] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
