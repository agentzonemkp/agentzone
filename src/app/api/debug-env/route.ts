import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasUrl: !!process.env.TURSO_DATABASE_URL,
    hasToken: !!process.env.TURSO_AUTH_TOKEN,
    urlPrefix: process.env.TURSO_DATABASE_URL?.substring(0, 20),
  });
}
