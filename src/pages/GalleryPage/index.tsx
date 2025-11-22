import React, { useEffect, useRef } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

import BannerHero from "@/components/Hero/BannerHero";
import MasonryGallery from "@/components/Galleries/Masonry";
import { masonryItems } from "@/components/Galleries/Masonry/data";
import { setupRevealOnScroll } from "@/components/Galleries/Masonry/animation";

const SITE_ORIGIN =
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : "";

const highlightCards = [
  {
    title: "Editorial energy",
    description:
      "Glimpse our latest photoshoots styled in bold color palettes and dreamy light—perfect for press kits and brand storytelling.",
  },
  {
    title: "Everyday shine",
    description:
      "Mix-and-match studs, ear cuffs, and layered necklaces captured on real Babes. Steal the stack or use it as inspo for your next drop.",
  },
  {
    title: "Behind the scenes",
    description:
      "Peek into workshop moments, pop-up displays, and community events that bring The Babes Club vibe to life across the DMV.",
  },
];

const GalleryPage: React.FC = () => {
  const highlightsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!highlightsRef.current) return;
    return setupRevealOnScroll(highlightsRef.current, {
      threshold: 0.25,
      stagger: 90,
      replay: false,
    });
  }, []);

  const canonical = SITE_ORIGIN ? `${SITE_ORIGIN}/gallery` : "/gallery";

  return (
    <main className="bg-gradient-to-b from-cotton-candy-100 via-white to-babe-pink-50 text-slate-900">
      <Helmet>
        <title>Gallery | The Babes Club</title>
        <meta
          name="description"
          content="Browse our mosaic gallery featuring editorial shoots, behind-the-scenes moments, and everyday shine from The Babes Club jewelry collections."
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Gallery | The Babes Club" />
        <meta
          property="og:description"
          content="Bold color, layered stacks, and behind-the-scenes magic from The Babes Club community."
        />
        <meta property="og:url" content={canonical} />
      </Helmet>

      <BannerHero
        imageSrc="/images/banner/holly-chronic-6.jpg"
        title="The Babes Club Gallery"
        alt="Model wearing layered Babes Club jewelry"
        overlayOpacity={45}
        className="lg:min-h-[38svh]"
        titleClassName="tracking-tight"
      />

      <section className="py-16">
        <div className="w-11/12 max-w-3xl mx-auto space-y-6 text-center">
          <p className="text-lg text-slate-600">
            A mood board straight from our studio to you. From art direction to
            everyday stacks, this mosaic gallery celebrates the women who wear
            Babes Club and the makers behind each piece.
          </p>
          <p className="text-slate-500">
            Scroll, save, and share your favorites—each look links back to the
            collections you love so you can recreate the sparkle IRL.
          </p>
        </div>
      </section>

      <section ref={highlightsRef} className="pb-12">
        <div className="grid w-11/12 max-w-6xl gap-6 mx-auto md:grid-cols-3">
          {highlightCards.map((card, index) => (
            <article
              key={card.title}
              className="p-6 transition-transform duration-500 ease-out shadow-sm animate-on-scroll rounded-2xl bg-white/70 ring-1 ring-white/60 backdrop-blur hover:-translate-y-1"
              style={{ transitionDelay: `${index * 60}ms` }}
            >
              <h2 className="text-xl font-semibold text-babe-pink-700">
                {card.title}
              </h2>
              <p className="mt-3 leading-relaxed text-slate-600">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="py-8">
        <MasonryGallery
          items={masonryItems}
          columnClassName="columns-1 sm:columns-2 xl:columns-3"
          gapClassName="gap-3"
          roundedClassName="rounded-xl"
        />
      </section>

      <section className="py-20">
        <div className="flex flex-col items-center w-11/12 max-w-5xl gap-6 px-8 py-12 mx-auto text-center shadow-lg rounded-3xl bg-babe-pink-100/60">
          <h2 className="text-3xl md:text-4xl font-heading text-babe-pink-700">
            Bring the sparkle home
          </h2>
          <p className="max-w-2xl text-base md:text-lg text-slate-600">
            Ready to build a custom stack or book us for your next event? Shop
            the collections featured above or send a note so we can style a set
            that feels uniquely you.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center px-6 py-3 font-semibold text-white transition rounded-full shadow-md bg-babe-pink hover:bg-babe-pink-600"
            >
              Shop the collection
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-6 py-3 font-semibold transition bg-white rounded-full shadow-md text-babe-pink-700 ring-1 ring-babe-pink-200 hover:bg-babe-pink-50"
            >
              Plan a styling session
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default GalleryPage;
