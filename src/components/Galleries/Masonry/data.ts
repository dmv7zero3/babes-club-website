export type MasonryItem = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

// Images live under public/, so paths are rooted at '/'
export const masonryItems: MasonryItem[] = [
  {
    src: "/images/models/holly-chronic-2.jpg",
    alt: "Holly Chronic portrait 2",
  },

  { src: "/images/models/model-earrings-1.jpg", alt: "Model with earrings 1" },
  // { src: "/images/models/model-earrings-3.jpg", alt: "Model with earrings 3" },
  { src: "/images/models/holly-chronic-3.jpg", alt: "Model with earrings 4" },
  // {
  //   src: "/images/models/holly-chronic-optimized.jpg",
  //   alt: "Holly Chronic portrait 1",
  // },
  { src: "/images/models/holly-chronic-7.jpg", alt: "Model with earrings 5" },
  { src: "/images/models/model-earrings.jpg", alt: "Model with earrings 6" },
  { src: "/images/models/model-earrings-7.jpg", alt: "Model with earrings 7" },
  {
    src: "/images/models/holly-chronic-1.jpg",
    alt: "Holly Chronic portrait 1",
  },
  { src: "/images/models/model-earrings-2.jpg", alt: "Model with earrings 2" },
  {
    src: "/images/models/holly-chronic-4.jpg",
    alt: "Holly Chronic portrait 4",
  },
];
