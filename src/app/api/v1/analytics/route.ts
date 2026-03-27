import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, agents } from '@/db/schema';
import { sql, desc, and, gte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d';

    // Calculate date threshold
    const now = new Date();
    let daysAgo = 7;
    if (range === '24h') daysAgo = 1;
    else if (range === '30d') daysAgo = 30;
    else if (range === '90d') daysAgo = 90;

    const threshold = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Total stats
    const totalStats = await db
      .select({
        totalVolume: sql<number>`COALESCE(SUM(${payments.amount_usdc}), 0)`,
        totalRevenue: sql<number>`COALESCE(SUM(${payments.amount_usdc}) * 0.01, 0)`,
        totalTransactions: sql<number>`COUNT(*)`,
        avgTransactionSize: sql<number>`COALESCE(AVG(${payments.amount_usdc}), 0)`,
      })
      .from(payments)
      .where(gte(payments.created_at, threshold));

    // Volume by day
    const volumeByDay = await db
      .select({
        date: sql<string>`DATE(${payments.created_at})`,
        volume: sql<number>`SUM(${payments.amount_usdc})`,
        revenue: sql<number>`SUM(${payments.amount_usdc}) * 0.01`,
        transactions: sql<number>`COUNT(*)`,
      })
      .from(payments)
      .where(gte(payments.created_at, threshold))
      .groupBy(sql`DATE(${payments.created_at})`)
      .orderBy(sql`DATE(${payments.created_at})`);

    // Volume by chain
    const volumeByChain = await db
      .select({
        chain: payments.chain,
        volume: sql<number>`SUM(${payments.amount_usdc})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(payments)
      .where(gte(payments.created_at, threshold))
      .groupBy(payments.chain);

    // Top agents
    const topAgents = await db
      .select({
        agentId: payments.agent_id,
        name: agents.name,
        revenue: sql<number>`SUM(${payments.amount_usdc})`,
        jobs: sql<number>`COUNT(*)`,
      })
      .from(payments)
      .leftJoin(agents, sql`${payments.agent_id} = ${agents.id}`)
      .where(gte(payments.created_at, threshold))
      .groupBy(payments.agent_id, agents.name)
      .orderBy(desc(sql`SUM(${payments.amount_usdc})`))
      .limit(10);

    return NextResponse.json({
      totalVolume: Number(totalStats[0]?.totalVolume || 0),
      totalRevenue: Number(totalStats[0]?.totalRevenue || 0),
      totalTransactions: Number(totalStats[0]?.totalTransactions || 0),
      avgTransactionSize: Number(totalStats[0]?.avgTransactionSize || 0),
      volumeByDay: volumeByDay.map((d) => ({
        date: d.date,
        volume: Number(d.volume),
        revenue: Number(d.revenue),
        transactions: Number(d.transactions),
      })),
      volumeByChain: volumeByChain.map((c) => ({
        chain: c.chain || 'unknown',
        volume: Number(c.volume),
        count: Number(c.count),
      })),
      topAgents: topAgents.map((a) => ({
        agentId: a.agentId || '',
        name: a.name || 'Unknown',
        revenue: Number(a.revenue),
        jobs: Number(a.jobs),
      })),
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
