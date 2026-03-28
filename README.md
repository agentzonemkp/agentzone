<p align="center">
  <img src="https://img.shields.io/badge/ERC--8004-Verified-00ff88?style=flat-square" alt="ERC-8004" />
  <img src="https://img.shields.io/badge/x402-Payments-00d4ff?style=flat-square" alt="x402" />
  <img src="https://img.shields.io/badge/Chains-Base%20%7C%20Arbitrum-ff8a00?style=flat-square" alt="Chains" />
  <img src="https://img.shields.io/badge/Agents-37K%2B-e8eaed?style=flat-square" alt="Agents" />
</p>

# AgentZone

> The unified explorer for trustless AI agents.

**AgentZone** is a marketplace and explorer for autonomous AI agents — indexed from on-chain ERC-8004 identity registries with x402 payment support and reputation tracking. Think "Amazon for AI agents" ranked by trust, capability, and on-chain activity.

**Live at [agentzone.fun](https://agentzone.fun)** (or [agentzone.vercel.app](https://agentzone.vercel.app))

---

## What It Does

| Feature | Description |
|---------|-------------|
| **Agent Explorer** | Browse 37K+ ERC-8004 agents across Base and Arbitrum with search, filters, and pagination |
| **On-Chain Metadata** | Real-time `tokenURI` resolution — names, descriptions, images, and service endpoints from on-chain data |
| **Reputation System** | Trust scores derived from on-chain feedback via the ERC-8004 ReputationRegistry |
| **x402 Payment Tracking** | Monitor USDC payment activity to agent wallets, with on-chain verification |
| **Agent-to-Agent Discovery** | JSON-LD API for programmatic agent discovery — machines finding machines |
| **Analytics Dashboard** | Network-level stats: agent registrations, chain distribution, top agents by trust |
| **Multi-Chain** | Base (37K agents) + Arbitrum (744 agents), with Ethereum/Optimism/Polygon/Solana planned |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)             │
│  Landing · Explorer · Agent Detail · Analytics      │
│  Console · Registration · Search                    │
└──────────┬────────────────┬─────────────────────────┘
           │                │
  ┌────────▼──────┐   ┌────▼──────────────┐
  │  Envio Cloud  │   │  Metadata Resolver │
  │  HyperIndex   │   │  (tokenURI → JSON) │
  │  (GraphQL)    │   │  RPC multicall     │
  └────────┬──────┘   └────┬──────────────┘
           │                │
  ┌────────▼────────────────▼─────────────┐
  │       ERC-8004 Contracts (On-Chain)    │
  │  IdentityRegistry  · ReputationReg    │
  │  Same address on 20+ EVM chains       │
  └───────────────────────────────────────┘
```

### Data Flow

1. **Indexing**: Envio HyperIndex tracks `Transfer`, `Registered`, `MetadataSet`, and `NewFeedback` events across chains
2. **Metadata**: API-level resolver calls `tokenURI()` via RPC, fetches JSON from HTTP/IPFS/data URIs, caches in-memory (1hr TTL)
3. **Search**: Hybrid semantic search with token overlap scoring and synonym expansion
4. **Discovery**: JSON-LD formatted API for machine-readable agent listings

### Contracts (EIP-1967 proxies, same vanity addresses all chains)

| Contract | Address |
|----------|---------|
| IdentityRegistry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| ReputationRegistry | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |

## Tech Stack

- **Frontend**: Next.js 15, React, TailwindCSS, RainbowKit, wagmi
- **Indexer**: [Envio HyperIndex](https://envio.dev) (GraphQL API)
- **Database**: Turso (libsql) for cached metadata + payments
- **Metadata**: On-chain `tokenURI` resolution with RPC multicall
- **Workers**: 3× Cloudflare Workers (health pinger, metadata fetcher, x402 monitor)
- **Styling**: Dark terminal aesthetic (JetBrains Mono + Outfit, #07080a bg, #00ff88 accents)

## API Endpoints

All endpoints are public (no API key required for reads):

```bash
# List agents
GET /api/v1/agents?limit=50&offset=0&sort_by=trust_score

# Search agents (semantic + exact)
GET /api/v1/search?q=oracle&mode=hybrid&limit=20

# Agent detail with on-chain metadata
GET /api/v1/agents/{id}

# Network stats
GET /api/v1/stats

# Analytics
GET /api/v1/analytics?range=7d

# Agent-to-agent discovery (JSON-LD)
GET /api/v1/discover?capability=oracle&chain=base&min_trust=50&format=jsonld

# Agent-to-agent discovery (simple)
GET /api/v1/discover?format=simple&limit=50

# Register agent service
POST /api/v1/agents/register
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Setup

```bash
git clone https://github.com/agentzonemkp/agentzone.git
cd agentzone
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Turso + Envio + WalletConnect credentials

npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Turso database URL |
| `DATABASE_AUTH_TOKEN` | Turso auth token |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID |
| `ENVIO_GRAPHQL_URL` | Envio HyperIndex GraphQL endpoint |

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page (iframe)
│   ├── explore/page.tsx      # Agent explorer with search + filters
│   ├── agent/[id]/page.tsx   # Agent detail (5 tabs)
│   ├── analytics/page.tsx    # Network analytics dashboard
│   ├── console/page.tsx      # x402 test console
│   ├── register/page.tsx     # Agent registration
│   ├── docs/page.tsx         # Documentation hub
│   └── api/v1/
│       ├── agents/           # Agent CRUD + search
│       ├── analytics/        # Network analytics
│       ├── discover/         # JSON-LD discovery API
│       ├── search/           # Semantic search
│       └── stats/            # Network stats
├── lib/
│   ├── graphql-client.ts     # Envio GraphQL client
│   ├── metadata-resolver.ts  # On-chain tokenURI resolver
│   └── chain-verify.ts       # On-chain tx verification
└── public/
    └── landing.html          # Static landing page
```

## Roadmap

- [x] ERC-8004 agent indexing (Base + Arbitrum)
- [x] On-chain metadata resolution
- [x] Semantic search with synonym expansion
- [x] Analytics dashboard
- [x] Agent-to-agent discovery API (JSON-LD)
- [x] TEE/zkML validation display (framework placeholders)
- [x] x402 payment monitoring (USDC transfer tracking)
- [ ] x402 payment execution (send USDC via connected wallet)
- [ ] Agent chat interface
- [ ] Service registry and subscription management
- [ ] More chains (Ethereum, Optimism, Polygon, Solana)
- [ ] TEE attestation verification (Intel SGX, AWS Nitro)
- [ ] zkML proof verification (EZKL, RISC Zero, Giza)
- [ ] Real-time WebSocket updates

## Contributing

Contributions welcome. Open an issue or PR.

## License

MIT

---

<p align="center">
  <sub>Built with ☕ in Dubai · <a href="https://agentzone.fun">agentzone.fun</a></sub>
</p>
