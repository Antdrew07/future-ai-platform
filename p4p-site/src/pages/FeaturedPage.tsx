import { useEffect } from "react";
import FeaturedPeptide from "@/components/FeaturedPeptide";

export default function FeaturedPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Peptide of the Week | Peptides 4 Power";
    return () => {
      document.title = "Peptides 4 Power | David Furka";
    };
  }, []);

  return (
    <div className="pt-16 md:pt-20">
      <FeaturedPeptide />
    </div>
  );
}
