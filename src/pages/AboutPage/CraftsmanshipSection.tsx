import React from "react";

import { MATERIALS, SERVICE_OPTIONS } from "./aboutData";

const CraftsmanshipSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-br from-cotton-candy-100 via-white to-babe-pink-50 text-slate-900">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2">
        <div className="space-y-6">
          <h3 className="font-heading text-3xl text-babe-pink-700 md:text-4xl">
            Crafted in micro-batches, loved in every city.
          </h3>
          <p className="text-lg text-slate-700">
            Necklaces land at $30 each or 4 for $100, with our multicolor Cotton
            Candy and 7UP styles coming in at $34. Earrings stay easy at $25
            each or 5 for $100. Mix, match, and bundle across colors—it&apos;s
            how we keep luxury playful and accessible.
          </p>
          <p className="text-lg text-slate-700">
            We obsess over material finishes, polish every clasp, and inspect
            each piece before packaging. Our chains and findings are sourced
            through trusted partners, then assembled in Washington, DC to ensure
            unmatched quality and turn-around speed for custom and bulk
            requests.
          </p>
        </div>
        <div className="space-y-8">
          <div className="rounded-3xl border border-babe-pink-100 bg-white/90 p-8 shadow-[0_20px_45px_rgba(254,59,161,0.18)]">
            <h4 className="font-heading text-xl text-babe-pink-700">
              Signature services
            </h4>
            <ul className="mt-5 space-y-3 text-sm uppercase tracking-[0.2em] text-slate-600">
              {SERVICE_OPTIONS.map((option) => (
                <li key={option} className="flex items-center gap-3">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-babe-pink-200 bg-babe-pink-50 text-babe-pink-600">
                    ★
                  </span>
                  <span>{option}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-babe-pink-100 bg-white/95 p-8 shadow-[0_18px_40px_rgba(254,59,161,0.15)]">
            <h4 className="font-heading text-xl text-babe-pink-700">
              Materials we adore
            </h4>
            <p className="mt-3 text-sm text-slate-600">
              {MATERIALS.length
                ? MATERIALS.join(" · ")
                : "Gold chains · Silver chains · Custom color palettes"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CraftsmanshipSection;
