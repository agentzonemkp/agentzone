import { GraphQLClient } from 'graphql-request';

const endpoint = process.env.GRAPHQL_ENDPOINT || 'https://indexer.dev.hyperindex.xyz/826cb72/v1/graphql';

export const graphqlClient = new GraphQLClient(endpoint, {
  headers: {},
});

export interface Agent {
  wallet_address: string;
  
  // ERC-8004 Identity
  has_erc8004_identity: boolean;
  erc8004_token_id?: string;
  erc8004_contract?: string;
  erc8004_chain_id?: number;
  name?: string;
  description?: string;
  capabilities?: string[];
  endpoint?: string;
  metadata_uri?: string;
  verified_at?: string;
  
  // x402 Activity
  total_revenue_usdc: string;
  transaction_count: number;
  unique_customers: number;
  success_count: number;
  failed_count: number;
  revenue_30d: string;
  tx_count_30d: number;
  customers_30d: number;
  
  // Timing
  first_seen_at: string;
  last_active_at: string;
  
  // Trust & Ranking
  trust_score: number;
  success_rate: number;
  
  updated_at: string;
}

export interface Payment {
  id: string;
  tx_hash: string;
  chain_id: number;
  block_number: string;
  timestamp: string;
  agent: {
    wallet_address: string;
    name?: string;
  };
  customer_address: string;
  amount_usdc: string;
  service_id?: string;
  payment_id?: string;
  metadata?: string;
  status: 'COMPLETED' | 'FAILED' | 'PENDING';
}

export const queries = {
  // Get all agents (paginated, sorted by trust score)
  getAgents: `
    query GetAgents($limit: Int, $offset: Int, $orderBy: String) {
      Agent(limit: $limit, offset: $offset, order_by: {trust_score: desc}) {
        wallet_address
        has_erc8004_identity
        name
        description
        capabilities
        endpoint
        total_revenue_usdc
        transaction_count
        revenue_30d
        tx_count_30d
        trust_score
        success_rate
        last_active_at
      }
    }
  `,
  
  // Get agent by wallet address
  getAgent: `
    query GetAgent($wallet: String!) {
      Agent(where: {wallet_address: {_eq: $wallet}}) {
        wallet_address
        has_erc8004_identity
        erc8004_token_id
        erc8004_contract
        erc8004_chain_id
        name
        description
        capabilities
        endpoint
        metadata_uri
        verified_at
        total_revenue_usdc
        transaction_count
        unique_customers
        success_count
        failed_count
        revenue_30d
        tx_count_30d
        customers_30d
        first_seen_at
        last_active_at
        trust_score
        success_rate
        updated_at
      }
    }
  `,
  
  // Get payments for an agent
  getAgentPayments: `
    query GetAgentPayments($wallet: String!, $limit: Int) {
      Payment(
        where: {agent: {wallet_address: {_eq: $wallet}}}
        limit: $limit
        order_by: {timestamp: desc}
      ) {
        id
        tx_hash
        chain_id
        block_number
        timestamp
        customer_address
        amount_usdc
        service_id
        payment_id
        status
      }
    }
  `,
  
  // Search agents
  searchAgents: `
    query SearchAgents($search: String!, $limit: Int) {
      Agent(
        where: {
          _or: [
            {name: {_ilike: $search}}
            {description: {_ilike: $search}}
            {wallet_address: {_ilike: $search}}
          ]
        }
        limit: $limit
        order_by: {trust_score: desc}
      ) {
        wallet_address
        name
        description
        trust_score
        revenue_30d
        success_rate
      }
    }
  `,
  
  // Get top agents by revenue
  getTopAgentsByRevenue: `
    query GetTopAgentsByRevenue($limit: Int) {
      Agent(
        limit: $limit
        order_by: {revenue_30d: desc}
        where: {revenue_30d: {_gt: "0"}}
      ) {
        wallet_address
        name
        revenue_30d
        transaction_count
        trust_score
      }
    }
  `,
  
  // Get verified agents only
  getVerifiedAgents: `
    query GetVerifiedAgents($limit: Int, $offset: Int) {
      Agent(
        where: {has_erc8004_identity: {_eq: true}}
        limit: $limit
        offset: $offset
        order_by: {trust_score: desc}
      ) {
        wallet_address
        name
        description
        trust_score
        revenue_30d
        transaction_count
      }
    }
  `,
};
