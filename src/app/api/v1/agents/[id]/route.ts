import { NextRequest, NextResponse } from 'next/server';
import { graphqlClient, queries } from '@/lib/graphql-client';
import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const wallet = params.id.toLowerCase();
  
  try {
    // Try GraphQL first
    const data: any = await graphqlClient.request(queries.getAgent, { wallet });
    const agents = data.Agent || [];
    
    if (agents.length > 0) {
      const agent = agents[0];
      
      // Fetch recent payments
      const paymentsData: any = await graphqlClient.request(queries.getAgentPayments, {
        wallet,
        limit: 10
      });
      
      return NextResponse.json({
        agent,
        payments: paymentsData.Payment || [],
        source: 'graphql'
      });
    }
    
    // Fallback to Turso
    console.log(`[API] Agent ${wallet} not found in GraphQL, trying Turso`);
    
    const agentResult = await turso.execute({
      sql: 'SELECT * FROM agents WHERE wallet_address = ?',
      args: [wallet]
    });
    
    if (agentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }
    
    const agent = agentResult.rows[0];
    
    // Fetch payments
    const paymentsResult = await turso.execute({
      sql: 'SELECT * FROM payments WHERE agent_address = ? ORDER BY timestamp DESC LIMIT 10',
      args: [wallet]
    });
    
    return NextResponse.json({
      agent,
      payments: paymentsResult.rows,
      source: 'turso'
    });
    
  } catch (error: any) {
    console.error('[API] Error fetching agent:', error);
    
    // Final fallback
    try {
      const agentResult = await turso.execute({
        sql: 'SELECT * FROM agents WHERE wallet_address = ?',
        args: [wallet]
      });
      
      if (agentResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 404 }
        );
      }
      
      const paymentsResult = await turso.execute({
        sql: 'SELECT * FROM payments WHERE agent_address = ? ORDER BY timestamp DESC LIMIT 10',
        args: [wallet]
      });
      
      return NextResponse.json({
        agent: agentResult.rows[0],
        payments: paymentsResult.rows,
        source: 'turso_fallback',
        error: error.message
      });
    } catch (fallbackError: any) {
      return NextResponse.json(
        { error: 'Failed to fetch agent', details: fallbackError.message },
        { status: 500 }
      );
    }
  }
}
