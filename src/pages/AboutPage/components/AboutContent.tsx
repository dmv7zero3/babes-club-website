// src/pages/AboutPage/components/AboutContent.tsx

import React from "react";

const AboutContent: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-warm-ivory-100 ">
      <div className="container">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-6xl font-normal font-kristi text-champagne-gold-900">
            our
          </h1>
          <h1 className="heading-1 text-opera-blue-900">PHILOSOPHY</h1>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-16 mb-16 lg:grid-cols-2 lg:gap-20">
          {/* Food Image */}
          <div className="relative h-[500px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl">
            <div
              className="absolute inset-0 w-full h-full bg-center bg-no-repeat bg-cover"
              style={{
                backgroundImage: "url('/images/banner/food-layout.jpg')",
              }}
            />
          </div>

          {/* Philosophy Text */}
          <div className="space-y-8">
            <div className="space-y-8 paragraph">
              <h1 className="text-left heading-1">Welcome to Excellence</h1>
              <p>
                Welcome to Cafe Opera and be prepared to enjoy delicious,
                delicate and delightful Asian cuisines, in an environment
                designed for comfort against a virtual backdrop decked with
                enchanting music.
              </p>

              <p>
                To offer only the best of authentic Asian cuisines is the pledge
                of Cafe Opera. Each order will tell the long years of expertise
                behind the chefs and bear witness to our meticulous process of
                food preparation and cooking.
              </p>
            </div>

            <div className="space-y-8 paragraph">
              <h3 className="text-left heading-1 ">Our Environment</h3>
              <p className="">
                Our tasteful selection of music will blend in perfectly with the
                good food and wine we serve. Our thorough understanding and
                mastery of innovative and traditional culinary art will surely
                open a new horizon to any gourmet guest such as yourself.
              </p>

              <p className="">
                It was never our intention to provide restaurant extravaganza.
                Situated in a layout telling of the brainchild of a
                customer-caring interior designer, soothed by the glow of
                romantic lighting, customers can expect to dine in the peace and
                pleasure of an environment where there is total harmony.
              </p>
            </div>
          </div>
        </div>

        {/* Health Commitment */}
        <div className="mx-auto text-center border rounded-2xl bg-warm-ivory-200/50 border-champagne-gold-200/30">
          <h3 className="mb-8 text-left heading-1">
            Our Health-Conscious Promise
          </h3>

          <div className="space-y-8 text-left">
            <p className="paragraph">
              The menu we offer boasts variety and not volume. While we work
              hard to satisfy the gourmets, we have not overlooked the
              specialized demands of vegetarians and children. As you all may
              be, we too are extremely health conscious, and to provide cuisines
              conducive to physical health and growth is our guiding principle.
            </p>

            <p className="paragraph">
              With the use of minimum oil, preservatives and additives, we are
              confident that customers will rediscover the real taste of food in
              Cafe Opera. It is our mission to ensure that customers will find
              each and every of their visits to Cafe Opera a most delightful
              experience.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutContent;
