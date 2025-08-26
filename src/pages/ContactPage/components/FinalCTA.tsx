import React from "react";
import { Star } from "lucide-react";

const FinalCTA: React.FC = () => (
  <div className="mt-16 text-center">
    <div className="inline-flex items-center px-8 py-4 font-bold rounded-full shadow-lg paragraph-md bg-jade-green-600 text-warm-ivory-50">
      <Star className="w-6 h-6 mr-2 fill-current text-champagne-gold-300" />
      Serving Sterling's finest Asian cuisine for 20+ years since 2003
      <Star className="w-6 h-6 ml-2 fill-current text-champagne-gold-300" />
    </div>
  </div>
);

export default FinalCTA;
