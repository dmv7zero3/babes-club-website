# Environment Variable Setup (.env) for The Babes Club Website

This project uses environment variables for configuration (API keys, endpoints, AWS info, etc). These variables are injected at build time using Webpack's DefinePlugin and a `.env` file at the project root.

## Steps to Enable .env Support

### 1. Install dotenv

- The project uses the `dotenv` package to load environment variables from a `.env` file.
- This is handled in `webpack/webpack.common.js`.

### 2. Create a `.env` File

- At the root of your project (same level as `package.json`), create a file named `.env`.
- Example contents:

```
NODE_ENV=development
GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
API_BASE_URL=https://your-api-domain.com
S3_BUCKET_ARN=arn:aws:s3:::the-babes-club-assets
CLOUDFRONT_DOMAIN=dpw5m6g065bgh.cloudfront.net
CLOUDFRONT_DISTRIBUTION_ARN=arn:aws:cloudfront::752567131183:distribution/ECA039PPTXLKM
CLOUDFRONT_DISTRIBUTION_ID=ECA039PPTXLKM
API_GATEWAY_ID=v1hwdsab2e
API_GATEWAY_URL=https://v1hwdsab2e.execute-api.us-east-1.amazonaws.com/PROD
API_GATEWAY_RESOURCE_ID=3z0uaa
```

### 3. Webpack Configuration

- The file `webpack/webpack.common.js` loads `.env` and merges it with `process.env`.
- Only whitelisted variables are injected (see `allowedEnv` array in the config).
- Webpack's `DefinePlugin` replaces all `process.env.XYZ` in your code with the actual values at build time.

### 4. Using Environment Variables in Code

- In your TypeScript/JS code, use `process.env.VARIABLE_NAME` (e.g., `process.env.GOOGLE_MAPS_API_KEY`).
- These will be replaced with the values from your `.env` file during the build.

### 5. Debugging

- When you run the dev server or build, you will see console output showing which variables were loaded and injected.
- If a variable is missing, check your `.env` file and ensure it is at the project root.

### 6. Security

- **Never commit your `.env` file to version control!**
- Add `.env` to your `.gitignore`.

## TypeScript & Loader Setup

To enable TypeScript and TSX support in your Webpack build, you must install the following dev dependencies:

```
npm install --save-dev ts-loader typescript
```

This allows Webpack to process `.ts` and `.tsx` files using the `ts-loader` loader. Make sure this is done before running your build or dev server.

## Troubleshooting

- If you see `process is not defined` in the browser, it means DefinePlugin is not replacing the variables—check your webpack config.
- If a variable is `undefined`, make sure it is in both your `.env` file and the `allowedEnv` array in `webpack.common.js`.

---

**Summary:**

- Place your `.env` at the project root.
- Only whitelisted variables are injected.
- Use `process.env.XYZ` in your code.
- Webpack and dotenv handle the rest!
