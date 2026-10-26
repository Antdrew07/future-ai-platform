import { useEffect } from "react";
import VideoSection from "@/components/VideoSection";

export default function VideosPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Videos | Peptides 4 Power";
    return () => {
      document.title = "Peptides 4 Power | David Furka";
    };
  }, []);

  return (
    <div className="pt-16 md:pt-20">
      <VideoSection />
    </div>
  );
}
