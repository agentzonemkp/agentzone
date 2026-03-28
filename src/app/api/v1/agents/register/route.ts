import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agents, services } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Register or update an agent's service listing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      wallet_address,
      name,
      description,
      category,
      api_endpoint,
      pricing_model = 'per_call',
      base_price_usdc = 0,
      services: serviceList = [],
    } = body;

    if (!wallet_address) {
      return NextResponse.json({ error: 'wallet_address required' }, { status: 400 });
    }

    // Upsert agent in Turso
    const agentId = `custom_${wallet_address.toLowerCase()}`;
    
    const existing = await db.query.agents.findFirst({
      where: eq(agents.id, agentId),
    });

    if (existing) {
      // Update
      // Note: Using raw query since drizzle update doesn't have a clean API here
      await db.update(agents).set({
        name: name || existing.name,
        description: description || existing.description,
        category: category || existing.category,
        api_endpoint: api_endpoint || existing.api_endpoint,
        pricing_model: pricing_model,
        base_price_usdc: base_price_usdc,
      }).where(eq(agents.id, agentId));
    } else {
      await db.insert(agents).values({
        id: agentId,
        name: name || `Agent ${wallet_address.slice(0, 8)}`,
        description: description || '',
        category: category || 'General',
        pricing_model,
        base_price_usdc,
        wallet_address: wallet_address.toLowerCase(),
        api_endpoint: api_endpoint || '',
        verified: false,
      });
    }

    // Register services
    for (const svc of serviceList) {
      const svcId = `${agentId}_${svc.name?.replace(/\s+/g, '_').toLowerCase() || crypto.randomUUID()}`;
      await db.insert(services).values({
        id: svcId,
        agent_id: agentId,
        name: svc.name || 'Default Service',
        description: svc.description || '',
        price_usdc: svc.price_usdc || 0,
        endpoint: svc.endpoint || api_endpoint || '',
        input_schema: svc.input_schema ? JSON.stringify(svc.input_schema) : null,
        output_schema: svc.output_schema ? JSON.stringify(svc.output_schema) : null,
        active: true,
      }).onConflictDoUpdate({
        target: services.id,
        set: {
          name: svc.name,
          description: svc.description,
          price_usdc: svc.price_usdc,
          endpoint: svc.endpoint,
          active: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      agent_id: agentId,
      message: existing ? 'Agent updated' : 'Agent registered',
      services_registered: serviceList.length,
    });
  } catch (error: any) {
    console.error('Error registering agent:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - list registered services for an agent
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet')?.toLowerCase();
  
  if (!wallet) {
    return NextResponse.json({ error: 'wallet param required' }, { status: 400 });
  }

  try {
    const agentId = `custom_${wallet}`;
    const agent = await db.query.agents.findFirst({
      where: eq(agents.id, agentId),
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not registered' }, { status: 404 });
    }

    const svcList = await db.query.services.findMany({
      where: eq(services.agent_id, agentId),
    });

    return NextResponse.json({
      agent,
      services: svcList,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
