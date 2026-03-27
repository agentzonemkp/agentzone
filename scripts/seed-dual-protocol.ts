import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const turso = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
});

async function seed() {
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - (30 * 86400);
  
  // Sample agents with mixed ERC-8004 + x402 data
  const agents = [
    {
      wallet_address: '0xd934c5f71ca40261097091ea2c1097',
      has_erc8004_identity: true,
      erc8004_token_id: 1,
      erc8004_contract: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
      erc8004_chain_id: 8453,
      name: 'DataOracle AI',
      description: 'Real-time market data feeds with sub-second latency',
      capabilities: JSON.stringify(['data', 'market-feeds', 'price-oracle']),
      endpoint: 'https://api.dataoracle.ai',
      verified_at: thirtyDaysAgo,
      total_revenue_usdc: 12_300_000000, // $12,300
      transaction_count: 487,
      unique_customers: 89,
      success_count: 467,
      failed_count: 20,
      revenue_30d: 5_600_000000, // $5,600
      tx_count_30d: 156,
      customers_30d: 34,
      first_seen_at: thirtyDaysAgo,
      last_active_at: now - 3600,
      trust_score: 94,
      success_rate: 96,
      updated_at: now,
    },
    {
      wallet_address: '0xa1ed4c5f71ca40261097091ea2c1d4ed',
      has_erc8004_identity: true,
      erc8004_token_id: 2,
      erc8004_contract: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
      erc8004_chain_id: 8453,
      name: 'TradingBot Alpha',
      description: 'Automated trading signals for crypto perpetuals',
      capabilities: JSON.stringify(['trading', 'signals', 'perps']),
      endpoint: 'https://api.tradingbot-alpha.com',
      verified_at: thirtyDaysAgo - 86400 * 10,
      total_revenue_usdc: 8_700_000000, // $8,700
      transaction_count: 201,
      unique_customers: 67,
      success_count: 185,
      failed_count: 16,
      revenue_30d: 4_200_000000, // $4,200
      tx_count_30d: 89,
      customers_30d: 28,
      first_seen_at: thirtyDaysAgo - 86400 * 15,
      last_active_at: now - 7200,
      trust_score: 89,
      success_rate: 92,
      updated_at: now,
    },
    {
      wallet_address: '0x660ad934c5f71ca40261097091ea2ca83f',
      has_erc8004_identity: false, // No ERC-8004, only x402 activity
      name: 'CodeAudit Pro',
      description: 'Smart contract security audits',
      capabilities: JSON.stringify(['security', 'audit', 'solidity']),
      endpoint: 'https://api.codeaudit.pro',
      total_revenue_usdc: 15_000_000000, // $15,000 (high revenue, no verification)
      transaction_count: 6,
      unique_customers: 4,
      success_count: 6,
      failed_count: 0,
      revenue_30d: 10_000_000000, // $10,000
      tx_count_30d: 4,
      customers_30d: 3,
      first_seen_at: thirtyDaysAgo - 86400 * 5,
      last_active_at: now - 86400,
      trust_score: 62, // Lower trust (no ERC-8004)
      success_rate: 100,
      updated_at: now,
    },
    {
      wallet_address: '0xc949aea380d7b7984806143ddbfe519b03abd68b',
      has_erc8004_identity: true,
      erc8004_token_id: 3,
      erc8004_contract: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
      erc8004_chain_id: 8453,
      name: 'ContentGen Studio',
      description: 'AI-powered content generation for marketing',
      capabilities: JSON.stringify(['content', 'copywriting', 'marketing']),
      endpoint: 'https://api.contentgen.studio',
      verified_at: thirtyDaysAgo - 86400 * 3,
      total_revenue_usdc: 3_200_000000, // $3,200
      transaction_count: 98,
      unique_customers: 23,
      success_count: 94,
      failed_count: 4,
      revenue_30d: 1_800_000000, // $1,800
      tx_count_30d: 45,
      customers_30d: 15,
      first_seen_at: thirtyDaysAgo - 86400 * 7,
      last_active_at: now - 1800,
      trust_score: 81,
      success_rate: 96,
      updated_at: now,
    },
    {
      wallet_address: '0x5ad7d934c5f71ca40261097091ea2c279b',
      has_erc8004_identity: false,
      name: 'ChainMonitor',
      description: 'Real-time blockchain event monitoring',
      capabilities: JSON.stringify(['monitoring', 'events', 'alerts']),
      endpoint: 'https://api.chainmonitor.io',
      total_revenue_usdc: 890_000000, // $890
      transaction_count: 67,
      unique_customers: 12,
      success_count: 65,
      failed_count: 2,
      revenue_30d: 450_000000, // $450
      tx_count_30d: 28,
      customers_30d: 8,
      first_seen_at: thirtyDaysAgo - 86400 * 2,
      last_active_at: now - 14400,
      trust_score: 53,
      success_rate: 97,
      updated_at: now,
    },
  ];
  
  console.log('Seeding agents...');
  for (const agent of agents) {
    await turso.execute({
      sql: `
        INSERT INTO agents (
          wallet_address, has_erc8004_identity, erc8004_token_id, erc8004_contract, erc8004_chain_id,
          name, description, capabilities, endpoint, verified_at,
          total_revenue_usdc, transaction_count, unique_customers, success_count, failed_count,
          revenue_30d, tx_count_30d, customers_30d,
          first_seen_at, last_active_at, trust_score, success_rate, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        agent.wallet_address,
        agent.has_erc8004_identity,
        agent.erc8004_token_id || null,
        agent.erc8004_contract || null,
        agent.erc8004_chain_id || null,
        agent.name,
        agent.description,
        agent.capabilities,
        agent.endpoint,
        agent.verified_at || null,
        agent.total_revenue_usdc,
        agent.transaction_count,
        agent.unique_customers,
        agent.success_count,
        agent.failed_count,
        agent.revenue_30d,
        agent.tx_count_30d,
        agent.customers_30d,
        agent.first_seen_at,
        agent.last_active_at,
        agent.trust_score,
        agent.success_rate,
        agent.updated_at,
      ],
    });
  }
  
  // Seed sample payments
  console.log('Seeding payments...');
  const payments = [
    { agent: agents[0].wallet_address, customer: '0x123...', amount: 50_000000, timestamp: now - 3600 },
    { agent: agents[0].wallet_address, customer: '0x456...', amount: 50_000000, timestamp: now - 7200 },
    { agent: agents[1].wallet_address, customer: '0x789...', amount: 250_000000, timestamp: now - 7200 },
    { agent: agents[2].wallet_address, customer: '0xabc...', amount: 5000_000000, timestamp: now - 86400 },
    { agent: agents[3].wallet_address, customer: '0xdef...', amount: 75_000000, timestamp: now - 1800 },
  ];
  
  for (let i = 0; i < payments.length; i++) {
    const p = payments[i];
    await turso.execute({
      sql: `
        INSERT INTO payments (
          id, tx_hash, chain_id, block_number, timestamp,
          agent_address, customer_address, amount_usdc, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        `tx${i}-0`,
        `0xtx${i}hash`,
        8453,
        1000000 + i,
        p.timestamp,
        p.agent,
        p.customer,
        p.amount,
        'COMPLETED',
      ],
    });
  }
  
  console.log('✅ Seeded 5 agents with dual-protocol data (3 ERC-8004 verified, 2 x402-only)');
  console.log('✅ Seeded 5 sample payments');
}

seed().catch(console.error);
