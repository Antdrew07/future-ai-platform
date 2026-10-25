import { useEffect } from "react";
import Poetry from "@/components/Poetry";

export default function PoetryPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Peptide Poetry | Peptides 4 Power";
    return () => {
      document.title = "Peptides 4 Power | David Furka";
    };
  }, []);

  return (
    <div className="pt-16 md:pt-20">
      <Poetry />
    </div>
  );
}
