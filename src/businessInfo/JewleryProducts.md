# Jewelry Catalog Data

Source of truth for e‑commerce product data used by the site.

## File

- `JewleryProducts.json` — structured catalog consumed by the app

## Data model

- currency: ISO currency code
- lastUpdated: YYYY-MM-DD
- \_adminNotes: internal-only metadata ignored by runtime import scripts
- collections[]
  - id, title, slug
  - basePriceCents: default unit price in cents
  - taxCode: optional identifier for Stripe Tax ("auto" = let Stripe decide)
  - tieredPricing[]: optional bulk/mix-and-match pricing
    - minQty: minimum quantity to trigger
    - totalPriceCents: bundle price applied across the whole set
    - mixAndMatch: whether variants can be mixed
    - note: display copy
  - options[]: configurable options for the collection
    - id, name, type (select|fixed), values[], default, note
  - variants[]: each sellable color/style within the collection
    - id, sku, name, color
    - priceOverrideCents (optional): per-variant price
    - imageUrl (optional): CDN asset URL for storefront/Stripe sync
    - active (optional): quick toggle for hiding variants without deleting
    - group, notes (optional)

## Current pricing

Necklaces

- Price: $30 each
- Bundle: 4 for $100 (mix & match)
- Options: Chain = Gold (default) or Silver
- Special multicolor variants (Cotton Candy, 7UP): $34 each

Earrings

- Price: $25 each
- Bundle: 5 for $100 (mix & match)
- Option: Pearl = Silver only (fixed)

Note: An older image lists earrings as $20 or 3/$50 or 7/$100 and gold/silver chain. The JSON reflects the more recent sheet: $25 or 5/$100, silver pearl only. If $20 pricing is desired, update `basePriceCents` and `tieredPricing` accordingly.

## How to update

1. Add new variant: append to the proper `variants[]` with a unique `id` and `sku`.
2. Change default prices: edit `basePriceCents` for the collection.
3. Change bundles: edit `tieredPricing[]` entries.
4. Per-variant price: set `priceOverrideCents` on that variant.
5. Options: extend `options[]` values or add a new option object.

## Example: change earrings to $20 or 3/$50 or 7/$100

```
"basePriceCents": 2000,
"tieredPricing": [
	{ "minQty": 3, "totalPriceCents": 5000, "mixAndMatch": true },
	{ "minQty": 7, "totalPriceCents": 10000, "mixAndMatch": true }
]
```

After edits, run a type check/build to ensure the app compiles.

## Notes for later

- Source references: two screenshots provided (inventory + earrings only). They conflict on earrings pricing and options.
  - Older-looking sheet: Earrings $20 or 3/$50 or 7/$100; silver/gold chain.
  - Newer sheet: Earrings $25 or 5/$100; silver pearl only. JSON uses this for now.
- Necklaces: base $30; 4 for $100; multicolor (Cotton Candy, 7UP) are $34 each.
- Options model: Necklaces expose Chain select (Gold/Silver). Earrings use fixed Pearl = Silver.
- SKUs: `N-` prefix for necklaces, `E-` for earrings; add suffixes if multiple options are introduced later.
- Bundles are per-collection (mix & match within a collection) and can be combined across colors.
- The app reads this JSON via `resolveJsonModule`; extra metadata fields are safe to add (e.g., `taxCode`, `imageUrl`, `active`).

Open questions

- Confirm earrings source of truth and whether a gold chain option exists (or only silver pearl).
- Should multicolor necklace variants be included in the 4-for-$100 bundle? Currently yes—price overrides only affect the per‑unit price, not bundle eligibility.
- Do we plan additional bundle tiers (e.g., 8 for $180) or seasonal promotions?

Implementation notes

- Pricing logic lives in `src/lib/pricing.ts`. It applies the best combination of bundle tiers per collection.
- If you change prices here, no code changes are required—UI recomputes totals based on this file.
- To flip earrings back to $20 tiers, use the example snippet above and update option text accordingly.

Changelog

- 2025-10-05: Added Stripe-friendly metadata (`taxCode`, `imageUrl`, `active`), refreshed admin notes, confirmed pricing description.
- 2025-10-02: Initial schema + pricing + docs captured here.
