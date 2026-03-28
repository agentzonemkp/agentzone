/**
 * Metadata Resolver — fetches tokenURI from on-chain, resolves JSON, caches in memory + Turso.
 * 
 * Most ERC-8004 agents store metadata at their tokenURI (IPFS, HTTP, or inline JSON).
 * Envio can't do contract calls during indexing, so we resolve at API time.
 */

const RPC_URLS: Record<number, string> = {
  8453: 'https://mainnet.base.org',
  42161: 'https://arb1.arbitrum.io/rpc',
  1: 'https://eth.llamarpc.com',
  10: 'https://mainnet.optimism.io',
  137: 'https://polygon-rpc.com',
};

const IDENTITY_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';
// tokenURI(uint256) selector
const TOKEN_URI_SELECTOR = '0xc87b56dd';

// In-memory LRU cache (per-instance, cleared on cold start)
const cache = new Map<string, { data: AgentMetadata; ts: number }>();
const CACHE_TTL = 3600_000; // 1 hour

export interface AgentMetadata {
  name: string;
  description: string;
  image?: string;
  category?: string;
  external_url?: string;
  services?: Array<{ type: string; url: string; name?: string }>;
  x402Support?: boolean;
  active?: boolean;
}

function encodeTokenId(tokenId: string | number): string {
  const hex = BigInt(tokenId).toString(16).padStart(64, '0');
  return TOKEN_URI_SELECTOR + hex;
}

function decodeString(hex: string): string {
  if (!hex || hex === '0x') return '';
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (clean.length < 128) return '';
  try {
    // ABI-encoded string: offset (32 bytes) + length (32 bytes) + data
    // The offset tells us where the string data starts
    const offset = parseInt(clean.slice(0, 64), 16) * 2; // convert to hex char offset
    const lenHex = clean.slice(offset, offset + 64);
    const len = parseInt(lenHex, 16);
    if (len === 0 || len > 100000) return '';
    const dataHex = clean.slice(offset + 64, offset + 64 + len * 2);
    return Buffer.from(dataHex, 'hex').toString('utf-8');
  } catch {
    return '';
  }
}

export async function resolveMetadata(chainId: number, tokenId: string | number): Promise<AgentMetadata | null> {
  const cacheKey = `${chainId}_${tokenId}`;
  
  // Check memory cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  const rpcUrl = RPC_URLS[chainId];
  if (!rpcUrl) return null;

  try {
    // 1. Call tokenURI(tokenId) on-chain
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{ to: IDENTITY_REGISTRY, data: encodeTokenId(tokenId) }, 'latest'],
      }),
    });

    const rpcResult = await res.json() as any;
    if (rpcResult.error || !rpcResult.result || rpcResult.result === '0x') return null;

    const uri = decodeString(rpcResult.result);
    if (!uri) return null;

    // 2. Resolve the URI
    let metadata: AgentMetadata;

    if (uri.startsWith('data:application/json')) {
      // Inline JSON (data URI) — could be base64 or URL-encoded
      const parts = uri.split(',');
      const header = parts[0]; // e.g. data:application/json;base64
      const payload = parts.slice(1).join(',');
      if (header.includes('base64')) {
        metadata = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
      } else {
        metadata = JSON.parse(decodeURIComponent(payload));
      }
    } else if (uri.startsWith('{')) {
      // Raw JSON
      metadata = JSON.parse(uri);
    } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
      // HTTP fetch with timeout
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 5000);
      try {
        const metaRes = await fetch(uri, { signal: ctrl.signal });
        if (!metaRes.ok) return null;
        metadata = await metaRes.json() as AgentMetadata;
      } finally {
        clearTimeout(timeout);
      }
    } else if (uri.startsWith('ipfs://')) {
      const gateway = `https://ipfs.io/ipfs/${uri.slice(7)}`;
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 8000);
      try {
        const metaRes = await fetch(gateway, { signal: ctrl.signal });
        if (!metaRes.ok) return null;
        metadata = await metaRes.json() as AgentMetadata;
      } finally {
        clearTimeout(timeout);
      }
    } else {
      return null;
    }

    // Normalize
    const result: AgentMetadata = {
      name: metadata.name || '',
      description: metadata.description || '',
      image: metadata.image || '',
      category: metadata.category || (metadata as any).type || '',
      external_url: metadata.external_url || (metadata as any).website || '',
      services: metadata.services || [],
      x402Support: metadata.x402Support || false,
      active: metadata.active !== false,
    };

    // Cache
    cache.set(cacheKey, { data: result, ts: Date.now() });
    
    // Prune cache if too large
    if (cache.size > 5000) {
      const entries = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts);
      for (let i = 0; i < 1000; i++) cache.delete(entries[i][0]);
    }

    return result;
  } catch (e) {
    console.error(`[MetadataResolver] Failed for ${cacheKey}:`, e);
    return null;
  }
}

// Batch resolve — resolves up to N agents in parallel
export async function batchResolveMetadata(
  agents: Array<{ chain_id: number; token_id: string | number; name?: string }>,
  maxConcurrent = 10
): Promise<Map<string, AgentMetadata>> {
  const results = new Map<string, AgentMetadata>();
  
  // Only resolve agents without real names
  const needsResolution = agents.filter(a => {
    const name = a.name || '';
    return !name || name.startsWith('Agent ') || name === '' || (name.startsWith('0x') && name.length > 10);
  });

  // Process in batches
  for (let i = 0; i < needsResolution.length; i += maxConcurrent) {
    const batch = needsResolution.slice(i, i + maxConcurrent);
    const promises = batch.map(async (agent) => {
      const meta = await resolveMetadata(agent.chain_id, agent.token_id);
      if (meta) {
        results.set(`${agent.chain_id}_${agent.token_id}`, meta);
      }
    });
    await Promise.all(promises);
  }

  return results;
}
