import React from "react";

import { getSocialLinks } from "./aboutData";

const SocialLinksSection: React.FC = () => {
  const socialLinks = getSocialLinks();

  return (
    <section className="bg-gradient-to-r from-cotton-candy-50 via-white to-babe-pink-50 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="rounded-3xl border border-babe-pink-100 bg-white/90 p-12 shadow-[0_24px_50px_rgba(254,59,161,0.15)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <p className="font-mono text-xs uppercase tracking-[0.32em] text-babe-pink-600">
                Stay connected
              </p>
              <h3 className="font-heading text-3xl text-babe-pink-700 md:text-4xl">
                Follow the drip in real time.
              </h3>
              <p className="max-w-xl text-base text-slate-700 md:text-lg">
                Pop-up announcements, studio drops, and styling inspo live on
                the gram. Tap through to be first in line for new colorways and
                custom order slots.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.handle}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full border border-babe-pink-200 bg-white px-5 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-babe-pink-700 transition hover:border-babe-pink-300 hover:bg-babe-pink-50"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-babe-pink text-white transition group-hover:bg-white group-hover:text-babe-pink-600">
                    #
                  </span>
                  {link.handle}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialLinksSection;
