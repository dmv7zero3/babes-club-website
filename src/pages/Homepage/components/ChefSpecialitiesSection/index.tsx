import React from "react";

// Chef Specialties menu data
const chefSpecialties = [
  {
    id: 1,
    name: "Shrimp with Walnuts",
    description:
      "Lightly battered jumbo shrimp tossed in special Gan Xiao sauce, topped with crispy caramelized walnuts",
  },
  {
    id: 2,
    name: "Teriyaki Chicken",
    description: "",
  },
  {
    id: 3,
    name: "Seafood Triple Delight",
    description:
      "Jumbo scallop, shrimp, sea bass & vegetables stir-fried in white wine sauce",
  },
  {
    id: 4,
    name: "Crispy Beef",
    description:
      "Fried shredded beef sautéed with julienne carrot & celery in spicy sweet sauce",
  },
  {
    id: 5,
    name: "Beef with Black Pepper Sauce",
    description:
      "Sliced flank steak sautéed with tangy black pepper sauce, served in hot pot over onion & asparagus",
  },
];

const ChefSpecialitiesSection: React.FC = () => {
  return (
    <section className="relative flex items-center overflow-hidden bg-warm-ivory">
      <div className="container ">
        <div className="grid items-center grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Image Container */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-xl shadow-opera-lg">
              <img
                src="/images/banner/seafood-triple-delight.jpg"
                alt="Seafood Triple Delight, Shrimp with Walnuts, Crispy Beef, and more chef specialties"
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
              <h1 className="text-4xl font-semibold tracking-wide uppercase font-heading md:text-5xl lg:text-6xl text-heritage-blue">
                Chef Specialties
              </h1>
            </div>

            {/* Chef Specialties List */}
            <div className="space-y-6">
              {chefSpecialties.map((item, index) => (
                <div
                  key={item.id}
                  className="pb-6 transition-all duration-300 border-b border-warm-ivory-300/50 last:border-b-0 hover:border-heritage-gold/30"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold transition-colors duration-300 font-heading lg:text-2xl text-heritage-blue hover:text-heritage-gold">
                      {item.name}
                    </h2>
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
                All chef specialties are freshly prepared to order using
                authentic recipes and premium ingredients.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChefSpecialitiesSection;
