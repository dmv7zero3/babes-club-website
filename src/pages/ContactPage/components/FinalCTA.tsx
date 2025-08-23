import React from "react";
import { Star } from "lucide-react";

const FinalCTA: React.FC = () => (
  <div className="mt-16 text-center">
    <div className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-full bg-jade-green/10 text-jade-green">
      <Star className="w-4 h-4 mr-2 fill-current" />
      Serving Sterling's finest Asian cuisine since establishment
      <Star className="w-4 h-4 ml-2 fill-current" />
    </div>
  </div>
);

export default FinalCTA;
