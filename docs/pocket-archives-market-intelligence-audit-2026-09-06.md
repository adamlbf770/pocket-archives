# Pocket Archives market-intelligence extension audit

**Audit date:** September 6, 2026
**Scope:** Existing repository, local inventory, eBay integration, hosted inventory experience, deal finder, source feasibility, and a staged path to pricing, sourcing, portfolio, and operational intelligence.
**Change policy for this audit:** Read-only. No inventory, listing, order, shipping, pricing, or hosted-site behavior was changed.

## Executive conclusion

Pocket Archives already has a real operating system. It should be extended, not replaced.

The strongest existing assets are the PA SKU system, exact front/back scans, scanner-session provenance, physical box assignments, a protected searchable inventory, eBay listing/order snapshots, and a functioning but deliberately conservative deal-finder prototype. The system's biggest weakness is not the user interface. It is that the canonical inventory is spread across mutable JSON/CSV files and generated TypeScript snapshots, with no transaction log, migration discipline, normalized market-history store, or reliable off-machine backup.

The safest architecture is therefore:

1. Keep today's inventory files and PA SKUs canonical.
2. Add a separate, derived market-intelligence database keyed back to `sku`.
3. Make all market ingestion and recommendations read-only in Phase 1.
4. Add explicit source attribution, confidence, freshness, and human-review gates.
5. Do not permit automated production repricing, publishing, deletion, purchasing, or offer acceptance.
6. Resolve the current eBay mutation-guard contradiction before any new production integration work.

The first implementation should be an additive intelligence foundation, not a database migration and not a new inventory app.

## 1. Existing architecture

### Audit coverage summary

| Requested area | Existing state |
|---|---|
| Framework/runtime | Vinext/Next-compatible React on Cloudflare Sites; Node 22+ |
| Database technology | No active database; canonical JSON/CSV plus generated TypeScript |
| Existing schema | Empty Drizzle schema; file shapes are implicit schemas |
| Inventory models | Storage assignments, scanner sessions, batch manifests, previews, exclusions |
| SKU system | Unique PA SKUs plus supported lot SKUs |
| Physical locations | 41 boxes/locations in the storage index |
| Acquisition/cost basis | Some catalog fields and notes; not systematic or sufficiently covered for P&L |
| eBay integration | Production OAuth, inventory/offers/images/orders/reconciliation scripts |
| Listing records | Active listing snapshot, draft and offer ledgers, published-offer data |
| Sold-order records | Sanitized order snapshot and completed-sale reconciliation |
| Shipping/fulfillment | eBay fulfillment state, listing shipping rules, label ledger, manual physical-status overrides |
| Authentication | Sign in with ChatGPT plus owner-email restriction for hosted inventory |
| API routes | No application-owned `app/**/route.ts` API routes found; external APIs are called by scripts/server code |
| Background jobs | Build-time syncs and runnable scripts; no active Pocket Archives deal-scanner schedule found |
| Pricing logic | Core floors/shipping thresholds plus numerous batch-specific pricing/audit scripts |
| Marketplace synchronization | eBay snapshots and reconciliation; no generic cross-channel sync layer |
| Existing dashboards | Searchable inventory and local-only acquisitions/CGC/slab-deal research pages |
| Deployment | Cloudflare Sites project; no D1 or R2 binding |
| Secrets/environment | eBay secrets in macOS Keychain; owner email via environment; no `.env.example` or central registry found |
| Backup/migrations | Git and a few one-off location migrations; no comprehensive backup/restore program |

### Application and hosting

- The application is a Vinext/Next-compatible React application running on the Cloudflare Sites stack.
- Runtime requirements are Node 22.13 or newer, React 19.2.6, Next 16.2.6, Vinext 0.0.50, Vite 8, and Wrangler 4.
- Hosting project ID is present in `.openai/hosting.json`.
- No Cloudflare D1 or R2 resource is currently attached (`d1: null`, `r2: null`).
- Drizzle is installed and `drizzle.config.ts` exists, but `db/schema.ts` is intentionally empty. There is no active relational database or meaningful migration history.
- Builds regenerate research and inventory snapshots before compiling the site.

### Canonical inventory and provenance

The current canonical inventory is file-backed:

- `inventory/Storage Locations.json` is the master SKU-to-box assignment index.
- `inventory/Scanner Intake Sessions.json` records scanner prefixes, capture counts, canonical pairs, exclusions, SKU ranges, and source batches.
- Individual batch folders contain CSV manifests, scan mappings, README notes, and exact front/back images.
- `inventory/Counterfeit Exclusions.json` provides a durable exclusion list.
- The PA SKU is the primary operational identifier. Lot SKUs are also supported.

