import { INSTAGRAM_URL, FACEBOOK_URL } from "@/businessInfo/business";
import { MEDIA_LINKS } from "./mediaLinks";
import { BACKLINKS } from "./backlinks";

// Social and app store links
const SOCIAL_LINKS = [INSTAGRAM_URL, FACEBOOK_URL];

// Media links (just the URLs)
const MEDIA_URLS = MEDIA_LINKS.map((link) => link.url);

// Export a single array for sameAs, including supplemental backlinks
export const SAME_AS: string[] = [...SOCIAL_LINKS, ...MEDIA_URLS, ...BACKLINKS];
