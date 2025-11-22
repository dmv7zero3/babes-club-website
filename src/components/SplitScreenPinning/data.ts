export type Item = {
  key: string;
  title: string;
  img: string;
  blurb: string;
};

export const splitScreenItems: Item[] = [
  {
    key: "earrings",
    title: "Earrings",
    img: "/images/models/model-earrings-1.jpg",
    blurb:
      "Welcome to our earrings collection—thoughtfully curated pieces that shine from day to night.",
  },
  {
    key: "necklaces",
    title: "Necklaces",
    img: "/images/models/model-earrings-2.jpg",
    blurb:
      "Necklaces that layer beautifully or stand alone—soft silhouettes and effortless charm.",
  },
  {
    key: "head-chain",
    title: "Head Chain",
    img: "/images/models/model-earrings-3.jpg",
    blurb:
      "Delicate head chains to frame your look with a warm, elevated touch.",
  },
  {
    key: "body-chain",
    title: "Body Chain",
    img: "/images/models/model-earrings-4.jpg",
    blurb:
      "Body chains with a graceful drape—welcoming accents for any occasion.",
  },
];
