import React from "react";

import { BUSINESS_NAME } from "@/businessInfo/business";

import { FORMATTED_ADDRESS, SPECIAL_NOTICES } from "./aboutData";

const StorySection: React.FC = () => {
  return (
    <section className="bg-gradient-to-br from-white via-cotton-candy-50 to-babe-pink-50 py-20">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <h3 className="font-heading text-3xl text-babe-pink-700 md:text-4xl">
            From pop-ups to polished heirlooms.
          </h3>
          <p className="text-lg text-slate-700">
            {BUSINESS_NAME} started as a hometown pop-up answering a simple
            question: where do we find jewelry that feels luxurious,
            doesn&apos;t gatekeep style, and celebrates our community? We source
            materials in small batches, assemble every strand by hand, and test
            designs in real life so each piece keeps up with nights out, special
            events, and everyday glow-ups.
          </p>
          <p className="text-lg text-slate-700">
            Every collection is guided by bold color theory, high-quality
            chains, and comfort-first findings. We design earrings that stay
            lightweight and necklaces that layer smoothly, whether you&apos;re
            styling a single signature shade or building a full spectrum.
          </p>
        </div>
        <div className="rounded-3xl border border-babe-pink-100 bg-white/90 p-8 shadow-[0_20px_45px_rgba(254,59,161,0.12)]">
          <h4 className="font-heading text-xl text-babe-pink-700">
            What drives us
          </h4>
          <ul className="mt-5 space-y-3 text-slate-700">
            {SPECIAL_NOTICES.map((notice) => (
              <li key={notice} className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-babe-pink" />
                <span>{notice}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-2xl bg-gradient-to-r from-babe-pink-50 via-white to-cotton-candy-100 p-6 text-sm text-slate-600 shadow-[0_10px_25px_rgba(254,59,161,0.12)]">
            <p className="font-semibold uppercase tracking-[0.32em] text-babe-pink-600">
              Studio HQ
            </p>
            <p>{FORMATTED_ADDRESS}</p>
            <p className="mt-1">Serving the DMV and shipping nationwide.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StorySection;
