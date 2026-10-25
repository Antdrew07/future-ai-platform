import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import DealsGrid from "@/components/DealsGrid";
import SaleOfWeek from "@/components/SaleOfWeek";

export default function Home() {
  const location = useLocation();

  // Smooth-scroll to a hash target (e.g. navigating "/#videos" from a page).
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
      <DealsGrid />
      <SaleOfWeek />
    </main>
  );
}
