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
        <h2 className="pb-2 mb-6 text-2xl font-bold tracking-widest text-center uppercase sm:text-3xl">
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
        <section className="mb-12 ">
          <h2 className="pb-2 mb-6 text-5xl font-bold tracking-widest text-center uppercase lg:text-3xl">
            {title}
          </h2>
          {note && (
            <div className="mb-4 text-sm italic text-center text-gray-500">
              {note}
            </div>
          )}
          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 ">
            {items && items.length > 0 ? (
              items.map((item, idx) => {
                if (!item.name && !item.description && item.price === undefined)
                  return null;
                const key = item.id ? `${item.id}-${idx}` : idx;
                return (
                  <li
                    key={key}
                    className="flex flex-col py-4 md:px-4 sm:flex-row sm:items-start"
                  >
                    <div className="flex-1">
                      <span className="flex items-center ">
                        <span className="text-4xl font-semibold md:text-3xl lg:text-lg">
                          {item.name || fallbackTitle || "Menu Item"}
                        </span>
                        {item.spicy && (
                          <span className="mt-0.5 ml-2 text-xl font-bold text-red-500 lg:text-xs">
                            SPICY
                          </span>
                        )}
                        {item.signature && (
                          <span className="mt-0.5 ml-2 text-xl font-bold text-green-600 lg:text-xs">
                            SIGNATURE
                          </span>
                        )}
                        {item.bestSeller && (
                          <span className="mt-0.5 ml-2 text-xl font-bold text-yellow-600 lg:text-xs">
                            BEST SELLER
                          </span>
                        )}
                      </span>
                      {item.description && (
                        <div className="mt-3.5 md:mt-2.5 text-3xl md:text-2xl text-gray-700 lg:text-base">
                          {item.description}
                        </div>
                      )}
                      {item.quantity && (
                        <div className="mt-1 text-3xl text-gray-500 md:text-2xl lg:text-sm">
                          {item.quantity}
                        </div>
                      )}
                      {item.serves && (
                        <div className="mt-3.5 lg:mt-1 text-3xl md:text-2xl text-gray-500 lg:text-sm">
                          Serves {item.serves}
                        </div>
                      )}
                    </div>
                    {item.price !== undefined && (
                      <div className="sm:ml-4 mt-2 text-right font-semibold text-3xl md:text-2xl lg:text-base min-w-[70px] text-gray-900">
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
