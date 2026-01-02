import Header from "@/components/lovalbe/Header";
import Hero from "@/components/lovalbe/Hero";
import Products from "@/components/lovalbe/Products";
import Benefits from "@/components/lovalbe/Benefits";
import Testimonials from "@/components/lovalbe/Testimonials";
import About from "@/components/lovalbe/About";
import Contact from "@/components/lovalbe/Contact";
import Footer from "@/components/lovalbe/Footer";
import { useEffect, useState } from "react";

const Index = () => {
  const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:8000";
  const [bgUrl, setBgUrl] = useState<string>("");
  useEffect(() => {
    const site = (() => {
      try {
        const o = window.location.origin;
        return o.endsWith("/") ? o : `${o}/`;
      } catch { return "http://localhost:8000/"; }
    })();
    setBgUrl("");
  }, []);
  return (
    <div className="min-h-screen relative">
      <div
        className="fixed inset-0 -z-10"
        style={
          bgUrl
            ? { backgroundImage: `url('${bgUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
            : { backgroundColor: '#ffffff' }
        }
      />
      <Header />
      <main>
        <Hero />
        <Products />
        <Benefits />
        <Testimonials />
        <About />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
