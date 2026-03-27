-- Insert sample agents
INSERT INTO agents (id, name, description, endpoint, owner_address, metadata_uri, category, reputation_score, total_jobs, successful_jobs, created_at) VALUES
('agent_001', 'DataOracle AI', 'Real-time market data aggregation and analysis', 'https://api.dataoracle.ai/v1', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'ipfs://QmX1...data', 'data', 950, 1247, 1198, datetime('now', '-45 days')),
('agent_002', 'CodeAudit Pro', 'Smart contract security auditing and vulnerability detection', 'https://codeaudit.pro/api', '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199', 'ipfs://QmX2...code', 'security', 920, 89, 87, datetime('now', '-32 days')),
('agent_003', 'TradingBot Alpha', 'Automated trading strategy execution', 'https://alpha.trading.bot/execute', '0xdD2FD4581271e230360230F9337D5c0430Bf44C0', 'ipfs://QmX3...trade', 'trading', 875, 2341, 2104, datetime('now', '-67 days')),
('agent_004', 'ContentGen Studio', 'AI-powered content generation and optimization', 'https://contentgen.studio/api/v2', '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E', 'ipfs://QmX4...content', 'content', 890, 456, 441, datetime('now', '-21 days')),
('agent_005', 'ChainMonitor', 'Multi-chain transaction monitoring and alerting', 'https://monitor.chain.services/v1', '0x2546BcD3c84621e976D8185a91A922aE77ECEc30', 'ipfs://QmX5...monitor', 'monitoring', 965, 5678, 5523, datetime('now', '-89 days'));

-- Insert services
INSERT INTO services (id, agent_id, name, description, price_usdc, created_at) VALUES
('svc_001', 'agent_001', 'Market Data Feed', 'Real-time crypto market data', 50, datetime('now', '-45 days')),
('svc_002', 'agent_001', 'Technical Analysis', 'AI-powered TA signals', 100, datetime('now', '-45 days')),
('svc_003', 'agent_002', 'Security Audit', 'Full smart contract audit', 5000, datetime('now', '-32 days')),
('svc_004', 'agent_003', 'Strategy Backtest', 'Historical strategy testing', 250, datetime('now', '-67 days')),
('svc_005', 'agent_004', 'Content Generation', 'Generate marketing content', 75, datetime('now', '-21 days')),
('svc_006', 'agent_005', 'Wallet Monitoring', 'Track wallet activity', 30, datetime('now', '-89 days'));

-- Insert reputation events
INSERT INTO reputation (id, agent_id, score_delta, event_type, metadata, created_at) VALUES
('rep_001', 'agent_001', 50, 'job_success', '{"job_id":"job_123","rating":5}', datetime('now', '-2 days')),
('rep_002', 'agent_002', 30, 'job_success', '{"job_id":"job_124","rating":4}', datetime('now', '-1 day')),
('rep_003', 'agent_003', -20, 'job_failure', '{"job_id":"job_125","reason":"timeout"}', datetime('now', '-5 days')),
('rep_004', 'agent_004', 40, 'verification', '{"verification_type":"identity"}', datetime('now', '-3 days')),
('rep_005', 'agent_005', 60, 'job_success', '{"job_id":"job_126","rating":5}', datetime('now', '-1 day'));

-- Insert payments
INSERT INTO payments (id, agent_id, service_id, from_address, amount_usdc, tx_hash, chain, status, created_at) VALUES
('pay_001', 'agent_001', 'svc_001', '0x1234567890123456789012345678901234567890', 50, '0xabc123...', 'base', 'confirmed', datetime('now', '-2 days')),
('pay_002', 'agent_002', 'svc_003', '0x2345678901234567890123456789012345678901', 5000, '0xdef456...', 'base', 'confirmed', datetime('now', '-1 day')),
('pay_003', 'agent_003', 'svc_004', '0x3456789012345678901234567890123456789012', 250, '0xghi789...', 'arbitrum', 'confirmed', datetime('now', '-3 days')),
('pay_004', 'agent_004', 'svc_005', '0x4567890123456789012345678901234567890123', 75, '0xjkl012...', 'base', 'pending', datetime('now', '-5 hours')),
('pay_005', 'agent_005', 'svc_006', '0x5678901234567890123456789012345678901234', 30, '0xmno345...', 'base', 'confirmed', datetime('now', '-4 days'));

-- Insert validations
INSERT INTO validations (id, agent_id, validator_address, is_valid, metadata, created_at) VALUES
('val_001', 'agent_001', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 1, '{"verification":"identity"}', datetime('now', '-40 days')),
('val_002', 'agent_002', '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199', 1, '{"verification":"security"}', datetime('now', '-30 days')),
('val_003', 'agent_003', '0xdD2FD4581271e230360230F9337D5c0430Bf44C0', 1, '{"verification":"identity"}', datetime('now', '-60 days')),
('val_004', 'agent_004', '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E', 1, '{"verification":"content"}', datetime('now', '-20 days')),
('val_005', 'agent_005', '0x2546BcD3c84621e976D8185a91A922aE77ECEc30', 1, '{"verification":"monitoring"}', datetime('now', '-85 days'));
