import React from "react";
import { Phone, MessageCircle } from "lucide-react";
import { SOCIAL_MEDIA } from "../../../businessInfo/business";

const phone = "(703) 858-1441";

const SocialMediaSection: React.FC = () => (
  <div className="p-8 text-center rounded-2xl bg-gradient-to-br from-heritage-blue to-opera-blue-800 text-heritage-ivory">
    <div className="max-w-3xl mx-auto">
      <h3 className="mb-4 text-3xl font-semibold font-heading">
        Follow Our Culinary Journey
      </h3>
      <p className="mb-8 text-lg opacity-90">
        Stay connected for daily specials, behind-the-scenes moments, and the
        latest from our kitchen to yours.
      </p>
      {/* Social Links */}
      <div className="flex justify-center gap-6 mb-8">
        {SOCIAL_MEDIA.facebook && (
          <a
            href={SOCIAL_MEDIA.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-6 py-3 transition-all duration-200 rounded-lg bg-heritage-ivory/10 hover:bg-heritage-ivory/20 hover:scale-105"
            aria-label="Follow us on Facebook"
          >
            <svg
              className="w-6 h-6 mr-3"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M22 12c0-5.522-4.477-10-10-10S2 6.478 2 12c0 5 3.657 9.127 8.438 9.877v-6.987h-2.54v-2.89h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.242 0-1.632.771-1.632 1.562v1.875h2.773l-.443 2.89h-2.33v6.987C18.343 21.127 22 17 22 12" />
            </svg>
            Facebook
          </a>
        )}
        {SOCIAL_MEDIA.instagram && (
          <a
            href={SOCIAL_MEDIA.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-6 py-3 transition-all duration-200 rounded-lg bg-heritage-ivory/10 hover:bg-heritage-ivory/20 hover:scale-105"
            aria-label="Follow us on Instagram"
          >
            <svg
              className="w-6 h-6 mr-3"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5zm4.25 2.25a6.25 6.25 0 1 1 0 12.5 6.25 6.25 0 0 1 0-12.5zm0 1.5a4.75 4.75 0 1 0 0 9.5 4.75 4.75 0 0 0 0-9.5zm6.125 1.125a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0z" />
            </svg>
            Instagram
          </a>
        )}
      </div>
      {/* Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <a
          href={`tel:${phone.replace(/\D/g, "")}`}
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold transition-all duration-200 rounded-lg bg-heritage-gold text-heritage-blue hover:bg-champagne-gold-500 hover:shadow-gold hover:scale-105"
        >
          <Phone className="w-5 h-5 mr-2" />
          Call to Order Now
        </a>
        <button className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold transition-all duration-200 border-2 rounded-lg border-heritage-ivory/30 text-heritage-ivory hover:bg-heritage-ivory/10 hover:border-heritage-ivory/50">
          <MessageCircle className="w-5 h-5 mr-2" />
          Leave a Review
        </button>
      </div>
    </div>
  </div>
);

export default SocialMediaSection;
