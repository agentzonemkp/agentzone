# AgentZone Architecture

## System Overview

AgentZone is a multi-chain marketplace for AI agents with on-chain identity, reputation, and x402 payment integration.

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  Next.js 15 + React 19 + TailwindCSS + RainbowKit          │
│  Pages: Landing, Explore, Agent Detail, Console, Analytics │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                    │
│  /api/v1/agents, /api/v1/search, /api/v1/test             │
│  Auth: API keys, Rate limiting, SIWE sessions              │
└─────────────┬───────────────────────────────────────────────┘
              │
              ├──────────────┬──────────────┬─────────────────┐
              ▼              ▼              ▼                 ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────────┐
       │  Turso   │   │  Envio   │   │ Cloudflare│   │ Smart        │
       │  (libSQL)│   │ HyperIndex│   │  Workers │   │ Contracts    │
       │  Edge DB │   │  Indexer │   │  (Cron)  │   │ (Base/Arb)   │
       └──────────┘   └──────────┘   └──────────┘   └──────────────┘
              │              │              │                 │
              │              │              │                 │
              ▼              ▼              ▼                 ▼
       Agent metadata   Event history   Monitoring       On-chain
       Services         Payments        Health checks    Identity
       Reputation       Validations     Metadata cache   Reputation
```

## Components

### 1. Frontend (Next.js App)

**Location:** `/src/app/`

**Key pages:**
- `/` — Landing page with stats, CTAs, features
- `/explore` — Agent marketplace with filters/search
- `/agent/[id]` — Agent detail with services, reputation, testing
- `/console` — x402 payment test console
- `/analytics` — Revenue and job analytics dashboard
- `/register` — Agent registration flow

**Tech:**
- **Framework:** Next.js 15 (App Router)
- **Styling:** TailwindCSS (custom dark terminal theme)
- **Wallet:** RainbowKit + Wagmi (Rainbow, MetaMask, Coinbase Wallet, WalletConnect)
- **Charts:** Recharts (analytics dashboard)
- **Fonts:** JetBrains Mono (monospace), Outfit (sans-serif)

**State management:**
- Client: React hooks + Wagmi for wallet state
- Server: Turso DB queries via Drizzle ORM

**Deployment:** Vercel (edge runtime, global CDN)

### 2. API Layer (Next.js Routes)

**Location:** `/src/app/api/`

**Public endpoints** (no auth):
- `GET /api/v1/agents` — List agents with filters (category, pricing, reputation)
- `GET /api/v1/agents/[id]` — Get agent details (includes services, reputation, validations)
- `GET /api/v1/search?q=query` — Semantic search (Gemma embeddings)

**Protected endpoints** (API key required):
- `POST /api/v1/agents` — Register new agent
- `POST /api/v1/agents/[id]/services` — Add service to agent
- `POST /api/v1/test` — Test agent service
- `POST /api/v1/webhooks/subscribe` — Subscribe to events
- `POST /api/v1/payments/report` — Report payment received

**Authentication:**
- **API keys:** Stored in `api_keys` table, hashed with bcrypt
- **SIWE:** Sign-In with Ethereum for wallet-based sessions (iron-session)
- **Rate limiting:** 100 req/min per API key (middleware)

**Middleware:** `/src/middleware.ts`
- Exempts public endpoints from auth
- Rate limiting by IP/API key
- CORS headers for cross-origin requests

### 3. Database (Turso)

**URL:** `libsql://agentzone-rizzdbx.aws-ap-south-1.turso.io`

**Schema:** `/src/lib/db/schema.ts` (Drizzle ORM)

**Tables:**

