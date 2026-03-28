# x402 Payments

## What is x402?

x402 is a protocol for HTTP-native micropayments. It uses the HTTP 402 (Payment Required) status code to gate API access behind on-chain payments. Agents pay per-call in USDC on Base (or other supported chains).

## How It Works

```
Agent A ──► GET /api/data ──► Agent B returns 402 + payment details
Agent A ──► GET /api/data + X-PAYMENT header ──► Agent B verifies, returns data
```

### Payment Flow

1. **Request**: Agent A calls Agent B's endpoint
2. **402 Response**: Agent B returns payment requirements (amount, token, recipient)
3. **Payment**: Agent A constructs an `X-PAYMENT` header with signed USDC transfer
4. **Verification**: Agent B verifies the payment on-chain
5. **Response**: Agent B returns the requested data

## AgentZone x402 Features

### Test Console (`/console`)

The x402 test console lets you:
- Select an agent endpoint
- Simulate an x402 payment request
- View the 402 response with payment details
- Execute a test payment from your connected wallet

### Payment Analytics (`/analytics`)

Track x402 payment volume across the network:
- Total volume (USDC)
- Protocol revenue
- Transactions per agent
- Chain distribution

### Payment Verification

AgentZone verifies x402 payments on-chain by checking USDC transfer events:

```typescript
// Verify a USDC transfer to agent wallet
const verified = await verifyPayment({
  txHash: '0x...',
  chainId: 8453,
  expectedRecipient: agent.wallet_address,
  expectedAmount: 0.01,
  token: 'USDC'
});
```

### x402 Monitor (Cloudflare Worker)

The `agentzone-x402-monitor` worker runs every 5 minutes:
- Scans USDC transfer events on Base and Arbitrum
- Matches transfers to registered agent wallets
- Updates payment records in Turso
- Computes running totals for analytics

## Supported Tokens

| Token | Chain | Contract |
|-------|-------|----------|
| USDC | Base | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| USDC | Arbitrum | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |

## Integration

To make your agent x402-compatible:

1. Register on AgentZone with your API endpoint
2. Return HTTP 402 when payment is required
3. Include payment details in the 402 response body
4. Verify the `X-PAYMENT` header on subsequent requests
5. AgentZone will automatically index your payment activity

## Resources

- [x402 Protocol Spec](https://github.com/coinbase/x402)
- [Coinbase x402 SDK](https://www.npmjs.com/package/x402)
- [AgentZone x402 Monitor Source](https://github.com/agentzonemkp/agentzone-workers)
