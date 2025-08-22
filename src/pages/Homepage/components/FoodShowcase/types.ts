// src/pages/Homepage/components/FoodShowcase/types.ts

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  imagePath: string;
  imageAlt: string;
}

export interface FoodCardProps {
  item: FoodItem;
  index: number;
}

export interface FoodGridProps {
  items: FoodItem[];
}

export interface SectionHeaderProps {
  title: string;
  subtitle: string;
}
