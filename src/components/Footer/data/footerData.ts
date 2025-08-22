// src/components/Footer/data/footerData.ts

import { FooterLink, SocialLink } from "../types";

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
  {
    label: "Order Online",
    path: "https://www.mealage.com/2foodmenu8.jsp?sessionid=1423263736473A2601:a:401:3674:259d:4e38:cddb:1847dgmicgflvwztemsjxgrswgdvlumg&restaurantId=9503",
    external: true,
  },
];

export const socialMediaLinks: SocialLink[] = [
  {
    platform: "Facebook",
    url: "https://www.facebook.com/CafeOpera.VA",
    icon: "facebook",
  },
  {
    platform: "Instagram",
    url: "https://www.instagram.com/cafe_opera_asian_cuisine/",
    icon: "instagram",
  },
  {
    platform: "Google Maps",
    url: "https://www.google.com/maps/place/Cafe+Opera/@39.0436,-77.4875,17z",
    icon: "map-pin",
  },
];

export const formatHours = (hours: { [key: string]: string }) => {
  const daysOrder = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return daysOrder.map((day) => ({
    day: day.charAt(0).toUpperCase() + day.slice(1),
    hours: hours[day] || "Closed",
  }));
};
