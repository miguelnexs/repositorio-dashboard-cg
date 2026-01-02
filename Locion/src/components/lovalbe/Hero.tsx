import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const Hero = () => {
  const [brandName, setBrandName] = useState<string>("Lujo y aromas");
  const [brandTagline, setBrandTagline] = useState<string>("By marcala mejia");
  useEffect(() => {
    const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:8000";
    const site = (() => {
      try {
        const o = window.location.origin;
        return o.endsWith("/") ? o : `${o}/`;
      } catch { return "http://localhost:8000/"; }
    })();
    (async () => {
      try {
        const sres = await fetch(`${API_BASE}/webconfig/public/settings/?site=${encodeURIComponent(site)}`);
        const sdata = await sres.json();
        if (sres.ok && sdata) {
          if (sdata.company_name) setBrandName(String(sdata.company_name));
          if (typeof sdata.company_description === "string" && sdata.company_description.trim().length > 0) {
            setBrandTagline(sdata.company_description.trim());
          }
        }
      } catch {}
    })();
  }, []);
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
      style={{
        background: "linear-gradient(135deg, hsl(40 30% 96%) 0%, hsl(350 60% 85% / 0.3) 50%, hsl(43 50% 75% / 0.2) 100%)",
      }}
    >
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-lovalbe-rose/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-lovalbe-gold-light/20 rounded-full blur-3xl animate-float delay-300" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-lovalbe-beige/30 rounded-full blur-3xl" />

      {/* Floating Decorative Circles */}
      <div className="absolute top-32 right-20 w-4 h-4 bg-accent rounded-full animate-float delay-200" />
      <div className="absolute bottom-40 left-20 w-3 h-3 bg-primary rounded-full animate-float delay-500" />
      <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-lovalbe-gold rounded-full animate-float delay-700" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-card/90 backdrop-blur-sm border border-border/70 rounded-full px-4 py-2 mb-8 animate-fade-in-down">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-foreground">
              Nueva colección primavera 2025
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-semibold text-foreground mb-6 animate-fade-in-up leading-tight">
            {brandName}
            <span className="block text-3xl md:text-4xl lg:text-5xl font-light text-foreground/90 mt-2">
              {brandTagline}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-foreground/90 max-w-2xl mx-auto mb-10 animate-fade-in-up delay-200 leading-relaxed">
            Lociones premium con ingredientes naturales para una piel suave y radiante. 
            Descubre el secreto de una hidratación profunda y duradera.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
            <a href="#productos">
              <Button className="btn-gold text-base px-8 py-4 flex items-center gap-2 group">
                Ver productos
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
            <Button
              variant="outline"
              className="bg-transparent border-2 border-foreground/40 hover:border-accent hover:bg-accent/10 text-foreground px-8 py-4 rounded-full transition-all duration-300"
            >
              Colección especial
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 md:gap-16 mt-16 animate-fade-in-up delay-500">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-heading font-semibold text-foreground">50K+</p>
              <p className="text-sm text-foreground/85">Clientes felices</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-heading font-semibold text-foreground">100%</p>
              <p className="text-sm text-foreground/85">Natural</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-heading font-semibold text-foreground">4.9</p>
              <p className="text-sm text-foreground/85">Valoración</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-foreground/50 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-foreground/60 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