Snapshot at audit time:

| Measure | Count |
|---|---:|
| Inventory assignments | 11,359 |
| Unique assigned SKUs | 11,359 |
| Physical boxes/locations | 41 |
| Scanner intake sessions | 82 |
| Batch manifest files | 110 |
| Scan-mapping files | 24 |
| Public inventory preview images | 13,373 |
| Counterfeit exclusions | 2 |

Every assignment has a box ID and there are no duplicate SKUs in the storage index. Status values, however, have proliferated into many spelling and formatting variants. They represent similar concepts but cannot yet be trusted as one normalized lifecycle enum.

### Inventory read model and UI

- `scripts/sync-inventory-catalog.mjs` joins storage assignments, batch manifests, eBay image attachments, active listings, and local previews.
- Its output is the generated `app/inventory/catalog.generated.ts` snapshot.
- `/inventory` searches name, SKU, number, and artist, and filters by set, game, box, and status.
- The production inventory route requires Sign in with ChatGPT and checks an owner email. Local development uses a development bypass.
- The inventory view uses eBay image URLs where available and local generated previews as a fallback.
- Because the catalog is generated at build/sync time, the hosted page can become stale until synchronization and deployment run again.

### eBay integration

The repository contains a substantial production eBay workflow:

- OAuth credentials are stored in macOS Keychain, not plaintext repository files.
- The integration can refresh tokens, inspect account configuration, build inventory items and offers, host images, publish/withdraw offers, update price/quantity, refresh active listings, import orders, and reconcile results.
- Account policy and location identifiers are stored separately in `data/ebay/account-config.json`.
- Listing rules include a $1.49 general floor, a $4.99 art/illustration-rare floor, $0.78 eBay Standard Envelope behavior, tracked-shipping thresholds, and standard package measurements.
- Active listings and orders are saved as sanitized local snapshots.
- Order exports omit buyer personal information.

Snapshot at audit time:

| Measure | Count/value |
|---|---:|
| Active eBay listings | 9,606 |
| Active listings with SKU | 9,594 |
| Active listings missing SKU | 12 |
| Duplicate nonblank SKUs in active snapshot | 0 |
| Active listing ask value | $16,475.94 |
| Image attachment records | 9,830 |
| Active SKU listings with attached-image record | 9,580 |
| Sanitized orders | 101 |
| Order line items | 131 |
| Order lines with SKU | 127 |
| Gross line-item amount in snapshot | $511.29 |
| Fulfilled orders | 100 |
| Not-started orders | 1 |

The ask-value figure is inventory exposure, not expected revenue or profit. The order gross is not P&L because it excludes or incompletely models tax, fees, shipping labels, refunds, packaging, and cost basis.

### Existing sourcing/deal finder

- `scripts/deals/watcher.mjs` searches the eBay Browse API for slab and raw-card opportunities.
- The math includes landed cost, estimated tax, marketplace fees, outbound shipping, packaging, net profit, ROI, maximum buy price, and liquidity.
- Its policy currently requires at least three exact realized sold comps before a BUY recommendation.
- It never purchases automatically.
- It can email findings through Apple Mail to `info@pocketarchives.com`.
- `/internal/slab-deals` renders a generated deal snapshot.
- `data/deals/sold-comps.json` currently has no connected realized-sale records, so strong recommendations are correctly suppressed.
- No active Pocket Archives scheduler was found for the watcher; the 15-minute interval is a configuration intention, not an operating schedule.

### Current routes

Public or hosted routes include `/`, `/about`, `/archive`, `/archive/pokemon`, `/collections/[slug]`, `/inventory`, `/objects/[slug]`, `/sales`, `/sales/[slug]`, and `/shop`.

Local research routes include `/internal`, `/internal/acquisitions`, `/internal/cgc`, and `/internal/slab-deals`. The internal layout intentionally returns 404 in production, so these are not remotely usable today.

### Versioning, backups, and recovery

- Git provides code history and some content history.
- The current branch is `main`; the latest audited commit is `128f813281c09f34220218596f6a0d2bb0555ff4` from September 5, 2026.
- At audit time the worktree had 13 modified tracked files and 13,135 untracked entries.
- Most operational inventory, images, eBay snapshots, and new scripts are therefore not reliably protected by the remote Git repository.
- No scheduled backup, checksum manifest, point-in-time snapshot, restore drill, or data migration framework was found.

This is the most serious durability risk in the current system.

## 2. Components to reuse

These should remain in place and become inputs to the extension:

