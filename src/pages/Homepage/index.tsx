import React from "react";
import { Helmet } from "react-helmet";
import HeroClipReveal from "./components/HeroClipReveal";
import SplitScreenPinning from "@/components/SplitScreenPinning/SplitScreenPinning";
import Hero from "./components/Hero";
import AboutHolly from "./components/AboutHolly";
import MasonryGallery from "@/components/Galleries/Masonry";
import HorizontalBanner from "@/components/HorizontalBanner";

// Lazy load non-hero sections to ensure the hero shows first
const BlobGallery = React.lazy(() => import("./components/ProductCategories"));
const AdjectivesScroller = React.lazy(
  () => import("./components/AdjectivesScroller")
);
const BrandMarquee = React.lazy(() => import("./components/BrandMarquee"));

const HomePage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>
          The Babes Club | Handcrafted Accessories • Made in Washington, DC
        </title>
      </Helmet>
      {/* Demo: GSAP Flip hero image reveal */}
      {/* Categories split-screen pinning */}
      <HeroClipReveal
        imageSrc="/images/banner/the-babes-club-jewlery.jpg"
        duration={1}
        delay={0.5}
        alt="Back pose model with vertical tattoo design"
        className="min-h-[100svh] w-full"
      />
      {/* Lazy content below the fold */}
      <React.Suspense fallback={null}>
        <BlobGallery className="flex items-center justify-center py-24 " />
        <MasonryGallery />
      </React.Suspense>
      {/* <section className="min-h-[150vh] bg-blue-600"></section> */}
    </>
  );
};

export default HomePage;
