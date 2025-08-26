import React from "react";
import type { MenuItem } from "../../businessInfo/FoodMenu/FoodMenu.types";

interface FoodMenuSectionProps {
  title: string;
  note?: string;
  items?: MenuItem[];
  fallbackTitle?: string;
}

const FoodMenuSection: React.FC<FoodMenuSectionProps> = ({
  title,
  note,
  items,
  fallbackTitle,
}) => {
  if (!title) {
    return (
      <section className="mb-12">
        <h2 className="pb-2 text-2xl font-bold tracking-widest text-center uppercase mb-9 sm:text-3xl">
          {fallbackTitle || "Menu Section"}
        </h2>
        <div className="italic text-center text-gray-500">
          Menu data not available.
        </div>
      </section>
    );
  }
  return (
    <div className="py-12 bg-white ">
      <main className="w-11/12 mx-auto max-w-7xl ">
        <section>
          <div className="mb-12 ">
            <h2 className="pb-2 font-bold tracking-widest text-center uppercase heading-2 font-lato text-opera-blue-800 ">
              {title}
            </h2>
            {note && (
              <p className="mt-2.5 mb-6 italic text-center text-gray-500 paragraph-md">
                {note}
              </p>
            )}
          </div>

          <ul className="grid grid-cols-1 gap-y-8 lg:grid-cols-2 gap-x-8 ">
            {items && items.length > 0 ? (
              items.map((item, idx) => {
                if (!item.name && !item.description && item.price === undefined)
                  return null;
                const key = item.id ? `${item.id}-${idx}` : idx;
                return (
                  <li
                    key={key}
                    className="flex flex-col py-4 text-left md:px-4 sm:flex-row"
                  >
                    <div className="flex-1">
                      <span className="flex flex-col items-start text-left lg:flex-row paragraph-md">
                        <span className="font-semibold uppercase paragraph font-lato text-opera-blue-800 ">
                          {item.name || fallbackTitle || "Menu Item"}
                        </span>
                        {item.spicy && (
                          <span className="mt-0.5 lg:ml-2 paragraph-sm font-bold text-red-500 ">
                            SPICY
                          </span>
                        )}
                        {item.signature && (
                          <span className="mt-0.5 lg:ml-2 paragraph-sm  font-bold text-green-600">
                            SIGNATURE
                          </span>
                        )}
                        {item.bestSeller && (
                          <span className="mt-0.5 lg:ml-2 paragraph-sm  font-bold text-yellow-600 ">
                            BEST SELLER
                          </span>
                        )}
                      </span>
                      {item.description && (
                        <div className="mt-1.5   text-gray-700 paragraph-md">
                          {item.description}
                        </div>
                      )}
                      {item.quantity && (
                        <div className="mt-2.5 text-gray-500 paragraph-md">
                          {item.quantity}
                        </div>
                      )}
                      {item.serves && (
                        <div className="mt-3.5 lg:mt-1  text-gray-500 paragraph-md">
                          Serves {item.serves}
                        </div>
                      )}
                    </div>
                    {item.price !== undefined && (
                      <div className="sm:ml-4 mt-3 lg:mt-2 text-left lg:text-right font-semibold paragraph-md min-w-[70px] text-opera-blue-800">
                        ${item.price.toFixed(2)}
                      </div>
                    )}
                  </li>
                );
              })
            ) : (
              <li className="py-4 italic text-gray-500">No items available.</li>
            )}
          </ul>
        </section>
      </main>
    </div>
  );
};

export default FoodMenuSection;
