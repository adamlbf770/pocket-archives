CREATE TABLE `alert` (
	`alert_id` text PRIMARY KEY NOT NULL,
	`alert_type` text NOT NULL,
	`severity` text NOT NULL,
	`sku` text,
	`identity_id` text,
	`created_at` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`summary` text NOT NULL,
	`evidence_json` text DEFAULT '{}' NOT NULL,
	`acknowledged_at` text,
	`resolved_at` text,
	FOREIGN KEY (`identity_id`) REFERENCES `normalized_identity`(`identity_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_alert_open_severity` ON `alert` (`status`,`severity`);--> statement-breakpoint
CREATE TABLE `audit_event` (
	`audit_id` text PRIMARY KEY NOT NULL,
	`occurred_at` text NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`before_hash` text,
	`after_hash` text,
	`approval_reference` text,
	`rollback_reference` text
);
--> statement-breakpoint
CREATE INDEX `idx_audit_event_entity_time` ON `audit_event` (`entity_type`,`entity_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `inventory_identity_map` (
	`sku` text PRIMARY KEY NOT NULL,
	`identity_id` text NOT NULL,
	`match_method` text NOT NULL,
	`match_score` real NOT NULL,
	`review_status` text DEFAULT 'pending' NOT NULL,
	`evidence_json` text DEFAULT '{}' NOT NULL,
	`reviewed_by` text,
	`reviewed_at` text,
	FOREIGN KEY (`identity_id`) REFERENCES `normalized_identity`(`identity_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_inventory_identity_review` ON `inventory_identity_map` (`review_status`);--> statement-breakpoint
CREATE TABLE `market_observation` (
	`observation_id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`observed_at` text NOT NULL,
	`external_item_id` text,
	`external_url` text,
	`identity_id` text,
	`sku` text,
	`observation_type` text NOT NULL,
	`price` real,
	`shipping` real,
	`tax_estimate` real,
	`currency` text DEFAULT 'USD' NOT NULL,
	`quantity` integer,
	`listing_format` text,
	`sold_at` text,
	`watchers` integer,
	`views` integer,
	`population` integer,
	`population_higher` integer,
	`raw_payload_hash` text,
	`quality_flags_json` text DEFAULT '[]' NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `source_registry`(`source_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`identity_id`) REFERENCES `normalized_identity`(`identity_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_market_observation_identity_time` ON `market_observation` (`identity_id`,`observed_at`);--> statement-breakpoint
CREATE INDEX `idx_market_observation_sku_time` ON `market_observation` (`sku`,`observed_at`);--> statement-breakpoint
CREATE INDEX `idx_market_observation_source_type` ON `market_observation` (`source_id`,`observation_type`);--> statement-breakpoint
CREATE TABLE `normalized_identity` (
	`identity_id` text PRIMARY KEY NOT NULL,
	`canonical_identity_key` text NOT NULL,
	`game` text NOT NULL,
	`name` text NOT NULL,
	`set_name` text,
	`set_code` text,
	`card_number` text,
	`year` integer,
	`language` text,
	`edition` text,
	`finish` text,
	`rarity` text,
	`variant` text,
	`grader` text,
	`grade` text,
	`certification_number` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uidx_normalized_identity_key` ON `normalized_identity` (`canonical_identity_key`);--> statement-breakpoint
CREATE INDEX `idx_normalized_identity_lookup` ON `normalized_identity` (`game`,`name`,`card_number`);--> statement-breakpoint
CREATE TABLE `pricing_recommendation` (
	`recommendation_id` text PRIMARY KEY NOT NULL,
	`sku` text NOT NULL,
	`valuation_id` text NOT NULL,
	`current_price` real,
	`recommended_price` real,
	`minimum_price` real,
	`maximum_price` real,
	`expected_net` real,
	`expected_roi` real,
	`recommended_action` text NOT NULL,
	`reason_codes_json` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL,
	`status` text DEFAULT 'proposed' NOT NULL,
	`approved_by` text,
	`approved_at` text,
	`applied_at` text,
	FOREIGN KEY (`valuation_id`) REFERENCES `valuation_snapshot`(`valuation_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_pricing_recommendation_status` ON `pricing_recommendation` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `sold_comparable` (
	`comparable_id` text PRIMARY KEY NOT NULL,
	`identity_id` text NOT NULL,
	`source_id` text NOT NULL,
	`sold_at` text NOT NULL,
	`price` real NOT NULL,
	`shipping` real DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`same_grader` integer DEFAULT false NOT NULL,
	`same_grade` integer DEFAULT false NOT NULL,
	`same_language` integer DEFAULT false NOT NULL,
	`same_variant` integer DEFAULT false NOT NULL,
	`included_in_valuation` integer DEFAULT false NOT NULL,
	`exclusion_reason` text,
	`outlier_score` real,
	FOREIGN KEY (`identity_id`) REFERENCES `normalized_identity`(`identity_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `source_registry`(`source_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_sold_comparable_identity_date` ON `sold_comparable` (`identity_id`,`sold_at`);--> statement-breakpoint
CREATE TABLE `source_registry` (
	`source_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`source_type` text NOT NULL,
	`access_mode` text NOT NULL,
	`integration_type` text NOT NULL,
	`confidence_grade` text NOT NULL,
	`connection_status` text NOT NULL,
	`official_api` integer DEFAULT false NOT NULL,
	`auth_type` text,
	`pricing_notes` text,
	`rate_limit_notes` text,
	`capabilities_json` text DEFAULT '{}' NOT NULL,
	`restrictions` text,
	`refresh_target_minutes` integer,
	`last_success_at` text,
	`last_attempt_at` text,
	`last_error` text,
	`terms_url` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_source_registry_status` ON `source_registry` (`connection_status`);--> statement-breakpoint
CREATE TABLE `sync_run` (
	`run_id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`job_type` text NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`status` text NOT NULL,
	`records_seen` integer DEFAULT 0 NOT NULL,
	`records_written` integer DEFAULT 0 NOT NULL,
	`records_rejected` integer DEFAULT 0 NOT NULL,
	`cursor` text,
	`error_summary` text,
	`code_version` text,
	FOREIGN KEY (`source_id`) REFERENCES `source_registry`(`source_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_sync_run_source_started` ON `sync_run` (`source_id`,`started_at`);--> statement-breakpoint
CREATE TABLE `valuation_snapshot` (
	`valuation_id` text PRIMARY KEY NOT NULL,
	`identity_id` text NOT NULL,
	`sku` text,
	`valued_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`market_value_low` real,
	`market_value_mid` real,
	`market_value_high` real,
	`comp_count` integer DEFAULT 0 NOT NULL,
	`lookback_days` integer,
	`liquidity_grade` text DEFAULT 'D' NOT NULL,
	`confidence_grade` text NOT NULL,
	`method_version` text NOT NULL,
	`source_mix_json` text DEFAULT '[]' NOT NULL,
	`assumptions_json` text DEFAULT '[]' NOT NULL,
	`review_required` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`identity_id`) REFERENCES `normalized_identity`(`identity_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_valuation_snapshot_sku_time` ON `valuation_snapshot` (`sku`,`valued_at`);