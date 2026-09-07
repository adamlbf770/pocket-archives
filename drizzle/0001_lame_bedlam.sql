CREATE TABLE `inventory_live_state` (
	`sku` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`price` real,
	`listing_id` text,
	`listing_url` text,
	`quantity_available` integer DEFAULT 0 NOT NULL,
	`sold_at` text,
	`last_seen_active_at` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_inventory_live_state_status` ON `inventory_live_state` (`status`);--> statement-breakpoint
CREATE INDEX `idx_inventory_live_state_listing_id` ON `inventory_live_state` (`listing_id`);--> statement-breakpoint
CREATE TABLE `inventory_sync_state` (
	`source` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`active_count` integer DEFAULT 0 NOT NULL,
	`sold_count` integer DEFAULT 0 NOT NULL,
	`records_written` integer DEFAULT 0 NOT NULL,
	`error` text
);
