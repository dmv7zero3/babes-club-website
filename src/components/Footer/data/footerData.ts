// src/components/Footer/data/footerData.ts

import { FooterLink, SocialLink } from "../types";

export const footerNavigationLinks: FooterLink[] = [
  {
    label: "Home",
    path: "/",
  },
  {
    label: "Menu",
    path: "/menu",
  },
  {
    label: "Events",
    path: "/events",
  },
  {
    label: "Catering",
    path: "/catering",
  },
  {
    label: "Contact",
    path: "/contact",
  },
];

export const socialMediaLinks: SocialLink[] = [
  {
    platform: "Facebook",
    url: "https://www.facebook.com/CafeOperaDC",
    icon: "facebook",
  },
  {
    platform: "Instagram",
    url: "https://www.instagram.com/cafeoperadc",
    icon: "instagram",
  },
  {
    platform: "Google Maps",
    url: "https://maps.google.com/?q=Cafe+Opera+Washington+DC",
    icon: "map-pin",
  },
];
