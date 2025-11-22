import React from "react";

import {
  CONTACT_EMAIL_HREF,
  CONTACT_EMAIL_IS_EXTERNAL,
  CONTACT_EMAIL_LABEL,
  SHOP_URL,
  SHOP_URL_IS_EXTERNAL,
} from "./aboutData";

const CallToActionBanner: React.FC = () => {
  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-r from-cotton-candy-100 via-white to-babe-pink-50 text-slate-900">
      <div className="absolute inset-0 bg-gradient-to-r from-babe-pink-100/60 via-transparent to-cotton-candy-200/70 blur-3xl" />
      <div className="relative flex flex-col items-center max-w-5xl gap-6 px-6 mx-auto text-center">
        <p className="font-mono text-xs uppercase tracking-[0.38em] text-babe-pink-600">
          Let&apos;s collaborate
        </p>
        <h3 className="text-3xl font-heading text-babe-pink-700 md:text-4xl">
          Planning a custom run or bulk order?
        </h3>
        <p className="max-w-3xl text-base text-slate-700 md:text-lg">
          Whether you&apos;re outfitting a bridal party, styling a creative
          shoot, or refreshing your shop assortment, we&apos;ve got you. Share
          your moodboard, palette, and timeline—we&apos;ll bring it to life with
          signature Babes Club shine.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href={CONTACT_EMAIL_HREF}
            className="rounded-full bg-babe-pink px-6 py-3 text-sm font-semibold uppercase tracking-[0.32em] text-white shadow-[0_20px_35px_rgba(254,59,161,0.25)] transition hover:bg-babe-pink-400 focus:outline-none focus:ring-2 focus:ring-babe-pink/40 focus:ring-offset-2 focus:ring-offset-white"
            target={CONTACT_EMAIL_IS_EXTERNAL ? "_blank" : undefined}
            rel={CONTACT_EMAIL_IS_EXTERNAL ? "noreferrer" : undefined}
          >
            {CONTACT_EMAIL_LABEL}
          </a>
          {/* <a
            href={SHOP_URL}
            target={SHOP_URL_IS_EXTERNAL ? "_blank" : undefined}
            rel={SHOP_URL_IS_EXTERNAL ? "noreferrer" : undefined}
            className="rounded-full border border-babe-pink-200 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.32em] text-babe-pink-600 transition hover:border-babe-pink-300 hover:bg-babe-pink-50"
          >
            Browse catalog
          </a> */}
        </div>
      </div>
    </section>
  );
};

export default CallToActionBanner;
