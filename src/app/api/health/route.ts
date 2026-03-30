import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
});

export async function GET() {
  try {
    const result = await turso.execute(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN has_erc8004 = 1 THEN 1 ELSE 0 END) as erc8004,
        SUM(CASE WHEN has_x402 = 1 THEN 1 ELSE 0 END) as x402,
        SUM(CASE WHEN has_erc8004 = 1 AND has_x402 = 1 THEN 1 ELSE 0 END) as verified_active
      FROM agents_unified
    `);

    const row = result.rows[0];

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      agents: Number(row.total),
      erc8004_agents: Number(row.erc8004),
      x402_sellers: Number(row.x402),
      verified_active: Number(row.verified_active),
      dataSource: 'turso_agents_unified',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: 'Health check failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
