import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:8000";

type PublicProduct = {
  id: number;
  name: string;
  description: string;
  image?: string | null;
  price?: number;
};

type PublicCategory = {
  id: number;
  name: string;
  description?: string | null;
  image?: string | null;
};

const Products = () => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const { ref, isVisible } = useScrollAnimation();
  const [items, setItems] = useState<PublicProduct[]>([]);
  const [cats, setCats] = useState<PublicCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const siteParam = (() => {
    try {
      const o = window.location.origin;
      return o.endsWith("/") ? o : `${o}/`;
    } catch {
      return "http://localhost:8000/";
    }
  })();
  const absUrl = (path?: string | null) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    if (path.startsWith("/")) return `${API_BASE}${path}`;
    return `${API_BASE}/${path}`;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchPair = async (site: string) => {
          const [pRes, cRes] = await Promise.all([
            fetch(`${API_BASE}/webconfig/public/products/?site=${encodeURIComponent(site)}`),
            fetch(`${API_BASE}/webconfig/public/categories/?site=${encodeURIComponent(site)}`),
          ]);
          const pData = await pRes.json();
          const cData = await cRes.json();
          return { pRes, cRes, pData, cData };
        };
        let { pRes, cRes, pData, cData } = await fetchPair(siteParam);
        if (pRes.ok && Array.isArray(pData)) setItems(pData);
        if (cRes.ok && Array.isArray(cData)) setCats(cData);
        if (Array.isArray(pData) && pData.length === 0 && Array.isArray(cData) && cData.length === 0) {
          const aid = (import.meta.env.VITE_ADMIN_ID as string) || '';
          if (aid) {
            try {
              await fetch(`${API_BASE}/webconfig/public/auto-claim/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ site: siteParam, aid }),
              });
              const r = await fetchPair(siteParam);
              if (r.pRes.ok && Array.isArray(r.pData)) setItems(r.pData);
              if (r.cRes.ok && Array.isArray(r.cData)) setCats(r.cData);
            } catch {}
          }
        }
        if (!pRes.ok) throw new Error((pData && pData.detail) || "No se pudieron cargar productos");
      } catch (e: any) {
        setError(e.message || "Error cargando catálogo");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section id="productos" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-lovalbe-rose/10 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-lovalbe-gold-light/10 rounded-full blur-3xl translate-y-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        <div ref={ref} className={`text-center mb-16 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
          <span className="text-accent font-medium tracking-widest text-sm uppercase">Catálogo</span>
          <h2 className="text-4xl md:text-5xl font-heading font-semibold text-foreground mt-4 mb-6">Lociones</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Catálogo vinculado al panel: productos y categorías configurados en tu dashboard.</p>
        </div>

        {error && (
          <div className="mb-6 text-center text-sm text-red-500">{error}</div>
        )}

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {cats.map((c) => (
            <div key={c.id} className="bg-card rounded-2xl border border-border/50 p-4 flex items-center gap-3">
              {c.image ? (
                <img src={absUrl(c.image)} alt={c.name} className="w-12 h-12 rounded object-cover" />
              ) : (
                <div className="w-12 h-12 rounded bg-muted" />
              )}
              <div>
                <div className="text-foreground font-medium">{c.name}</div>
                <div className="text-muted-foreground text-xs line-clamp-1">{c.description || ""}</div>
              </div>
            </div>
          ))}
          {cats.length === 0 && !loading && (
            <div className="col-span-full text-center text-muted-foreground">No hay categorías visibles.</div>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((product, index) => (
            <div
              key={product.id}
              className={`group relative bg-card rounded-3xl overflow-hidden border border-border/50 transition-all duration-500 hover:shadow-elevated hover:-translate-y-2 ${
                isVisible ? "animate-fade-in-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${(index + 1) * 150}ms` }}
              onMouseEnter={() => setHoveredId(product.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className={`relative h-56 bg-muted flex items-center justify-center overflow-hidden`}>
                {product.image ? (
                  <img src={absUrl(product.image)} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl">🧴</span>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-heading font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">{product.name}</h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-heading font-semibold text-foreground">{typeof product.price === "number" ? `$${product.price.toFixed(2)}` : ""}</span>
                  </div>
                  <a href={`/producto/${product.id}`}>
                    <Button size="sm" className="btn-gold text-sm px-4 py-2 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Ver detalles
                    </Button>
                  </a>
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-lovalbe-gold-light to-lovalbe-gold transition-all duration-500 ${hoveredId === product.id ? "w-full" : "w-0"}`} />
            </div>
          ))}
          {items.length === 0 && !loading && (
            <div className="col-span-full text-center text-muted-foreground">No hay productos visibles.</div>
          )}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" className="border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground rounded-full px-8 py-3 transition-all duration-300">
            Ver toda la colección
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Products;
