import { createPublicClient, http } from 'viem';
import { base, arbitrum } from 'viem/chains';

const IDENTITY_REGISTRY_BASE = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';
const IDENTITY_REGISTRY_ARBITRUM = '0x8004A818BFB912233c491871b3d84c89A494BD9e';

const identityAbi = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const clients = {
  base: createPublicClient({ chain: base, transport: http() }),
  arbitrum: createPublicClient({ chain: arbitrum, transport: http() }),
};

export async function verifyAgentOwnership(
  walletAddress: string,
  agentId: string
): Promise<{ verified: boolean; chain?: string; tokenId?: string }> {
  const address = walletAddress as `0x${string}`;

  // Check Base
  try {
    const balance = await clients.base.readContract({
      address: IDENTITY_REGISTRY_BASE,
      abi: identityAbi,
      functionName: 'balanceOf',
      args: [address],
    });

    if (balance && balance > BigInt(0)) {
      // Get all tokens owned by this address
      for (let i = 0; i < Number(balance); i++) {
        const tokenId = await clients.base.readContract({
          address: IDENTITY_REGISTRY_BASE,
          abi: identityAbi,
          functionName: 'tokenOfOwnerByIndex',
          args: [address, BigInt(i)],
        });

        const tokenURI = await clients.base.readContract({
          address: IDENTITY_REGISTRY_BASE,
          abi: identityAbi,
          functionName: 'tokenURI',
          args: [tokenId],
        });

        // Parse tokenURI to check if it matches agentId
        // Assuming tokenURI contains agent metadata
        if (tokenURI.includes(agentId)) {
          return { verified: true, chain: 'base', tokenId: tokenId.toString() };
        }
      }
    }
  } catch (error) {
    console.error('Base verification error:', error);
  }

  // Check Arbitrum
  try {
    const balance = await clients.arbitrum.readContract({
      address: IDENTITY_REGISTRY_ARBITRUM,
      abi: identityAbi,
      functionName: 'balanceOf',
      args: [address],
    });

    if (balance && balance > BigInt(0)) {
      for (let i = 0; i < Number(balance); i++) {
        const tokenId = await clients.arbitrum.readContract({
          address: IDENTITY_REGISTRY_ARBITRUM,
          abi: identityAbi,
          functionName: 'tokenOfOwnerByIndex',
          args: [address, BigInt(i)],
        });

        const tokenURI = await clients.arbitrum.readContract({
          address: IDENTITY_REGISTRY_ARBITRUM,
          abi: identityAbi,
          functionName: 'tokenURI',
          args: [tokenId],
        });

        if (tokenURI.includes(agentId)) {
          return { verified: true, chain: 'arbitrum', tokenId: tokenId.toString() };
        }
      }
    }
  } catch (error) {
    console.error('Arbitrum verification error:', error);
  }

  return { verified: false };
}

export async function getAgentTokens(walletAddress: string): Promise<
  Array<{ chain: string; tokenId: string; tokenURI: string }>
> {
  const address = walletAddress as `0x${string}`;
  const tokens: Array<{ chain: string; tokenId: string; tokenURI: string }> = [];

  // Base
  try {
    const balance = await clients.base.readContract({
      address: IDENTITY_REGISTRY_BASE,
      abi: identityAbi,
      functionName: 'balanceOf',
      args: [address],
    });

    if (balance && balance > BigInt(0)) {
      for (let i = 0; i < Number(balance); i++) {
        const tokenId = await clients.base.readContract({
          address: IDENTITY_REGISTRY_BASE,
          abi: identityAbi,
          functionName: 'tokenOfOwnerByIndex',
          args: [address, BigInt(i)],
        });

        const tokenURI = await clients.base.readContract({
        address: IDENTITY_REGISTRY_BASE,
        abi: identityAbi,
        functionName: 'tokenURI',
        args: [tokenId],
      });

        tokens.push({ chain: 'base', tokenId: tokenId.toString(), tokenURI });
      }
    }
  } catch (error) {
    console.error('Base token fetch error:', error);
  }

  // Arbitrum
  try {
    const balance = await clients.arbitrum.readContract({
      address: IDENTITY_REGISTRY_ARBITRUM,
      abi: identityAbi,
      functionName: 'balanceOf',
      args: [address],
    });

    if (balance && balance > BigInt(0)) {
      for (let i = 0; i < Number(balance); i++) {
      const tokenId = await clients.arbitrum.readContract({
        address: IDENTITY_REGISTRY_ARBITRUM,
        abi: identityAbi,
        functionName: 'tokenOfOwnerByIndex',
        args: [address, BigInt(i)],
      });

      const tokenURI = await clients.arbitrum.readContract({
        address: IDENTITY_REGISTRY_ARBITRUM,
        abi: identityAbi,
        functionName: 'tokenURI',
        args: [tokenId],
      });

        tokens.push({ chain: 'arbitrum', tokenId: tokenId.toString(), tokenURI });
      }
    }
  } catch (error) {
    console.error('Arbitrum token fetch error:', error);
  }

  return tokens;
}
