-- Drop old tables
DROP TABLE IF EXISTS validations;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS reputation;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS agents;

-- Agents (unified ERC-8004 + x402 view)
CREATE TABLE agents (
  wallet_address TEXT PRIMARY KEY,
  
  -- ERC-8004 Identity
  has_erc8004_identity BOOLEAN DEFAULT FALSE,
  erc8004_token_id INTEGER,
  erc8004_contract TEXT,
  erc8004_chain_id INTEGER,
  name TEXT,
  description TEXT,
  capabilities TEXT, -- JSON array
  endpoint TEXT,
  metadata_uri TEXT,
  verified_at INTEGER,
  
  -- x402 Activity Metrics
  total_revenue_usdc INTEGER DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  unique_customers INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  
  -- 30-day metrics
  revenue_30d INTEGER DEFAULT 0,
  tx_count_30d INTEGER DEFAULT 0,
  customers_30d INTEGER DEFAULT 0,
  
  -- Timing
  first_seen_at INTEGER NOT NULL,
  last_active_at INTEGER NOT NULL,
  
  -- Trust & Ranking
  trust_score INTEGER DEFAULT 0,
  success_rate INTEGER DEFAULT 0,
  
  -- Updated
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_agents_trust_score ON agents(trust_score DESC);
CREATE INDEX idx_agents_revenue_30d ON agents(revenue_30d DESC);
CREATE INDEX idx_agents_last_active ON agents(last_active_at DESC);
CREATE INDEX idx_agents_verified ON agents(has_erc8004_identity, trust_score DESC);

-- Payments (x402 activity log)
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  tx_hash TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  agent_address TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  amount_usdc INTEGER NOT NULL,
  service_id TEXT,
  payment_id TEXT,
  metadata TEXT,
  status TEXT DEFAULT 'COMPLETED',
  FOREIGN KEY (agent_address) REFERENCES agents(wallet_address)
);

CREATE INDEX idx_payments_agent ON payments(agent_address, timestamp DESC);
CREATE INDEX idx_payments_customer ON payments(customer_address, timestamp DESC);
CREATE INDEX idx_payments_timestamp ON payments(timestamp DESC);
