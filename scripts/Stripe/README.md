# Stripe Catalog Import

Populate the Stripe product + price catalog from `src/businessInfo/JewleryProducts.json`.

## Prerequisites

- Environment variables configured (see `.env`):
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_PRIVATE_KEY`
- Install dependencies:

```bash
npm install
```

> The script relies on the official [`stripe`](https://www.npmjs.com/package/stripe) SDK and `ts-node` (installed via `npm install`).

## Usage

Dry-run (default first step):

```bash
npx ts-node --esm scripts/Stripe/import-catalog.ts --dry-run
```

Apply changes:

```bash
npx ts-node --esm scripts/Stripe/import-catalog.ts
```

Options:

| Flag                               | Description                                                                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`                        | Show the operations without creating/updating Stripe records or writing the ID map.                                          |
| `--rotate-price`                   | When a price already exists with a different amount, create a new price instead of reusing it (Stripe prices are immutable). |
| `--json=path`                      | Override the catalog JSON path. Default is `src/businessInfo/JewleryProducts.json`.                                          |
| `--out=path`                       | Override where to write the Stripe ID map. Default is `scripts/Stripe/stripe-id-map.json`.                                   |
| `--collections=necklaces,earrings` | Import only the listed collections.                                                                                          |

Environment overrides:

- `DRY_RUN=1` behaves the same as `--dry-run`.
- `JEWELRY_PRODUCTS_PATH` can point to an alternative catalog.

## Output

When not in dry-run mode, the script writes a `stripe-id-map.json` alongside the script. Each entry maps a SKU to the product/price IDs created or discovered on Stripe.

## Notes

- Only variants with `"active": true` (or missing) are imported. Variants explicitly marked `false` are skipped.
- Additional product metadata copied to Stripe includes SKU, collection, variant ID, group, color, image URL, and collection tax code.
- The script can run repeatedly; it updates metadata or price amounts when needed and reuses existing products/prices whenever possible.
