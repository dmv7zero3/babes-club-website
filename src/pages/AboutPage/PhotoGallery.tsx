import React from "react";

import { PRIMARY_INSTAGRAM_URL, SHOP_URL } from "./aboutData";

type LocalGalleryItem = {
  src: string;
  alt: string;
  caption: string;
};

const GALLERY_ITEMS: LocalGalleryItem[] = [
  {
    src: "/images/squares/holly-chronic-1.jpg",
    alt: "Holly Chronic wearing Babes Club accessories, look one",
    caption:
      "Holly Chronic styling a layered Babes Club look in our first square feature.",
  },
  {
    src: "/images/squares/holly-chronic-2.jpg",
    alt: "Holly Chronic modeling Babes Club accessories, look two",
    caption:
      "Statement earrings and a vivid palette highlight our second square capture.",
  },
  {
    src: "/images/squares/holly-chronic-3.jpg",
    alt: "Holly Chronic modeling Babes Club accessories, look three",
    caption: "Close-up portrait showcasing Babes Club sparkle and texture.",
  },
  {
    src: "/images/squares/holly-chronic-4.jpg",
    alt: "Holly Chronic wearing Babes Club accessories, look one",
    caption:
      "Holly Chronic styling a layered Babes Club look in our first square feature.",
  },
  {
    src: "/images/squares/holly-chronic-5.jpg",
    alt: "Holly Chronic modeling Babes Club accessories, look two",
    caption:
      "Statement earrings and a vivid palette highlight our second square capture.",
  },
  {
    src: "/images/squares/holly-chronic-7.jpg",
    alt: "Holly Chronic modeling Babes Club accessories, look three",
    caption: "Close-up portrait showcasing Babes Club sparkle and texture.",
  },
];

const PhotoGallery: React.FC = () => {
  const galleryCtaHref = PRIMARY_INSTAGRAM_URL || SHOP_URL;
  const galleryIsExternal = galleryCtaHref.startsWith("http");

  return (
    <section className="py-20 bg-gradient-to-r from-babe-pink-50 via-white to-cotton-candy-100">
      <div className="max-w-6xl px-6 mx-auto text-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-[0.38em] text-babe-pink-600">
              Visual journal
            </p>
            <h3 className="text-3xl font-heading text-babe-pink-700 md:text-4xl">
              Gallery-ready and model-forward.
            </h3>
            <p className="max-w-2xl text-base text-slate-700 md:text-lg">
              We&apos;ll be rotating in fresh campaign photography,
              behind-the-scenes studio shots, and model imagery. The layout
              below is optimized for portrait, landscape, and square crops—just
              drop in assets when they&apos;re uploaded to the CDN.
            </p>
          </div>
          <a
            href={galleryCtaHref}
            target={galleryIsExternal ? "_blank" : undefined}
            rel={galleryIsExternal ? "noreferrer" : undefined}
            className="inline-flex items-center gap-2 rounded-full bg-babe-pink px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.32em] text-white shadow-[0_18px_35px_rgba(254,59,161,0.25)] transition hover:bg-babe-pink-400 focus:outline-none focus:ring-2 focus:ring-babe-pink/40 focus:ring-offset-2 focus:ring-offset-white"
          >
            Follow on Instagram
          </a>
        </div>
        <div className="grid gap-6 mt-12 md:grid-cols-2 xl:grid-cols-3">
          {GALLERY_ITEMS.map((item) => (
            <figure
              key={item.src}
              className="group relative overflow-hidden rounded-3xl border border-babe-pink-100 bg-white shadow-[0_16px_40px_rgba(254,59,161,0.15)]"
            >
              <div className="relative h-[320px] w-full overflow-hidden">
                <img
                  src={item.src}
                  alt={item.alt}
                  className="object-cover w-full h-full transition duration-700 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 transition opacity-0 bg-gradient-to-t from-babe-pink-600/60 via-white/10 to-transparent group-hover:opacity-100" />
              </div>
              <figcaption className="p-6 text-sm text-slate-600">
                {item.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PhotoGallery;
