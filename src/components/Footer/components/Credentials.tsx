// src/components/Footer/components/Credentials.tsx

import React from "react";

const Credentials: React.FC = () => (
  <p className="footer-small text-warm-ivory-300">
    Website design from{" "}
    <a
      href="https://www.marketbrewer.com"
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium transition-colors duration-200 text-heritage-gold hover:text-champagne-gold-500"
    >
      MarketBrewer
    </a>
  </p>
);

export default Credentials;
