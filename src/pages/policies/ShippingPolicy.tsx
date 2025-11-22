import React from "react";
import { Link } from "react-router-dom";

import { EMAIL } from "@/businessInfo/business";

const ShippingPolicyPage: React.FC = () => {
  const contactEmail = EMAIL;

  return (
    <main className="min-h-[50vh] bg-gradient-to-b from-cotton-candy-100 via-white to-babe-pink-50 py-20 text-slate-900">
      <div className="w-11/12 max-w-3xl mx-auto space-y-6 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-heading text-babe-pink-700">
            Shipping Policy
          </h1>
          <p className="text-base text-slate-700">
            Our detailed shipping guide is under development. We&apos;re mapping
            out delivery zones, carrier options, and target timelines so you
            know exactly when your jewelry will arrive.
          </p>
          <p className="text-sm text-slate-600">
            Check back soon or reach out to{" "}
            <a
              className="font-medium transition text-babe-pink-600 underline-offset-4 hover:text-babe-pink-700 hover:underline"
              href={`mailto:${contactEmail}`}
            >
              {contactEmail}
            </a>{" "}
            if you need assistance with an order in the meantime.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/return-policy"
            className="inline-flex items-center justify-center rounded-full bg-babe-pink px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-[0_18px_35px_rgba(254,59,161,0.25)] transition hover:bg-babe-pink-400 focus:outline-none focus:ring-2 focus:ring-babe-pink/40 focus:ring-offset-2 focus:ring-offset-white"
          >
            View Return Policy
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border border-babe-pink-200 bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.25em] text-babe-pink-600 transition hover:border-babe-pink-300 hover:bg-babe-pink-50 focus:outline-none focus:ring-2 focus:ring-babe-pink/30 focus:ring-offset-2 focus:ring-offset-white"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
};

export default ShippingPolicyPage;
