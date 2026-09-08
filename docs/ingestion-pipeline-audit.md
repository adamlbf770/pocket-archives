# Pocket Archives ingestion pipeline audit

## Outcome

The durable inventory, storage-location, image, eBay, order, and market layers remain in place. The unsafe part was intake: individual batch scripts embedded card identities, rotations, pricing fallbacks, and image operations in one-off code. A plausible OCR or filename guess could therefore reach a listing without an exact catalog reconciliation.

The new ingestion core inserts a controlled gate before canonical inventory and eBay drafts. It is additive and does not rewrite existing SKUs, storage assignments, sales, or eBay state.

## Existing path retained

1. Ricoh scans arrive in scanner intake sessions.
2. Existing batch scripts preserve raw scans and produce front/back assets.
3. `inventory/Storage Locations.json` and batch manifests remain canonical.
4. Existing eBay modules retain draft, image-attachment, publish, and reconciliation responsibilities.
5. D1 remains a rebuildable hosted intelligence layer.

## New controlled path

1. A batch input maps each SKU to an exact front/back pair and a provisional identity.
2. Mechanical quality checks reject missing, unreadable, low-resolution, implausibly cropped, or duplicate front/back files.
3. Apple Vision tests 0°, 90°, 180°, and 270° and records score evidence and confidence.
4. A normalized identity includes game, name, set, number, language, finish, variant, and edition.
5. Approved catalogs verify exact print identity where coverage exists.
6. Any source conflict, missing required field, finish uncertainty, duplicate, or ambiguous orientation routes to review.
7. Only a complete 92+ score with zero reason codes can enter the existing eBay draft builder.
8. Publishing remains disabled. Drafts require the existing explicit publish workflow.

## Source policy

- Scryfall: exact Magic printing verification. Bulk data should replace repeated calls at large volume.
- Pokémon TCG API: English catalog identity only. A physical finish is not treated as verified merely because a catalog entry exists.
- YGOPRODeck: Yu-Gi-Oh! exact name and set-code support. Cache bulk catalogs for high-volume runs.
- TCGCSV: supporting price/catalog cache, not realized sold evidence.
- TCGplayer: no new API access is assumed. Use only if Pocket Archives already has valid credentials and remains within its terms.
- One Piece, Dragon Ball, Sorcery, Riftbound, Carddass, Topps, and non-English Pokémon: remain review-first until a licensed or authoritative exact-print catalog adapter is added.

## Confidence contract

- `AUTO_DRAFT`: exact external identity, complete required fields, verified finish, high orientation confidence, clean image pair, and no duplicate flag.
- `REVIEW`: plausible but incomplete or ambiguous.
- `CONFLICT`: local guess and approved external evidence disagree.
- `RESCAN`: the image pair fails a mechanical quality gate.

No state except `AUTO_DRAFT` is accepted by `assertEbayDraftSafe`.

## Operator workflow

Create a batch JSON using `scripts/ingestion/example-batch-input.json`, then run:

```bash
npm run ingestion:run -- /absolute/path/to/batch-input.json
npm run sync:intelligence
```

Review exceptions at `/ingestion`. Decisions export as an auditable JSON file; they do not silently overwrite canonical inventory.

## Next hardening phases

1. Add local catalog mirrors and cache expiry for high-volume source matching.
2. Add image-based front/back classification and finish detection models with retained evidence.
3. Add signed correction import and append-only correction history.
4. Add stratified random QA sampling by game, language, finish, and confidence band.
5. Add precision metrics: false-positive rate, correction rate, rescan rate, and source conflict rate.
6. Enable automatic eBay draft creation only after a statistically meaningful QA sample meets the agreed false-positive threshold.

The initial rollout deliberately optimizes for false-positive prevention rather than draft volume.
