// src/components/Footer/types.ts

export interface FooterLink {
  label: string;
  path: string;
  external?: boolean;
}

export interface BusinessHours {
  [key: string]: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface FooterBrandProps {
  businessName: string;
  tagline: string;
  description: string;
  logo: string;
  established: string;
}

export interface FooterContactProps {
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    formatted: string;
  };
  phone: string;
  email: string;
  parking: string;
}

export interface FooterNavigationProps {
  links: FooterLink[];
}

export interface FooterSocialProps {
  socialLinks: SocialLink[];
  onlineOrderingUrl: string;
}

export interface FooterHoursProps {
  hours: BusinessHours;
  diningNotice?: string;
}

export interface FooterBottomProps {
  businessName: string;
  established: string;
}
