import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agents } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { input, walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const agent = await db.query.agents.findFirst({
      where: eq(agents.id, id),
    });

    if (!agent || !agent.api_endpoint) {
      return NextResponse.json({ error: 'Agent not found or no endpoint configured' }, { status: 404 });
    }

    // For MVP: simulate x402 payment and forward request
    // In production: generate x402 header, handle facilitator flow
    
    const startTime = Date.now();
    
    try {
      const agentResponse = await fetch(agent.api_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AgentZone-Test/1.0',
          // Future: 'X-PAYMENT': base64(x402PaymentProof)
        },
        body: JSON.stringify({ input }),
      });

      const responseTime = Date.now() - startTime;
      const result = await agentResponse.json();

      return NextResponse.json({
        success: true,
        result,
        metadata: {
          responseTime,
          costUsdc: agent.base_price_usdc,
          paymentMethod: 'x402-simulated',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (agentError: any) {
      return NextResponse.json({
        success: false,
        error: 'Agent request failed',
        details: agentError.message,
      }, { status: 502 });
    }
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
