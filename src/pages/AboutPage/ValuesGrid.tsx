import React from "react";
import { Link } from "react-router-dom";

import { COMPETITIVE_ADVANTAGES } from "./aboutData";

const ValuesGrid: React.FC = () => {
  return (
    <section className="bg-gradient-to-r from-white via-cotton-candy-50 to-babe-pink-50 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-4">
            <h3 className="font-heading text-3xl text-babe-pink-700 md:text-4xl">
              Community at the center.
            </h3>
            <p className="text-lg text-slate-700">
              We&apos;re proudly women-owned and rooted in the DMV. From local
              pickup to bulk orders for weddings, sororities, and creative
              collectives, every drop is built to celebrate the people who wear
              it.
            </p>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center rounded-full border border-babe-pink-200 bg-white px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.32em] text-babe-pink-700 transition hover:border-babe-pink-300 hover:bg-babe-pink-50"
          >
            Explore the shop
          </Link>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {COMPETITIVE_ADVANTAGES.map((advantage) => (
            <div
              key={advantage}
              className="group relative overflow-hidden rounded-3xl border border-babe-pink-100 bg-white/90 p-8 shadow-[0_16px_40px_rgba(254,59,161,0.12)] transition hover:border-babe-pink-300 hover:shadow-[0_20px_50px_rgba(254,59,161,0.18)]"
            >
              <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-babe-pink-200/40 blur-3xl transition group-hover:scale-125" />
              <p className="relative text-base font-semibold text-babe-pink-700">
                {advantage}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValuesGrid;
