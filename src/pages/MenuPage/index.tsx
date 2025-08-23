// src/pages/MenuPage/index.tsx

import React from "react";
import InnerPageHero from "../../components/Hero/InnerPageHero";

import FoodMenuSection from "../../components/FoodMenuSection";
import foodMenu from "../../businessInfo/FoodMenu/FoodMenu";

const MenuPage: React.FC = () => {
  // List of menu section keys in display order
  const sectionKeys = [
    "appetizers",
    "soupsAndSalads",
    "signatureDishes",
    "poultryAndPork",
    "beef",
    "seafood",
    "noodlesAndRice",
    "chefSpecialties",
    "vegetarian",
    "wraps",
    "weightWatchers",
    "sideOrders",
    "beverages",
  ];

  return (
    <>
      <InnerPageHero
        backgroundImage="/images/banner/appetizer-layout.jpg"
        text="Menu"
      />
      {sectionKeys.map((key) => {
        // Handle beverages separately if needed
        if (key === "beverages") {
          const beverages = foodMenu.menu.beverages;
          if (!beverages) return null;
          // Render each beverage sub-section if it exists
          return [
            beverages.mixedDrinks && (
              <FoodMenuSection
                key="mixedDrinks"
                title={beverages.mixedDrinks.title}
                items={beverages.mixedDrinks.items}
                fallbackTitle="Mixed Drinks"
              />
            ),
            beverages.wine && (
              <FoodMenuSection
                key="wine"
                title={beverages.wine.title}
                items={beverages.wine.items}
                fallbackTitle="Wine"
              />
            ),
            beverages.beer && (
              <FoodMenuSection
                key="beer"
                title={beverages.beer.title}
                items={beverages.beer.items}
                fallbackTitle="Beer"
              />
            ),
          ];
        }
        const section = foodMenu.menu[key];
        if (!section) return null;
        return (
          <FoodMenuSection
            key={key}
            title={section.title}
            note={section.note}
            items={section.items}
            fallbackTitle={section.title || key}
          />
        );
      })}
    </>
  );
};

export default MenuPage;
