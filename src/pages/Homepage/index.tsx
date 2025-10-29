import React from "react";
import { BUSINESS_NAME, BUSINESS_DESCRIPTION } from "@/businessInfo/business";

const missionStatement =
  "Life Missions International exists to strengthen communities and transform lives through compassionate service, education, and sustainable development. We work to empower individuals and families to achieve self-sufficiency, foster unity, and create lasting change. Guided by faith and a commitment to human dignity, we partner with local and global communities to build hope, promote holistic growth, and inspire a world where everyone has the opportunity to thrive.";

const focusAreas = [
  {
    title: "Compassionate Service",
    description:
      "We meet practical needs with dignity—supporting food access, family services, and emergency assistance for our neighbors in Washington, D.C.",
  },
  {
    title: "Education & Empowerment",
    description:
      "We equip individuals and families with resources, workshops, and mentorship that nurture self-sufficiency and long-term stability.",
  },
  {
    title: "Sustainable Development",
    description:
      "We collaborate with community partners and global allies to build programs that create lasting impact and pathways to thriving communities.",
  },
];

const HomePage: React.FC = () => {
  return (
    <div className="relative isolate">
      <section className="relative overflow-hidden bg-primary-900 text-white">
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="container flex min-h-[70vh] flex-col items-center justify-center gap-8 py-24 text-center">
          <span className="inline-flex items-center rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-primary-100 bg-white/5">
            Guided by faith & service
          </span>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
            Building hope with {BUSINESS_NAME}
          </h1>
          <p className="max-w-2xl text-lg text-primary-100 sm:text-xl">
            {BUSINESS_DESCRIPTION}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="mailto:dahconsultants@gmail.com" className="btn-primary">
              Partner with us
            </a>
            <a
              href="#mission"
              className="btn-outline border-white text-white hover:border-white/80 hover:bg-white/10 hover:text-white"
            >
              Learn more
            </a>
          </div>
        </div>
      </section>

      <section id="mission" className="container -mt-20 space-y-12 pb-24">
        <div className="rounded-3xl border border-primary-800/10 bg-white p-10 shadow-xl">
          <h2 className="text-3xl font-semibold text-primary-800">
            Our Mission
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-neutral-700">
            {missionStatement}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {focusAreas.map((area) => (
            <div
              key={area.title}
              className="flex flex-col gap-3 rounded-2xl border border-primary-800/10 bg-background p-6 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-primary-700">
                {area.title}
              </h3>
              <p className="text-base text-neutral-700">{area.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
