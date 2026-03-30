import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // id param is now a wallet_address
    const result = await turso.execute({
      sql: `SELECT wallet_address, tx_count, total_volume_usdc, unique_buyers, first_tx_at, last_tx_at 
            FROM x402_payments 
            WHERE wallet_address = ?`,
      args: [id.toLowerCase()],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({
        jobs: [],
        count: 0,
        wallet_address: id,
        tx_count: 0,
        total_volume_usdc: 0,
        unique_buyers: 0,
      });
    }

    const row = result.rows[0];
    
    return NextResponse.json({
      jobs: {
        wallet_address: String(row.wallet_address),
        tx_count: Number(row.tx_count) || 0,
        total_volume_usdc: Number(row.total_volume_usdc) || 0,
        unique_buyers: Number(row.unique_buyers) || 0,
        first_tx_at: row.first_tx_at ? String(row.first_tx_at) : null,
        last_tx_at: row.last_tx_at ? String(row.last_tx_at) : null,
      },
      count: Number(row.tx_count) || 0,
    });
  } catch (error) {
    console.error('Jobs fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
