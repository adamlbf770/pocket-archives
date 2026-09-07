# Deal-finder market data

`sold-comps.json` is the conservative realized-sale source used by Slab Hunter.
Active eBay asking prices are never accepted as sold comps.

Each sale record must contain:

```json
{
  "title": "1999 Pokemon Base Set Pikachu 58/102 PSA 9",
  "soldPrice": 82.5,
  "shipping": 5,
  "soldAt": "2026-08-31T00:00:00.000Z",
  "source": "eBay Product Research",
  "sourceUrl": ""
}
```

Use an authorized eBay Marketplace Insights feed or an export from eBay Product
Research. The current Pocket Archives eBay application does not have the
restricted Marketplace Insights permission, so candidates without imported
realized sales remain `PASS` instead of being promoted from active asking prices.
