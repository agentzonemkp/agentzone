import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agents, reputation, services, validations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
