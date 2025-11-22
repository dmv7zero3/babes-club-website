import {
  BUSINESS_CITY,
  BUSINESS_STATE,
  EMAIL,
  ONLINE_ORDERING_URL,
  SOCIAL_MEDIA,
  getFormattedAddress,
} from "@/businessInfo/business";
import businessData from "@/businessInfo/business-data.json";

type GalleryItem = {
  src: string;
  alt: string;
  caption: string;
};

type SocialLink = {
  label: string;
  handle: string;
  href: string;
};

const {
  established,
  features,
  competitive_advantages: competitiveAdvantages,
  special_notices: specialNotices,
} = businessData;

const ESTABLISHED_YEAR = established || "2024";

const SHOP_URL =
  typeof ONLINE_ORDERING_URL === "string" &&
  ONLINE_ORDERING_URL.trim().length > 0
    ? ONLINE_ORDERING_URL
    : "/shop";

const SHOP_URL_IS_EXTERNAL = SHOP_URL.startsWith("http");

const rawAddress = getFormattedAddress();
const FORMATTED_ADDRESS =
  rawAddress.replace(/^,\s*/, "").trim() ||
  businessData.address.formatted ||
  [BUSINESS_CITY, BUSINESS_STATE].filter(Boolean).join(", ");

const CONTACT_EMAIL_HREF = EMAIL?.trim()
  ? `mailto:${EMAIL}?subject=${encodeURIComponent("Custom Babes Club Order")}`
  : "/contact";

const CONTACT_EMAIL_IS_EXTERNAL = CONTACT_EMAIL_HREF.startsWith("http");
const CONTACT_EMAIL_LABEL = EMAIL?.trim()
  ? "Email the studio"
  : "Connect with us";

const GALLERY_ITEMS: GalleryItem[] = [
  {
    src: "/images/about/gallery/studio-detail-1.jpg",
    alt: "Close-up view of handcrafted necklace with gold chain",
    caption: "Hand-knotted details finished in our DC studio.",
  },
  {
    src: "/images/about/gallery/boutique-display-1.jpg",
    alt: "Display wall of colorful necklaces and earrings",
    caption: "Color-forward collections curated for mixing and matching.",
  },
  {
    src: "/images/about/gallery/model-portrait-1.jpg",
    alt: "Model wearing layered necklaces and matching earrings",
    caption: "Every look is styled to feel effortless and vibrant.",
  },
  {
    src: "/images/about/gallery/studio-process-1.jpg",
    alt: "Hands assembling jewelry pieces on a workbench",
    caption: "Craftsmanship anchored in small-batch production.",
  },
  {
    src: "/images/about/gallery/pop-up-1.jpg",
    alt: "Babes Club pop-up shop setup at local market",
    caption: "DMV pop-ups bring the full experience to our community.",
  },
  {
    src: "/images/about/gallery/detail-flatlay-1.jpg",
    alt: "Flat lay of colorful accessories and brand cards",
    caption: "Templates ready for upcoming product photography uploads.",
  },
];

const SERVICE_OPTIONS = features?.service_options ?? [];
const MATERIALS = features?.materials ?? [];
const COMPETITIVE_ADVANTAGES = competitiveAdvantages ?? [];
const SPECIAL_NOTICES = specialNotices ?? [];

const PRIMARY_INSTAGRAM_URL = SOCIAL_MEDIA?.instagram_main ?? "";

const getSocialLinks = (): SocialLink[] => {
  const baseLinks: Array<SocialLink | null> = [
    {
      label: "Main Instagram",
      handle: "@thebabesclub",
      href: SOCIAL_MEDIA?.instagram_main ?? "",
    },
    {
      label: "Shop Instagram",
      handle: "@shopthebabesclub",
      href: SOCIAL_MEDIA?.instagram_shop ?? "",
    },
    {
      label: "Chronic Clothing",
      handle: "@the.chronicclothingco",
      href: SOCIAL_MEDIA?.instagram_chronic ?? "",
    },
    {
      label: "Baby Chronic",
      handle: "@baby.chronic",
      href: SOCIAL_MEDIA?.instagram_baby ?? "",
    },
    SHOP_URL_IS_EXTERNAL
      ? {
          label: "Online Shop",
          handle: SHOP_URL.replace(/^https?:\/\//, ""),
          href: SHOP_URL,
        }
      : null,
  ];

  return baseLinks.filter((link): link is SocialLink => Boolean(link?.href));
};

export type { GalleryItem, SocialLink };

export {
  COMPETITIVE_ADVANTAGES,
  CONTACT_EMAIL_HREF,
  CONTACT_EMAIL_IS_EXTERNAL,
  CONTACT_EMAIL_LABEL,
  ESTABLISHED_YEAR,
  FORMATTED_ADDRESS,
  GALLERY_ITEMS,
  MATERIALS,
  PRIMARY_INSTAGRAM_URL,
  SERVICE_OPTIONS,
  SHOP_URL,
  SHOP_URL_IS_EXTERNAL,
  SPECIAL_NOTICES,
  getSocialLinks,
};
