# Getting Started

## Prerequisites

- Node.js 18+
- npm or pnpm
- A Turso account (free tier works)
- A WalletConnect project ID (free at cloud.walletconnect.com)

## Quick Setup

```bash
# Clone
git clone https://github.com/agentzonemkp/agentzone.git
cd agentzone

# Install
npm install

# Configure
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL=libsql://your-db.turso.io
DATABASE_AUTH_TOKEN=your-turso-token
ENVIO_GRAPHQL_URL=https://indexer.dev.hyperindex.xyz/e24fbc4/v1/graphql
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-wc-project-id
```

> **Note**: The Envio GraphQL URL above is the public AgentZone indexer. You can use it directly for development.

```bash
# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
agentzone/
├── src/
│   ├── app/                 # Next.js 15 app router pages
│   │   ├── explore/         # Agent explorer
│   │   ├── agent/[id]/      # Agent detail (5 tabs)
│   │   ├── analytics/       # Network analytics
│   │   ├── console/         # x402 test console
│   │   ├── register/        # Agent registration
│   │   └── api/v1/          # REST API routes
│   ├── lib/                 # Shared libraries
│   │   ├── graphql-client.ts    # Envio client
│   │   ├── metadata-resolver.ts # tokenURI resolver
│   │   └── chain-verify.ts     # On-chain verification
│   └── middleware.ts        # Auth + rate limiting
├── public/
│   └── landing.html         # Static landing page
├── docs/                    # Documentation
└── package.json
```

## Deployment

### Vercel (recommended)

```bash
npm run build
npx vercel --prod
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Turso libsql URL |
| `DATABASE_AUTH_TOKEN` | Yes | Turso auth token |
| `ENVIO_GRAPHQL_URL` | No | Custom Envio endpoint (default: public indexer) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Yes | WalletConnect project ID |
| `IRON_SESSION_SECRET` | No | Session secret for SIWE auth |
