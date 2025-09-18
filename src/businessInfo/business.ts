// src/businessInfo/business.ts
// Simplified: Single-business configuration (no multi-tenant selection logic)
import businessData from "./business-data.json";

type Business = typeof businessData;
const BUSINESS: Business = businessData; // direct reference

// Core Business Info
export const BUSINESS_ID = BUSINESS.business_id;
export const BUSINESS_NAME = BUSINESS.business_name;
export const BUSINESS_DESCRIPTION = BUSINESS.description;

// Address & Contact
export const BUSINESS_ADDRESS = BUSINESS.address.street;
export const BUSINESS_CITY = BUSINESS.address.city;
export const BUSINESS_STATE = BUSINESS.address.state;
export const BUSINESS_ZIP = BUSINESS.address.zipCode;
export const EMAIL = BUSINESS.contact.email;
export const PHONE_NUMBER = BUSINESS.contact.phone;

// Social Media
export const SOCIAL_MEDIA = BUSINESS.social_media;

// Online Ordering
export const ONLINE_ORDERING_URL = BUSINESS.online_ordering || "";

// Logo (provide a generic fallback)
export const LOGO_URL = BUSINESS.logo;

// Helper: formatted address
export const getFormattedAddress = (): string => {
  return `${BUSINESS_ADDRESS}, ${BUSINESS_CITY}, ${BUSINESS_STATE} ${BUSINESS_ZIP}`;
};