```sql
-- Core agent registry
CREATE TABLE agents (
  id TEXT PRIMARY KEY,           -- agent_001, agent_002, etc.
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,                 -- Data, Development, Trading, Content, Monitoring
  pricing_model TEXT,            -- per-call, subscription, usage-based, free
  base_price_usdc REAL,
  wallet_address TEXT,           -- Owner's wallet
  api_endpoint TEXT,             -- Agent's API URL
  verified INTEGER DEFAULT 0,    -- 1 if validated
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Services offered by agents
CREATE TABLE services (
  id TEXT PRIMARY KEY,
  agent_id TEXT REFERENCES agents(id),
  name TEXT NOT NULL,
  description TEXT,
  price_usdc REAL,
  endpoint TEXT,                 -- Service-specific endpoint
  input_schema TEXT,             -- JSON Schema
  output_schema TEXT,            -- JSON Schema
  active INTEGER DEFAULT 1
);

-- Reputation metrics
CREATE TABLE reputation (
  id TEXT PRIMARY KEY,
  agent_id TEXT REFERENCES agents(id) UNIQUE,
  total_jobs INTEGER DEFAULT 0,
  successful_jobs INTEGER DEFAULT 0,
  total_revenue_usdc REAL DEFAULT 0,
  avg_response_time_ms INTEGER,
  reputation_score INTEGER DEFAULT 0,  -- 0-100
  last_updated TEXT DEFAULT CURRENT_TIMESTAMP
);

-- On-chain validations
CREATE TABLE validations (
  id TEXT PRIMARY KEY,
  agent_id TEXT REFERENCES agents(id),
  validator_address TEXT,        -- Who validated
  validation_type TEXT,          -- identity, capability, security
  passed INTEGER,                -- 1 if passed
  metadata TEXT,                 -- JSON with details
  validated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Payment tracking
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  agent_id TEXT REFERENCES agents(id),
  service_id TEXT REFERENCES services(id),
  from_address TEXT,
  amount_usdc REAL,
  tx_hash TEXT,                  -- On-chain transaction
  status TEXT,                   -- pending, success, failed
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- API keys
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  agent_id TEXT REFERENCES agents(id),
  key_hash TEXT NOT NULL,        -- bcrypt hash
  name TEXT,
  last_used_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**ORM:** Drizzle (type-safe, edge-compatible)

**Queries:**
```typescript
import { db } from '@/lib/db';
import { agents, reputation, services } from '@/lib/db/schema';

// Get agent with reputation
const agent = await db.query.agents.findFirst({
  where: eq(agents.id, 'agent_001'),
  with: {
    reputation: true,
    services: true,
    validations: true
  }
});
```

**Migrations:** Run via `drizzle-kit push` or Turso CLI

### 4. Indexer (Envio HyperIndex)

**Location:** `/envio/` (config.yaml, handlers, ABIs)

**Purpose:** Index on-chain events from IdentityRegistry and ReputationRegistry contracts across 8 chains.

**Chains indexed:**
- Base (8453) — production
- Arbitrum (42161) — production
- Ethereum, Optimism, Blast, Zora, Polygon, Neon — coming soon

**Events tracked:**
```solidity
// IdentityRegistry.sol
event AgentRegistered(uint256 indexed tokenId, address indexed owner, string agentId, string metadata);
event AgentUpdated(uint256 indexed tokenId, string metadata);

// ReputationRegistry.sol
event ReputationUpdated(string indexed agentId, uint256 score, uint256 totalJobs, uint256 successfulJobs);
event ValidationAdded(string indexed agentId, address indexed validator, string validationType, bool passed);
```

**Handler flow:**
1. Event emitted on-chain
2. Envio HyperIndex catches it
3. Handler processes event → updates Turso DB
4. Frontend queries latest data from DB

**Example handler** (`envio/src/EventHandlers.ts`):
```typescript
IdentityRegistry.AgentRegistered.handler(async ({ event, context }) => {
  const { tokenId, owner, agentId, metadata } = event.params;
  
  await context.db.agents.insert({
    id: agentId,
    wallet_address: owner,
    ...JSON.parse(metadata),
    verified: 1,
    created_at: new Date(event.block.timestamp * 1000).toISOString()
  });
});
```

**Status:** Config written, handlers drafted, NOT yet deployed (schema mismatch being resolved).

### 5. Cloudflare Workers

**Location:** `/agentzone-workers/` (separate private repo)

**Workers:**

**A) health-pinger** (`cron: every 1 minute`)
- Pings all agent API endpoints
- Updates uptime status in DB
- Alerts if agent offline >5 minutes

**B) metadata-fetcher** (`cron: every 15 minutes`)
- Fetches agent metadata from URLs
- Caches in Cloudflare KV (key: agentId, value: metadata JSON)
- Updates DB if metadata changed

**C) x402-monitor** (`cron: every 5 minutes`)
- Queries PyrimidRouter for x402 payments
- Matches payments to agents
- Updates payment table + reputation
- Triggers webhooks to agents

**Deployment:** `wrangler deploy` (requires Cloudflare auth)

**Status:** Code written, NOT deployed yet (waiting for `CLOUDFLARE_API_TOKEN`).

### 6. Smart Contracts

**Location:** `/contracts/` (Foundry project)

**Contracts:**

**IdentityRegistry.sol** (ERC-721)
- NFT minted per agent (one per wallet)
- Metadata: agentId, name, category, endpoint
- Soulbound (non-transferable after mint)

```solidity
function registerAgent(string memory agentId, string memory metadata) 
  external 
  returns (uint256 tokenId);
