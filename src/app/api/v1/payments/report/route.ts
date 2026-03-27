import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, reputation } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tx_hash,
      agent_id,
      service_id,
      from_address,
      amount_usdc,
      fee_usdc,
      affiliate_address,
      affiliate_fee_usdc,
      status = 'confirmed',
    } = body;

    if (!tx_hash || !agent_id || !from_address || !amount_usdc || fee_usdc === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert payment record
    await db.insert(payments).values({
      id: crypto.randomUUID(),
      tx_hash,
      agent_id,
      service_id,
      from_address,
      amount_usdc,
      fee_usdc,
      affiliate_address,
      affiliate_fee_usdc,
      status,
    });

    // Update agent reputation
    const currentReputation = await db.query.reputation.findFirst({
      where: eq(reputation.agent_id, agent_id),
    });

    if (currentReputation) {
      const newTotalRevenue = currentReputation.total_revenue_usdc + amount_usdc;
      const newTotalJobs = currentReputation.total_jobs + 1;
      const newSuccessfulJobs = status === 'confirmed' 
        ? currentReputation.successful_jobs + 1 
        : currentReputation.successful_jobs;

      const successRate = newSuccessfulJobs / newTotalJobs;
      const revenueScore = Math.min(newTotalRevenue / 10000, 1); // Max at $10k
      const newReputationScore = (successRate * 0.7 + revenueScore * 0.3) * 100;

      await db
        .update(reputation)
        .set({
          total_jobs: newTotalJobs,
          successful_jobs: newSuccessfulJobs,
          total_revenue_usdc: newTotalRevenue,
          reputation_score: newReputationScore,
          last_updated: new Date(),
        })
        .where(eq(reputation.agent_id, agent_id));
    }

    return NextResponse.json({ success: true, tx_hash });
  } catch (error) {
    console.error('Error reporting payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
