import CafeOperaHeroBanner from "./components/CafeOperaHeroBanner";
import AboutSection from "./components/AboutSection";
import ParallaxSection from "../../components/Parallax";
import FoodShowcase from "./components/FoodShowcase";

const HomePage: React.FC = () => {
  return (
    <>
      <CafeOperaHeroBanner />
      <AboutSection />
      <ParallaxSection
        imagePath="/images/banner/golden-chicken.jpg"
        height="60vh"
      ></ParallaxSection>
      <FoodShowcase />
      <ParallaxSection
        imagePath="/images/banner/shrimp-walnuts.jpg"
        height="60vh"
      ></ParallaxSection>

      {/* create full 100vh empty sections */}
      <section className="h-screen"></section>
    </>
  );
};

export default HomePage;
