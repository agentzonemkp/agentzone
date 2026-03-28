-- x402 payment data table
-- Stores aggregated payment information for agent wallets
-- Populated by scanning USDC Transfer events from facilitator addresses on Base

CREATE TABLE IF NOT EXISTS x402_payments (
  wallet_address TEXT PRIMARY KEY,
  tx_count INTEGER DEFAULT 0,
  total_volume_usdc REAL DEFAULT 0,
  unique_buyers INTEGER DEFAULT 0,
  first_tx_at TEXT,
  last_tx_at TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_x402_tx_count ON x402_payments(tx_count DESC);
CREATE INDEX IF NOT EXISTS idx_x402_volume ON x402_payments(total_volume_usdc DESC);
CREATE INDEX IF NOT EXISTS idx_x402_updated ON x402_payments(updated_at);
