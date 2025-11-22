import React from "react";
import { CalendarDays, Gift, Mail, Sparkles } from "lucide-react";

import ContactForm from "@/components/ContactForm/ContactForm";
import businessInfo from "@/businessInfo/business-data.json";
import { EMAIL } from "@/businessInfo/business";

const ContactPage: React.FC = () => {
  const contactEmail = EMAIL;
  const pickupDetails =
    businessInfo?.location_details?.pickup ||
    "DMV pickup available by appointment.";

  const socialLinks = [
    {
      label: "Instagram",
      href: businessInfo?.social_media?.instagram_main,
    },
    {
      label: "Shop",
      href: businessInfo?.social_media?.instagram_shop,
    },
  ].filter((link) => Boolean(link.href));

  const includeSuggestions = [
    "Event date or occasion",
    "Desired quantities or budget",
    "Preferred color stories or materials",
    "Pickup, delivery, or shipping preferences",
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-cotton-candy-100 via-white to-babe-pink-50 text-slate-900">
      <section className="mx-auto w-11/12 max-w-6xl py-24">
        <div className="space-y-6 text-center md:text-left">
          <p className="text-sm uppercase tracking-[0.35em] text-babe-pink-500">
            Contact The Babes Club
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-babe-pink-700 md:text-5xl">
            Let’s dream up your next statement piece
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-slate-700">
            Whether you’re planning a custom design, stocking your boutique, or
            booking a pop-up, we’re here to co-create something unforgettable.
            Share a few details below and our team will reply within one
            business day.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="space-y-8">
            <section className="rounded-3xl border border-babe-pink-100 bg-gradient-to-br from-white via-cotton-candy-50 to-babe-pink-50 p-6 shadow-[0_25px_60px_rgba(254,59,161,0.18)]">
              <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-babe-pink-600">
                What to expect
              </h2>
              <ul className="mt-5 space-y-4 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="rounded-full bg-babe-pink-100 p-2 text-babe-pink-500 shadow-inner">
                    <Mail size={18} />
                  </span>
                  <div>
                    <p className="font-medium text-babe-pink-700">
                      Direct replies
                    </p>
                    <a
                      href={`mailto:${contactEmail}`}
                      className="text-sm text-babe-pink-600 transition hover:text-babe-pink-700"
                    >
                      {contactEmail}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="rounded-full bg-babe-pink-100 p-2 text-babe-pink-500 shadow-inner">
                    <CalendarDays size={18} />
                  </span>
                  <div>
                    <p className="font-medium text-babe-pink-700">
                      Quick turnaround
                    </p>
                    <p className="text-slate-600">
                      Replies within one business day.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="rounded-full bg-babe-pink-100 p-2 text-babe-pink-500 shadow-inner">
                    <Gift size={18} />
                  </span>
                  <div>
                    <p className="font-medium text-babe-pink-700">
                      DMV pickup ready
                    </p>
                    <p className="text-slate-600">{pickupDetails}</p>
                  </div>
                </li>
              </ul>
            </section>

            <section className="rounded-3xl border border-babe-pink-100 bg-white/90 p-6 shadow-[0_20px_45px_rgba(254,59,161,0.16)] backdrop-blur-sm">
              <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-babe-pink-600">
                When you write, include…
              </h2>
              <ul className="mt-5 space-y-3 text-sm text-slate-700">
                {includeSuggestions.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-babe-pink-200 bg-babe-pink-50 text-[0.65rem] text-babe-pink-600">
                      <Sparkles size={12} />
                    </span>
                    <p>{item}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-3xl border border-babe-pink-100 bg-white/95 p-6 shadow-[0_18px_40px_rgba(254,59,161,0.15)] backdrop-blur-sm">
              <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-babe-pink-600">
                Follow along
              </h2>
              <p className="mt-4 text-sm text-slate-700">
                Get daily looks, drop announcements, and behind-the-scenes
                moments.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-babe-pink-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-babe-pink-600 transition hover:border-babe-pink-300 hover:bg-babe-pink-50"
                  >
                    <Sparkles size={14} />
                    <span>{link.label}</span>
                  </a>
                ))}
                {socialLinks.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Follow us on Instagram @thebabesclub.
                  </p>
                ) : null}
              </div>
            </section>
          </div>

          <ContactForm />
        </div>
      </section>
    </main>
  );
};

export default ContactPage;
