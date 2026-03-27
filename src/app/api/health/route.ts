import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function GET() {
  try {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    
    if (!url || !authToken) {
      return NextResponse.json(
        { status: 'error', error: 'Missing credentials' },
        { status: 500 }
      );
    }
    
    const client = createClient({ url, authToken });
    const result = await client.execute('SELECT count(*) as count FROM agents');
    
    return NextResponse.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      agents: result.rows[0].count
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        error: 'Database connection failed',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
