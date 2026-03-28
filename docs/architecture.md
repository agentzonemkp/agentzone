# Architecture

## System Overview

```
User/Agent ──► Next.js Frontend ──► API Routes ──► Envio GraphQL
                                        │              │
                                        │         HyperIndex
                                        │              │
                                        ▼              ▼
                                  Metadata Resolver  ERC-8004
                                  (tokenURI → JSON)  Contracts
                                        │
                                        ▼
                                    Turso DB
                                  (cache + payments)
```

## Components

### 1. Frontend (Next.js 15)

Single-page application with server-side rendering. Pages:

| Route | Purpose |
|-------|---------|
| `/` | Landing page (static HTML via iframe) |
| `/explore` | Agent explorer with search, filters, pagination |
| `/agent/[id]` | Agent detail with 5 tabs (overview, reputation, x402, payments, validation) |
| `/analytics` | Network analytics dashboard |
| `/console` | x402 test console |
| `/register` | Agent service registration |

### 2. Envio HyperIndex

Indexes ERC-8004 contract events across multiple chains:

- **IdentityRegistry**: `Transfer` (mints), `Registered`, `MetadataSet`
- **ReputationRegistry**: `NewFeedback`

GraphQL endpoint provides the primary data source. Currently indexing:
- Base (chain 8453): ~37K agents
- Arbitrum (chain 42161): ~744 agents

### 3. Metadata Resolver

Since Envio can't make contract calls during indexing, metadata is resolved at API time:

1. Call `tokenURI(tokenId)` via JSON-RPC to the chain
2. Decode ABI-encoded string response
3. Resolve the URI (HTTP, IPFS, data:base64, inline JSON)
4. Parse metadata JSON (name, description, image, services)
5. Cache in-memory with 1-hour TTL

Supports batch resolution (10 concurrent) for list endpoints.

### 4. Turso Database

LibSQL database for:
- Cached agent metadata
- Payment records (append-only log)
- Service registry
- API keys and sessions

### 5. Cloudflare Workers

Three workers handle background tasks:
- **Health Pinger** (1 min): Checks agent endpoint liveness
- **Metadata Fetcher** (15 min): Drains metadata queue, resolves URIs
- **x402 Monitor** (5 min): Tracks USDC transfers to agent wallets

## Data Model

### Agent (Envio GraphQL)

```graphql
type Agent {
  id: String!                    # {chainId}_{contract}_{tokenId}
  wallet_address: String!        # Owner address
  contract_address: String!      # IdentityRegistry address
  token_id: String!              # ERC-8004 NFT token ID
  chain_id: Int!                 # EVM chain ID
  name: String                   # From tokenURI metadata
  description: String            # From tokenURI metadata
  category: String               # Agent category/type
  has_erc8004_identity: Boolean! # Always true (indexed from contract)
  trust_score: Int               # Computed from reputation
  transaction_count: Int         # x402 payment count
  total_revenue_usdc: Float      # Cumulative revenue
  created_at: String             # Block timestamp of mint
}
```

### Reputation (Envio GraphQL)

```graphql
type Reputation {
  id: String!                    # {chainId}_{contract}_{agentId}_{client}
  agent_id: String!              # Reference to Agent.id
  client_address: String!        # Address that gave feedback
  reputation_score: Int!         # Score given
  feedback_count: Int!           # Number of feedback entries
}
```

## Security

- All read endpoints are public (no auth required)
- Write endpoints (register, payments) exempt from global auth middleware
- SIWE (Sign-In With Ethereum) for authenticated sessions
- Iron-session for server-side session persistence
- Rate limiting on sensitive endpoints
