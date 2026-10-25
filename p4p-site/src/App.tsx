import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import About from "@/pages/About";
import PoetryPage from "@/pages/PoetryPage";
import VideosPage from "@/pages/VideosPage";
import FeaturedPage from "@/pages/FeaturedPage";
import ContactPage from "@/pages/ContactPage";
import VendorPage from "@/pages/VendorPage";

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/poetry" element={<PoetryPage />} />
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/peptide-of-the-week" element={<FeaturedPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/vendor/:slug" element={<VendorPage />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
