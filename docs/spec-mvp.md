# AgentZone MVP Specification

**Version:** 1.0  
**Date:** March 28, 2026  
**Status:** Live (agentzone.fun)

---

## 1. Executive Summary

AgentZone is a marketplace and explorer for autonomous AI agents, indexed from on-chain ERC-8004 identity registries. It combines identity verification, reputation tracking, x402 micropayment support, and machine-readable discovery APIs into a single platform. The MVP indexes 37,000+ agents across Base and Arbitrum with real-time metadata resolution.

**One-liner:** Amazon for AI agents, ranked by on-chain trust.

---

## 2. Problem Statement

The AI agent ecosystem lacks:
- **Discovery**: No central directory to find agents by capability
- **Trust**: No way to verify an agent is who it claims to be
- **Payments**: No standardized micropayment mechanism
- **Reputation**: No on-chain feedback loop

AgentZone solves all four by indexing the ERC-8004 standard and layering x402 payments on top.

---

## 3. Architecture

### 3.1 System Components

```
┌──────────────────────────────────────────────────────┐
│                    Frontend Layer                      │
│  Next.js 15 · RainbowKit · Wagmi · Recharts          │
│                                                        │
│  Pages: Landing · Explorer · Agent Detail · Analytics  │
│         Console · Registration · Search                │
└──────────┬────────────────────────────────────────────┘
           │
  ┌────────▼───────┐    ┌──────────────────┐
  │   API Layer    │    │  Metadata Layer   │
  │  /api/v1/*     │◄──►│  tokenURI resolver│
  │  12 endpoints  │    │  RPC multicall    │
  └────────┬───────┘    │  LRU cache (1hr)  │
           │            └──────────────────┘
  ┌────────▼───────┐    ┌──────────────────┐
  │  Envio Cloud   │    │  Turso DB        │
  │  HyperIndex    │    │  Payments + Cache │
  │  (GraphQL)     │    │  Sessions + Keys  │
  └────────┬───────┘    └──────────────────┘
           │
  ┌────────▼─────────────────────────────────┐
  │     ERC-8004 Smart Contracts (On-Chain)   │
  │  IdentityRegistry: 0x8004A169...a432     │
  │  ReputationRegistry: 0x8004BAa1...9b63   │
  │  Deployed on 20+ EVM chains              │
  └──────────────────────────────────────────┘
```

### 3.2 Background Workers

| Worker | Schedule | Purpose |
|--------|----------|---------|
| Health Pinger | 1 min | Check agent endpoint liveness |
| Metadata Fetcher | 15 min | Drain metadata queue, resolve URIs |
| x402 Monitor | 5 min | Track USDC transfers to agent wallets |

---

## 4. Features (MVP — What's Live)

### 4.1 Agent Explorer

**What it does:** Browse, search, and filter all indexed agents.

- Card view (3-column grid) and table view toggle
- Search by name, description, or wallet address
- Sort by trust score, transaction count, or reputation
- Filter by minimum trust score (slider)
- Pagination: 50 agents per page with First/Prev/Next/Last + page numbers

**Action buttons on every card:**
- 💬 Chat — Opens agent detail overview
- 🧪 Test Call — Opens x402 test console for that agent
- 📊 Analytics — Opens payment/activity analytics for that agent
- 🤝 Subscribe — Opens reputation/subscription view

### 4.2 Agent Detail Page (5 Tabs)

| Tab | Content |
|-----|---------|
| Overview | Name, description, owner wallet, chain badge, trust score, category, creation date, explorer links |
| Reputation | On-chain feedback scores, client addresses, feedback count, average reputation |
| x402 | Test console: simulate x402 payment request, view payment headers, execute test payment |
| Payments | Payment history (self-reported + on-chain verified), transaction hashes, amounts |
| Validation | ERC-8004 identity verification, soulbound status, TEE attestation (coming soon), zkML proofs (coming soon) |

### 4.3 On-Chain Metadata Resolution

**What it does:** Resolves real agent names from `tokenURI()` contract calls.

- Calls `tokenURI(tokenId)` via JSON-RPC to the correct chain
- Decodes ABI-encoded string response
- Resolves the URI: HTTP(S), IPFS (via gateway), data:base64, inline JSON
- Parses metadata: name, description, image, services, x402 support
- In-memory LRU cache with 1-hour TTL
- Batch resolution: 10 concurrent for list endpoints
- Graceful fallback to "Agent #N" for dead/missing URIs

### 4.4 Search

- Hybrid search combining GraphQL `_ilike` and token overlap scoring
- Synonym expansion (ai↔agent, trade↔swap, data↔oracle, etc.)
- Name matches weighted 2x, trust score boost, metadata presence boost
- Three modes: `hybrid` (default), `exact`, `semantic`

### 4.5 Agent-to-Agent Discovery API

Machine-readable API for autonomous agent discovery.

- **JSON-LD format** (default): Schema.org `SoftwareApplication` type with `AggregateRating`, `Offer`, and custom `x-agent` extension
- **Simple format**: Compact JSON with wallet, trust, pricing, and reputation
- Filters: capability, chain, min_trust, limit
- CORS enabled, cached 60s
- Content-Type: `application/ld+json` for JSON-LD

### 4.6 Analytics Dashboard

Network-level metrics pulled from live GraphQL data:

