import { createClient } from '@libsql/client';
import { createPublicClient, http, parseAbiItem, type Address } from 'viem';
import { base } from 'viem/chains';

const turso = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
});

const baseClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

// Base facilitator addresses (from facilitators package)
const FACILITATORS: Address[] = [
  '0xdbdf3d8ed80f84c35d01c6c9f9271761bad90ba6',
  '0x9aae2b0d1b9dc55ac9bab9556f9a26cb64995fb9',
  '0x3a70788150c7645a21b95b7062ab1784d3cc2104',
  '0x708e57b6650a9a741ab39cae1969ea1d2d10eca1',
  '0xce82eeec8e98e443ec34fda3c3e999cbe4cb6ac2',
  '0x7f6d822467df2a85f792d4508c5722ade96be056',
  '0x001ddabba5782ee48842318bd9ff4008647c8d9c',
  '0x9c09faa49c4235a09677159ff14f17498ac48738',
  '0xcbb10c30a9a72fae9232f41cbbd566a097b4e03a',
  '0x9fb2714af0a84816f5c6322884f2907e33946b88',
  '0x47d8b3c9717e976f31025089384f23900750a5f4',
  '0x94701e1df9ae06642bf6027589b8e05dc7004813',
  '0x552300992857834c0ad41c8e1a6934a5e4a2e4ca',
  '0xd7469bf02d221968ab9f0c8b9351f55f8668ac4f',
  '0x88800e08e20b45c9b1f0480cf759b5bf2f05180c',
  '0x6831508455a716f987782a1ab41e204856055cc2',
  '0xdc8fbad54bf5151405de488f45acd555517e0958',
  '0x91d313853ad458addda56b35a7686e2f38ff3952',
  '0xadd5585c776b9b0ea77e9309c1299a40442d820f',
  '0x4ffeffa616a1460570d1eb0390e264d45a199e91',
  '0x222c4367a2950f3b53af260e111fc3060b0983ff',
  '0xb70c4fe126de09bd292fe3d1e40c6d264ca6a52a',
  '0xd348e724e0ef36291a28dfeccf692399b0e179f8',
  '0x80c08de1a05df2bd633cf520754e40fde3c794d3',
  '0xd8dfc729cbd05381647eb5540d756f4f8ad63eec',
  '0x76eee8f0acabd6b49f1cc4e9656a0c8892f3332e',
  '0x97d38aa5de015245dcca76305b53abe6da25f6a5',
  '0x0168f80e035ea68b191faf9bfc12778c87d92008',
  '0x5e437bee4321db862ac57085ea5eb97199c0ccc5',
  '0xc19829b32324f116ee7f80d193f99e445968499a',
  '0xc6699d2aada6c36dfea5c248dd70f9cb0235cb63',
  '0xb2bd29925cbbcea7628279c91945ca5b98bf371b',
  '0x25659315106580ce2a787ceec5efb2d347b539c9',
  '0xb8f41cb13b1f213da1e94e1b742ec1323235c48f',
  '0xe575fa51af90957d66fab6d63355f1ed021b887b',
  '0x279e08f711182c79ba6d09669127a426228a4653',
  '0xfe0920a0a7f0f8a1ec689146c30c3bbef439bf8a',
  '0x97316fa4730bc7d3b295234f8e4d04a0a4c093e8',
  '0x97db9b5291a218fc77198c285cefdc943ef74917',
  '0x73b2b8df52fbe7c40fe78db52e3dffdd5db5ad07',
  '0x724efafb051f17ae824afcdf3c0368ae312da264',
  '0xa9a54ef09fc8b86bc747cec6ef8d6e81c38c6180',
  '0x4638bc811c93bf5e60deed32325e93505f681576',
  '0xd7d91a42dfadd906c5b9ccde7226d28251e4cd0f',
  '0x4544b535938b67d2a410a98a7e3b0f8f68921ca7',
  '0x59e8014a3b884392fbb679fe461da07b18c1ff81',
  '0xe6123e6b389751c5f7e9349f3d626b105c1fe618',
  '0xf70e7cb30b132fab2a0a5e80d41861aa133ea21b',
  '0x3f61093f61817b29d9556d3b092e67746af8cdfd',
  '0x612d72dc8402bba997c61aa82ce718ea23b2df5d',
  '0x48ab4b0af4ddc2f666a3fcc43666c793889787a3',
  '0xce7819f0b0b871733c933d1f486533bab95ec47b',
  '0x1fc230ee3c13d0d520d49360a967dbd1555c8326',
  '0x290d8b8edcafb25042725cb9e78bcac36b8865f8',
  '0x87af99356d774312b73018b3b6562e1ae0e018c9',
  '0x65058cf664d0d07f68b663b0d4b4f12a5e331a38',
  '0x8d8fa42584a727488eeb0e29405ad794a105bb9b',
  '0x88e13d4c764a6c840ce722a0a3765f55a85b327e',
  '0x3be45f576696a2fd5a93c1330cd19f1607ab311d',
  '0x103040545ac5031a11e8c03dd11324c7333a13c7',
  '0x90d5e567017f6c696f1916f4365dd79985fce50f',
  '0x90da501fdbec74bb0549100967eb221fed79c99b',
  '0xb578b7db22581507d62bdbeb85e06acd1be09e11',
  '0xd97c12726dcf994797c981d31cfb243d231189fb',
  '0xe07e9cbf9a55d02e3ac356ed4706353d98c5a618',
];

