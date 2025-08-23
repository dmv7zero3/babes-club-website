// Utility to get environment variables safely (Node.js only)
// Do NOT use getEnvVar in browser code!
const safeEnv =
  typeof process !== "undefined" && process.env ? process.env : {};

export const GOOGLE_MAPS_API_KEY = safeEnv.GOOGLE_MAPS_API_KEY || "";
export const S3_BUCKET_ARN = safeEnv.S3_BUCKET_ARN || "";
export const CLOUDFRONT_DOMAIN = safeEnv.CLOUDFRONT_DOMAIN || "";
export const CLOUDFRONT_DISTRIBUTION_ARN =
  safeEnv.CLOUDFRONT_DISTRIBUTION_ARN || "";
export const CLOUDFRONT_DISTRIBUTION_ID =
  safeEnv.CLOUDFRONT_DISTRIBUTION_ID || "";
// API Gateway
export const API_GATEWAY_ID = safeEnv.API_GATEWAY_ID || "";
export const API_GATEWAY_URL = safeEnv.API_GATEWAY_URL || "";
export const API_GATEWAY_RESOURCE_ID = safeEnv.API_GATEWAY_RESOURCE_ID || "";
