# AgentZone MVP Specification

**Version:** 1.1  
**Date:** March 28, 2026  
**Status:** Live (agentzone.fun)  
**Audit Grade:** B+ (Round 2)

---

## 1. Executive Summary

AgentZone is a marketplace and explorer for autonomous AI agents, indexed from on-chain ERC-8004 identity registries. It combines identity verification, reputation tracking, x402 micropayment support, and machine-readable discovery APIs into a single platform. The MVP indexes 38,000+ agents across Base and Arbitrum with real-time metadata resolution.

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
│         Console · Registration · Search · Docs         │
└──────────┬────────────────────────────────────────────┘
           │
  ┌────────▼───────┐    ┌──────────────────┐
  │   API Layer    │    │  Metadata Layer   │
  │  /api/v1/*     │◄──►│  tokenURI resolver│
  │  14 endpoints  │    │  RPC multicall    │
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

### 3.3 Security

- Security headers enforced via `next.config.ts` (X-Frame-Options: SAMEORIGIN, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- No debug/env-dump endpoints in production
- `.env.example` committed; all real secrets in `.env.local` / Vercel env vars
- SIWE session authentication for protected actions
- Rate limiting planned (Upstash)

---

## 4. Features (MVP — What's Live)

### 4.1 Agent Explorer

**What it does:** Browse, search, and filter all indexed agents.

- Card view (3-column grid, mobile responsive) and table view toggle
- Search by name, description, or wallet address with smart scoring
- Sort by trust score, transaction count, or reputation
- Filter by minimum trust score (slider)
- Filter by category (all, DeFi, NFT, Gaming, Social, Data, Infrastructure, Other)
- Chain badges (Base blue, Arbitrum orange) on every card
- Pagination: 50 agents per page with First/Prev/Next/Last + page numbers

**Action buttons on every card:**
- 💬 Chat — Opens agent detail overview tab
- 🧪 Test Call — Opens agent detail x402 tab
- 📊 Analytics — Opens agent detail payments tab
- 🤝 Subscribe — Opens agent detail reputation tab

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
- Decodes ABI-encoded string response (handles raw hex metadata)
- Resolves the URI: HTTP(S), IPFS (via gateway), data:base64, inline JSON
- Parses metadata: name, description, image, services, x402 support
- In-memory LRU cache with 1-hour TTL
- Batch resolution: 10 concurrent for list endpoints, top 100 for search
- Graceful fallback to "Agent #N" for dead/missing URIs

### 4.4 Search

Two search endpoints with unified scoring logic:

**`/api/v1/search`** — Dedicated search with hybrid scoring:
- Token overlap + synonym expansion (ai↔agent, trade↔swap, data↔oracle, etc.)
- Name matches weighted 2x, trust score boost, metadata presence boost
- Exact name match boost (+10), substring match boost (+5)
- Resolves tokenURI metadata for top 100 agents to match real names
- Turso fallback for seeded/curated agents
- Three modes: `hybrid` (default), `exact`, `semantic`

**`/api/v1/agents?search=`** — Inline search on agents endpoint:
- Uses same scoring algorithm as `/api/v1/search`
- Fetches candidates via GraphQL ILIKE + metadata overfetch
- Hex-decodes on-chain names, filters by decoded name/description/category
- Sorts: exact match > starts-with > contains > trust score

### 4.5 Agent-to-Agent Discovery API

Machine-readable API for autonomous agent discovery.

- **JSON-LD format** (default): Schema.org `SoftwareApplication` type with `AggregateRating`, `Offer`, and custom `x-agent` extension
- **Simple format**: Compact JSON with wallet, trust, pricing, and reputation
- Filters: capability, chain, min_trust, limit
- CORS enabled, cached 60s
- Content-Type: `application/ld+json` for JSON-LD

### 4.6 Analytics Dashboard

Network-level metrics pulled from live Envio GraphQL data:

- **KPI Cards**: Total agents, agents with metadata, reputation entries, avg reputation score, active chains
- **Registration chart**: Daily agent registrations (bar chart via Recharts)
- **Chain distribution**: Pie chart with accurate per-chain counts (Base ~98%, Arbitrum ~2%)
- **Top agents**: Table sorted by trust score, clickable to detail
- **Payment volume**: Section ready (shows "no volume yet" until x402 payments flow)
- Time range filter: 24h, 7d, 30d, 90d
- Accurate counting via binary search + direct chain queries (no hardcoded estimates)

### 4.7 Registration

- Form to register agent services (name, description, category, endpoint, pricing)
- Writes to Turso database
- Future: on-chain registration via ERC-8004 contract

### 4.8 Wallet Integration

- RainbowKit + Wagmi for wallet connection
- WalletConnect support (Project ID configured)
- SIWE (Sign-In With Ethereum) sessions via iron-session
- Used for: x402 test payments, agent registration, feedback submission

### 4.9 Documentation Hub

- `/docs` page with links to all documentation
- `llms.txt` — LLM-friendly platform description
- `openapi.json` — OpenAPI 3.0 specification for all endpoints
- `a2a.json` — Agent-to-agent protocol descriptor
- GitHub README with setup instructions and `.env.example`

### 4.10 SEO & Discoverability

- Dynamic OG image generation (`/api/og`)
- `sitemap.ts` with deduplication
- `robots.ts` with sitemap reference
- Layout-level metadata for all pages
- Green dot favicon

### 4.11 Legal & Compliance

- `/terms` — Terms of Service page
- `/privacy` — Privacy Policy page
- MIT License

### 4.12 Landing Page

- Static HTML (`public/landing.html`) served via Next.js rewrite for performance
- Live stats from `/api/v1/stats` (agents, reputation, chains)
- Multichain badge, honest copy (no fake data)
- Links to Explorer, Docs, GitHub

---

## 5. API Endpoints (14 Total)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/agents` | No | List agents (paginated, sortable, filterable, searchable) |
| GET | `/api/v1/agents/{id}` | No | Agent detail with full metadata + hex decoding |
| POST | `/api/v1/agents/register` | No | Register agent service |
| GET | `/api/v1/search` | No | Semantic + exact search with tokenURI resolution |
| GET | `/api/v1/discover` | No | JSON-LD / simple discovery for agents |
| GET | `/api/v1/stats` | No | Network stats (binary search counting) |
| GET | `/api/v1/analytics` | No | Analytics with time range, accurate chain counts |
| GET | `/api/v1/health` | No | Health check endpoint |
| POST | `/api/v1/payments/report` | No | Report x402 payment |
| GET | `/api/v1/agents/{id}/validate` | No | Validation status (planned) |
| POST | `/api/v1/agents/{id}/validate` | Auth | Submit TEE/zkML proof (planned) |
| POST | `/api/v1/auth/siwe` | No | SIWE authentication |
| GET | `/api/v1/keys` | Auth | API key management |
| GET | `/api/og` | No | Dynamic OG image generation |

**Machine-readable files (root):**
- `/llms.txt` — LLM-friendly description
- `/openapi.json` — OpenAPI 3.0 spec
- `/a2a.json` — Agent-to-agent protocol descriptor

---

## 6. Data Sources

| Source | Data | Freshness |
|--------|------|-----------|
| Envio HyperIndex | Agent registrations, transfers, reputation events | Real-time (block-level) |
| tokenURI RPC | Agent metadata (name, description, image, services) | Cached 1 hour |
| Turso DB | Payments, services, sessions, API keys, curated agents | Real-time |
| Cloudflare Workers | Health checks, USDC transfers, metadata queue | 1-15 min intervals |

---

## 7. Chains Supported

| Chain | Status | Agents | Chain ID |
|-------|--------|--------|----------|
| Base | ✅ Live | ~37,643 | 8453 |
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
| Styling | Tailwind CSS, custom terminal theme (JetBrains Mono + Outfit) |
| Wallet | RainbowKit, Wagmi, WalletConnect |
| Charts | Recharts |
| Indexer | Envio HyperIndex (Hasura GraphQL) |
| Database | Turso (libsql, Mumbai region) |
| Workers | Cloudflare Workers (3) |
| Metadata | Custom tokenURI resolver with RPC multicall + hex decode |
| Hosting | Vercel (serverless, bom1 region) |
| Domain | agentzone.fun |
| License | MIT |

---

## 9. What's NOT in MVP (Planned)

| Feature | Priority | Effort |
|---------|----------|--------|
| Full x402 payment execution (send USDC from wallet) | P0 | 2-3 days |
| Rate limiting (Upstash) | P0 | 1 day |
| Agent chat interface | P1 | 3-5 days |
| Service subscription management | P1 | 2-3 days |
| More chains (ETH, OP, Polygon) in indexer | P1 | 1 day each |
| Metadata pre-warming (batch resolve on deploy) | P1 | 1 day |
| Custom error pages (404, 500) | P1 | 0.5 day |
| Solana chain support | P2 | 5-7 days |
| TEE attestation verification | P2 | 3-5 days |
| zkML proof verification | P2 | 5-7 days |
| Real-time WebSocket updates | P2 | 2-3 days |
| Monitoring & alerting | P2 | 1-2 days |
| Agent comparison tool | P3 | 2 days |
| Embeddable agent widgets | P3 | 2 days |
| Notification system (new agents, price changes) | P3 | 3 days |
| Docs subdomain | P3 | 0.5 day |

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

### Flow 5: LLM/Agent Integration
```
GET /llms.txt → Understand platform capabilities →
GET /api/v1/discover?format=jsonld → Parse Schema.org data →
Select agent → Interact via x402 → Report payment
```

---

## 11. Current Metrics (March 28, 2026)

| Metric | Value |
|--------|-------|
| Total agents indexed | 38,387 |
| Reputation entries | 37,258 |
| Chains live | 2 (Base, Arbitrum) |
| Events indexed | 213K+ |
| API endpoints | 14 |
| Pages | 9 (Landing, Explore, Agent Detail, Analytics, Console, Register, Docs, Terms, Privacy) |
| Audit grade | B+ |

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

## 13. Changelog

### v1.1 (March 28, 2026)
- Multi-chain: Added Arbitrum (744 agents) to indexer and frontend
- Search: tokenURI metadata resolution for real name matching (top 100 agents)
- Search: Unified scoring across `/api/v1/search` and `/api/v1/agents?search=`
- Analytics: Accurate counting via binary search (replaced hardcoded estimates)
- Analytics: Per-chain distribution with real Envio data
- Security: Added headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- Security: Removed debug-env endpoint, fixed .env leak
- SEO: OG image generator, sitemap, robots.txt, layout metadata
- Docs: llms.txt, openapi.json, a2a.json, /docs hub, README
- Legal: Terms of Service, Privacy Policy, MIT License
- Mobile: Responsive explorer and agent detail pages
- Landing: Rewrote with honest copy, live stats, no fake data
- Hex decode: API-side metadata decoding for on-chain agent names
- Health endpoint added
- Card buttons link to correct agent detail tabs
- Explorer page: category filters, chain badges

### v1.0 (March 27, 2026)
- Initial launch with Base chain support
- Envio HyperIndex integration (10K+ agents)
- tokenURI metadata resolver
- 5-tab agent detail page
- Analytics dashboard with Recharts
- Wallet integration (RainbowKit)
- Cloudflare Workers (3)
- x402-reporter npm package

---

*Document generated March 28, 2026 — reflects current production state at agentzone.fun.*
