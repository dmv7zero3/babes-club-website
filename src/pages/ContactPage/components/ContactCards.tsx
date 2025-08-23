import React from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import {
  BUSINESS_NAME,
  EMAIL,
  getFormattedAddress,
} from "../../../businessInfo/business";

const ContactCards: React.FC = () => {
  const phone = "(703) 858-1441";
  return (
    <div className="grid grid-cols-1 gap-8 mb-16 lg:grid-cols-3">
      {/* Phone Card */}
      <div className="text-center transition-all duration-300 border-2 group card hover:shadow-opera-lg hover:-translate-y-1 bg-gradient-to-br from-opera-blue-50 to-opera-blue-100 border-opera-blue-200">
        <div className="p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 transition-colors duration-300 rounded-full bg-opera-blue-900 group-hover:bg-opera-blue-800 shadow-opera">
            <Phone className="w-8 h-8 text-warm-ivory-50" />
          </div>
          <h3 className="mb-4 text-xl font-semibold font-heading text-opera-blue-900">
            Call to Order
          </h3>
          <p className="mb-4 font-medium text-rich-mahogany-800">
            Speak directly with our team for orders, reservations, or questions
          </p>
          <a
            href={`tel:${phone.replace(/\D/g, "")}`}
            className="inline-flex items-center px-6 py-3 text-lg font-bold transition-all duration-200 transform rounded-lg bg-champagne-gold-400 text-opera-blue-900 hover:bg-champagne-gold-500 hover:shadow-gold hover:scale-105"
          >
            <Phone className="w-5 h-5 mr-2" />
            {phone}
          </a>
        </div>
      </div>

      {/* Email Card */}
      <div className="text-center transition-all duration-300 border-2 group card hover:shadow-opera-lg hover:-translate-y-1 bg-gradient-to-br from-champagne-gold-50 to-champagne-gold-100 border-champagne-gold-200">
        <div className="p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 transition-colors duration-300 rounded-full bg-champagne-gold-400 group-hover:bg-champagne-gold-500 shadow-gold">
            <Mail className="w-8 h-8 text-opera-blue-900" />
          </div>
          <h3 className="mb-4 text-xl font-semibold font-heading text-opera-blue-900">
            Email Us
          </h3>
          <p className="mb-4 font-medium text-rich-mahogany-800">
            Send us a message for catering inquiries or general questions
          </p>
          <a
            href={`mailto:${EMAIL}`}
            className="inline-flex items-center px-6 py-3 text-lg font-bold transition-all duration-200 transform rounded-lg bg-opera-blue-900 text-champagne-gold-50 hover:bg-opera-blue-800 hover:shadow-opera-lg hover:scale-105"
          >
            <Mail className="w-5 h-5 mr-2" />
            Email Us
          </a>
        </div>
      </div>

      {/* Visit Card */}
      <div className="text-center transition-all duration-300 border-2 group card hover:shadow-opera-lg hover:-translate-y-1 bg-gradient-to-br from-jade-green-50 to-jade-green-100 border-jade-green-200">
        <div className="p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 transition-colors duration-300 rounded-full shadow-lg bg-jade-green-600 group-hover:bg-jade-green-700">
            <MapPin className="w-8 h-8 text-warm-ivory-50" />
          </div>
          <h3 className="mb-4 text-xl font-semibold font-heading text-jade-green-800">
            Visit Our Restaurant
          </h3>
          <p className="mb-4 font-medium text-rich-mahogany-800">
            Experience our authentic atmosphere and fresh-made dishes
          </p>
          <div className="text-center">
            <p className="px-4 py-2 text-sm font-bold rounded-lg text-jade-green-800 bg-jade-green-200">
              {getFormattedAddress()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactCards;
