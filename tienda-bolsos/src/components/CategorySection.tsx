import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:8000";

interface PublicCategory {
  id: number;
  name: string;
  description?: string | null;
  image?: string | null;
}

const CategorySection = () => {
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [loading, setLoading] = useState(true);

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
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}/webconfig/public/categories/?site=${encodeURIComponent(siteParam)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setCategories(data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) return null; // Or a loading spinner
  if (categories.length === 0) return null;

  return (
    <section id="cangureras" className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <span className="text-sm text-accent uppercase tracking-widest font-semibold">
              Explora
            </span>
            <h2 className="font-display text-4xl md:text-5xl mt-2 text-foreground">
              POR CATEGORÍA
            </h2>
          </div>
          <Button variant="outline" size="lg">
            Ver Todas
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Category Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className="group relative h-[400px] overflow-hidden cursor-pointer hover-lift opacity-0 animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
            >
              {/* Background Image */}
              {category.image ? (
                <img
                  src={absUrl(category.image)}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="absolute inset-0 bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No Image</span>
                </div>
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/50 to-transparent" />
              
              {/* Content */}
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <h3 className="font-display text-3xl text-background mt-2">
                  {category.name}
                </h3>
                <p className="text-background/80 mt-1">
                  {category.description || ""}
                </p>
                
                {/* Hover Arrow */}
                <div className="mt-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  <span className="inline-flex items-center gap-2 text-accent font-semibold uppercase tracking-wider text-sm">
                    Explorar
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
