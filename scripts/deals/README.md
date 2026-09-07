# Pocket Archives dealer scanner

The scheduled watcher runs every 15 minutes and keeps two independent lanes:

- **Slab Hunter** discovers PSA, CGC, BGS, and TAG slabs under the configured
  acquisition ceiling.
- **Raw Card Hunter** discovers Illustration Rare-only lots, Ultra Rare-only
  lots, and explicit saved-card watches.

Active eBay listings are candidate discovery only. They are never treated as
realized market value. A candidate can be `BUY` or `STRONG BUY` only when
`data/deals/sold-comps.json` contains at least three exact realized sold comps
and the liquidity, discount, net-profit, and ROI gates all pass.

Import an authorized eBay Product Research export with:

```sh
npm run deals:import-comps -- --file /path/to/export.csv
npm run deals:import-comps -- --file /path/to/export.csv --apply
```

The first command validates without changing the database. The second imports
the rows. Run `npm run deals:dry-run` afterward to refresh the dashboard without
sending email.

No code path buys an item. Every recommendation requires manual approval.