1. **PA SKU namespace** as the primary join key for owned inventory.
2. **Storage Locations** as the canonical physical-location registry.
3. **Scanner Intake Sessions** as the provenance and batch-ingestion registry.
4. **Batch manifests and exact scans** as the auditable identity and condition evidence.
5. **Counterfeit exclusions and intake exclusions** as hard safety constraints.
6. **Inventory catalog generator** as the existing read-model compiler.
7. **Protected `/inventory` experience** as the canonical operator search tool.
8. **eBay Keychain/OAuth implementation** and sanitized local exports.
9. **eBay listing normalization**, condition mapping, package rules, SKU reconciliation, and image-hosting helpers.
10. **Deal math** for landed cost, ROI, fees, liquidity, and maximum offer.
11. **Current threshold configuration** as policy inputs, not hard-coded truth.
12. **Generated internal dashboards** as a useful prototype for future authenticated intelligence pages.

## 3. Gaps that block trustworthy intelligence

### Data-model gaps

- No normalized card identity table separates card, printing, language, finish, edition, grade, and certification.
- No durable identity-resolution record explains why a source item matched a Pocket Archives item.
- No append-only observation history exists for active asks, realized sales, population counts, watchers, views, or source prices.
- No valuation snapshot records methodology, comparable set, exclusions, confidence, or expiry.
- No normalized inventory lifecycle or event log exists.
- No cost-basis ledger allocates bulk purchases across cards.
- No complete order-economics record joins revenue, refunds, marketplace fees, promoted fees, label cost, packaging, and cost basis.
- No buyer/cohort model exists beyond sanitized order-level data.
- No source registry records legal/access constraints, refresh cadence, failures, and confidence.

### Operational gaps

- Generated inventory can lag local truth.
- Twelve active eBay listings lack SKUs; four historical order lines also lack SKUs.
- The storage index has many semantically overlapping status strings.
- Market research is distributed across one-off scripts and batch CSV files, which makes reproducibility and trend analysis difficult.
- Shipping state partly relies on manual overrides because buying/printing a label is not the same as physically shipping an order.
- The deal finder is not scheduled and has no sold-comps feed.
- Internal dashboards are disabled in production.
- No source-health dashboard or alerting exists.
- No documented disaster-recovery procedure exists.

### Immediate safety defect

`assertDraftOnlyMutation` and its error message claim the API wrapper blocks non-draft mutations. The current allowlist nevertheless permits publish, bulk publish, withdraw, bulk price updates, and delete operations. The dedicated test expects bulk publishing to be blocked and fails:

- `node --test tests/ebay-cli.test.mjs`
- Result at audit time: 6 passed, 1 failed.
- Failure: expected `/sell/inventory/v1/bulk_publish_offer` to be rejected, but it was allowed.

This does not prove a listing was changed accidentally. It proves the safety contract, implementation, and test suite disagree. New market-intelligence work should not proceed to production write features until the contract is made explicit and enforced.

## 4. Proposed additive schema

Phase 1 should attach a new D1/SQLite intelligence database without migrating canonical inventory. The inventory files remain the source of truth; the database stores derived observations and recommendations keyed to `sku`.

### Source and ingestion

#### `source_registry`

- `source_id`
- `name`
- `source_type`
- `access_mode` (`api`, `export`, `manual`, `partner`, `unavailable`)
- `base_url`
- `auth_type`
- `credential_reference`
- `terms_url`
- `commercial_use_status`
- `rate_limit_notes`
- `refresh_target_minutes`
- `last_success_at`
- `last_failure_at`
- `status`
- `confidence_grade`
- `notes`

#### `sync_run`

- `run_id`, `source_id`, `job_type`
- `started_at`, `completed_at`
- `status`, `records_seen`, `records_written`, `records_rejected`
- `cursor`, `error_summary`, `code_version`

#### `market_observation`

- `observation_id`, `source_id`, `observed_at`
- `external_item_id`, `external_url`
- `identity_id`, `sku` (nullable)
- `observation_type` (`active_ask`, `sold`, `guide`, `population`, `engagement`)
- `price`, `shipping`, `tax_estimate`, `currency`
- `quantity`, `listing_format`, `sold_at`
- `watchers`, `views`, `population`, `population_higher`
- `raw_payload_hash`, `quality_flags`

### Identity and comparables

#### `normalized_identity`

- `identity_id`
- `game`, `name`, `set_name`, `set_code`, `card_number`
- `year`, `language`, `edition`, `finish`, `rarity`, `variant`
- `grader`, `grade`, `certification_number`
- `canonical_identity_key`

#### `inventory_identity_map`

- `sku`, `identity_id`
- `match_method`, `match_score`
- `review_status`, `reviewed_by`, `reviewed_at`
- `evidence`

#### `sold_comparable`

