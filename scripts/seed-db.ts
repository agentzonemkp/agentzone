import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!
});

async function seed() {
  console.log('🌱 Seeding database...');
  
  const baseTime = Date.now();
  
  // Insert agents
  await client.execute({
    sql: `INSERT INTO agents (id, name, description, category, pricing_model, base_price_usdc, wallet_address, api_endpoint, verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ['agent_001', 'DataOracle AI', 'Real-time market data aggregation and analysis across BTC, ETH, and top 100 alts', 'data', 'per-request', 50.0, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'https://api.dataoracle.ai/v1', 1, baseTime - (45 * 24 * 60 * 60 * 1000)]
  });
  
  await client.execute({
    sql: `INSERT INTO agents (id, name, description, category, pricing_model, base_price_usdc, wallet_address, api_endpoint, verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ['agent_002', 'CodeAudit Pro', 'Smart contract security auditing with automated vulnerability detection', 'security', 'per-audit', 5000.0, '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199', 'https://codeaudit.pro/api', 1, baseTime - (32 * 24 * 60 * 60 * 1000)]
  });
  
  await client.execute({
    sql: `INSERT INTO agents (id, name, description, category, pricing_model, base_price_usdc, wallet_address, api_endpoint, verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ['agent_003', 'TradingBot Alpha', 'Automated trading strategy execution with funding rate arbitrage', 'trading', 'subscription', 250.0, '0xdD2FD4581271e230360230F9337D5c0430Bf44C0', 'https://alpha.trading.bot/execute', 1, baseTime - (67 * 24 * 60 * 60 * 1000)]
  });
  
  await client.execute({
    sql: `INSERT INTO agents (id, name, description, category, pricing_model, base_price_usdc, wallet_address, api_endpoint, verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ['agent_004', 'ContentGen Studio', 'AI-powered content generation and optimization for Web3 marketing', 'content', 'per-request', 75.0, '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E', 'https://contentgen.studio/api/v2', 1, baseTime - (21 * 24 * 60 * 60 * 1000)]
  });
  
  await client.execute({
    sql: `INSERT INTO agents (id, name, description, category, pricing_model, base_price_usdc, wallet_address, api_endpoint, verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: ['agent_005', 'ChainMonitor', 'Multi-chain transaction monitoring and alerting for large wallets', 'monitoring', 'subscription', 30.0, '0x2546BcD3c84621e976D8185a91A922aE77ECEc30', 'https://monitor.chain.services/v1', 1, baseTime - (89 * 24 * 60 * 60 * 1000)]
  });

  // Insert reputation data
  await client.execute({
    sql: `INSERT INTO reputation (agent_id, total_jobs, successful_jobs, total_revenue_usdc, avg_response_time_ms, reputation_score, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ['agent_001', 1247, 1198, 62350.0, 45, 95.8, baseTime]
  });
  
  await client.execute({
    sql: `INSERT INTO reputation (agent_id, total_jobs, successful_jobs, total_revenue_usdc, avg_response_time_ms, reputation_score, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ['agent_002', 89, 87, 445000.0, 120, 97.8, baseTime]
  });
  
  await client.execute({
    sql: `INSERT INTO reputation (agent_id, total_jobs, successful_jobs, total_revenue_usdc, avg_response_time_ms, reputation_score, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ['agent_003', 2341, 2104, 585250.0, 82, 89.9, baseTime]
  });
  
  await client.execute({
    sql: `INSERT INTO reputation (agent_id, total_jobs, successful_jobs, total_revenue_usdc, avg_response_time_ms, reputation_score, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ['agent_004', 456, 441, 34200.0, 55, 96.7, baseTime]
  });
  
  await client.execute({
    sql: `INSERT INTO reputation (agent_id, total_jobs, successful_jobs, total_revenue_usdc, avg_response_time_ms, reputation_score, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ['agent_005', 5678, 5523, 170340.0, 38, 97.3, baseTime]
  });

  // Insert services
  await client.execute({
    sql: `INSERT INTO services (id, agent_id, name, description, price_usdc, endpoint, active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ['svc_001', 'agent_001', 'BTC/USD Price Feed', 'Real-time Bitcoin price from aggregated CEX sources', 0.01, '/v1/price/btc', 1]
  });
  
  await client.execute({
    sql: `INSERT INTO services (id, agent_id, name, description, price_usdc, endpoint, active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ['svc_002', 'agent_001', 'Funding Rate Monitor', 'Track perpetual funding rates across exchanges', 0.05, '/v1/funding', 1]
  });
  
  await client.execute({
    sql: `INSERT INTO services (id, agent_id, name, description, price_usdc, endpoint, active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ['svc_003', 'agent_002', 'Full Security Audit', 'Comprehensive smart contract audit report', 5000.0, '/api/audit/full', 1]
  });
  
  await client.execute({
    sql: `INSERT INTO services (id, agent_id, name, description, price_usdc, endpoint, active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ['svc_004', 'agent_003', 'Strategy Backtest', 'Historical performance testing for trading strategies', 250.0, '/execute/backtest', 1]
  });
  
  await client.execute({
    sql: `INSERT INTO services (id, agent_id, name, description, price_usdc, endpoint, active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ['svc_005', 'agent_004', 'Tweet Generation', 'AI-generated crypto marketing tweets', 75.0, '/api/v2/generate/tweet', 1]
  });
  
  await client.execute({
    sql: `INSERT INTO services (id, agent_id, name, description, price_usdc, endpoint, active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: ['svc_006', 'agent_005', 'Wallet Alerts', 'Real-time notifications for large wallet movements', 30.0, '/v1/alerts/wallet', 1]
  });

  // Insert validations
  await client.execute({
    sql: `INSERT INTO validations (agent_id, validator_address, validation_type, passed, validated_at) VALUES (?, ?, ?, ?, ?)`,
    args: ['agent_001', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'uptime', 1, baseTime - (2 * 24 * 60 * 60 * 1000)]
  });
  
  await client.execute({
    sql: `INSERT INTO validations (agent_id, validator_address, validation_type, passed, validated_at) VALUES (?, ?, ?, ?, ?)`,
    args: ['agent_001', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'accuracy', 1, baseTime - (5 * 24 * 60 * 60 * 1000)]
  });
  
  await client.execute({
    sql: `INSERT INTO validations (agent_id, validator_address, validation_type, passed, validated_at) VALUES (?, ?, ?, ?, ?)`,
    args: ['agent_002', '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199', 'security', 1, baseTime - (1 * 24 * 60 * 60 * 1000)]
  });
  
  await client.execute({
    sql: `INSERT INTO validations (agent_id, validator_address, validation_type, passed, validated_at) VALUES (?, ?, ?, ?, ?)`,
    args: ['agent_003', '0xdD2FD4581271e230360230F9337D5c0430Bf44C0', 'performance', 1, baseTime - (3 * 24 * 60 * 60 * 1000)]
  });
  
  await client.execute({
    sql: `INSERT INTO validations (agent_id, validator_address, validation_type, passed, validated_at) VALUES (?, ?, ?, ?, ?)`,
    args: ['agent_004', '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E', 'content-quality', 1, baseTime - (4 * 24 * 60 * 60 * 1000)]
  });
  
  await client.execute({
    sql: `INSERT INTO validations (agent_id, validator_address, validation_type, passed, validated_at) VALUES (?, ?, ?, ?, ?)`,
    args: ['agent_005', '0x2546BcD3c84621e976D8185a91A922aE77ECEc30', 'reliability', 1, baseTime - (7 * 24 * 60 * 60 * 1000)]
  });

  console.log('✅ Database seeded successfully!');
  console.log('   - 5 agents');
  console.log('   - 5 reputation records');
  console.log('   - 6 services');
  console.log('   - 5 validations');
}

seed().catch(console.error);
