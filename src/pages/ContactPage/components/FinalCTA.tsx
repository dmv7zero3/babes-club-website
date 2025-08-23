import React from "react";
import { Star } from "lucide-react";

const FinalCTA: React.FC = () => (
  <div className="mt-16 text-center">
    <div className="inline-flex items-center px-8 py-4 text-base font-bold rounded-full shadow-lg bg-jade-green-600 text-warm-ivory-50">
      <Star className="w-5 h-5 mr-2 fill-current text-champagne-gold-300" />
      Serving Sterling's finest Asian cuisine for 20+ years since 2003
      <Star className="w-5 h-5 ml-2 fill-current text-champagne-gold-300" />
    </div>
  </div>
);

export default FinalCTA;
