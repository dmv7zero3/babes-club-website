import React from "react";
import { motion } from "framer-motion";
import { ContentContainerProps } from "../types";

const ContentContainer: React.FC<ContentContainerProps> = () => {
  return (
    <div className="space-y-8">
      {/* Discover Header */}
      <div className="space-y-4">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-champagne-gold-900 font-['Kristi'] text-4xl md:text-5xl"
        >
          discover
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl font-normal leading-tight text-rich-mahogany font-heading md:text-5xl lg:text-6xl"
        >
          OUR STORY
        </motion.h2>
      </div>

      {/* Content Text */}
      <div className="space-y-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg leading-relaxed text-rich-mahogany/80 font-body"
        >
          FOR THOSE WHO LOVE SUPERB AND AUTHENTIC CHINESE AND PAN-ASIAN CUISINE.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-base leading-relaxed text-rich-mahogany/70 font-body"
        >
          CAFÉ OPERA GOES FOR THE FRESHEST AND FINEST INGREDIENTS AND METICULOUS
          COOKING.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="pt-4"
        >
          <p className="mb-6 text-base leading-relaxed text-rich-mahogany/70 font-body">
            Since 2004, Arthur and Tin Kong have brought the authentic flavors
            of Hong Kong to Ashburn, Virginia. Our family-owned restaurant
            combines traditional Hong Kong cuisine with the warmth of American
            hospitality, creating dishes that honor our heritage while welcoming
            all who seek exceptional food made with care.
          </p>

          <p className="text-base leading-relaxed text-rich-mahogany/70 font-body">
            Every dish is prepared fresh to order using only the finest
            ingredients, with no MSG, ensuring that each meal reflects our
            commitment to both authenticity and quality. As opera music fills
            our dining room—a nod to our passion for the arts—we invite you to
            become part of our extended family.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ContentContainer;
