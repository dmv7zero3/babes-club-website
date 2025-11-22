import React from "react";

import {
  BUSINESS_CITY,
  BUSINESS_DESCRIPTION,
  BUSINESS_STATE,
} from "@/businessInfo/business";

import { ESTABLISHED_YEAR } from "./aboutData";

const AboutHero: React.FC = () => {
  return (
    <section className="bg-gradient-to-r from-cotton-candy-100 via-white to-babe-pink-50">
      <div className="flex flex-col max-w-6xl gap-6 px-6 py-16 mx-auto text-slate-900 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl space-y-4">
          <p className="font-mono text-xs uppercase tracking-[0.38em] text-babe-pink-600">
            Est. {ESTABLISHED_YEAR} · {BUSINESS_CITY}, {BUSINESS_STATE}
          </p>
          <h2 className="text-3xl font-heading text-babe-pink-700 md:text-4xl">
            Handcrafted accessories for bold self-expression.
          </h2>
          <p className="text-base text-slate-700 md:text-lg">
            {BUSINESS_DESCRIPTION}
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm text-slate-700 md:text-right">
          {/* <a
            href={SHOP_URL}
            className="inline-flex items-center justify-center rounded-full border border-babe-pink-200 bg-white px-6 py-3 font-semibold uppercase tracking-[0.28em] text-babe-pink-600 shadow-[0_20px_35px_rgba(254,59,161,0.2)] transition hover:border-babe-pink-300 hover:bg-babe-pink-50"
            target={SHOP_URL_IS_EXTERNAL ? "_blank" : undefined}
            rel={SHOP_URL_IS_EXTERNAL ? "noreferrer" : undefined}
          >
            Shop the collection
          </a> */}
          <span className="text-xs uppercase tracking-[0.28em] text-slate-500">
            DMV Pickup · Custom Orders · Bulk Pricing
          </span>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