const USDC_ADDRESS: Address = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');
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
 * Returns cached data if fresh, otherwise fetches from on-chain
 */
export async function getX402PaymentData(walletAddress: string): Promise<X402PaymentData | null> {
  const normalizedAddress = walletAddress.toLowerCase();
  
  // Check cache first
  const cached = await turso.execute({
    sql: `SELECT * FROM x402_payments WHERE wallet_address = ?`,
    args: [normalizedAddress],
  });

  if (cached.rows.length > 0) {
    const row = cached.rows[0];
    const updatedAt = new Date(row.updated_at as string).getTime();
    const now = Date.now();
    
    // Return cached if fresh
    if (now - updatedAt < CACHE_TTL_MS) {
      return {
        address: row.wallet_address as string,
        tx_count: row.tx_count as number,
        total_volume_usdc: row.total_volume_usdc as number,
        unique_buyers: row.unique_buyers as number,
        first_tx: row.first_tx_at as string | null,
        last_tx: row.last_tx_at as string | null,
      };
    }
  }

  return null;
}

/**
 * Get all x402 payment data (for enriching agent list)
 * Returns Map<address, PaymentData>
 */
export async function getAllX402PaymentData(): Promise<Map<string, X402PaymentData>> {
  const result = await turso.execute({
    sql: `SELECT * FROM x402_payments WHERE updated_at > datetime('now', '-15 minutes')`,
  });

  const map = new Map<string, X402PaymentData>();
  for (const row of result.rows) {
    map.set(row.wallet_address as string, {
      address: row.wallet_address as string,
      tx_count: row.tx_count as number,
      total_volume_usdc: row.total_volume_usdc as number,
      unique_buyers: row.unique_buyers as number,
      first_tx: row.first_tx_at as string | null,
      last_tx: row.last_tx_at as string | null,
    });
  }

  return map;
}

/**
 * Refresh x402 payment data from on-chain logs
 * Scans recent blocks for USDC Transfer events from facilitator addresses
 */
