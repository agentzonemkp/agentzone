import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agents, reputation } from '@/db/schema';
import { randomUUID } from 'crypto';
import { getSession } from '@/lib/session';
import { verifyAgentOwnership } from '@/lib/onchain-verify';

export async function POST(req: NextRequest) {
  try {
    // Check session
    const session = await getSession();
    if (!session.isLoggedIn || !session.address) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, category, pricingModel, basePrice, apiEndpoint, walletAddress } = body;

    if (!name || !category || !pricingModel || basePrice === undefined || !walletAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify wallet owns agent identity on-chain
    const verification = await verifyAgentOwnership(session.address, name);
    if (!verification.verified) {
      return NextResponse.json({ error: 'No ERC-8004 agent identity found for this wallet' }, { status: 403 });
    }

    const agentId = randomUUID();
    const now = new Date();

    // Insert agent
    await db.insert(agents).values({
      id: agentId,
      name,
      description: description || null,
      category,
      pricing_model: pricingModel,
      base_price_usdc: basePrice,
      wallet_address: walletAddress,
      api_endpoint: apiEndpoint || null,
      verified: false,
      created_at: now,
    });

    // Init empty reputation
    await db.insert(reputation).values({
      agent_id: agentId,
      total_jobs: 0,
      successful_jobs: 0,
      total_revenue_usdc: 0,
      avg_response_time_ms: null,
      reputation_score: 0,
      last_updated: now,
    });

    return NextResponse.json({ success: true, agentId });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
