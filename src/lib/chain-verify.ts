// On-chain transaction verification for x402 payments
// Uses Base RPC to verify USDC transfer transactions

const BASE_RPC = 'https://mainnet.base.org';
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'.toLowerCase();
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

interface VerificationResult {
  verified: boolean;
  from?: string;
  to?: string;
  amount_usdc?: number;
  block_number?: number;
  timestamp?: number;
  error?: string;
}

export async function verifyUSDCPayment(txHash: string): Promise<VerificationResult> {
  try {
    // Get transaction receipt
    const receiptRes = await fetch(BASE_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      }),
    });
    const receipt = await receiptRes.json();

    if (!receipt.result) {
      return { verified: false, error: 'Transaction not found' };
    }

    if (receipt.result.status !== '0x1') {
      return { verified: false, error: 'Transaction reverted' };
    }

    // Find USDC Transfer log
    const transferLog = receipt.result.logs.find((log: any) =>
      log.address.toLowerCase() === USDC_BASE &&
      log.topics[0] === TRANSFER_TOPIC &&
      log.topics.length >= 3
    );

    if (!transferLog) {
      return { verified: false, error: 'No USDC transfer in transaction' };
    }

    const from = '0x' + transferLog.topics[1].slice(26);
    const to = '0x' + transferLog.topics[2].slice(26);
    const rawAmount = BigInt(transferLog.data);
    const amount_usdc = Number(rawAmount) / 1e6; // USDC has 6 decimals
    const block_number = parseInt(receipt.result.blockNumber, 16);

    // Get block timestamp
    const blockRes = await fetch(BASE_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'eth_getBlockByNumber',
        params: [receipt.result.blockNumber, false],
      }),
    });
    const block = await blockRes.json();
    const timestamp = block.result ? parseInt(block.result.timestamp, 16) : 0;

    return {
      verified: true,
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      amount_usdc,
      block_number,
      timestamp,
    };
  } catch (error: any) {
    return { verified: false, error: error.message || 'Verification failed' };
  }
}

// Check if a wallet has received any USDC (quick check using balance)
export async function getUSDCBalance(walletAddress: string): Promise<number> {
  try {
    const balanceCall = {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{
        to: USDC_BASE,
        data: '0x70a08231000000000000000000000000' + walletAddress.slice(2).toLowerCase().padStart(40, '0'),
      }, 'latest'],
    };
    const res = await fetch(BASE_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(balanceCall),
    });
    const data = await res.json();
    if (data.result) {
      return Number(BigInt(data.result)) / 1e6;
    }
    return 0;
  } catch {
    return 0;
  }
}