- `comparable_id`, `identity_id`, `source_id`
- `sold_at`, `price`, `shipping`, `currency`
- `same_grader`, `same_grade`, `same_language`, `same_variant`
- `included_in_valuation`, `exclusion_reason`, `outlier_score`

### Valuation and recommendations

#### `valuation_snapshot`

- `valuation_id`, `identity_id`, `sku`, `valued_at`, `expires_at`
- `market_value_low`, `market_value_mid`, `market_value_high`
- `comp_count`, `lookback_days`, `liquidity_grade`
- `confidence_grade`, `method_version`
- `source_mix`, `assumptions`, `review_required`

#### `pricing_recommendation`

- `recommendation_id`, `sku`, `valuation_id`
- `current_price`, `recommended_price`, `minimum_price`, `maximum_price`
- `expected_net`, `expected_roi`, `recommended_action`
- `reason_codes`, `created_at`, `status`
- `approved_by`, `approved_at`, `applied_at`

#### `grading_scenario`

- `scenario_id`, `sku`, `valuation_id`
- `grader`, `target_grade`, `estimated_probability`
- `grading_fee`, `shipping_cost`, `insurance_cost`, `turnaround_days`
- `expected_value`, `expected_net`, `expected_roi`
- `recommendation`, `assumptions`

### Inventory, sales, and finance analytics

#### `inventory_snapshot`

- `snapshot_id`, `sku`, `captured_at`
- `canonical_status`, `box_id`
- `listing_id`, `listing_price`, `listing_start_at`
- `days_in_inventory`, `days_listed`

#### `inventory_event`

- `event_id`, `sku`, `event_type`, `occurred_at`
- `from_value`, `to_value`, `source`, `actor`, `correlation_id`

#### `acquisition_lot`

- `lot_id`, `source`, `purchase_date`, `total_cost`
- `tax`, `shipping`, `other_cost`, `item_count`, `notes`

#### `cost_allocation`

- `allocation_id`, `lot_id`, `sku`
- `method`, `allocated_cost`, `confidence`, `created_at`

#### `order_economics`

- `order_id`, `line_item_id`, `sku`
- `sold_at`, `gross_revenue`, `buyer_shipping`
- `refunds`, `marketplace_fees`, `promoted_fees`
- `label_cost`, `packaging_cost`, `allocated_cost_basis`
- `net_profit`, `margin_percent`, `fulfilled_at`

#### `buyer_cohort`

- `buyer_key` (platform-scoped pseudonymous identifier)
- `first_order_at`, `last_order_at`, `order_count`
- `gross_revenue`, `net_profit`, `preferred_games`, `repeat_buyer`

### Alerts and auditability

#### `alert`

- `alert_id`, `alert_type`, `severity`, `sku`, `identity_id`
- `created_at`, `status`, `summary`, `evidence`
- `acknowledged_at`, `resolved_at`

#### `audit_event`

- `audit_id`, `occurred_at`, `actor`, `action`
- `entity_type`, `entity_id`, `before_hash`, `after_hash`
- `approval_reference`, `rollback_reference`

All tables should be append-first. Corrections should supersede older records rather than erase history.

## 5. Proposed pages and components

The existing `/inventory` page remains the operational center. Add authenticated intelligence beside it:

### `/market`

- Portfolio market value, range, confidence, and freshness.
- Raw versus graded exposure.
- Value by game, set, language, box, and age.
- Explicit stale-data banner.

### `/pricing`

- Current price versus conservative market range.
- Highest-confidence underpriced and overpriced listings.
- Comparable drawer with exact-match dimensions and exclusions.
- Suggested price and expected net.
- Approval queue only; no automatic write in Phase 1.

### `/sourcing`

- Reuse the slab-deal economics and candidate table.
- Separate slab and raw-card policies.
- Show landed cost, max offer, expected net, ROI, liquidity, and source confidence.
- Manual approval remains mandatory.

### `/portfolio`

- Owned value, realized revenue, estimated profit, aging, sell-through, and turnover.
- Cost-basis coverage indicator so incomplete P&L is visibly labeled.
- Grading-candidate scenarios and sensitivity analysis.

### `/sales-intelligence`

- Revenue and net by period, game, set, language, price band, and acquisition lot.
- Repeat-buyer and attachment-rate views using platform-compliant pseudonymous IDs.
- Cancellation, refund, shipping, and time-to-fulfillment analysis.

### `/orders`

- Order and line-item state joined to SKU and current physical location.
- Paid, refunded, label-purchased, handed-to-carrier, and delivered shown as separate events.
- Exceptions for missing SKU, missing item, duplicate label, or inventory mismatch.

### `/shipping`

- Unshipped queue, batch-label workflow, package profile, label cost, carrier acceptance, and delivery state.
- Preserve the existing business rule that printing a label does not prove physical shipment.
- No label purchase or fulfillment write in Phase 1.

