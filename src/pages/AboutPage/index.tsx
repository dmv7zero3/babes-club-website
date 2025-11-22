import BannerHero from "@/components/Hero/BannerHero";
import AboutHero from "./AboutHero";
import CallToActionBanner from "./CallToActionBanner";
import CraftsmanshipSection from "./CraftsmanshipSection";
import PhotoGallery from "./PhotoGallery";
import SocialLinksSection from "./SocialLinksSection";
import StorySection from "./StorySection";
import ValuesGrid from "./ValuesGrid";

const AboutPage: React.FC = () => {
  return (
    <main className="bg-gradient-to-b from-cotton-candy-100 via-white to-babe-pink-50 text-slate-900">
      <BannerHero
        imageSrc="/images/banner/holly-chronic-7.jpg"
        title="Inside the Babes Club"
        alt="Babes Club jewelry arranged on velvet backdrop"
        overlayOpacity={45}
        className="lg:min-h-[38svh]"
        titleClassName="tracking-tight"
      />
      <AboutHero />
      <StorySection />
      <CraftsmanshipSection />
      <ValuesGrid />
      <PhotoGallery />
      <SocialLinksSection />
      <CallToActionBanner />
    </main>
  );
};

export default AboutPage;
