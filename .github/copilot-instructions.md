# Babes Club Copilot Guide

## Architecture snapshot

- **Static React SPA:** Built with React Router v6, bootstrapped in `src/index.tsx` and `App.tsx`. Routes are defined in `src/routes.tsx`.
- **Static Hosting on AWS S3 + CloudFront:** Webpack outputs pre-rendered HTML files for each route into `/dist`. The contents of `/dist` are synced to an S3 bucket (`S3_BUCKET_PATH`), served via CloudFront (`CLOUDFRONT_DISTRIBUTION_ID`).
- **CloudFront Function Routing:** A custom CloudFront function handles:
  - Pass-through for static assets (JS, CSS, images, fonts, etc.)
  - Route-specific HTML (e.g., `/about` → `/about/index.html`)
  - Fallback for unknown routes to `/index.html` for React Router client-side navigation
  - Redirect `/index.html` to `/` for canonical root
- **Route Generation:** Each route in `src/routes.tsx` is mirrored in `webpack/config/routes-meta.js` for static HTML generation and SEO. Direct navigation to any route works due to CloudFront logic.
- **No SSR:** All routing/rendering is client-side. CloudFront only serves static files and delegates unknown paths to the SPA entry point.

## Lambda Layers & API Gateway

- **Shared Lambda Layer:** All AWS Lambda functions for commerce use the shared layer `arn:aws:lambda:us-east-1:752567131183:layer:babesclub-shared-commerce:6`. This layer provides:
  - Environment/config helpers (`shared_commerce/env.py`)
  - DynamoDB access (`shared_commerce/storage.py`)
  - Cart signing, validation, rate limiting, CORS, security, Stripe secret management, and event utilities
  - See `AWS_Lambda_Functions/shared_layers/commerce/python/shared_commerce/` for all shared utilities
- **API Gateway Integration:**
  - API Gateway routes requests to Lambda functions, which import from the shared layer for consistent business logic and environment handling
  - Environment variables (see `.env` and `constants.py`) are used for table names, Stripe secrets, CORS, etc.
  - API Gateway stage and base URL are set in `.env` (`API_BASE_URL`)
  - CORS origins are managed via the `CORS_ALLOW_ORIGIN` env and resolved in the shared layer
- **Ensuring API Gateway Consistency:**
  - Use AWS CLI to list, create, and update API Gateway resources:
    - List APIs: `aws apigateway get-rest-apis --region us-east-1`
    - List resources for an API: `aws apigateway get-resources --rest-api-id <API_GATEWAY_ID> --region us-east-1`
    - List stages: `aws apigateway get-stages --rest-api-id <API_GATEWAY_ID> --region us-east-1`
    - Deploy API: `aws apigateway create-deployment --rest-api-id <API_GATEWAY_ID> --stage-name PROD --region us-east-1`
  - Always verify that Lambda integrations reference the correct shared layer ARN and environment variables
  - Use the same naming and environment conventions for all new Lambda/API Gateway resources

## Build & env basics

- Node >= 22 and npm >= 10 are required (`package.json`). Install deps with `npm install`.
- Local dev: `npm start` (webpack dev server on 3001). Full check loop: `npm run dev:check` → `npm start`.
- Production build: `npm run build` (outputs to `dist/`). No unit tests yet (`npm run ci:test` echoes), so rely on lint & type-check: `npm run lint`, `npm run type-check`.
- Environment variables are whitelisted in `webpack/webpack.common.js`; update `allowedEnv` before using new keys. Values flow from `.env` via `src/env/env.ts`.

## Data & pricing conventions

- Always source catalog data from `JewleryProducts.json`; add variants/collections there so pricing helpers and UI stay in sync.
- Use `priceCart`, `formatMoney`, and `analyzeCartPricing` for totals and bundle messaging; do not recompute amounts ad hoc.
- When building checkout payloads, go through `buildCheckoutPayload` and stash via `stashCheckoutPayload` to maintain the quote → session flow expected by the checkout page.

## API integrations & external services

- Frontend hits API Gateway via `src/lib/api/apiClient.ts`; base URL must be provided as `API_BASE_URL`. Errors are wrapped in `CommerceApiError` for UI handling.
- Checkout flow expects AWS Lambda backends (`AWS_Lambda_Functions/`); keep quote signatures and Stripe sessions aligned with `createCartQuote`/`createCheckoutSession` payloads.
- Stripe catalog importer lives in `scripts/Stripe/import-catalog.ts` (run with `npm run stripe:import` or `--dry-run` variant) and reads the same catalog JSON—update both sides together.

## UI & interaction patterns

- Tailwind config (`tailwind.config.js`) defines custom design tokens (`babe-pink`, `cotton-candy`, custom glow utilities). Prefer these utilities over inline styles.
- Smooth scrolling relies on GSAP ScrollTrigger and an optional ScrollSmoother plugin (`src/components/SmoothScrollProvider.tsx`). It auto-disables for `prefers-reduced-motion`; avoid importing premium plugins directly.
- Header lazy-loads `CartDrawer` with `React.lazy` and renders modals via `components/Shared/Portal`. Use the existing `DrawerManagerContext` and `useDrawerManager` hooks when adding new off-canvas panels.

## Deployment workflow

- `scripts/deploy.mjs` orchestrates build ➜ S3 upload ➜ CloudFront invalidation using layered config from `config/deploy.json` and optional `deploy.local.json`. Ensure `S3_BUCKET_PATH`, `CLOUDFRONT_*`, and `SITE_ORIGIN` are set.
- Asset syncing helpers (`scripts/s3.js`) expect AWS CLI credentials and a defined `S3_BUCKET_PATH`. They apply aggressive cache headers—mirror that logic for new asset types.
- Route additions require coordinating three spots: `src/routes.tsx`, `webpack/config/routes-meta.js` (`STATIC_ROUTE_PATHS` and meta entries), and any SEO defaults in `src/data/seo/defaultMeta.js`.

## Quality guardrails

- Keep TypeScript strictness (see `tsconfig.json`) and path aliases (`@/*`) intact; prefer importing via aliases to avoid brittle relative paths.
- Run `npm run type-check` after touching shared types or scripts (`scripts/**/*.ts` are included in the TS project).
- Lint fixes should go through `npm run lint:fix` to maintain the current ESLint + Prettier setup.
