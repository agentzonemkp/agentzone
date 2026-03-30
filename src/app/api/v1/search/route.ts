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
function decode(val: string): string {
  return typeof val === 'string' && val.startsWith('0x') && val.length > 2 ? hexToString(val) : val || '';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const filter = searchParams.get('filter') || 'all'; // all | verified | x402 | both

    if (!query) {
      return NextResponse.json({ error: 'Missing q parameter' }, { status: 400 });
    }

    const queryLower = query.toLowerCase().trim();
    const pattern = `%${queryLower}%`;

    // Build filter conditions
    const filterConditions: string[] = [];
    if (filter === 'verified') filterConditions.push('has_erc8004 = 1');
    if (filter === 'x402') filterConditions.push('has_x402 = 1');
    if (filter === 'both') filterConditions.push('has_erc8004 = 1 AND has_x402 = 1');
    const filterSQL = filterConditions.length > 0 ? `AND ${filterConditions.join(' AND ')}` : '';

    // Search agents_unified with scoring via SQL
    // Priority: exact name > name starts with > name contains > description contains
    const result = await turso.execute({
      sql: `SELECT wallet_address, name, description, category, chain_id, token_id,
                   trust_score, composite_score, has_erc8004, has_x402,
                   tx_count, total_volume_usdc,
                   CASE
                     WHEN LOWER(name) = ? THEN 1000
                     WHEN LOWER(name) LIKE ? THEN 100
                     WHEN LOWER(name) LIKE ? THEN 50
                     WHEN LOWER(description) LIKE ? THEN 10
                     WHEN LOWER(category) LIKE ? THEN 5
                     ELSE 1
                   END + COALESCE(trust_score, 0) * 0.01 as relevance
            FROM agents_unified
            WHERE (LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category) LIKE ? OR LOWER(wallet_address) LIKE ?)
            ${filterSQL}
            ORDER BY relevance DESC
            LIMIT ?`,
      args: [
        queryLower,           // exact match
        `${queryLower}%`,     // starts with
        pattern,              // contains
        pattern,              // desc contains
        pattern,              // cat contains
        pattern, pattern, pattern, pattern, // WHERE clauses
        limit,
      ],
    });

    const agents = result.rows.map((row: any) => {
      const rawName = String(row.name || '');
      const name = decode(rawName) || `Agent #${row.token_id || String(row.wallet_address).slice(0, 8)}`;
      return {
        id: String(row.wallet_address),
        wallet_address: String(row.wallet_address),
        token_id: String(row.token_id || ''),
        name,
        description: decode(String(row.description || '')),
        category: decode(String(row.category || '')),
        chain_id: Number(row.chain_id) || 8453,
        trust_score: Number(row.trust_score) || 0,
        composite_score: Number(row.composite_score) || 0,
        has_erc8004: Boolean(row.has_erc8004),
        has_x402: Boolean(row.has_x402),
        tx_count: Number(row.tx_count) || 0,
        total_volume_usdc: Number(row.total_volume_usdc) || 0,
        relevance_score: Math.round(Number(row.relevance) * 100) / 100,
      };
    });

    // Filter junk results
    const filtered = agents.filter((a) => {
      const { name, description } = a;
      if (name.startsWith('data:')) return false;
      if (description.includes('<svg') || description.includes('pragma solidity')) return false;
      return true;
    });

    return NextResponse.json({
      query,
      filter,
      agents: filtered,
      count: filtered.length,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('[Search] Error:', error);
    return NextResponse.json({ error: 'Search failed', details: error.message }, { status: 500 });
  }
}
