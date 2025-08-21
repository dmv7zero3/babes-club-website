// Utility to get environment variables safely (Node.js only)
// Do NOT use getEnvVar in browser code!
export function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

// For browser code, use process.env.* directly. These will be replaced at build time by Webpack's DefinePlugin.
// Never commit real API keys to the repo or expose them to the client if not needed.
export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
export const S3_BUCKET_ARN = process.env.S3_BUCKET_ARN || "";
export const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || "";
export const CLOUDFRONT_DISTRIBUTION_ARN =
  process.env.CLOUDFRONT_DISTRIBUTION_ARN || "";
export const CLOUDFRONT_DISTRIBUTION_ID =
  process.env.CLOUDFRONT_DISTRIBUTION_ID || "";
// API Gateway
export const API_GATEWAY_ID = process.env.API_GATEWAY_ID || "";
export const API_GATEWAY_URL = process.env.API_GATEWAY_URL || "";
export const API_GATEWAY_RESOURCE_ID =
  process.env.API_GATEWAY_RESOURCE_ID || "";