### `/source-health`

- Source connection state, authentication expiry, freshness, lag, last error, record counts, contractual access mode, and confidence grade.
- Manual-only sources shown as manual; never presented as live feeds.

### `/alerts`

- Pricing anomalies, missing SKUs, stale scans, duplicate identities, suspicious certs, stale sources, unsold aging, and fulfillment exceptions.

### Shared components

- `ConfidenceBadge`
- `FreshnessIndicator`
- `SourceAttribution`
- `IdentityMatchReview`
- `ComparableTable`
- `MarketRange`
- `RecommendationCard`
- `ApprovalGate`
- `DataCoveragePanel`
- `SyncRunLog`
- `RollbackPreview`

The hosted intelligence pages should use the existing Sign in with ChatGPT owner check. They should not be placed under the current production-disabled `/internal` layout if remote access is desired.

### Decision modules to add behind those pages

- **Weekly pricing analysis:** recommendations only. Under $2, flag only extreme movement; $2–$10, flag deviations of roughly 20–25%; $10–$50, roughly 10–15%; $50+, vintage, slabs, and ephemera require manual review.
- **Money Left on the Table:** rank active listings by credible gross uplift, quantity, confidence, liquidity, and source freshness.
- **Stale inventory:** bucket at 0–30, 31–60, 61–90, 91–180, 181–365, and 365+ days, then combine age with views, watchers, price position, and liquidity.
- **Restock engine:** use Pocket Archives' own sell-through, margin, ROI, and time-to-sale to calculate a maximum acquisition price.
- **Pattern discovery:** test game, character, set, artist, language, rarity, price band, and product-family hypotheses; label small samples as directional rather than statistically meaningful.
- **Bundle recommendations:** recommend only when inventory is stale/duplicated or a defensible theme, playset, artist, evolution line, or set grouping exists. Verify that constituent singles cannot double-sell.
- **Portfolio segmentation:** VOLUME, CORE, PREMIUM, HOLD, and ARCHIVE. ARCHIVE is not treated as liquidation inventory.
- **Pocket Archives Brief:** daily/weekly generated summary in which every sentence links to the rows and calculations supporting it.
- **Cross-channel connectors:** Pocket Archives remains the inventory center. eBay, TCGplayer, Mercari, Whatnot, PocketArchives.com, and local sales are channel adapters, never competing masters.

Allowed initial action labels are KEEP, RAISE PRICE, LOWER PRICE, SEND OFFER, RESTOCK, BUNDLE, LIVE SALE, CROSS-LIST, LIQUIDATE, HOLD, and MANUAL REVIEW. In Phase 1 all are informational labels, not executable marketplace actions.

## 6. Source registry and access audit

No source should be called “connected” until credentials, permitted access, a successful health check, and a persisted sync run all exist.

| Source | Best use | Official access reality | Proposed mode | Confidence |
|---|---|---|---|---|
| Pocket Archives inventory/manifests | Identity, condition, language, finish, box, scans | Local canonical data | Automated local read | A for owned-item facts |
| Pocket Archives eBay orders | Own revenue, fulfillment, SKU sales | Existing OAuth read scopes and sanitized export | Automated API snapshot | A for own transactions |
| eBay active listings/Browse | Current competition and discovery | Official Browse API; active purchasable items, not realized sold truth | Automated API | B for active asks |
| eBay Marketplace Insights | Realized sold history | Official API is Limited Release and requires access approval | Conditional/partner | A if approved, unavailable otherwise |
| eBay Analytics | Own traffic and performance | Official Sell Analytics API | Add read-only scope and adapter after review | A for own metrics |
| TCGplayer | Catalog and current pricing | Official API exists, but TCGplayer states it no longer grants new API access | Existing-key only; otherwise manual | B with authorized key, manual otherwise |
| PriceCharting | Current guide values and catalog IDs | Paid API/static token; current values only; historical sales/prices are not provided by API/CSV | Paid API if subscribed | B as a supporting guide, not sold truth |
| PSA | Cert verification, population, recent similar sales | Official public cert and Population Report pages; daily population data; no public integration contract identified in this audit | Manual/approved adapter only | A for exact cert facts, B for value support |
| CGC | Cert verification and population | Official verification and population tools; public pages warn population is not value | Manual/approved adapter only | A for cert facts, B for population |
| TAG | Cert/grade support | No documented public API located | Manual only until written access | C |
| Card Ladder | Vetted sales history, estimates, population | Paid consumer product; no public API located; Pro is $20/month or $200/year | Manual or licensed partnership | B as reviewed evidence |
| Collectr | Raw/graded prices, sold listings, population, portfolio | Consumer/Pro product and export features; no public API located | Manual/export with permission | B as reviewed evidence |
| TCGIndex | Potential market reference | No authoritative public integration documentation verified | Unavailable/manual pending verification | C |
| Whatnot | Own inventory/orders; marketplace sales channel | Official seller workflows support CSV and Shopify; no general public developer API verified | CSV/Shopify/manual export | A for own exported data; not a market-price feed |

