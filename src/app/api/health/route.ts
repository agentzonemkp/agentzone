import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { graphqlClient } from '@/lib/graphql-client';

export async function GET() {
  try {
    let agentCount = 0;
    let dataSource = 'turso';
    
    // Try Envio GraphQL first
    try {
      const data = await graphqlClient.request(`{
        base: Agent(where: {chain_id: {_eq: 8453}}, limit: 1, offset: 35000) { id }
        arb: Agent(where: {chain_id: {_eq: 42161}}, limit: 1, offset: 700) { id }
      }`) as any;
      
      const baseHas35k = data.base?.length > 0;
      const arbHas700 = data.arb?.length > 0;
      agentCount = (baseHas35k ? 37000 : 10000) + (arbHas700 ? 744 : 0);
      dataSource = 'envio_graphql';
    } catch (graphqlError) {
      // Fallback to Turso
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
      agentCount = Number(result.rows[0].count);
    }
    
    return NextResponse.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      agents: agentCount,
      dataSource
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        error: 'Health check failed',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
