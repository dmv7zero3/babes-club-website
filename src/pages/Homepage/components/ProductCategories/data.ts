import { BlobName } from "@/components/Icons/Blobs";

export type ProductCategoryItem = {
  src: string;
  alt: string;
  from: BlobName;
  to: BlobName;
  title: string;
  href: string;
};

export const items: ProductCategoryItem[] = [
  {
    src: "/images/products/earrings.jpg",
    alt: "Model wearing earrings",
    from: "BlobA",
    to: "BlobB",
    title: "Earrings",
    href: "/products/earrings",
  },
  {
    src: "/images/products/necklaces-1.jpg",
    alt: "Necklace product",
    from: "BlobB",
    to: "BlobC",
    title: "Necklaces",
    href: "/products/necklaces",
  },
  // {
  //   src: "/images/products/head-chain.jpg",
  //   alt: "Head chain product",
  //   from: "BlobC",
  //   to: "BlobA",
  //   title: "Head Chain",
  // },
  // {
  //   src: "/images/products/body-chain.jpg",
  //   alt: "Model earrings 4",
  //   from: "BlobA",
  //   to: "BlobC",
  //   title: "Body Chain",
  // },
];

export default items;
