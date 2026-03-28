import { GraphQLClient } from 'graphql-request';

const endpoint = process.env.GRAPHQL_ENDPOINT || 'https://indexer.dev.hyperindex.xyz/e24fbc4/v1/graphql';

export const graphqlClient = new GraphQLClient(endpoint, {
  headers: {},
});

// Types matching actual Envio indexed schema
export interface Agent {
  id: string;
  wallet_address: string;
  chain_id: number;
  contract_address: string;
  token_id: string;
  name: string;
  description: string;
  category: string;
  has_erc8004_identity: boolean;
  verified: boolean;
  trust_score: number;
  success_rate: number;
  total_revenue_usdc: number;
  transaction_count: number;
  unique_customers: number;
  revenue_30d: number;
  tx_count_30d: number;
  base_price_usdc: number;
  pricing_model: string;
  api_endpoint: string;
  avg_response_time_ms: number;
  rank_revenue: number;
  rank_transactions: number;
  rank_trust: number;
  growth_rate: number;
  created_at: string;
  last_active_at: string;
  reputation: Reputation[];
  payments: Payment[];
}

export interface Reputation {
  id: string;
  agent_id: string;
  client_address: string;
  reputation_score: number;
  feedback_count: number;
  avg_response_time_ms: number;
  last_feedback_at: string;
}

export interface Payment {
  id: string;
  wallet_address: string;
  customer_address: string;
  amount_usdc: number;
  chain_id: number;
  tx_hash: string;
  service_name: string;
  status: string;
  response_time_ms: number;
  metadata_uri: string;
  timestamp: string;
}

export const queries = {
  // Get all agents sorted by trust score
  getAgents: `
    query GetAgents($limit: Int, $offset: Int) {
      Agent(limit: $limit, offset: $offset, order_by: {trust_score: desc}) {
        id
        wallet_address
        chain_id
        token_id
        name
        description
        category
        has_erc8004_identity
        verified
        trust_score
        success_rate
        total_revenue_usdc
        transaction_count
        unique_customers
        revenue_30d
        tx_count_30d
        base_price_usdc
        avg_response_time_ms
        rank_trust
        created_at
        last_active_at
        reputation {
          reputation_score
          feedback_count
          client_address
        }
      }
    }
  `,

  // Get single agent by ID
  getAgent: `
    query GetAgent($id: String!) {
      Agent(where: {id: {_eq: $id}}) {
        id
        wallet_address
        chain_id
        contract_address
        token_id
        name
        description
        category
        has_erc8004_identity
        verified
        trust_score
        success_rate
        total_revenue_usdc
        transaction_count
        unique_customers
        revenue_30d
        tx_count_30d
        base_price_usdc
        pricing_model
        api_endpoint
        avg_response_time_ms
        rank_revenue
        rank_transactions
        rank_trust
        growth_rate
        created_at
        last_active_at
        reputation {
          id
          reputation_score
          feedback_count
          client_address
          avg_response_time_ms
          last_feedback_at
        }
        payments {
          id
          tx_hash
          customer_address
          amount_usdc
          service_name
          status
          timestamp
        }
      }
    }
  `,

  // Search agents by name/wallet
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
        id
        wallet_address
        token_id
        name
        description
        category
        trust_score
        transaction_count
        reputation {
          reputation_score
        }
      }
    }
  `,

  // Get agents with reputation data
  getTopAgents: `
    query GetTopAgents($limit: Int) {
      Agent(
        limit: $limit
        order_by: {trust_score: desc}
        where: {reputation: {}}
      ) {
        id
        wallet_address
        token_id
        name
        category
        trust_score
        total_revenue_usdc
        transaction_count
        reputation {
          reputation_score
          feedback_count
        }
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
        id
        wallet_address
        token_id
        name
        description
        category
        trust_score
        transaction_count
        reputation {
          reputation_score
        }
      }
    }
  `,

  // Get stats for landing page
  getStats: `
    query GetStats {
      allAgents: Agent(limit: 100000) { id }
      withMetadata: Agent(where: {description: {_neq: ""}}, limit: 100000) { id }
      allReputation: Reputation(limit: 100000) { id }
    }
  `,
};
