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
    <div className="grid grid-cols-1 gap-16 mb-16 lg:grid-cols-3">
      {/* Phone Card */}
      <div className="text-center transition-all duration-300 border-2 group card hover:shadow-opera-lg hover:-translate-y-1 bg-gradient-to-br from-opera-blue-50 to-opera-blue-100 border-opera-blue-200">
        <div className="p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 transition-colors duration-300 rounded-full bg-opera-blue-300/30 shadow-opera">
            <Phone className="w-9 h-9 lg:w-7 lg:h-7 text-opera-blue" />
          </div>
          <h1 className="mb-4 text-4xl font-semibold lg:text-2xl font-heading text-opera-blue-900">
            Call to Order
          </h1>
          <p className="mb-4 paragraph text-rich-mahogany-800">
            Speak directly with our team for orders, reservations, or questions
          </p>
          <a
            href={`tel:${phone.replace(/\D/g, "")}`}
            className="leading-normal transition-all duration-200 transform rounded-full btn-md font-lato bg-champagne-gold text-opera-blue-900 hover:bg-champagne-gold-500 hover:shadow-gold "
          >
            <Phone className="w-5 h-5 mr-2" />
            {phone}
          </a>
        </div>
      </div>

      {/* Email Card */}
      <div className="text-center transition-all duration-300 border-2 group card hover:shadow-opera-lg hover:-translate-y-1 bg-gradient-to-br from-champagne-gold-50 to-champagne-gold-100 border-champagne-gold-200">
        <div className="p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 transition-colors duration-300 rounded-full bg-champagne-gold-300/30 shadow-gold">
            <Mail className="w-9 h-9 lg:w-7 lg:h-7 text-opera-blue" />
          </div>
          <h1 className="mb-4 text-4xl font-semibold lg:text-2xl font-heading text-opera-blue-900">
            Email Us
          </h1>
          <p className="mb-4 paragraph text-rich-mahogany-800">
            Send us a message for catering inquiries or general questions
          </p>
          <a
            href={`mailto:${EMAIL}`}
            className="leading-normal transition-all duration-200 transform rounded-full btn-md font-lato bg-opera-blue-900 text-champagne-gold-50 hover:bg-opera-blue-800 hover:shadow-opera-lg "
          >
            <Mail className="w-5 h-5 mr-2" />
            Email Us
          </a>
        </div>
      </div>

      {/* Visit Card */}
      <div className="text-center transition-all duration-300 border-2 group card hover:shadow-opera-lg hover:-translate-y-1 bg-jade-green-300/30 ">
        <div className="p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full shadow-lg bg-jade-green-300/30 ">
            <MapPin className="w-9 h-9 lg:w-7 lg:h-7 text-opera-blue" />
          </div>
          <h1 className="mb-4 text-4xl font-semibold lg:text-2xl font-heading text-opera-blue-900">
            Visit Our Restaurant
          </h1>
          <p className="mb-4 paragraph text-rich-mahogany-800">
            Experience our authentic atmosphere and fresh-made dishes
          </p>
          <div className="text-center">
            <p className="leading-normal rounded-full btn-md font-lato text-jade-green-800 bg-jade-green-200">
              {getFormattedAddress()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactCards;
