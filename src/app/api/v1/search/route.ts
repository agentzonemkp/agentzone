import { NextRequest, NextResponse } from 'next/server';
import { graphqlClient, queries } from '@/lib/graphql-client';
import { createClient } from '@libsql/client';
import { batchResolveMetadata } from '@/lib/metadata-resolver';

const turso = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
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

// Simple token overlap scoring for semantic-ish matching
function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
  );
}

function semanticScore(query: string, agent: any): number {
  const qTokens = tokenize(query);
  const name = decode(agent.name || '');
  const desc = decode(agent.description || '');
  const cat = decode(agent.category || '');
  const text = `${name} ${desc} ${cat}`;
  const aTokens = tokenize(text);

  // Synonym expansion for common agent terms
  const synonyms: Record<string, string[]> = {
    'ai': ['agent', 'ml', 'model', 'intelligence', 'neural', 'llm'],
    'trade': ['trading', 'swap', 'exchange', 'defi', 'perp'],
    'data': ['oracle', 'feed', 'api', 'analytics'],
    'code': ['audit', 'review', 'security', 'smart contract'],
    'nft': ['token', 'erc721', 'erc8004', 'identity'],
    'payment': ['x402', 'usdc', 'transfer', 'pay'],
    'social': ['content', 'community', 'dao'],
    'monitor': ['track', 'alert', 'watch', 'health'],
  };

  let score = 0;
  const nameLower = name.toLowerCase();
  const queryLower = query.toLowerCase().trim();

  // Exact name match — highest priority
  if (nameLower === queryLower) return 1000;
  // Name starts with query
  if (nameLower.startsWith(queryLower)) score += 100;
  // Name contains query as substring
  if (nameLower.includes(queryLower)) score += 50;

  const expandedQ = new Set(qTokens);
  for (const token of qTokens) {
    for (const [key, syns] of Object.entries(synonyms)) {
      if (token === key || syns.includes(token)) {
        expandedQ.add(key);
        syns.forEach(s => expandedQ.add(s));
      }
    }
  }

  // Direct token matches (weighted)
  for (const token of expandedQ) {
    if (aTokens.has(token)) score += 1;
    // Name matches score higher
    if (tokenize(name).has(token)) score += 2;
  }

  // Boost for trust score
  score += (agent.trust_score || 0) / 100;

  // Boost for having metadata
  if (name && !name.startsWith('Agent ')) score += 0.5;
  if (desc) score += 0.5;

  return score;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');
    const mode = searchParams.get('mode') || 'hybrid'; // hybrid | exact | semantic

    if (!query) {
      return NextResponse.json({ error: 'Missing q parameter' }, { status: 400 });
    }

    // Fetch candidates via GraphQL ILIKE
    let candidates: any[] = [];
    try {
      const data: any = await graphqlClient.request(queries.searchAgents, {
        search: `%${query}%`,
        limit: Math.min(limit * 5, 200), // overfetch for re-ranking
      });
      candidates = data.Agent || [];
    } catch (e) {
      console.error('[Search] GraphQL failed:', e);
    }

    // Also fetch agents with metadata for semantic matching
    if (mode !== 'exact' && candidates.length < limit) {
      try {
        const metaData: any = await graphqlClient.request(`{
          Agent(where: {description: {_neq: ""}}, limit: 200, order_by: {trust_score: desc}) {
            id wallet_address token_id name description category chain_id
            trust_score transaction_count total_revenue_usdc has_erc8004_identity
          }
        }`);
        const metaAgents = metaData.Agent || [];
        const existingIds = new Set(candidates.map((a: any) => a.id));
        for (const a of metaAgents) {
          if (!existingIds.has(a.id)) candidates.push(a);
        }
      } catch {}
    }

    // Also search Turso DB (has curated/seeded agents with real names)
    try {
      const tursoResult = await turso.execute({
        sql: `SELECT wallet_address, '' as id, COALESCE(erc8004_token_id, 0) as token_id,
              name, description, capabilities as category, COALESCE(erc8004_chain_id, 8453) as chain_id,
              trust_score, transaction_count, total_revenue_usdc, has_erc8004_identity
              FROM agents WHERE name LIKE ? OR description LIKE ?
              ORDER BY trust_score DESC LIMIT 50`,
        args: [`%${query}%`, `%${query}%`],
      });
      const existingWallets = new Set(candidates.map((a: any) => a.wallet_address?.toLowerCase()));
      for (const row of tursoResult.rows) {
        if (!existingWallets.has((row.wallet_address as string)?.toLowerCase())) {
          candidates.push({
            id: row.wallet_address,
            wallet_address: row.wallet_address,
            token_id: row.token_id,
            name: row.name,
            description: row.description,
            category: row.category,
            chain_id: row.chain_id,
            trust_score: Number(row.trust_score || 0),
            transaction_count: Number(row.transaction_count || 0),
            total_revenue_usdc: Number(row.total_revenue_usdc || 0),
            has_erc8004_identity: Boolean(row.has_erc8004_identity),
          });
        }
      }
    } catch (e) {
      console.error('[Search] Turso fallback error:', e);
    }

    // Score and rank
    const scored = candidates.map((agent: any) => ({
      ...agent,
      _score: semanticScore(query, agent),
      name: decode(agent.name),
      description: decode(agent.description),
      category: decode(agent.category),
    }));

    scored.sort((a: any, b: any) => b._score - a._score);

    // Also fetch top agents with resolved metadata (catches tokenURI names like "ClawNews")
    // The standard agents list resolves these via batchResolveMetadata
    try {
      const topData: any = await graphqlClient.request(`{
        Agent(limit: 100, order_by: {trust_score: desc}) {
          id wallet_address token_id name description category chain_id
          trust_score transaction_count total_revenue_usdc has_erc8004_identity
        }
      }`);
      const topAgents = topData.Agent || [];
      // Resolve metadata for generic-named agents
      const needsResolve = topAgents.filter((a: any) => {
        const n = a.name || '';
        return !n || /^Agent \d+$/.test(n) || (n.startsWith('0x') && n.length > 10);
      });
      if (needsResolve.length > 0) {
        const metadata = await batchResolveMetadata(
          needsResolve.map((a: any) => ({ chain_id: a.chain_id || 8453, token_id: a.token_id })),
          10
        );
        for (const agent of needsResolve) {
          const key = `${agent.chain_id || 8453}_${agent.token_id}`;
          const meta = metadata.get(key);
          if (meta) {
            if (meta.name) agent.name = meta.name;
            if (meta.description) agent.description = meta.description;
            if (meta.category) agent.category = meta.category;
          }
        }
      }
      // Add resolved top agents to candidates (deduped)
      const existingIds = new Set(scored.map((a: any) => a.id));
      for (const a of topAgents) {
        if (!existingIds.has(a.id)) {
          const decodedName = decode(a.name);
          const decodedDesc = decode(a.description);
          const decodedCat = decode(a.category);
          scored.push({
            ...a,
            name: decodedName,
            description: decodedDesc,
            category: decodedCat,
            _score: semanticScore(query, { ...a, name: decodedName, description: decodedDesc, category: decodedCat }),
          });
        }
      }
      // Re-sort after adding enriched candidates
      scored.sort((a: any, b: any) => b._score - a._score);
    } catch (e) {
      console.error('[Search] Top agents resolution error:', e);
    }

    // Apply data quality filter
    const filtered = scored.filter((a: any) => {
      const name = a.name || '';
      const desc = a.description || '';
      
      // Filter out junk data
      if (name.startsWith('Agent #')) {
        const hasJunkDesc = desc.includes('data:application') || 
                           desc.includes('<svg') || 
                           desc.includes('pragma solidity') || 
                           desc.includes('localhost') ||
                           (desc.startsWith('http://') || desc.startsWith('https://'));
        if (hasJunkDesc) return false;
      }
      
      // Filter raw SVG/Solidity in description
      if (desc.includes('<svg') || desc.includes('pragma solidity')) return false;
      
      // Filter data URI names
      if (name.startsWith('data:')) return false;
      
      return true;
    });

    const results = filtered.slice(0, limit).map((a: any) => ({
      id: a.wallet_address || a.id,
      wallet_address: a.wallet_address,
      token_id: a.token_id,
      name: a.name || `Agent #${a.token_id}`,
      description: a.description || '',
      category: a.category || '',
      chain_id: a.chain_id || 8453,
      trust_score: a.trust_score || 0,
      transaction_count: a.transaction_count || 0,
      total_revenue_usdc: a.total_revenue_usdc || 0,
      has_erc8004_identity: a.has_erc8004_identity,
      relevance_score: Math.round(a._score * 100) / 100,
    }));

    return NextResponse.json({
      query,
      mode,
      agents: results,
      count: results.length,
      total_candidates: candidates.length,
    });
  } catch (error: any) {
    console.error('[Search] Error:', error);
    return NextResponse.json({ error: 'Search failed', details: error.message }, { status: 500 });
  }
}
