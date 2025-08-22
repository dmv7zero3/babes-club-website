import CafeOperaHeroBanner from "./components/CafeOperaHeroBanner";
import AboutSection from "./components/AboutSection";
import ParallaxSection from "../../components/Parallax";

const HomePage: React.FC = () => {
  return (
    <>
      <CafeOperaHeroBanner />
      <AboutSection />
      <ParallaxSection
        imagePath="/images/banner/golden-chicken.jpg"
        height="80vh"
      ></ParallaxSection>
      {/* create full 100vh empty sections */}
      <section className="h-screen"></section>
      <section className="h-screen"></section>
      <section className="h-screen"></section>
    </>
  );
};

export default HomePage;
