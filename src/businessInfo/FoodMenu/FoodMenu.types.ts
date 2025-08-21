// Types for Cafe Opera FoodMenu
// Auto-generated for FoodMenu.ts

export interface FoodMenu {
  restaurant: {
    name: string;
    tagline: string;
    description: string;
    specialties: string[];
    features: string[];
  };
  menu: {
    [section: string]: {
      title: string;
      note?: string;
      items: MenuItem[];
      [key: string]: any;
    };
  };
  restaurantInfo: {
    location: string;
    established: number;
    ownership: string;
    cuisine: string;
    specialFeatures: string[];
    awards: string[];
    atmosphere: string;
  };
  dietaryInfo: {
    spicyLevels: {
      mild: string;
      medium: string;
      spicy: string;
      custom: string;
    };
    allergies: {
      glutenFree: string;
      peanutAllergy: string;
      msgFree: string;
      vegetarian: string;
      customization: string;
    };
  };
}

export interface MenuItem {
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  spicy?: boolean;
  serves?: number;
  quantity?: string;
  signature?: boolean;
  bestSeller?: boolean;
  specialty?: boolean;
  proteinOptions?: Array<{ option: string; price: number } | string>;
  [key: string]: any;
}
