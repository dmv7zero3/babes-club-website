# Life Missions International Copilot Guide

## Project Overview

Life Missions International is a non-profit organization helping families in need through food pantry programs and community support in Washington, D.C. The organization is building the foundation to qualify for grants that will expand its impact. This is a React-based website for the organization.

## Architecture snapshot

- Single-page React app (React Router v6) bootstrapped in `src/index.tsx` and `App.tsx`; routes live in `src/routes.tsx`.
- Business data is centralized in `src/businessInfo/business-data.json` and exported via `src/businessInfo/business.ts`.
- Webpack config in `webpack/` drives builds. `webpack/config/routes-meta.js` mirrors `src/routes.tsx` to prerender HTML files with per-route SEO meta.

## Build & env basics

- Node >= 22 and npm >= 10 are required (`package.json`). Install deps with `npm install`.
- Local dev: `npm start` (webpack dev server on 3001). Full check loop: `npm run dev:check` → `npm start`.
- Production build: `npm run build` (outputs to `dist/`). No unit tests yet (`npm run ci:test` echoes), so rely on lint & type-check: `npm run lint`, `npm run type-check`.
- Environment variables are whitelisted in `webpack/webpack.common.js`; update `allowedEnv` before using new keys. Values flow from `.env` via `src/env/env.ts`.

## Business Data

- Business information is centralized in `src/businessInfo/business-data.json`.
- Export business constants from `src/businessInfo/business.ts` for use throughout the application.
- Update business-data.json when organization details, services, or programs change.

## UI & interaction patterns

- Tailwind config (`tailwind.config.js`) defines custom design tokens. Prefer these utilities over inline styles.
- Smooth scrolling relies on GSAP ScrollTrigger and an optional ScrollSmoother plugin (`src/components/SmoothScrollProvider.tsx`). It auto-disables for `prefers-reduced-motion`; avoid importing premium plugins directly.

## Deployment workflow

- `scripts/deploy.mjs` orchestrates build ➜ S3 upload ➜ CloudFront invalidation using layered config from `config/deploy.json` and optional `deploy.local.json`. Ensure `S3_BUCKET_PATH`, `CLOUDFRONT_*`, and `SITE_ORIGIN` are set.
- Asset syncing helpers (`scripts/s3.js`) expect AWS CLI credentials and a defined `S3_BUCKET_PATH`. They apply aggressive cache headers—mirror that logic for new asset types.
- Route additions require coordinating three spots: `src/routes.tsx`, `webpack/config/routes-meta.js` (`STATIC_ROUTE_PATHS` and meta entries), and any SEO defaults in `src/data/seo/defaultMeta.js`.

## Quality guardrails

- Keep TypeScript strictness (see `tsconfig.json`) and path aliases (`@/*`) intact; prefer importing via aliases to avoid brittle relative paths.
- Run `npm run type-check` after touching shared types or scripts (`scripts/**/*.ts` are included in the TS project).
- Lint fixes should go through `npm run lint:fix` to maintain the current ESLint + Prettier setup.
