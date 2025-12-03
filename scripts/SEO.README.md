# SEO Meta Data Refactor

A build-time SEO solution that works for **all platforms** — no JavaScript required.

## Platform Compatibility

| Platform | Executes JS? | This Solution Works? |
|----------|--------------|---------------------|
| Google | ✅ Yes | ✅ Yes |
| Bing | ✅ Yes | ✅ Yes |
| Facebook | ❌ No | ✅ Yes |
| Twitter | ❌ No | ✅ Yes |
| LinkedIn | ❌ No | ✅ Yes |
| iMessage | ❌ No | ✅ Yes |
| Slack | ❌ No | ✅ Yes |

## Why Build-Time Only?

**React Helmet and other client-side solutions don't work for social platforms.**

When Facebook/Twitter/LinkedIn scrape your page, they see raw HTML before JavaScript runs. If meta tags are injected by React Helmet, social platforms see nothing.

**This solution bakes all meta tags into HTML at build time** — guaranteed to work everywhere.

## Files Changed

### 1. `public/index.html`
**Before:** Complex EJS logic for URL normalization, OG image type detection, etc.
**After:** Simple variable output only. All logic moved to `routes-meta.js`.

### 2. `webpack/config/routes-meta.js`
**Before:** Scattered logic between template and config.
**After:** Single source of truth. Pre-computes all values:

| Variable | Description |
|----------|-------------|
| `title` | Page title |
| `description` | Meta description |
| `keywords` | Meta keywords |
| `canonical` | Full canonical URL with trailing slash |
| `ogTitle` | Open Graph title |
| `ogDescription` | Open Graph description |
| `ogImage` | Full absolute URL to OG image |
| `ogImageAlt` | Alt text for OG image |
| `jsonLd` | Pre-stringified JSON-LD structured data |

### 3. `src/data/seo/defaultMeta.js`
**Before:** Had Moon Lounge placeholder content.
**After:** Correct Babes Club defaults.

### 4. `scripts/validate-seo.js` (NEW)
Validation script to verify all generated HTML files have required meta tags.
Fails the build if any required tags are missing.

## Installation

### 1. Copy Files

```
seo-refactor/
├── public/index.html             → public/index.html
├── webpack/config/routes-meta.js → webpack/config/routes-meta.js
├── scripts/validate-seo.js       → scripts/validate-seo.js
└── src/data/seo/defaultMeta.js   → src/data/seo/defaultMeta.js
```

### 2. Update package.json

```json
{
  "scripts": {
    "seo:validate": "node scripts/validate-seo.js",
    "build": "NODE_ENV=production webpack --config webpack/webpack.prod.js && npm run seo:validate"
  }
}
```

## Usage

### Building
```bash
npm run build
```

Webpack generates a separate HTML file for each route:
```
dist/
├── index.html          # /
├── about/index.html    # /about
├── shop/index.html     # /shop
├── contact/index.html  # /contact
└── gallery/index.html  # /gallery
```

Each file has all SEO meta tags baked in — no JavaScript required.

### Validation
```bash
npm run seo:validate
```

Checks all generated HTML files for required meta tags. Fails if any are missing.

## Adding New Routes

1. Add the route to `ROUTES` object in `webpack/config/routes-meta.js`:

```js
const ROUTES = {
  // ... existing routes
  
  "/products/earrings": {
    title: "Earrings | The Babes Club",
    description: "Handcrafted earrings with silver pearl options. Mix & match any 5 for $100.",
    ogImage: business.og_image,
    jsonLd: [ORG_ENTITY, WEBSITE_ENTITY],
  },
};
```

2. Rebuild: `npm run build`

That's it. The new route will have its own HTML file with correct meta tags.

## Verification

### Test Social Sharing

After deploying, verify with these tools:

| Platform | Debugger URL |
|----------|--------------|
| Facebook | https://developers.facebook.com/tools/debug/ |
| Twitter | https://cards-dev.twitter.com/validator |
| LinkedIn | https://www.linkedin.com/post-inspector/ |

### Check Generated HTML

```bash
# View meta tags in generated HTML
cat dist/index.html | grep -E "(og:|twitter:|canonical)"
cat dist/about/index.html | grep -E "(og:|twitter:|canonical)"
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       BUILD TIME                             │
│                                                              │
│   business-data.json ──┐                                    │
│                        │                                    │
│                        ▼                                    │
│              ┌──────────────────┐                           │
│              │  routes-meta.js  │                           │
│              │  (all SEO logic) │                           │
│              └────────┬─────────┘                           │
│                       │                                     │
│                       ▼                                     │
│              ┌──────────────────┐                           │
│              │ HtmlWebpackPlugin│                           │
│              │ + index.html     │                           │
│              └────────┬─────────┘                           │
│                       │                                     │
│                       ▼                                     │
│     ┌─────────────────────────────────────┐                │
│     │            dist/                     │                │
│     │  ├── index.html        (/)          │                │
│     │  ├── about/index.html  (/about)     │                │
│     │  ├── shop/index.html   (/shop)      │                │
│     │  ├── contact/index.html(/contact)   │                │
│     │  └── gallery/index.html(/gallery)   │                │
│     └─────────────────────────────────────┘                │
│                       │                                     │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │     All platforms read        │
        │     static HTML directly      │
        │                               │
        │  • Google      ✅             │
        │  • Facebook    ✅             │
        │  • Twitter     ✅             │
        │  • LinkedIn    ✅             │
        │  • iMessage    ✅             │
        │  • Slack       ✅             │
        └───────────────────────────────┘
```

## Benefits

1. **Works everywhere** — No JavaScript dependency means all platforms see correct meta tags
2. **Single source of truth** — All SEO data lives in `routes-meta.js`
3. **No logic in template** — HTML template just outputs pre-computed values
4. **Build validation** — Catches missing tags before deploy
5. **Easy to extend** — Just add routes to the ROUTES object and rebuild

## What About React Helmet?

**You don't need it.**

React Helmet is a client-side solution that updates `<head>` after JavaScript runs. Since social platforms don't execute JavaScript, React Helmet is useless for Facebook/Twitter/LinkedIn sharing.

This build-time approach handles all platforms, including Google. Keep your existing `react-helmet` package if other parts of your app use it, but **don't rely on it for SEO meta tags**.
