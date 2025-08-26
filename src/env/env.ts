// src/env/env.ts
// Environment configuration that uses process.env values
// These will be replaced by webpack DefinePlugin at build time

export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
export const S3_BUCKET_ARN = process.env.S3_BUCKET_ARN || "";
export const CLOUDFRONT_DOMAIN =
  process.env.CLOUDFRONT_DOMAIN || "dpw5m6g065bgh.cloudfront.net";
export const CLOUDFRONT_DISTRIBUTION_ARN =
  process.env.CLOUDFRONT_DISTRIBUTION_ARN ||
  "arn:aws:cloudfront::752567131183:distribution/ECA039PPTXLKM";
export const CLOUDFRONT_DISTRIBUTION_ID =
  process.env.CLOUDFRONT_DISTRIBUTION_ID || "ECA039PPTXLKM";

// API Gateway
export const API_GATEWAY_ID = process.env.API_GATEWAY_ID || "v1hwdsab2e";
export const API_GATEWAY_URL =
  process.env.API_GATEWAY_URL ||
  "https://v1hwdsab2e.execute-api.us-east-1.amazonaws.com/PROD";
export const API_GATEWAY_RESOURCE_ID =
  process.env.API_GATEWAY_RESOURCE_ID || "3z0uaa";

export const API_BASE_URL = process.env.API_BASE_URL || "";
export const NODE_ENV = process.env.NODE_ENV || "development";

// Configuration object for easy access
export const ENV_CONFIG = {
  GOOGLE_MAPS_API_KEY,
  S3_BUCKET_ARN,
  CLOUDFRONT_DOMAIN,
  CLOUDFRONT_DISTRIBUTION_ARN,
  CLOUDFRONT_DISTRIBUTION_ID,
  API_GATEWAY_ID,
  API_GATEWAY_URL,
  API_GATEWAY_RESOURCE_ID,
  API_BASE_URL,
  NODE_ENV,
} as const;

// Type for environment variable keys
export type EnvVarKey = keyof typeof ENV_CONFIG;

// Helper function to get environment variables safely
export const getEnvVar = (key: EnvVarKey): string => {
  const value = ENV_CONFIG[key];

  // Log warning for missing required variables
  if (!value && ["GOOGLE_MAPS_API_KEY"].includes(key)) {
    console.error(`🔴 Missing required environment variable: ${key}`);
  }

  return value;
};

// Validation function
export const validateEnvironment = (): {
  isValid: boolean;
  missing: string[];
} => {
  const required = ["GOOGLE_MAPS_API_KEY"] as EnvVarKey[];
  const missing = required.filter((key) => !ENV_CONFIG[key]);

  return {
    isValid: missing.length === 0,
    missing,
  };
};

// For development debugging (will be stripped in production)
if (NODE_ENV === "development") {
  const validation = validateEnvironment();

  console.log("🌍 Cafe Opera Environment Variables:", {
    NODE_ENV,
    GOOGLE_MAPS_API_KEY: GOOGLE_MAPS_API_KEY ? "✅ SET" : "❌ NOT SET",
    API_BASE_URL: API_BASE_URL ? "✅ SET" : "⚠️ NOT SET",
    CLOUDFRONT_DOMAIN: CLOUDFRONT_DOMAIN ? "✅ SET" : "⚠️ NOT SET",
    API_GATEWAY_URL: API_GATEWAY_URL ? "✅ SET" : "⚠️ NOT SET",
  });

  if (!validation.isValid) {
    console.error(
      "❌ Missing required environment variables:",
      validation.missing
    );
    console.info("💡 Please check your .env file at the project root");
  } else {
    console.log("✅ All required environment variables are configured");
  }
}
