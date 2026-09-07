CREATE TABLE `card_market_cache` (
	`sku` text PRIMARY KEY NOT NULL,
	`payload_json` text NOT NULL,
	`fetched_at` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_card_market_cache_expires` ON `card_market_cache` (`expires_at`);