import { NextRequest, NextResponse } from 'next/server';
import { graphqlClient } from '@/lib/graphql-client';
import { refreshX402Data } from '@/lib/x402-data';

export async function POST(request: NextRequest) {
  try {
    const { blocks = 100000 } = await request.json().catch(() => ({}));

    console.log('[x402/refresh] Starting x402 payment data refresh');

    // Fetch all agent wallet addresses from GraphQL
    const data: any = await graphqlClient.request(`
      query AllAgentWallets {
        Agent {
          wallet_address
        }
      }
    `);

    const agentWallets = (data.Agent || [])
      .map((a: any) => a.wallet_address)
      .filter(Boolean);

    console.log(`[x402/refresh] Found ${agentWallets.length} agent wallets`);

    if (agentWallets.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No agent wallets found',
        updated: 0,
      });
    }

    // Refresh payment data
    const updated = await refreshX402Data(agentWallets, blocks);

    console.log(`[x402/refresh] Updated ${updated} agent payment records`);

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} agent payment records`,
      updated,
      scanned_agents: agentWallets.length,
      blocks_scanned: blocks,
    });
  } catch (error: any) {
    console.error('[x402/refresh] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh x402 payment data',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to refresh x402 payment data',
    usage: 'POST /api/v1/x402/refresh with optional { blocks: 5000 }',
    note: 'Default scans last 5000 blocks (~2 hours on Base). Use smaller values to avoid rate limits on public RPC.',
  });
}
