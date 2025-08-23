import React from "react";

// Define the lunch specials items data
const lunchSpecials = [
  {
    id: 1,
    name: "Chicken Lo Mein",
    description: "",
  },
  {
    id: 2,
    name: "Sweet & Sour Chicken",
    description:
      "Fried lightly battered chicken, onion, bell peppers and pineapple, sauce on the side",
  },
  {
    id: 3,
    name: "Kung Pao Chicken",
    description:
      "Diced chicken, carrot, celery, water chestnuts & peanuts with spicy brown sauce",
  },
  {
    id: 4,
    name: "General Tso's Chicken",
    description:
      "Fried lightly breaded chicken breast with special home-made sauce",
  },
  {
    id: 5,
    name: "Chicken with Mixed Vegetables",
    description: "",
  },
];

const LunchSpecialsSection: React.FC = () => {
  return (
    <section className="relative flex items-center overflow-hidden bg-warm-ivory">
      <div className="container">
        <div className="grid items-center grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Content Container - Now on the left */}
          <div className="space-y-8 lg:pr-8">
            {/* Section Header */}
            <div className="space-y-4">
              <h2 className="text-4xl font-semibold tracking-wide uppercase font-heading md:text-5xl lg:text-6xl text-heritage-blue">
                Lunch Specials
              </h2>
            </div>

            {/* Lunch Specials List */}
            <div className="space-y-6">
              {lunchSpecials.map((item, index) => (
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
                    {item.description && (
                      <p className="text-sm leading-relaxed text-rich-mahogany-700 lg:text-base">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Optional CTA or additional info */}
            <div className="pt-4">
              <p className="text-sm italic text-heritage-gold">
                Available Monday through Friday, 11:30 AM - 3:00 PM. All lunch
                specials served with steamed rice.
              </p>
            </div>
          </div>

          {/* Image Container - Now on the right */}
          <div className="relative order-first lg:order-last">
            <div className="relative overflow-hidden rounded-xl shadow-opera-lg">
              <img
                src="/images/banner/lunch-specials.jpg"
                alt="Delicious lunch specials featuring chicken lo mein, sweet & sour chicken, and kung pao chicken"
                className="object-cover w-full h-full"
                loading="lazy"
              />
              {/* Subtle overlay for better text contrast on hover */}
              <div className="absolute inset-0 transition-opacity duration-500 opacity-0 bg-gradient-to-l from-heritage-blue/10 to-transparent hover:opacity-100" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LunchSpecialsSection;