export async function refreshX402Data(agentWallets: string[], blocksToScan = 10000): Promise<number> {
  console.log('[x402] Starting refresh for', agentWallets.length, 'agent wallets');
  
  const currentBlock = await baseClient.getBlockNumber();
  const fromBlock = currentBlock - BigInt(blocksToScan);
  
  // Normalize agent addresses for lookup
  const agentAddressSet = new Set(agentWallets.map((a) => a.toLowerCase()));
  
  // Map to store aggregated payment data
  const paymentMap = new Map<string, {
    txCount: number;
    totalVolume: bigint;
    buyers: Set<string>;
    firstTx: bigint | null;
    lastTx: bigint | null;
  }>();

  console.log(`[x402] Scanning blocks ${fromBlock} to ${currentBlock}`);

  // Query logs in chunks (Base RPC limit: 2000 blocks per query)
  const CHUNK_SIZE = 2000;
  let totalLogsProcessed = 0;

  for (let start = fromBlock; start < currentBlock; start += BigInt(CHUNK_SIZE)) {
    const end = start + BigInt(CHUNK_SIZE) > currentBlock ? currentBlock : start + BigInt(CHUNK_SIZE);
    
    // Add delay between chunks to avoid rate limiting (public RPC)
    if (start > fromBlock) {
      await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
    }
    
    try {
      // Get all Transfer events FROM facilitator addresses
      const logs = await baseClient.getLogs({
        address: USDC_ADDRESS,
        event: TRANSFER_EVENT,
        fromBlock: start,
        toBlock: end,
      });

      for (const log of logs) {
        const { from, to, value } = log.args;
        if (!from || !to || !value) continue;

        const fromLower = from.toLowerCase();
        const toLower = to.toLowerCase();

        // Only count transfers FROM facilitators TO agent wallets
        if (!FACILITATORS.includes(fromLower as Address)) continue;
        if (!agentAddressSet.has(toLower)) continue;

        // Initialize or update payment data for this agent
        if (!paymentMap.has(toLower)) {
          paymentMap.set(toLower, {
            txCount: 0,
            totalVolume: BigInt(0),
            buyers: new Set(),
            firstTx: log.blockNumber,
            lastTx: log.blockNumber,
          });
        }

        const data = paymentMap.get(toLower)!;
        data.txCount += 1;
        data.totalVolume += value;
        // The buyer is whoever paid the facilitator (we don't have that info in Transfer event alone)
        // For now, count unique facilitators as a proxy for unique buyers
        data.buyers.add(fromLower);
        data.firstTx = data.firstTx && data.firstTx < log.blockNumber ? data.firstTx : log.blockNumber;
        data.lastTx = data.lastTx && data.lastTx > log.blockNumber ? data.lastTx : log.blockNumber;

        totalLogsProcessed++;
      }
    } catch (error: any) {
      console.error(`[x402] Error fetching logs for blocks ${start}-${end}:`, error.message);
    }
  }

  console.log(`[x402] Processed ${totalLogsProcessed} transfer events`);

  // Upsert results into Turso
  let updatedCount = 0;
  for (const [address, data] of paymentMap.entries()) {
    const volumeUsdc = Number(data.totalVolume) / 1_000_000; // USDC has 6 decimals

    // Get block timestamps for first/last transactions
    let firstTxAt: string | null = null;
    let lastTxAt: string | null = null;

    try {
      if (data.firstTx) {
        const firstBlock = await baseClient.getBlock({ blockNumber: data.firstTx });
        firstTxAt = new Date(Number(firstBlock.timestamp) * 1000).toISOString();
      }
      if (data.lastTx && data.lastTx !== data.firstTx) {
        const lastBlock = await baseClient.getBlock({ blockNumber: data.lastTx });
        lastTxAt = new Date(Number(lastBlock.timestamp) * 1000).toISOString();
      } else if (data.lastTx === data.firstTx) {
        lastTxAt = firstTxAt;
      }
    } catch (error: any) {
      console.error(`[x402] Error fetching block timestamps for ${address}:`, error.message);
    }

    await turso.execute({
      sql: `
        INSERT INTO x402_payments (wallet_address, tx_count, total_volume_usdc, unique_buyers, first_tx_at, last_tx_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(wallet_address) DO UPDATE SET
          tx_count = excluded.tx_count,
          total_volume_usdc = excluded.total_volume_usdc,
          unique_buyers = excluded.unique_buyers,
          first_tx_at = COALESCE(excluded.first_tx_at, first_tx_at),
          last_tx_at = COALESCE(excluded.last_tx_at, last_tx_at),
          updated_at = datetime('now')
      `,
      args: [address, data.txCount, volumeUsdc, data.buyers.size, firstTxAt, lastTxAt],
    });

    updatedCount++;
  }

  console.log(`[x402] Updated ${updatedCount} agent payment records`);
  return updatedCount;
}
