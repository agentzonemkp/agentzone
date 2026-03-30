import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const wallet = searchParams.get('wallet')?.toLowerCase();

    let sql = 'SELECT * FROM x402_payments';
    const args: any[] = [];

    if (wallet) {
      sql += ' WHERE wallet_address = ?';
      args.push(wallet);
    }

    sql += ' ORDER BY total_volume_usdc DESC LIMIT ?';
    args.push(limit);

    const result = await turso.execute({ sql, args });

    const payments = result.rows.map((row: any) => ({
      wallet_address: String(row.wallet_address),
      tx_count: Number(row.tx_count) || 0,
      total_volume_usdc: Number(row.total_volume_usdc) || 0,
      unique_buyers: Number(row.unique_buyers) || 0,
      first_tx_at: row.first_tx_at ? String(row.first_tx_at) : null,
      last_tx_at: row.last_tx_at ? String(row.last_tx_at) : null,
      updated_at: row.updated_at ? String(row.updated_at) : null,
    }));

    return NextResponse.json({
      payments,
      count: payments.length,
    });
  } catch (error: any) {
    console.error('Payments fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
