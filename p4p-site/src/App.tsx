import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import About from "@/pages/About";
import PoetryPage from "@/pages/PoetryPage";
import VendorsPage from "@/pages/VendorsPage";
import VideosPage from "@/pages/VideosPage";
import FeaturedPage from "@/pages/FeaturedPage";
import ContactPage from "@/pages/ContactPage";
import VendorPage from "@/pages/VendorPage";

function AppRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-fade">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/vendors" element={<VendorsPage />} />
        <Route path="/poetry" element={<PoetryPage />} />
        <Route path="/videos" element={<VideosPage />} />
        <Route path="/peptide-of-the-week" element={<FeaturedPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/vendor/:slug" element={<VendorPage />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <AppRoutes />
      <Footer />
    </BrowserRouter>
  );
}
