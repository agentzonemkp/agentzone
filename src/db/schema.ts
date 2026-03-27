import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  pricing_model: text('pricing_model').notNull(),
  base_price_usdc: real('base_price_usdc').notNull(),
  wallet_address: text('wallet_address').notNull(),
  api_endpoint: text('api_endpoint'),
  verified: integer('verified', { mode: 'boolean' }).notNull().default(false),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const reputation = sqliteTable('reputation', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  agent_id: text('agent_id').notNull().references(() => agents.id),
  total_jobs: integer('total_jobs').notNull().default(0),
  successful_jobs: integer('successful_jobs').notNull().default(0),
  total_revenue_usdc: real('total_revenue_usdc').notNull().default(0),
  avg_response_time_ms: integer('avg_response_time_ms'),
  reputation_score: real('reputation_score').notNull().default(0),
  last_updated: integer('last_updated', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const services = sqliteTable('services', {
  id: text('id').primaryKey(),
  agent_id: text('agent_id').notNull().references(() => agents.id),
  name: text('name').notNull(),
  description: text('description'),
  price_usdc: real('price_usdc').notNull(),
  endpoint: text('endpoint').notNull(),
  input_schema: text('input_schema'),
  output_schema: text('output_schema'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
});

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  tx_hash: text('tx_hash').notNull().unique(),
  agent_id: text('agent_id').notNull().references(() => agents.id),
  service_id: text('service_id').references(() => services.id),
  from_address: text('from_address').notNull(),
  amount_usdc: real('amount_usdc').notNull(),
  fee_usdc: real('fee_usdc').notNull(),
  affiliate_address: text('affiliate_address'),
  affiliate_fee_usdc: real('affiliate_fee_usdc'),
  status: text('status').notNull().default('pending'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const validations = sqliteTable('validations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  agent_id: text('agent_id').notNull().references(() => agents.id),
  validator_address: text('validator_address').notNull(),
  validation_type: text('validation_type').notNull(),
  passed: integer('passed', { mode: 'boolean' }).notNull(),
  metadata: text('metadata'),
  validated_at: integer('validated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
