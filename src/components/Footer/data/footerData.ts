// src/components/Footer/data/footerData.ts

import { FooterLink, SocialLink } from "../types";
import {
  FACEBOOK_URL,
  INSTAGRAM_URL,
  GOOGLE_MAPS_URL,
  ONLINE_ORDERING_URL,
} from "../../../businessInfo/business";

export const footerNavigationLinks: FooterLink[] = [
  {
    label: "Home",
    path: "/",
  },
  {
    label: "About",
    path: "/about",
  },
  {
    label: "Menu",
    path: "/menu",
  },
  {
    label: "Contact",
    path: "/contact",
  },
];

export const socialMediaLinks: SocialLink[] = [
  {
    platform: "Facebook",
    url: FACEBOOK_URL,
    icon: "facebook",
  },
  {
    platform: "Instagram",
    url: INSTAGRAM_URL,
    icon: "instagram",
  },
  {
    platform: "Google Maps",
    url: GOOGLE_MAPS_URL,
    icon: "map-pin",
  },
];
