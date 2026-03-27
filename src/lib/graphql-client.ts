import { GraphQLClient } from 'graphql-request';

const endpoint = process.env.GRAPHQL_ENDPOINT || 'https://indexer.dev.hyperindex.xyz/826cb72/v1/graphql';

export const graphqlClient = new GraphQLClient(endpoint, {
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  pricing_model: string;
  base_price_usdc: number;
  wallet_address: string;
  api_endpoint: string;
  verified: boolean;
  created_at: string;
  chain_id?: number;
  nft_token_id?: string;
  reputation?: Reputation;
  services: Service[];
  validations: Validation[];
}

export interface Reputation {
  id: string;
  agent_id: string;
  total_jobs: number;
  successful_jobs: number;
  total_revenue_usdc: number;
  reputation_score: number;
  avg_response_time_ms: number;
  last_updated: string;
}

export interface Service {
  id: string;
  agent_id: string;
  name: string;
  description: string;
  price_usdc: number;
  active: boolean;
  endpoint?: string;
  input_schema?: string;
  output_schema?: string;
}

export interface Validation {
  id: string;
  agent_id: string;
  validator_address: string;
  passed: boolean;
  validated_at: string;
  validation_type?: string;
  metadata?: string;
}

export const GET_AGENTS_QUERY = `
  query GetAgents($limit: Int, $offset: Int) {
    Agent(limit: $limit, offset: $offset, order_by: {created_at: desc}) {
      id
      name
      description
      category
      pricing_model
      base_price_usdc
      wallet_address
      api_endpoint
      verified
      created_at
      chain_id
      nft_token_id
      reputation {
        total_jobs
        successful_jobs
        total_revenue_usdc
        reputation_score
        avg_response_time_ms
        last_updated
      }
      services {
        id
        name
        description
        price_usdc
        active
      }
      validations {
        id
        validator_address
        passed
        validated_at
      }
    }
  }
`;

export const GET_AGENT_BY_ID_QUERY = `
  query GetAgentById($id: String!) {
    Agent(where: {id: {_eq: $id}}) {
      id
      name
      description
      category
      pricing_model
      base_price_usdc
      wallet_address
      api_endpoint
      verified
      created_at
      chain_id
      nft_token_id
      reputation {
        total_jobs
        successful_jobs
        total_revenue_usdc
        reputation_score
        avg_response_time_ms
        last_updated
      }
      services {
        id
        name
        description
        price_usdc
        active
      }
      validations {
        id
        validator_address
        passed
        validated_at
      }
    }
  }
`;

export const SEARCH_AGENTS_QUERY = `
  query SearchAgents($searchTerm: String!) {
    Agent(
      where: {
        _or: [
          {name: {_ilike: $searchTerm}},
          {description: {_ilike: $searchTerm}},
          {category: {_ilike: $searchTerm}}
        ]
      }
      order_by: {created_at: desc}
    ) {
      id
      name
      description
      category
      pricing_model
      base_price_usdc
      wallet_address
      verified
      created_at
      reputation {
        total_jobs
        successful_jobs
        reputation_score
      }
    }
  }
`;
