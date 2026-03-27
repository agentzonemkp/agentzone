CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`pricing_model` text NOT NULL,
	`base_price_usdc` real NOT NULL,
	`wallet_address` text NOT NULL,
	`api_endpoint` text,
	`verified` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`tx_hash` text NOT NULL,
	`agent_id` text NOT NULL,
	`service_id` text,
	`from_address` text NOT NULL,
	`amount_usdc` real NOT NULL,
	`fee_usdc` real NOT NULL,
	`affiliate_address` text,
	`affiliate_fee_usdc` real,
	`status` text DEFAULT 'pending' NOT NULL,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_tx_hash_unique` ON `payments` (`tx_hash`);--> statement-breakpoint
CREATE TABLE `reputation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agent_id` text NOT NULL,
	`total_jobs` integer DEFAULT 0 NOT NULL,
	`successful_jobs` integer DEFAULT 0 NOT NULL,
	`total_revenue_usdc` real DEFAULT 0 NOT NULL,
	`avg_response_time_ms` integer,
	`reputation_score` real DEFAULT 0 NOT NULL,
	`last_updated` integer NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price_usdc` real NOT NULL,
	`endpoint` text NOT NULL,
	`input_schema` text,
	`output_schema` text,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `validations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agent_id` text NOT NULL,
	`validator_address` text NOT NULL,
	`validation_type` text NOT NULL,
	`passed` integer NOT NULL,
	`metadata` text,
	`validated_at` integer NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
