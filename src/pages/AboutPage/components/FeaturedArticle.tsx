// src/pages/AboutPage/components/FeaturedArticle.tsx

import React from "react";

const FeaturedArticle: React.FC = () => {
  return (
    <section className="relative overflow-hidden py-22 lg:py-24">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-center bg-no-repeat bg-cover"
        style={{
          backgroundImage: "url('/images/banner/golden-chicken.jpg')",
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-rich-mahogany-900/80" />

      <div className="relative z-10 w-11/12 max-w-4xl py-16 mx-auto text-center lg:py-0">
        {/* Featured Badge */}
        <div className="mb-8">
          <div className="inline-flex items-center px-6 py-3 space-x-3 rounded-full bg-champagne-gold-400/90 backdrop-blur-sm">
            <svg
              className="w-6 h-6 text-opera-blue"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold paragraph-md text-opera-blue">
              Featured Restaurant
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-10 shadow-2xl rounded-3xl bg-warm-ivory-200/95 backdrop-blur-sm">
          <h2 className="mb-6 heading-2-sub text-opera-blue ">
            Featured in Ashburn Magazine
          </h2>

          <p className="mb-8 paragraph text-rich-mahogany-700">
            CafeOpera was recently featured in Ashburn Magazine – Check out the
            article about our commitment to authentic Asian cuisine and
            exceptional dining experience.
          </p>

          <a
            href="https://www.ashburnmagazine.com/winedine/ashburn-restaurateurs-prove-they-have-staying-power/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-base btn-md bg-opera-blue text-warm-ivory-50"
          >
            Read the Full Article
            <svg
              className="w-5 h-5 ml-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};

export default FeaturedArticle;
