import { NextRequest, NextResponse } from 'next/server';
import { graphqlClient, GET_AGENT_BY_ID_QUERY, Agent } from '@/lib/graphql-client';
import { db } from '@/db';
import { agents, reputation, services, validations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'graphql';

    if (source === 'turso') {
      // Fallback to Turso
      const agent = await db.query.agents.findFirst({
        where: eq(agents.id, id),
      });

      if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }

      const [agentReputation, agentServices, agentValidations] = await Promise.all([
        db.query.reputation.findFirst({
          where: eq(reputation.agent_id, id),
        }),
        db.query.services.findMany({
          where: eq(services.agent_id, id),
        }),
        db.query.validations.findMany({
          where: eq(validations.agent_id, id),
        }),
      ]);

      return NextResponse.json({
        agent,
        reputation: agentReputation,
        services: agentServices,
        validations: agentValidations,
        source: 'turso',
      });
    }

    // Primary: GraphQL from Envio indexer
    const data = await graphqlClient.request<{ Agent: Agent[] }>(GET_AGENT_BY_ID_QUERY, { id });

    if (!data.Agent || data.Agent.length === 0) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agent = data.Agent[0];

    return NextResponse.json({
      agent: {
        ...agent,
        // Flatten nested relations for consistency with old API
      },
      reputation: agent.reputation,
      services: agent.services,
      validations: agent.validations,
      source: 'graphql',
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
