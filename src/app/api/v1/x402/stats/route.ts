import { NextRequest, NextResponse } from 'next/server';
import { getX402GlobalStats, getX402TopSellers, getX402TopBuyers, getX402Facilitators } from '@/lib/x402-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = parseInt(searchParams.get('timeframe') || '30');

    const [globalStats, topSellers, topBuyers] = await Promise.all([
      getX402GlobalStats(timeframe),
      getX402TopSellers(timeframe, 0, 20),
      getX402TopBuyers(timeframe, 0, 10),
    ]);

    const sellers = (topSellers.items || []).map((s: any) => ({
      address: s.recipient,
      volume_usdc: Number(s.total_amount || 0) / 1_000_000,
      tx_count: Number(s.tx_count || 0),
      unique_buyers: Number(s.unique_buyers || 0),
      chains: s.chains || [],
      last_active: s.latest_block_timestamp,
    }));

    const buyers = (topBuyers.items || []).map((b: any) => ({
      address: b.sender,
      volume_usdc: Number(b.total_amount || 0) / 1_000_000,
      tx_count: Number(b.tx_count || 0),
      unique_sellers: Number(b.unique_sellers || 0),
      facilitators: b.facilitator_ids || [],
    }));

    return NextResponse.json({
      timeframe_days: timeframe,
      summary: {
        total_transactions: Number(globalStats.total_transactions || 0),
        total_volume_usdc: Number(globalStats.total_amount || 0) / 1_000_000,
        unique_buyers: Number(globalStats.unique_buyers || 0),
        unique_sellers: Number(globalStats.unique_sellers || 0),
        latest_activity: globalStats.latest_block_timestamp,
      },
      top_sellers: sellers,
      top_buyers: buyers,
      source: 'x402scan.com',
    });
  } catch (error: any) {
    console.error('[x402/stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch x402 stats', details: error.message },
      { status: 500 }
    );
  }
}
