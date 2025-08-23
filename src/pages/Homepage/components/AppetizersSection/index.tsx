import React from "react";

// Define the appetizer items data
const appetizers = [
  {
    id: 1,
    name: "Spring Roll",
    description:
      "Home-made crispy spring rolls filled with shrimp, ground beef & vegetables | 2 qty",
  },
  {
    id: 2,
    name: "Crab Rangoon",
    description:
      "Appetizing starter with imitation crab meat & cream cheese wrapped with wonton skin | 6 qty",
  },
  {
    id: 3,
    name: "Chicken Satay",
    description:
      "Grilled juicy & tender chicken skewers served with spicy peanut satay sauce on the side | 4 qty",
  },
  {
    id: 4,
    name: "Chicken Wing",
    description: "Fried chicken wings marinated with lemongrass",
  },
  {
    id: 5,
    name: "Crispy Wonton",
    description: "Fried chicken wonton",
  },
];

const AppetizersSection: React.FC = () => {
  return (
    <section className="relative flex items-center overflow-hidden bg-warm-ivory">
      <div className="container">
        <div className="grid items-center grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Image Container */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-xl shadow-opera-lg">
              <img
                src="/images/banner/appetizer-layout.jpg"
                alt="Delicious appetizers including spring rolls, crab rangoon, and chicken wings"
                className="object-cover w-full h-full"
                loading="lazy"
              />
              {/* Subtle overlay for better text contrast on hover */}
              <div className="absolute inset-0 transition-opacity duration-500 opacity-0 bg-gradient-to-r from-heritage-blue/10 to-transparent hover:opacity-100" />
            </div>
          </div>

          {/* Content Container */}
          <div className="space-y-8 lg:pl-8">
            {/* Section Header */}
            <div className="space-y-4">
              <h2 className="text-5xl font-semibold tracking-wide uppercase font-heading lg:text-6xl text-heritage-blue">
                Appetizers
              </h2>
            </div>

            {/* Appetizers List */}
            <div className="space-y-6">
              {appetizers.map((item, index) => (
                <div
                  key={item.id}
                  className="pb-6 transition-all duration-300 border-b border-warm-ivory-300/50 last:border-b-0 hover:border-heritage-gold/30"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold transition-colors duration-300 font-heading lg:text-2xl text-heritage-blue hover:text-heritage-gold">
                      {item.name}
                    </h3>
                    <p className="text-sm leading-relaxed text-rich-mahogany-700 lg:text-base">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Optional CTA or additional info */}
            <div className="pt-4">
              <p className="text-sm italic text-heritage-gold">
                All appetizers are freshly prepared to order using authentic
                recipes and premium ingredients.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppetizersSection;