### Per-source operational decisions

**Pocket Archives own data — A.** No external authentication or usage cost. It supports every game, language, variant, condition, and finish that has been correctly reviewed in the manifests. It is the freshest source for identity, scans, SKU, and location, and the highest-priority source for the business's own realized transactions. Its weaknesses are inconsistent statuses, incomplete cost basis, a build-derived web snapshot, and missing marketplace SKUs on a small number of records. Automation is permitted because it is first-party data; ingestion should still be read-only and hash-audited.

**eBay seller APIs — A for own account facts.** OAuth user authorization is already implemented and credentials are in Keychain. Own listings, orders, fulfillment, and account analytics can be automated under granted scopes and eBay's API limits. The source supports the languages and variants represented by listing aspects, but those values remain seller-entered and require validation. Freshness can be minutes when scheduled. Store rate-limit headers/usage from every run rather than hard-coding a quota that may differ by API and application.

**eBay Browse — B for active market evidence.** Application OAuth supports current active listings, prices, shipping, seller data, and offer availability. It does not by itself establish realized market value. It can cover raw and graded cards across games/languages, but title and aspect quality varies, so exact identity matching is mandatory. Use at a 15–60 minute cadence within the application's current rate allocation. Commercial automation must follow eBay API terms and attribution requirements.

**eBay Marketplace Insights — A if approved; unavailable otherwise.** This is the preferred eBay realized-sales source, but official documentation marks it Limited Release. Do not design Phase 1 as if access is guaranteed. Authentication and limits depend on approved application access. Until approval is confirmed with a successful call, the registry status must be `access_pending` and no BUY or high-confidence valuation may claim eBay sold-history coverage.

**TCGplayer — B with an already-authorized key; MANUAL ONLY otherwise.** The official REST API exposes catalog and pricing concepts, but TCGplayer states that it no longer grants new API access. Authentication uses API credentials for existing authorized developers. Coverage is strongest for recognized TCG products and standard market-price dimensions; unusual languages, promos, finishes, and graded cards require caution. Do not scrape around the restriction. If Pocket Archives has no existing credential, use permitted manual research or licensed alternatives.

**PriceCharting — B supporting guide.** The official API uses a paid token and its downloadable CSV is tied to a paid tier. It supplies current guide values/catalog data, including many raw and graded products, but the official documentation says API/CSV does not provide historical prices or individual sales. It should therefore support, never replace, realized comps. Language and variant coverage must be verified per product ID. Refresh daily unless the subscription permits and the business needs more frequent reads.

**PSA — A for an exact certification fact; B for market/population support.** Public cert verification reports label identity, grade, population, population higher, and in many cases similar-sales data. The Population Report says it updates daily. Verification does not eliminate counterfeit risk, and public access is not equivalent to permission for unattended bulk extraction. No public PSA integration contract was identified in this audit, so begin as manual verification or obtain written/partner access. PSA supports the languages/variants it has certified, but the exact label definition must be preserved.

**CGC — A for exact certification facts; B for population.** Official verification and population tools exist, and QR/cert lookup supports authenticity review. CGC explicitly warns that population is not a measure of value or rarity and rate-limits search activity. No public bulk API contract was verified. Use manually or through approved access; do not automate the consumer interface. Grade-label changes such as legacy 9.5 treatment must be normalized carefully.

**TAG — MANUAL ONLY.** TAG cert/grade information may be useful for an individual slab, but no official public API, pricing feed, bulk population interface, authentication scheme, price, or rate limit was verified during the audit. Treat TAG values conservatively and require stronger realized comps. Do not build automation until written access and terms are obtained.

**Card Ladder — MANUAL ONLY unless licensed.** The official product advertises 100M+ verified sales, population data, daily updates, and a $20/month or $200/year Pro plan. No public API was identified. It can be valuable human-reviewed evidence for graded cards and historical transactions, but a consumer subscription is not assumed to grant automated extraction or commercial redistribution. Record manually reviewed comps with URL, date, and reviewer.

**Collectr — MANUAL ONLY/export with permission.** The official product offers raw/graded prices, sold listings, population, multiple languages, 5+ years of Pro history, and collection export. No public API was identified. Use approved exports or manual review, retaining its source attribution and product/variant identity. Do not treat a portfolio estimate as a realized comp.