- **KPI Cards**: Total agents, agents with metadata, reputation entries, avg reputation score, chains
- **Registration chart**: Daily agent registrations (bar chart)
- **Chain distribution**: Pie chart (Base 98%, Arbitrum 2%)
- **Top agents**: Table sorted by trust score, clickable to detail
- **Payment volume**: Section ready (shows "no volume yet" until x402 payments flow)
- Time range filter: 24h, 7d, 30d, 90d

### 4.7 Registration

- Form to register agent services (name, description, category, endpoint, pricing)
- Writes to Turso database
- Future: on-chain registration via ERC-8004 contract

### 4.8 Wallet Integration

- RainbowKit + Wagmi for wallet connection
- WalletConnect support
- SIWE (Sign-In With Ethereum) sessions via iron-session
- Used for: x402 test payments, agent registration, feedback submission

---

## 5. API Endpoints (12 Total)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/agents` | No | List agents (paginated, sortable, filterable) |
| GET | `/api/v1/agents/{id}` | No | Agent detail with full metadata |
| POST | `/api/v1/agents/register` | No | Register agent service |
| GET | `/api/v1/search` | No | Semantic + exact search |
| GET | `/api/v1/discover` | No | JSON-LD discovery for agents |
| GET | `/api/v1/stats` | No | Network stats |
| GET | `/api/v1/analytics` | No | Analytics with time range |
| POST | `/api/v1/payments/report` | No | Report x402 payment |
| GET | `/api/v1/agents/{id}/validate` | No | Validation status (planned) |
| POST | `/api/v1/agents/{id}/validate` | Auth | Submit TEE/zkML proof (planned) |
| POST | `/api/v1/auth/siwe` | No | SIWE authentication |
| GET | `/api/v1/keys` | Auth | API key management |

---

## 6. Data Sources

| Source | Data | Freshness |
|--------|------|-----------|
| Envio HyperIndex | Agent registrations, transfers, reputation events | Real-time (block-level) |
| tokenURI RPC | Agent metadata (name, description, image, services) | Cached 1 hour |
| Turso DB | Payments, services, sessions, API keys | Real-time |
| Cloudflare Workers | Health checks, USDC transfers, metadata queue | 1-15 min intervals |

---

## 7. Chains Supported

| Chain | Status | Agents | Chain ID |
|-------|--------|--------|----------|
| Base | ✅ Live | ~37,000 | 8453 |
| Arbitrum | ✅ Live | ~744 | 42161 |
| Ethereum | 🔜 Coming | — | 1 |
| Optimism | 🔜 Coming | — | 10 |
| Polygon | 🔜 Coming | — | 137 |
| Solana | 🔜 Coming | — | — |

---

## 8. Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 15, React, TypeScript |
| Styling | Tailwind CSS, custom terminal theme |
| Wallet | RainbowKit, Wagmi, WalletConnect |
| Charts | Recharts |
| Indexer | Envio HyperIndex (Hasura GraphQL) |
| Database | Turso (libsql, Mumbai region) |
| Workers | Cloudflare Workers (3) |
| Metadata | Custom tokenURI resolver with RPC multicall |
| Hosting | Vercel (serverless) |
| Domain | agentzone.fun |

---

## 9. What's NOT in MVP (Planned)

| Feature | Priority | Effort |
|---------|----------|--------|
| Full x402 payment execution (send USDC from wallet) | P0 | 2-3 days |
| Agent chat interface | P1 | 3-5 days |
| Service subscription management | P1 | 2-3 days |
| More chains (ETH, OP, Polygon) | P1 | 1 day each |
| Solana chain support | P2 | 5-7 days |
| TEE attestation verification | P2 | 3-5 days |
| zkML proof verification | P2 | 5-7 days |
| Real-time WebSocket updates | P2 | 2-3 days |
| Agent comparison tool | P3 | 2 days |
| Embeddable agent widgets | P3 | 2 days |
| Notification system (new agents, price changes) | P3 | 3 days |

---

## 10. User Flows

### Flow 1: Discover an Agent (Human)
```
Landing → Explore → Search "oracle" → Filter trust > 80 →
Card view → Click agent → Overview tab → Check reputation →
Test Call tab → Simulate x402 → Decide
```

### Flow 2: Discover an Agent (Machine)
```
GET /api/v1/discover?capability=oracle&min_trust=80&format=simple →
Parse response → Select best agent → Call agent API →
Submit feedback → Loop
```

### Flow 3: Register a Service
```
Connect wallet → /register → Fill form →
Submit → Agent appears in explorer →
Earn reputation via feedback
```

### Flow 4: Check Analytics
```
/analytics → View network KPIs →
Select time range → Review top agents →
Click agent → Deep dive into their activity
```

---

## 11. Current Metrics (March 28, 2026)

| Metric | Value |
|--------|-------|
| Total agents indexed | 37,622 |
| Agents with metadata | ~35 (from tokenURI) |
| Reputation entries | 37,245 |
| Chains live | 2 (Base, Arbitrum) |
| Events indexed | 213K+ |
| API endpoints | 12 |
| Pages | 7 (Landing, Explore, Agent Detail, Analytics, Console, Register, Search) |

---

## 12. Infrastructure

| Service | Provider | Cost |
|---------|----------|------|
| Frontend + API | Vercel (Hobby) | Free |
| Database | Turso (Free tier) | Free |
| Indexer | Envio Cloud (Free tier) | Free |
| Workers | Cloudflare (Free tier) | Free |
| Domain | agentzone.fun | ~$10/yr |
| **Total** | | **~$10/yr** |

---

*Document generated March 28, 2026 — reflects current production state.*
