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
      <div className="text-center transition-all duration-300 group card-heritage hover:shadow-opera-lg hover:-translate-y-1">
        <div className="p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 transition-colors duration-300 rounded-full bg-heritage-blue/10 group-hover:bg-heritage-blue/20">
            <Phone className="w-8 h-8 text-heritage-blue" />
          </div>
          <h3 className="mb-4 text-xl font-semibold font-heading text-heritage-blue">
            Call to Order
          </h3>
          <p className="mb-4 text-rich-mahogany-600">
            Speak directly with our team for orders, reservations, or questions
          </p>
          <a
            href={`tel:${phone.replace(/\D/g, "")}`}
            className="inline-flex items-center px-6 py-3 text-lg font-semibold transition-all duration-200 rounded-lg bg-heritage-blue text-heritage-ivory hover:bg-opera-blue-800 hover:shadow-opera"
          >
            <Phone className="w-5 h-5 mr-2" />
            {phone}
          </a>
        </div>
      </div>
      {/* Email Card */}
      <div className="text-center transition-all duration-300 group card-heritage hover:shadow-opera-lg hover:-translate-y-1">
        <div className="p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 transition-colors duration-300 rounded-full bg-heritage-gold/10 group-hover:bg-heritage-gold/20">
            <Mail className="w-8 h-8 text-heritage-gold" />
          </div>
          <h3 className="mb-4 text-xl font-semibold font-heading text-heritage-blue">
            Email Us
          </h3>
          <p className="mb-4 text-rich-mahogany-600">
            Send us a message for catering inquiries or general questions
          </p>
          <a
            href={`mailto:${EMAIL}`}
            className="inline-flex items-center px-6 py-3 text-lg font-semibold transition-all duration-200 rounded-lg bg-heritage-gold text-heritage-blue hover:bg-champagne-gold-500 hover:shadow-gold"
          >
            <Mail className="w-5 h-5 mr-2" />
            Email Us
          </a>
        </div>
      </div>
      {/* Visit Card */}
      <div className="text-center transition-all duration-300 group card-heritage hover:shadow-opera-lg hover:-translate-y-1">
        <div className="p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 transition-colors duration-300 rounded-full bg-jade-green/10 group-hover:bg-jade-green/20">
            <MapPin className="w-8 h-8 text-jade-green" />
          </div>
          <h3 className="mb-4 text-xl font-semibold font-heading text-heritage-blue">
            Visit Our Restaurant
          </h3>
          <p className="mb-4 text-rich-mahogany-600">
            Experience our authentic atmosphere and fresh-made dishes
          </p>
          <div className="text-center">
            <p className="text-sm font-medium text-heritage-blue">
              {getFormattedAddress()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactCards;
