import CafeOperaHeroBanner from "./components/CafeOperaHeroBanner";
import AboutSection from "./components/AboutSection";
import ParallaxSection from "../../components/Parallax";
import FoodShowcase from "./components/FoodShowcase";
import AppetizersSection from "./components/AppetizersSection";
import LunchSpecialsSection from "./components/LunchSpecialsSection";
import ChefSpecialitiesSection from "./components/ChefSpecialitiesSection";
import RestaurantSection from "./components/RestaurantSection";
const HomePage: React.FC = () => {
  return (
    <>
      <CafeOperaHeroBanner />
      <AboutSection />
      <ParallaxSection
        imagePath="/images/banner/golden-chicken.jpg"
        height="60vh"
      />
      <FoodShowcase />

      <ParallaxSection
        imagePath="/images/banner/shrimp-walnuts.jpg"
        height="60vh"
      />
      <AppetizersSection />
      <LunchSpecialsSection />
      <ChefSpecialitiesSection />
      <RestaurantSection />
    </>
  );
};

export default HomePage;
