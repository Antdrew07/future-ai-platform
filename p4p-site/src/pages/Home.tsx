import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Hero from "@/components/Hero";
import SaleOfWeek from "@/components/SaleOfWeek";
import FeaturedPeptide from "@/components/FeaturedPeptide";
import VideoSection from "@/components/VideoSection";
import DealsGrid from "@/components/DealsGrid";
import Poetry from "@/components/Poetry";
import Contact from "@/components/Contact";

export default function Home() {
  const location = useLocation();

  // Smooth-scroll to a hash target (e.g. navigating "/#deals" from a vendor page).
  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) {
        requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth" }));
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <main>
      <Hero />
      <SaleOfWeek />
      <FeaturedPeptide />
      <VideoSection />
      <DealsGrid />
      <Poetry />
      <Contact />
    </main>
  );
}
