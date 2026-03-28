import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
});

const X402SCAN_BASE = 'https://www.x402scan.com/api/trpc';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export interface X402PaymentData {
  address: string;
  tx_count: number;
  total_volume_usdc: number;
  unique_buyers: number;
  first_tx: string | null;
  last_tx: string | null;
}

/**
 * Get x402 payment data for a specific wallet address
 */
export async function getX402PaymentData(walletAddress: string): Promise<X402PaymentData | null> {
  const normalizedAddress = walletAddress.toLowerCase();

  const cached = await turso.execute({
    sql: `SELECT * FROM x402_payments WHERE wallet_address = ?`,
    args: [normalizedAddress],
  });

  if (cached.rows.length > 0) {
    const row = cached.rows[0];
    return {
      address: String(row.wallet_address),
      tx_count: Number(row.tx_count) || 0,
      total_volume_usdc: Number(row.total_volume_usdc) || 0,
      unique_buyers: Number(row.unique_buyers) || 0,
      first_tx: row.first_tx_at ? String(row.first_tx_at) : null,
      last_tx: row.last_tx_at ? String(row.last_tx_at) : null,
    };
  }

  return null;
}

/**
 * Get x402 payment data for multiple wallet addresses (batch)
 */
export async function getBatchX402PaymentData(walletAddresses: string[]): Promise<Map<string, X402PaymentData>> {
  if (walletAddresses.length === 0) return new Map();

  const placeholders = walletAddresses.map(() => '?').join(',');
  const normalizedAddresses = walletAddresses.map(a => a.toLowerCase());

  const result = await turso.execute({
    sql: `SELECT * FROM x402_payments WHERE wallet_address IN (${placeholders}) AND tx_count > 0`,
    args: normalizedAddresses,
  });

  const paymentMap = new Map<string, X402PaymentData>();
  for (const row of result.rows) {
    const addr = String(row.wallet_address);
    paymentMap.set(addr, {
      address: addr,
      tx_count: Number(row.tx_count) || 0,
      total_volume_usdc: Number(row.total_volume_usdc) || 0,
      unique_buyers: Number(row.unique_buyers) || 0,
      first_tx: row.first_tx_at ? String(row.first_tx_at) : null,
      last_tx: row.last_tx_at ? String(row.last_tx_at) : null,
    });
  }

  return paymentMap;
}

/**
 * Query x402scan tRPC endpoint
 */
async function queryX402Scan(procedure: string, input: any): Promise<any> {
  const encodedInput = encodeURIComponent(JSON.stringify({ "0": { json: input } }));
  const url = `${X402SCAN_BASE}/${procedure}?batch=1&input=${encodedInput}`;

  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`x402scan API error: ${res.status}`);
  }

  const data = await res.json();
  if (Array.isArray(data) && data[0]?.result?.data?.json) {
    return data[0].result.data.json;
  }
  if (Array.isArray(data) && data[0]?.error) {
    throw new Error(`x402scan tRPC error: ${data[0].error.json?.message || 'Unknown'}`);
  }

  return data;
}

/**
 * Get global x402 stats from x402scan
 */
export async function getX402GlobalStats(timeframe = 30) {
  return queryX402Scan('public.stats.overall', { timeframe });
}

/**
 * Get top sellers from x402scan
 */
export async function getX402TopSellers(timeframe = 30, page = 0, pageSize = 100) {
  return queryX402Scan('public.sellers.all.list', {
    timeframe,
    pagination: { page, page_size: pageSize },
    sorting: { id: 'total_amount', desc: true },
  });
}

/**
 * Get top buyers from x402scan
 */
export async function getX402TopBuyers(timeframe = 30, page = 0, pageSize = 20) {
  return queryX402Scan('public.buyers.all.list', {
    timeframe,
    pagination: { page, page_size: pageSize },
    sorting: { id: 'total_amount', desc: true },
  });
}

/**
 * Get facilitator list from x402scan
 */
export async function getX402Facilitators(timeframe = 30) {
  return queryX402Scan('public.facilitators.list', {
    timeframe,
    pagination: { page: 0, page_size: 50 },
    sorting: { id: 'tx_count', desc: true },
  });
}

/**
 * Refresh x402 payment data from x402scan tRPC API
 * Fetches top sellers and upserts into Turso for cross-referencing with ERC-8004 agents
 */
export async function refreshX402Data(): Promise<number> {
  console.log('[x402] Starting refresh from x402scan tRPC API');

  let updatedCount = 0;
  let page = 0;
  const pageSize = 100;
  let hasMore = true;

  // Ensure table exists
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS x402_payments (
      wallet_address TEXT PRIMARY KEY,
      tx_count INTEGER DEFAULT 0,
      total_volume_usdc REAL DEFAULT 0,
      unique_buyers INTEGER DEFAULT 0,
      first_tx_at TEXT,
      last_tx_at TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await turso.execute(`CREATE INDEX IF NOT EXISTS idx_x402_tx_count ON x402_payments(tx_count DESC)`);

  while (hasMore && page < 5) { // Max 5 pages = 500 sellers (Vercel 10s timeout)
    try {
      const data = await getX402TopSellers(30, page, pageSize);
      const items = data.items || [];

      if (items.length === 0) {
        hasMore = false;
        break;
      }

      // Batch upsert all sellers from this page in a single transaction
      const stmts = items.map((seller: any) => {
        const address = (seller.recipient || '').toLowerCase();
        const volumeUsdc = Number(seller.total_amount || 0) / 1_000_000;
        const txCount = Number(seller.tx_count || 0);
        const uniqueBuyers = Number(seller.unique_buyers || 0);
        const lastTxAt = seller.latest_block_timestamp || null;
        return {
          sql: `INSERT INTO x402_payments (wallet_address, tx_count, total_volume_usdc, unique_buyers, last_tx_at, updated_at)
                VALUES (?, ?, ?, ?, ?, datetime('now'))
                ON CONFLICT(wallet_address) DO UPDATE SET
                  tx_count = excluded.tx_count,
                  total_volume_usdc = excluded.total_volume_usdc,
                  unique_buyers = excluded.unique_buyers,
                  last_tx_at = COALESCE(excluded.last_tx_at, last_tx_at),
                  updated_at = datetime('now')`,
          args: [address, txCount, volumeUsdc, uniqueBuyers, lastTxAt],
        };
      }).filter((s: any) => s.args[0] && s.args[0].length >= 10);

      await turso.batch(stmts, 'write');
      updatedCount += stmts.length;

      console.log(`[x402] Page ${page}: ${items.length} sellers processed`);

      if (items.length < pageSize) {
        hasMore = false;
      }
      page++;

      // Rate limit: 300ms between pages
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error: any) {
      console.error(`[x402] Error on page ${page}:`, error.message);
      hasMore = false;
    }
  }

  console.log(`[x402] Refresh complete: ${updatedCount} sellers updated`);
  return updatedCount;
}
