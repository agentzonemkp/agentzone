import { NextRequest, NextResponse } from 'next/server';
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
    // Query Turso agents_unified table
    const conditions: string[] = [];
    const args: any[] = [];
    
    if (capability) {
      conditions.push('(name LIKE ? OR description LIKE ? OR category LIKE ?)');
      const pattern = `%${capability}%`;
      args.push(pattern, pattern, pattern);
    }
    
    if (chain === 'base') {
      conditions.push('chain_id = ?');
      args.push(8453);
    } else if (chain === 'arbitrum') {
      conditions.push('chain_id = ?');
      args.push(42161);
    }
    
    if (minTrust > 0) {
      conditions.push('trust_score >= ?');
      args.push(minTrust);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const result = await turso.execute({
      sql: `SELECT wallet_address, token_id as token_id, name, description, 
            category, chain_id as chain_id,
            trust_score, tx_count as transaction_count, total_volume_usdc as total_revenue_usdc,
            has_erc8004, has_x402, composite_score
            FROM agents_unified
            ${whereClause}
            ORDER BY composite_score DESC
            LIMIT ?`,
      args: [...args, limit],
    });

    const rawAgents = result.rows.map((row: any) => ({
      id: String(row.wallet_address),
      wallet_address: String(row.wallet_address),
      token_id: String(row.token_id || ''),
      name: decode(String(row.name || '')),
      description: decode(String(row.description || '')),
      category: decode(String(row.category || '')),
      chain_id: Number(row.chain_id) || 8453,
      contract_address: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
      trust_score: Number(row.trust_score) || 0,
      transaction_count: Number(row.transaction_count) || 0,
      total_revenue_usdc: Number(row.total_revenue_usdc) || 0,
      has_erc8004_identity: Boolean(row.has_erc8004),
      has_x402: Boolean(row.has_x402),
    }));

    // Apply data quality filter
    const filtered = rawAgents.filter((a: any) => {
      const name = a.name || '';
      const desc = a.description || '';
      
      if (name.startsWith('Agent #')) {
        const hasJunkDesc = desc.includes('data:application') || 
                           desc.includes('<svg') || 
                           desc.includes('pragma solidity') || 
                           desc.includes('localhost') ||
                           (desc.startsWith('http://') || desc.startsWith('https://'));
        if (hasJunkDesc) return false;
      }
      
      if (desc.includes('<svg') || desc.includes('pragma solidity')) return false;
      if (name.startsWith('data:')) return false;
      
      return true;
    });

    const agents = filtered.map((a: any) => {
      const name = a.name || `Agent #${a.token_id}`;
      const description = a.description;
      const category = a.category;

      if (format === 'simple') {
        return {
          id: a.wallet_address,
          wallet: a.wallet_address,
          name,
          description,
          category,
          chain: a.chain_id === 8453 ? 'base' : a.chain_id === 42161 ? 'arbitrum' : `chain_${a.chain_id}`,
          trust_score: a.trust_score || 0,
          api_endpoint: null,
          pricing: {
            model: 'per_call',
            base_usdc: 0,
          },
          reputation: {
            score: a.trust_score || 0,
            feedback_count: 0,
          },
          erc8004: a.has_erc8004_identity,
          x402: a.has_x402,
        };
      }

      // JSON-LD format — machine-readable linked data
      return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        '@id': `https://agentzone.fun/agent/${encodeURIComponent(a.wallet_address)}`,
        name,
        description,
        applicationCategory: category || 'Agent',
        operatingSystem: a.chain_id === 8453 ? 'Base' : a.chain_id === 42161 ? 'Arbitrum' : 'EVM',
        offers: {
          '@type': 'Offer',
          price: 0,
          priceCurrency: 'USD',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: 0,
            priceCurrency: 'USDC',
            unitText: 'per_call',
          },
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: a.trust_score || 0,
          bestRating: 100,
          ratingCount: 0,
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
          api_endpoint: null,
          success_rate: 0,
          avg_response_time_ms: 0,
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
