import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesBar from "@/components/FeaturesBar";
import ProductGrid from "@/components/ProductGrid";
import CategorySection from "@/components/CategorySection";
import NewsletterSection from "@/components/NewsletterSection";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";

const Index = () => {
  const [bgUrl, setBgUrl] = useState<string>("");

  useEffect(() => {
    const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:8000";
    const absUrl = (path?: string | null) => {
      if (!path) return "";
      if (path.startsWith("http://") || path.startsWith("https://")) return path;
      if (path.startsWith("/")) return `${API_BASE}${path}`;
      return `${API_BASE}/${path}`;
    };
    const site = (() => {
      try {
        const o = window.location.origin;
        return o.endsWith("/") ? o : `${o}/`;
      } catch {
        return "http://localhost:8000/";
      }
    })();

    const load = async () => {
      try {
        const sres = await fetch(`${API_BASE}/webconfig/public/settings/?site=${encodeURIComponent(site)}`);
        const sdata = await sres.json();
        if (sres.ok && sdata) {
          if (sdata.background_image) {
            setBgUrl(absUrl(sdata.background_image));
          }
        }
      } catch (e) {
        console.error("Error fetching index settings", e);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen relative bg-background">
      <div
        className="fixed inset-0 -z-10 transition-all duration-500"
        style={
          bgUrl
            ? { backgroundImage: `url('${bgUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
            : { backgroundColor: 'transparent' }
        }
      />
      <Header />
      <main>
        <HeroSection />
        <FeaturesBar />
        <ProductGrid />
        <CategorySection />
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
