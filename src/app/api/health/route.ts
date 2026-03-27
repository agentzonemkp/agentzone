import { NextResponse } from 'next/server';
import { db } from '@/db';
import { agents } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    await db.select({ count: sql`count(*)` }).from(agents);
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        error: 'Database connection failed',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
