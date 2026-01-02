import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:8000";

interface PublicProduct {
  id: number;
  name: string;
  description: string;
  image?: string | null;
  price?: number;
  category_id?: number;
}

interface PublicCategory {
  id: number;
  name: string;
  description?: string | null;
  image?: string | null;
}

const ProductGrid = () => {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("Todos");

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
        
        if (pRes.ok && Array.isArray(pData)) setProducts(pData);
        if (cRes.ok && Array.isArray(cData)) setCategories(cData);

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
              if (r.pRes.ok && Array.isArray(r.pData)) setProducts(r.pData);
              if (r.cRes.ok && Array.isArray(r.cData)) setCategories(r.cData);
            } catch {}
          }
        }
        if (!pRes.ok) throw new Error((pData && pData.detail) || "No se pudieron cargar productos");
      } catch (e: any) {
        setError(e.message || "Error cargando catálogo");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredProducts = activeCategory === "Todos" 
    ? products 
    : products.filter(p => {
        const cat = categories.find(c => c.id === p.category_id);
        return cat?.name === activeCategory;
      });

  const categoryNames = ["Todos", ...categories.map(c => c.name)];

  return (
    <section id="productos" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-sm text-accent uppercase tracking-widest font-semibold">
            Nuestra Colección
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mt-4 text-foreground">
            PRODUCTOS <span className="text-accent">DESTACADOS</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Explora nuestra selección de bolsos y cangureras premium para el hombre urbano
          </p>
        </div>

        {error && (
          <div className="text-center text-red-500 mb-8">{error}</div>
        )}

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categoryNames.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 text-sm uppercase tracking-wider font-medium transition-all duration-300 ${
                activeCategory === cat
                  ? "bg-foreground text-background"
                  : "bg-secondary text-foreground hover:bg-foreground hover:text-background"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product, index) => (
            <div 
              key={product.id} 
              className="opacity-0 animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
            >
              <ProductCard 
                product={{
                  id: product.id,
                  name: product.name,
                  category: categories.find(c => c.id === product.category_id)?.name || "General",
                  price: product.price || 0,
                  image: absUrl(product.image),
                  description: product.description
                }} 
              />
            </div>
          ))}
          {filteredProducts.length === 0 && !loading && (
            <div className="col-span-full text-center text-muted-foreground">
              No hay productos disponibles en esta categoría.
            </div>
          )}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="inline-flex items-center gap-2 px-8 py-4 border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-300 uppercase tracking-wider font-semibold">
            Ver Más Productos
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
