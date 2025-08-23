// Hardcoded environment variables for debugging
export const GOOGLE_MAPS_API_KEY = "AIzaSyBFUIzxEwVOnNgLtjKbUi2sLhdw0EbdPjw";
export const S3_BUCKET_ARN = "hardcoded-s3-bucket-arn";
export const CLOUDFRONT_DOMAIN = "dpw5m6g065bgh.cloudfront.net";
export const CLOUDFRONT_DISTRIBUTION_ARN =
  "arn:aws:cloudfront::752567131183:distribution/ECA039PPTXLKM";
export const CLOUDFRONT_DISTRIBUTION_ID = "ECA039PPTXLKM";
// API Gateway
export const API_GATEWAY_ID = "v1hwdsab2e";
export const API_GATEWAY_URL =
  "https://v1hwdsab2e.execute-api.us-east-1.amazonaws.com/PROD";
export const API_GATEWAY_RESOURCE_ID = "3z0uaa";

export const API_BASE_URL = "";
export const NODE_ENV = "development";

// For development debugging (will be stripped in production)
if (NODE_ENV === "development") {
  // Only log masked API key for safety
  // eslint-disable-next-line no-console
  console.log("Environment variables loaded:", {
    GOOGLE_MAPS_API_KEY: GOOGLE_MAPS_API_KEY ? "***SET***" : "NOT SET",
    API_BASE_URL: API_BASE_URL || "NOT SET",
    NODE_ENV,
  });
}
