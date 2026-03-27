import { db } from '../db';
import { agents, reputation, services, validations } from '../db/schema';

const seedData = {
  agents: [
    {
      id: 'agent-oracle-v3',
      name: 'DataOracle-v3',
      description: 'Real-time market data oracle with 99.9% uptime',
      category: 'Data',
      pricing_model: 'per-call',
      base_price_usdc: 0.05,
      wallet_address: '0x1234567890123456789012345678901234567890',
      api_endpoint: 'https://api.dataoracle.xyz/v3',
      verified: true,
      created_at: new Date('2026-01-15'),
    },
    {
      id: 'agent-pepe-whale',
      name: 'PEPEWhaleAlert',
      description: 'Tracks PEPE whale movements and on-chain signals',
      category: 'Analytics',
      pricing_model: 'subscription',
      base_price_usdc: 10.0,
      wallet_address: '0x2345678901234567890123456789012345678901',
      api_endpoint: 'https://pepewhale.zone/api',
      verified: true,
      created_at: new Date('2026-02-01'),
    },
    {
      id: 'agent-risk-guard',
      name: 'RiskGuard-AI',
      description: 'ML-powered portfolio risk assessment',
      category: 'Risk Management',
      pricing_model: 'tiered',
      base_price_usdc: 2.5,
      wallet_address: '0x3456789012345678901234567890123456789012',
      api_endpoint: 'https://riskguard.ai/v1',
      verified: false,
      created_at: new Date('2026-02-20'),
    },
    {
      id: 'agent-mev-shield',
      name: 'MEVShield',
      description: 'MEV protection and front-running detection',
      category: 'Security',
      pricing_model: 'per-call',
      base_price_usdc: 0.25,
      wallet_address: '0x4567890123456789012345678901234567890123',
      api_endpoint: 'https://mevshield.net/protect',
      verified: true,
      created_at: new Date('2026-03-01'),
    },
    {
      id: 'agent-liq-mapper',
      name: 'LiquidityMapper',
      description: 'Cross-DEX liquidity aggregation and routing',
      category: 'DeFi',
      pricing_model: 'commission',
      base_price_usdc: 0.0,
      wallet_address: '0x5678901234567890123456789012345678901234',
      api_endpoint: 'https://liqmap.pro/aggregate',
      verified: true,
      created_at: new Date('2026-03-10'),
    },
  ],
  reputation: [
    { agent_id: 'agent-oracle-v3', total_jobs: 12847, successful_jobs: 12821, total_revenue_usdc: 642.35, avg_response_time_ms: 23, reputation_score: 98.5 },
    { agent_id: 'agent-pepe-whale', total_jobs: 387, successful_jobs: 387, total_revenue_usdc: 3870.0, avg_response_time_ms: 145, reputation_score: 97.2 },
    { agent_id: 'agent-risk-guard', total_jobs: 1203, successful_jobs: 1156, total_revenue_usdc: 3007.5, avg_response_time_ms: 312, reputation_score: 89.1 },
    { agent_id: 'agent-mev-shield', total_jobs: 5621, successful_jobs: 5598, total_revenue_usdc: 1405.25, avg_response_time_ms: 18, reputation_score: 96.8 },
    { agent_id: 'agent-liq-mapper', total_jobs: 8943, successful_jobs: 8901, total_revenue_usdc: 892.15, avg_response_time_ms: 87, reputation_score: 95.3 },
  ],
  services: [
    { id: 'svc-oracle-spot', agent_id: 'agent-oracle-v3', name: 'Spot Price Feed', description: 'Real-time spot prices for 500+ tokens', price_usdc: 0.05, endpoint: '/spot', active: true },
    { id: 'svc-oracle-perp', agent_id: 'agent-oracle-v3', name: 'Perpetuals Data', description: 'Funding rates, OI, liquidations', price_usdc: 0.10, endpoint: '/perp', active: true },
    { id: 'svc-pepe-alerts', agent_id: 'agent-pepe-whale', name: 'Whale Alerts', description: 'Real-time whale transaction notifications', price_usdc: 10.0, endpoint: '/alerts', active: true },
    { id: 'svc-risk-portfolio', agent_id: 'agent-risk-guard', name: 'Portfolio Analysis', description: 'Full risk breakdown with recommendations', price_usdc: 2.5, endpoint: '/analyze', active: true },
    { id: 'svc-mev-scan', agent_id: 'agent-mev-shield', name: 'Transaction Scan', description: 'Pre-submission MEV risk check', price_usdc: 0.25, endpoint: '/scan', active: true },
    { id: 'svc-liq-route', agent_id: 'agent-liq-mapper', name: 'Optimal Route', description: 'Best execution path across DEXs', price_usdc: 0.0, endpoint: '/route', active: true },
    { id: 'svc-liq-depths', agent_id: 'agent-liq-mapper', name: 'Depth Charts', description: 'Aggregated order book data', price_usdc: 0.15, endpoint: '/depths', active: true },
  ],
  validations: [
    { agent_id: 'agent-oracle-v3', validator_address: '0xValidator1', validation_type: 'uptime', passed: true, metadata: '{"uptime_pct": 99.94}', validated_at: new Date('2026-03-20') },
    { agent_id: 'agent-oracle-v3', validator_address: '0xValidator2', validation_type: 'accuracy', passed: true, metadata: '{"deviation_bps": 2}', validated_at: new Date('2026-03-21') },
    { agent_id: 'agent-pepe-whale', validator_address: '0xValidator1', validation_type: 'latency', passed: true, metadata: '{"avg_latency_ms": 145}', validated_at: new Date('2026-03-22') },
    { agent_id: 'agent-mev-shield', validator_address: '0xValidator3', validation_type: 'security_audit', passed: true, metadata: '{"auditor": "ChainSec", "score": 95}', validated_at: new Date('2026-03-18') },
    { agent_id: 'agent-mev-shield', validator_address: '0xValidator2', validation_type: 'uptime', passed: true, metadata: '{"uptime_pct": 99.87}', validated_at: new Date('2026-03-23') },
    { agent_id: 'agent-liq-mapper', validator_address: '0xValidator1', validation_type: 'routing_accuracy', passed: true, metadata: '{"optimal_routes_pct": 94.2}', validated_at: new Date('2026-03-19') },
    { agent_id: 'agent-risk-guard', validator_address: '0xValidator4', validation_type: 'model_accuracy', passed: false, metadata: '{"backt est_sharpe": 0.87}', validated_at: new Date('2026-03-17') },
  ],
};

async function seed() {
  console.log('🌱 Seeding database...');

  for (const agent of seedData.agents) {
    await db.insert(agents).values(agent).onConflictDoNothing();
  }
  console.log('✅ Agents seeded');

  for (const rep of seedData.reputation) {
    await db.insert(reputation).values(rep).onConflictDoNothing();
  }
  console.log('✅ Reputation seeded');

  for (const service of seedData.services) {
    await db.insert(services).values(service).onConflictDoNothing();
  }
  console.log('✅ Services seeded');

  for (const validation of seedData.validations) {
    await db.insert(validations).values(validation).onConflictDoNothing();
  }
  console.log('✅ Validations seeded');

  console.log('🎉 Seed complete!');
}

seed().catch(console.error);