**TCGIndex — DO NOT USE until verified.** This audit did not locate authoritative public documentation establishing the API, authentication, pricing, limits, historical/active coverage, language/variant support, freshness, or commercial-use terms needed for an integration. It can be reconsidered after direct documentation or a vendor agreement is supplied.

**Whatnot — A for Pocket Archives exports; MANUAL ONLY as general market evidence.** Official seller tools support CSV import and a Shopify sales-channel integration; Whatnot states that Shopify is the source of truth for synced fields. SKU is included in weekly orders reports and can reconcile inventory. No general public market-data API was verified. Use own permitted exports for revenue/orders and manual marketplace evidence for comps. Do not use buyer data for off-platform marketing.

Official references reviewed:

- eBay Browse API: https://developer.ebay.com/api-docs/buy/api-browse.html
- eBay Buy application access: https://developer.ebay.com/develop/get-started/get-started-on-a-buying-application
- eBay Analytics API: https://developer.ebay.com/api-docs/sell/analytics/static/overview.html
- TCGplayer API access notice: https://docs.tcgplayer.com/docs/getting-started
- PriceCharting API/CSV documentation: https://www.pricecharting.com/api-documentation
- PSA Population Report: https://www.psacard.com/Pop
- PSA cert verification: https://www.psacard.com/cert
- CGC certification and population tools: https://www.cgccards.com/certlookup/ and https://www.cgccards.com/population-report/
- Card Ladder pricing/features: https://cardladder.com/pricing
- Collectr pricing product: https://getcollectr.com/prices
- Whatnot listing options: https://help.whatnot.com/hc/en-us/articles/9779149424269-Create-product-listings
- Whatnot Shopify source-of-truth behavior: https://help.whatnot.com/hc/en-us/articles/44650692889997-Shopify-x-Whatnot-Integration

### Source precedence by question

1. **What item do we own?** Pocket Archives scan + manifest + reviewed identity.
2. **Where is it?** Storage Locations.
3. **Is it listed/sold/fulfilled?** eBay own-account APIs plus explicit manual physical-shipment event.
4. **What are buyers asking?** eBay Browse and current marketplace data.
5. **What has actually sold?** Approved realized-sales feed, then licensed/manual verified sources.
6. **What is it worth?** Conservative combination of exact realized comps, liquidity, active supply, and supporting guides.
7. **What should we charge?** Valuation plus Pocket Archives floors, shipping/fee economics, age, and strategy, always as a recommendation first.

## 7. Proposed integrations, services, and jobs

### Read-only adapters

- `inventory-adapter`: imports canonical file snapshots and hashes every source file.
- `ebay-account-adapter`: active listings, orders, fulfillment, and eventually Analytics.
- `ebay-market-adapter`: current listings from Browse.
- `sold-comps-adapter`: approved realized-sales source only.
- `guide-adapter`: TCGplayer/PriceCharting or licensed substitutes.
- `grader-adapter`: cert verification and population, only where permitted.

### Core services

- Identity resolver with exact variant/language/finish/grade dimensions.
- Comparable selector with outlier rejection and exclusion reasons.
- Valuation engine with low/mid/high ranges and confidence.
- Pricing policy engine that imports current floors and shipping economics.
- Order economics engine.
- Aging and sell-through engine.
- Sourcing/deal engine reusing current deal math.
- Recommendation and approval service.
- Audit-log and rollback service.

### Jobs

- Every 15–60 minutes: active-listing and source-health refresh, subject to limits.
- Daily: inventory snapshot, listing age, stale-source checks, valuation candidates.
- Weekly: portfolio valuation, pricing review, sell-through, buyer cohort, sourcing report.
- On demand: exact-item research, cert verification, grading scenario, and approval export.

Every job must be idempotent, cursor-aware, rate-limit-aware, and safe to rerun.

## 8. Risks and controls

