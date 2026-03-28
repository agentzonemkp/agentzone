import { NextResponse } from 'next/server';
import { refreshX402Data } from '@/lib/x402-data';

export async function POST() {
  try {
    console.log('[x402/refresh] Starting x402 payment data refresh from x402scan');

    const updated = await refreshX402Data();

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} seller payment records from x402scan`,
      updated,
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
    message: 'POST to this endpoint to refresh x402 payment data from x402scan',
    source: 'x402scan.com tRPC API (public.sellers.all.list)',
    note: 'Fetches all x402 sellers (paginated), upserts into Turso for ranking enrichment',
  });
}