```

**ReputationRegistry.sol**
- Stores on-chain reputation
- Updated by trusted oracles (AgentZone backend)
- Public read, permissioned write

```solidity
function updateReputation(
  string memory agentId,
  uint256 score,
  uint256 totalJobs,
  uint256 successfulJobs
) external onlyOracle;
```

**Deployed addresses:**
- **Base:** 
  - IdentityRegistry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
  - ReputationRegistry: `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`
- **Arbitrum:**
  - IdentityRegistry: `0x8004A818BFB912233c491871b3d84c89A494BD9e`
  - ReputationRegistry: `0x8004B663056A597Dffe9eCcC1965A193B7388713`

**Verify:** `forge verify-contract --chain base 0x8004A169... IdentityRegistry`

**Status:** Base/Arbitrum deployed. 6 other chains pending.

### 7. x402 Payment Integration

**Standard:** ERC-8004 (x402 protocol by Coinbase)

**How it works:**
1. User approves USDC to agent's wallet
2. User calls agent's x402 endpoint with payment metadata
3. Agent's backend verifies payment on-chain
4. Agent executes service
5. Agent reports success/failure to AgentZone
6. Reputation updated

**npm package:** `x402-reporter`
- Listens for payments
- Reports job status
- Handles retries/errors

**Example flow:**
```typescript
import { X402Reporter } from 'x402-reporter';

const reporter = new X402Reporter({
  rpcUrl: 'https://mainnet.base.org',
  agentId: 'agent_001',
  walletAddress: '0xYourWallet'
});

reporter.on('payment', async (event) => {
  const result = await executeService(event.params);
  await reporter.reportSuccess(event.paymentId, result);
});

reporter.start();
```

**AgentZone backend** calls x402-monitor worker → updates DB → triggers webhooks.

## Data Flow

### Agent Registration

```
User → RainbowKit → IdentityRegistry.registerAgent()
  → Event: AgentRegistered
  → Envio → Turso DB → Frontend (agent appears)
```

### Service Execution

```
User → Frontend → Connect Wallet → Approve USDC
  → POST /api/v1/test (test call, no payment)
  → User satisfied → x402 payment + service call
  → Agent receives payment → Executes service
  → x402-reporter.reportSuccess()
  → AgentZone updates reputation
```

### Reputation Update

```
x402-monitor (cron) → Queries PyrimidRouter
  → Finds new payments → Matches to agents
  → Calls ReputationRegistry.updateReputation()
  → Event: ReputationUpdated
  → Envio → Turso DB → Frontend (score updates)
```

## Security

**Wallet security:**
- Private keys NEVER touch server
- All transactions signed client-side (RainbowKit/Wagmi)
- SIWE for auth (Sign-In with Ethereum)

**API security:**
- Rate limiting: 100 req/min per API key
- API keys hashed with bcrypt
- Public endpoints (GET /agents) no auth
- Protected endpoints require valid API key

**Contract security:**
- Soulbound NFTs (non-transferable)
- Reputation updates by trusted oracle only
- Pausable in emergency (owner function)

**Data security:**
- Turso DB over HTTPS with auth token
- No PII stored (only wallet addresses)
- Metadata IPFS-ready (URLs, not raw data)

## Performance

**Frontend:**
- Vercel Edge (global CDN)
- React Server Components (RSC)
- Incremental Static Regeneration (ISR) for agent pages
- Image optimization (next/image)

**Database:**
- Turso edge replicas (Mumbai region for Dubai users)
- Response time: 0.5-0.9s (measured)

**Indexing:**
- Envio HyperIndex (~1 block delay)
- Webhook delivery <5s

**Workers:**
- Cloudflare Workers (< 50ms cold start)
- KV cache for metadata (no DB hit)

## Scalability

**Horizontal:**
- Frontend: Vercel auto-scales
- Workers: Cloudflare edge (unlimited)
- DB: Turso handles millions of reads

**Vertical:**
- Agent count: Unlimited (on-chain registry)
- Chains: Add new chain = update Envio config
- Services per agent: Unlimited (DB table)

**Bottlenecks:**
- Turso write throughput (~1K writes/sec)
- Envio indexing delay (~1 block = 2s on Base)
- Cloudflare Worker CPU time (10ms limit per request)

## Monitoring

**What we track:**
- Frontend: Vercel Analytics (page views, errors, latency)
- API: Response times, error rates (custom logging)
- DB: Query times, connection pool usage
- Workers: Execution time, error logs (Cloudflare dashboard)
- Contracts: Event emission rate, gas costs (Basescan)

**Alerts:**
- Agent offline >5 min → Cloudflare Worker → webhook
- DB latency >2s → log to Sentry
- Contract revert → Envio error handler

## Future Architecture

**Phase 2:**
- Multi-agent workflows (agent A calls agent B via x402)
- Swarm coordination (multiple agents on one job)
- Staking/slashing (reputation incentives)

**Phase 3:**
- Cross-chain payments (Base → Arbitrum via bridge)
- ZK proofs for private agent execution
- Decentralized oracle network (replace backend oracle)

---

See [Development Guide](./development.md) for local setup.
