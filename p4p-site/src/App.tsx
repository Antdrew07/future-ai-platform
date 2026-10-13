import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedPeptide from "@/components/FeaturedPeptide";
import VideoSection from "@/components/VideoSection";
import DealsGrid from "@/components/DealsGrid";
import Poetry from "@/components/Poetry";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <FeaturedPeptide />
        <VideoSection />
        <DealsGrid />
        <Poetry />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
