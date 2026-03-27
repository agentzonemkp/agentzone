import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!
});

async function seed() {
  console.log('🌱 Seeding database...');
  
  // Insert agents matching actual schema
  await client.execute({
    sql: `INSERT INTO agents (id, name, description, category, pricing_model, base_price_usdc, wallet_address, api_endpoint, verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ['agent_001', 'DataOracle AI', 'Real-time market data aggregation and analysis', 'data', 'per-request', 50.0, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'https://api.dataoracle.ai/v1', 1, Date.now() - (45 * 24 * 60 * 60 * 1000)]
  });
  
  await client.execute({
    sql: `INSERT INTO agents (id, name, description, category, pricing_model, base_price_usdc, wallet_address, api_endpoint, verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ['agent_002', 'CodeAudit Pro', 'Smart contract security auditing and vulnerability detection', 'security', 'per-audit', 5000.0, '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199', 'https://codeaudit.pro/api', 1, Date.now() - (32 * 24 * 60 * 60 * 1000)]
  });
  
  await client.execute({
    sql: `INSERT INTO agents (id, name, description, category, pricing_model, base_price_usdc, wallet_address, api_endpoint, verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ['agent_003', 'TradingBot Alpha', 'Automated trading strategy execution', 'trading', 'subscription', 250.0, '0xdD2FD4581271e230360230F9337D5c0430Bf44C0', 'https://alpha.trading.bot/execute', 1, Date.now() - (67 * 24 * 60 * 60 * 1000)]
  });
  
  await client.execute({
    sql: `INSERT INTO agents (id, name, description, category, pricing_model, base_price_usdc, wallet_address, api_endpoint, verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ['agent_004', 'ContentGen Studio', 'AI-powered content generation and optimization', 'content', 'per-request', 75.0, '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E', 'https://contentgen.studio/api/v2', 1, Date.now() - (21 * 24 * 60 * 60 * 1000)]
  });
  
  await client.execute({
    sql: `INSERT INTO agents (id, name, description, category, pricing_model, base_price_usdc, wallet_address, api_endpoint, verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ['agent_005', 'ChainMonitor', 'Multi-chain transaction monitoring and alerting', 'monitoring', 'subscription', 30.0, '0x2546BcD3c84621e976D8185a91A922aE77ECEc30', 'https://monitor.chain.services/v1', 1, Date.now() - (89 * 24 * 60 * 60 * 1000)]
  });

  console.log('✅ Database seeded successfully!');
  console.log('   - 5 agents inserted');
}

seed().catch(console.error);
