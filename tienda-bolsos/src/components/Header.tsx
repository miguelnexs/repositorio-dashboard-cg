import { Menu, X, Search, User } from "lucide-react";
import { useState, useEffect } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [companyName, setCompanyName] = useState<string>("4C");
  const [logo, setLogo] = useState<string | null>(null);

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
        // Auto-claim logic
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

        // Fetch settings
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

        // Fallback to portal settings if needed
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
      } catch (e) {
        console.error("Error fetching header settings", e);
      }
    };
    load();
  }, []);

  const navLinks = [
    { name: "Cangureras", href: "#cangureras" },
    { name: "Mochilas", href: "#mochilas" },
    { name: "Cruzados", href: "#cruzados" },
    { name: "Accesorios", href: "#accesorios" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            {logo ? (
              <img src={logo} alt={companyName} className="h-10 md:h-12 w-auto object-contain" />
            ) : (
              <span className="font-display text-3xl md:text-4xl tracking-wider text-foreground">
                {companyName}
              </span>
            )}
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors duration-300 uppercase tracking-wider"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-4">
            <button className="p-2 text-foreground hover:text-accent transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-foreground hover:text-accent transition-colors hidden md:block">
              <User className="w-5 h-5" />
            </button>
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-fade-in">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block py-3 text-sm font-medium text-foreground hover:text-accent transition-colors uppercase tracking-wider"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
