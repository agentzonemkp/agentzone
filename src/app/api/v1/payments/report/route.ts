import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyUSDCPayment } from '@/lib/chain-verify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tx_hash, agent_wallet, chain_id = 8453 } = body;

    if (!tx_hash) {
      return NextResponse.json({ error: 'tx_hash required' }, { status: 400 });
    }

    // Check if already recorded
    const existing = await db.query.payments.findFirst({
      where: eq(payments.tx_hash, tx_hash),
    });
    if (existing) {
      return NextResponse.json({ 
        success: true, 
        message: 'Payment already recorded',
        payment: existing,
      });
    }

    // Verify on-chain
    const verification = await verifyUSDCPayment(tx_hash);

    if (!verification.verified) {
      return NextResponse.json({
        success: false,
        error: verification.error || 'Transaction verification failed',
      }, { status: 400 });
    }

    // If agent_wallet provided, verify it matches the recipient
    if (agent_wallet && verification.to !== agent_wallet.toLowerCase()) {
      return NextResponse.json({
        success: false,
        error: 'Transaction recipient does not match agent wallet',
        expected: agent_wallet.toLowerCase(),
        actual: verification.to,
      }, { status: 400 });
    }

    // Build agent_id from verification data
    const agentId = agent_wallet
      ? `${chain_id}_0x8004a169fb4a3325136eb29fa0ceb6d2e539a432_unknown`
      : 'unknown';

    // Store verified payment
    const paymentId = crypto.randomUUID();
    await db.insert(payments).values({
      id: paymentId,
      tx_hash,
      agent_id: agentId,
      from_address: verification.from!,
      amount_usdc: verification.amount_usdc!,
      fee_usdc: verification.amount_usdc! * 0.01, // 1% protocol fee
      chain: chain_id === 8453 ? 'base' : chain_id === 42161 ? 'arbitrum' : `chain_${chain_id}`,
      status: 'verified',
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentId,
        tx_hash,
        from: verification.from,
        to: verification.to,
        amount_usdc: verification.amount_usdc,
        block_number: verification.block_number,
        timestamp: verification.timestamp,
        status: 'verified',
      },
    });
  } catch (error: any) {
    console.error('Error reporting payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - list payments for an agent wallet
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet')?.toLowerCase();
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!wallet) {
    return NextResponse.json({ error: 'wallet param required' }, { status: 400 });
  }

  try {
    const results = await db.query.payments.findMany({
      where: eq(payments.from_address, wallet),
      limit,
      orderBy: (p, { desc }) => [desc(p.timestamp)],
    });

    return NextResponse.json({ payments: results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
