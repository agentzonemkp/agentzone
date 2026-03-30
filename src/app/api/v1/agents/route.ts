import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { resolveMetadata } from '@/lib/metadata-resolver';

const turso = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
  const offset = parseInt(searchParams.get('offset') || '0');
  const min_trust_score = parseInt(searchParams.get('min_trust_score') || '0');
  const search = searchParams.get('search') || searchParams.get('q') || '';
  const sort_by = searchParams.get('sort_by') || 'composite_score';
  const filter = searchParams.get('filter') || 'all'; // all | verified | x402 | both
  const facilitator = searchParams.get('facilitator') || '';

  try {
    // Build WHERE clause
    const conditions: string[] = [];
    const args: any[] = [];

    if (filter === 'verified' || filter === 'erc8004') {
      conditions.push('has_erc8004 = 1');
    } else if (filter === 'x402') {
      conditions.push('has_x402 = 1');
    } else if (filter === 'both') {
      conditions.push('has_erc8004 = 1 AND has_x402 = 1');
    }

    if (facilitator) {
      conditions.push('facilitators LIKE ?');
      args.push(`%${facilitator}%`);
    }
    // 'all' = no filter, show everything

    if (min_trust_score > 0) {
      conditions.push('trust_score >= ?');
      args.push(min_trust_score);
    }

    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ? OR wallet_address LIKE ?)');
      const like = `%${search}%`;
      args.push(like, like, like);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sort
    let orderBy = 'composite_score DESC';
    if (sort_by === 'transaction_count' || sort_by === 'transactions') {
      orderBy = 'tx_count DESC';
    } else if (sort_by === 'reputation') {
      orderBy = 'avg_reputation DESC';
    } else if (sort_by === 'trust_score') {
      orderBy = 'trust_score DESC';
    } else if (sort_by === 'volume') {
      orderBy = 'total_volume_usdc DESC';
    } else if (sort_by === 'recent') {
      orderBy = 'last_tx_at DESC NULLS LAST';
    }

    // Count
    const countResult = await turso.execute({
      sql: `SELECT COUNT(*) as c FROM agents_unified ${where}`,
      args,
    });
    const totalCount = Number(countResult.rows[0].c);

    // Fetch agents
    const result = await turso.execute({
      sql: `SELECT * FROM agents_unified ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    });

    const agents = result.rows.map(row => ({
      id: row.wallet_address,
      wallet_address: row.wallet_address,
      chain_id: Number(row.chain_id) || 8453,
      token_id: row.token_id,
      name: resolveName(String(row.name || ''), String(row.wallet_address || '')),
      description: decodeHex(String(row.description || '')) || String(row.description || ''),
      category: row.category,
      has_erc8004_identity: Boolean(row.has_erc8004),
      has_x402: Boolean(row.has_x402),
      verified: Boolean(row.has_erc8004),
      trust_score: Number(row.trust_score) || 0,
      avg_reputation: Math.round((Number(row.avg_reputation) || 0) * 10) / 10,
      total_feedback: Number(row.total_feedback) || 0,
      transaction_count: Number(row.tx_count) || 0,
      total_revenue_usdc: Number(row.total_volume_usdc) || 0,
      unique_customers: Number(row.unique_buyers) || 0,
      composite_score: Number(row.composite_score) || 0,
      original_minter: row.original_minter,
      last_active_at: row.last_tx_at || row.erc8004_created_at || '',
      facilitators: String(row.facilitators || '').split(',').filter(Boolean),
      chains: String(row.chains || '').split(',').filter(Boolean),
      success_rate: 0,
      revenue_30d: Number(row.total_volume_usdc) || 0,
      tx_count_30d: Number(row.tx_count) || 0,
      base_price_usdc: 0,
      avg_response_time_ms: 0,
      rank_trust: 0,
    }));

    // Resolve on-chain names for agents without readable names (batch, max 50)
    const needsResolution = agents.filter(a =>
      a.token_id && (!a.name || a.name.startsWith('0x') || a.name.match(/^Agent \d+$/))
    ).slice(0, 50);

    if (needsResolution.length > 0) {
      const metaPromises = needsResolution.map(async (a) => {
        try {
          const meta = await resolveMetadata(a.chain_id || 8453, String(a.token_id));
          if (meta?.name) {
            a.name = meta.name;
            a.description = meta.description || a.description;
            // Cache name back to Turso (fire-and-forget)
            turso.execute({
              sql: `UPDATE agents_unified SET name = ? WHERE wallet_address = ?`,
              args: [meta.name, String(a.wallet_address)],
            }).catch(() => {});
          }
        } catch {}
      });
      await Promise.allSettled(metaPromises);
    }

    return NextResponse.json({
      agents,
      count: agents.length,
      total: totalCount,
      offset,
      limit,
      filter,
      source: 'turso_unified',
    });
  } catch (error: any) {
    console.error('[API] agents error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch agents', details: error.message },
      { status: 500 }
    );
  }
}

function decodeHex(val: string): string {
  if (typeof val === 'string' && val.startsWith('0x') && val.length > 2) {
    try {
      const clean = val.slice(2);
      if (clean.length === 0 || clean.length % 2 !== 0) return '';
      const bytes = Buffer.from(clean, 'hex');
      const decoded = bytes.toString('utf-8').trim();
      if (/^[\x20-\x7E\s]+$/.test(decoded) && decoded.length > 0) return decoded;
    } catch {}
  }
  return '';
}

function resolveName(name: string, wallet: string): string {
  // Try raw name first
  if (name && !name.startsWith('0x') && name.length > 0) return name;
  // Try hex decode
  const decoded = decodeHex(name);
  if (decoded) return decoded;
  // Fallback to formatted wallet address
  if (wallet && wallet.length >= 10) return `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;
  return 'Unknown Agent';
}