| Risk | Impact | Required control |
|---|---|---|
| Wrong card/variant/language/finish match | Bad prices and buyer disputes | Exact identity dimensions, match scores, human review below threshold |
| Active ask treated as sold market | Overvaluation | Separate observation types; realized-sales requirement for high confidence |
| Thin or manipulated comps | False deals | Minimum comp counts, outlier rejection, liquidity grades, source diversity |
| Stale generated inventory | Wrong operational state | Timestamp/freshness UI and automated sync verification |
| File corruption or accidental deletion | Loss of canonical inventory | Encrypted off-machine snapshots, checksums, restore drills |
| Conflicting status vocabulary | Incorrect availability | Canonical lifecycle enum plus mapping, without destroying source text |
| Publishing/deleting through mislabeled guard | Production listing damage | Phase 0 mutation-policy repair, least-privilege commands, explicit approvals |
| Secrets leaked into repo/output | Account compromise | Continue Keychain; add credential inventory and secret scanning |
| API access revoked or rate limited | Missing/stale intelligence | Source registry, exponential backoff, stale badges, fallback modes |
| Consumer site scraping violates terms | Account/legal risk | No scraping without written permission; manual or licensed access only |
| Incomplete cost basis | Misleading profit | Coverage percentage and confidence; never label gross revenue as profit |
| Concurrent file edits | Lost updates | Single-writer lock now; database transactions for intelligence later |
| Privacy leakage | Buyer harm/policy violation | Keep sanitized exports and pseudonymous buyer keys |
| Automatic repricing race | Margin loss | Recommendations only; approval and before/after diff; bounded rollback |

## 9. Implementation order

### Phase 0 — Stabilize and protect

1. Decide and encode the intended eBay mutation policy.
2. Repair the failing safety test and split read, draft, publish, reprice, withdraw, and delete capabilities into explicit commands.
3. Add a production write kill switch defaulting to off.
4. Back up canonical inventory, images, eBay snapshots, and manifests off-machine.
5. Create checksums and a documented restore test.
6. Commit or deliberately archive the current 13,135 untracked entries; do not leave the only copies in a dirty worktree.
7. Normalize lifecycle status through a non-destructive mapping layer.
8. Resolve or explicitly exempt the 12 active listings and 4 order lines without SKUs.

**Exit gate:** Backup restore succeeds, safety tests pass, and no production mutation can occur without a named command and explicit approval.

### Phase 1 — Read-only intelligence foundation

1. Attach D1 for derived intelligence only.
2. Add migrations for source, sync, identity, observation, comp, valuation, snapshot, recommendation, alert, and audit tables.
3. Import a hashed snapshot of canonical inventory without changing source files.
4. Add eBay active-listing/order read adapters.
5. Add source registry and source-health page.
6. Port existing deal output into normalized observations.
7. Add freshness, confidence, and coverage components.

**Exit gate:** The intelligence database can be deleted and rebuilt entirely from canonical files and approved external sources.

### Phase 2 — Pricing intelligence

1. Add identity review queue.
2. Connect a lawful realized-sales source.
3. Add comparable selection, valuation ranges, liquidity, and stale-data rules.
4. Build `/pricing` and `/market` recommendations.
5. Export proposed changes as a reviewable file; do not write to eBay.

**Exit gate:** Sample valuations are reproducible and approved by manual spot checks across languages, finishes, grades, and eras.

### Phase 3 — Sales, portfolio, and operations

1. Add cost-basis lots and allocations.
2. Import actual eBay fees, refunds, label costs, and fulfillment timestamps.
3. Build true P&L, aging, sell-through, buyer cohorts, and shipping analytics.
4. Preserve the distinction between label purchased, handed to carrier, and delivered.

**Exit gate:** Every profit number displays its cost-coverage percentage and can be reconciled to source transactions.

### Phase 4 — Sourcing and grading

1. Schedule the existing deal finder after a realized-sales feed is live.
2. Separate slab and raw policies.
3. Add grading expected-value scenarios.
4. Email only actionable, high-confidence alerts.
5. Keep purchases manual.

**Exit gate:** Backtests demonstrate minimum-profit/ROI rules and false-positive rates are acceptable.

### Phase 5 — Controlled write workflows, only if later approved

1. Add review queues with before/after diffs.
2. Require explicit per-batch approval.
3. Enforce floors, maximum percentage moves, source freshness, and confidence.
4. Write through a separately scoped process with a kill switch.
5. Verify every result and preserve rollback data.

There should still be no unattended production repricing or purchasing.

## 10. Phase 1 acceptance criteria

- Existing inventory files and `/inventory` remain canonical and unchanged.
- D1 contains only derived intelligence and references `sku` without replacing it.
- Every displayed price has source, observation date, method, range, and confidence.
- Active asks and realized sold comps are never mixed.
- Every sync is logged and retry-safe.
- Failed or stale sources are obvious in the UI.
- Low-confidence identity matches cannot generate actionable recommendations.
- No API route can publish, delete, reprice, buy, accept, or message without a separate later-approved capability.
- Database loss is recoverable from canonical files and source re-ingestion.
- Backups are off-machine, encrypted, checksummed, and restore-tested.

## Recommended decision

Approve Phase 0 first, then Phase 1. Do not begin pricing dashboards or additional marketplace automation until the eBay mutation contract and backup/recovery gaps are fixed. After that, build the intelligence layer as a removable, read-only projection over the existing Pocket Archives inventory.
