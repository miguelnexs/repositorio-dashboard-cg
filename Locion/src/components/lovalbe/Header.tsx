import { useState, useEffect } from "react";
import { Menu, X, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [companyName, setCompanyName] = useState<string>("LOVALBE");
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:8000";
    const absUrl = (path?: string | null) => {
      if (!path) return "";
      if (path.startsWith("http://") || path.startsWith("https://")) return path;
      if (path.startsWith("/")) return `${API_BASE}${path}`;
      return `${API_BASE}/${path}`;
    };
    const bust = (url: string) => {
      if (!url) return url;
      const sep = url.includes("?") ? "&" : "?";
      return `${url}${sep}t=${Date.now()}`;
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
        const aid = (import.meta.env.VITE_ADMIN_ID as string) || '';
        if (aid) {
          try {
            await fetch(`${API_BASE}/webconfig/public/auto-claim/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ site, aid }),
            });
          } catch {}
        }
        const sres = await fetch(`${API_BASE}/webconfig/public/settings/?site=${encodeURIComponent(site)}`);
        const sdata = await sres.json();
        if (sres.ok && sdata) {
          if (sdata.company_name) setCompanyName(String(sdata.company_name));
          if (sdata.logo) {
            const u = absUrl(sdata.logo);
            setLogo(bust(u));
            return;
          }
        }
        const pres = await fetch(`${API_BASE}/webconfig/public/portal/?site=${encodeURIComponent(site)}`);
        const pdata = await pres.json();
        if (pres.ok && pdata && pdata.settings) {
          const s = pdata.settings;
          if (s.company_name) setCompanyName(String(s.company_name));
          if (s.logo) {
            const u = absUrl(s.logo);
            setLogo(bust(u));
          }
        }
      } catch {}
    };
    load();
  }, []);

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Productos", href: "/productos" },
    { name: "Ingredientes", href: "/beneficios" },
    { name: "Opiniones", href: "/testimonios" },
    { name: "Contacto", href: "/contacto" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-soft py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo / Brand */}
        <a href="#inicio" className="flex items-center gap-2 group">
          {logo ? (
            <img src={logo} alt={companyName} className="w-9 h-9 rounded object-cover border border-border" />
          ) : null}
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="text-sm font-medium text-foreground hover:text-accent transition-colors duration-300 relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* CTA Button */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/productos">
            <Button className="btn-gold flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Comprar ahora
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-background/98 backdrop-blur-md border-b border-border transition-all duration-300 ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="text-lg font-medium text-foreground hover:text-accent transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <Link to="/productos" className="mt-4">
            <Button className="btn-gold flex items-center justify-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Comprar ahora
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
