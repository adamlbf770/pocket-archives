# Pocket Archives historical research package

This folder is the documentary backbone for Pocket Archives' history and museum work. It separates narrative interpretation from source records, image provenance, object acquisition, and disputed-card tracking so later design work does not erase uncertainty.

## Deliverables

- [`pokemon-history-dossier.md`](./pokemon-history-dossier.md) — chronological narrative, timeline, people, development, art, cards, anime, material culture, international expansion, collecting history, myths, unresolved questions, Japanese wording, and a connected primary-source reading room.
- [`source-ledger.csv`](./source-ledger.csv) — 55 claim-connected sources with dates, languages, source classes, supported sections, limitations, and review status.
- [`capsule-monsters-artifact-register.csv`](./capsule-monsters-artifact-register.csv) — 21 known surviving artifact records with creator attribution, publication history, interpretive value, and confidence.
- [`image-provenance-register.csv`](./image-provenance-register.csv) — 15 historically important image leads with original context, current digital source, resolution lead, and reuse caution.
- [`acquisition-roadmap-100.csv`](./acquisition-roadmap-100.csv) — exactly 100 museum acquisition targets, emphasizing historical function over trophy value.
- [`cgc-impacted-certificates.csv`](./cgc-impacted-certificates.csv) — all 813 certificate numbers in CGC's public prototype/playtest-card investigation notice, with the official status stated without extrapolation.
- [`update-cgc-certificate-register.py`](./update-cgc-certificate-register.py) — deterministic updater for the CGC register; rerun it if the official notice changes.

## Editorial rules

1. Do not silently upgrade **probable**, **disputed**, or **unresolved** claims to fact.
2. Cite the underlying contemporary document or object when one is available; use collector research as a route to evidence, not as a replacement for it.
3. Preserve Japanese wording where translation could strengthen or narrow the claim.
4. Keep design authorship, final official illustration, and physical-object authenticity as separate questions.
5. Treat copyright in artwork, ownership of an object, and rights in a scan or photograph separately.
6. Treat price ranges as acquisition-planning bands, not appraisals.

## Status language

- **Reviewed** — the source was inspected closely enough to support the stated use.
- **In review** — useful evidence was located, but a primary page, physical copy, translation, or conflict still needs closure.
- **Located** — a discovery lead retained for future examination; it should not carry a major claim alone.

The unresolved-question register in the dossier is intentional. It records where the surviving evidence does not justify a cleaner story.
