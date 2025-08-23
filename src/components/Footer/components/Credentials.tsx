// src/components/Footer/components/Credentials.tsx

import React from "react";

const Credentials: React.FC = () => {
  return (
    <div className="border-t border-warm-ivory-200/20">
      <div className="px-4 py-4 md:px-6 md:py-5 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            <p className="text-sm text-warm-ivory-300">
              A website designed from{" "}
              <a
                href="https://www.marketbrewer.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium transition-colors duration-200 text-heritage-gold hover:text-champagne-gold-500"
              >
                MarketBrewer
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credentials;
