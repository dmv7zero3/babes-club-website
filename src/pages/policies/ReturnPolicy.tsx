import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

import { EMAIL } from "@/businessInfo/business";

const ReturnPolicyPage: React.FC = () => {
  const contactEmail = EMAIL;

  return (
    <main className="min-h-[50vh] bg-gradient-to-b from-cotton-candy-100 via-white to-babe-pink-50 py-20 text-slate-900">
      <Helmet>
        <title>Return Policy | The Babes Club</title>
      </Helmet>
      <div className="w-11/12 max-w-3xl mx-auto space-y-6 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-heading text-babe-pink-700">
            Return Policy
          </h1>
          <p className="text-base text-slate-700">
            Our returns experience is being polished right now. We&apos;re
            drafting clear guidelines for eligibility, timelines, and prepaid
            labels so you can shop confidently.
          </p>
          <p className="text-sm text-slate-600">
            Need help today? Email{" "}
            <a
              className="font-medium transition text-babe-pink-600 underline-offset-4 hover:text-babe-pink-700 hover:underline"
              href={`mailto:${contactEmail}`}
            >
              {contactEmail}
            </a>{" "}
            and the team will jump in.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {/* <Link
          to="/shipping-policy"
          className="inline-flex items-center justify-center rounded-full bg-babe-pink px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-[0_18px_35px_rgba(254,59,161,0.25)] transition hover:bg-babe-pink-400 focus:outline-none focus:ring-2 focus:ring-babe-pink/40 focus:ring-offset-2 focus:ring-offset-white"
        >
          View Shipping Policy
        </Link> */}
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

export default ReturnPolicyPage;
