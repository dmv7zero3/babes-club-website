// src/businessInfo/business.ts
import businessData from "./business-data.json";

type BusinessJson = typeof businessData;

const ACTIVE_BUSINESS_ID = "cafe-opera";
const ACTIVE_BUSINESS = (businessData as BusinessJson)[ACTIVE_BUSINESS_ID];

if (!ACTIVE_BUSINESS) {
  throw new Error(
    `Business configuration not found for: ${ACTIVE_BUSINESS_ID}`
  );
}

// Core Business Info
export const BUSINESS_ID = ACTIVE_BUSINESS.business_id;
export const BUSINESS_NAME = ACTIVE_BUSINESS.business_name;
export const BUSINESS_DESCRIPTION = ACTIVE_BUSINESS.description;

// Address & Contact
export const BUSINESS_ADDRESS = ACTIVE_BUSINESS.address.street;
export const BUSINESS_CITY = ACTIVE_BUSINESS.address.city;
export const BUSINESS_STATE = ACTIVE_BUSINESS.address.state;
export const BUSINESS_ZIP = ACTIVE_BUSINESS.address.zipCode;
export const EMAIL = ACTIVE_BUSINESS.contact.email;

// Hours
export const BUSINESS_HOURS = ACTIVE_BUSINESS.hours;

// Social Media
export const SOCIAL_MEDIA = ACTIVE_BUSINESS.social_media;
export const INSTAGRAM_URL = SOCIAL_MEDIA.instagram || "";
export const FACEBOOK_URL = SOCIAL_MEDIA.facebook || "";
export const GOOGLE_MAPS_URL = SOCIAL_MEDIA.google_maps || "";

// Online Ordering
export const ONLINE_ORDERING_URL = ACTIVE_BUSINESS.online_ordering || "";

// Dine-in Notice
export const DINE_IN_NOTICE = ACTIVE_BUSINESS.dine_in_notice || "";

// Logo
export const LOGO_URL =
  ACTIVE_BUSINESS.logo || "/images/logo/cafe-opera-logo.png";

// Helper: formatted address
export const getFormattedAddress = (): string => {
  return `${BUSINESS_ADDRESS}, ${BUSINESS_CITY}, ${BUSINESS_STATE} ${BUSINESS_ZIP}`;
};

// Days of week type for type-safe access
export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

// Helper: get hours for a given day
export const getBusinessHours = (day: DayOfWeek): string => {
  return ACTIVE_BUSINESS.hours[day] || "Closed";
};
