import { useEffect } from "react";
import DealsGrid from "@/components/DealsGrid";

export default function VendorsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Vendors | Peptides 4 Power";
    return () => {
      document.title = "Peptides 4 Power | David Furka";
    };
  }, []);

  return (
    <div className="pt-16 md:pt-20">
      <DealsGrid />
    </div>
  );
}
