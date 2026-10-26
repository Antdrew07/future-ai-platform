import { useEffect } from "react";
import Contact from "@/components/Contact";

export default function ContactPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Contact | Peptides 4 Power";
    return () => {
      document.title = "Peptides 4 Power | David Furka";
    };
  }, []);

  return (
    <div className="pt-16 md:pt-20">
      <Contact />
    </div>
  );
}
