import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const jobs = await db
      .select()
      .from(payments)
      .where(eq(payments.agent_id, id))
      .orderBy(desc(payments.timestamp))
      .limit(limit);

    return NextResponse.json({
      jobs: jobs.map(j => ({
        id: j.id,
        txHash: j.tx_hash,
        from: j.from_address,
        amount: j.amount_usdc,
        fee: j.fee_usdc,
        status: j.status,
        timestamp: j.timestamp,
      })),
      count: jobs.length,
    });
  } catch (error) {
    console.error('Jobs fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
