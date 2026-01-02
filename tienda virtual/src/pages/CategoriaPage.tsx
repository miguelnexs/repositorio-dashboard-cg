import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { API_CONFIG, getImageUrlWithFallback } from '../config/api';
import OptimizedImage from '../components/ui/OptimizedImage';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, DollarSign } from "lucide-react";
import ColorDisplay from '../components/ColorDisplay';
import { ProductColor } from '../hooks/useProductos';
import { useProductos } from '../hooks/useProductos';

interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  imagen_url: string | null;
}

const CategoriaPage = () => {
  const { slug } = useParams();
  const { products } = useProductos();
  const [categoria, setCategoria] = React.useState<Categoria | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filtros
  const [search, setSearch] = React.useState("");
  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");

  React.useEffect(() => {
    async function fetchCategoria() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_CONFIG.API_URL}/webconfig/public/categories/`, { headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) throw new Error('No se pudo cargar la categoría');
        const list = await res.json();
        const cat = Array.isArray(list) ? list.find((c: any) => String(c.id) === String(slug)) : null;
        if (!cat) throw new Error('Categoría no encontrada');
        setCategoria({ id: cat.id, nombre: cat.name || cat.nombre, descripcion: cat.description || '', imagen_url: cat.image || null });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchCategoria();
  }, [slug]);

  // Filtrado de productos
  const productosFiltrados = React.useMemo(() => {
    if (!categoria) return [];
    const base = products.filter((p) => p.categoryId === (categoria as any).id || (p.category || '').toLowerCase() === (categoria.nombre || '').toLowerCase());
    return base.filter((prod) => {
      const nombreMatch = prod.name.toLowerCase().includes(search.toLowerCase());
      const precioNum = Number(prod.priceNumber || 0);
      const min = minPrice ? parseFloat(minPrice) : undefined;
      const max = maxPrice ? parseFloat(maxPrice) : undefined;
      const minOk = min === undefined || precioNum >= min;
      const maxOk = max === undefined || precioNum <= max;
      return nombreMatch && minOk && maxOk;
    });
  }, [categoria, products, search, minPrice, maxPrice]);

  if (loading) return <div className="text-center py-16 text-neutral-500">Cargando categoría...</div>;
  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;
  if (!categoria) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold text-neutral-900 mb-2 tracking-tight">{categoria.nombre}</h1>
            <p className="text-neutral-600 max-w-2xl text-lg leading-relaxed">{categoria.descripcion}</p>
          </div>
          <Link to="/">
            <Button variant="outline">Volver al inicio</Button>
          </Link>
        </div>
        {/* Filtros mejorados */}
        <Card className="mb-10 p-6 shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="flex-1 relative">
              <label className="block text-sm text-neutral-700 mb-1 font-medium">Buscar por nombre</label>
              <Input
                type="text"
                placeholder="Buscar producto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 h-12 text-base"
              />
              <Search className="w-5 h-5 text-neutral-400 absolute left-3 top-9" />
            </div>
            <div className="relative">
              <label className="block text-sm text-neutral-700 mb-1 font-medium">Precio mínimo</label>
              <Input
                type="number"
                min="0"
                placeholder="Mínimo"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                className="w-36 pl-10 h-12 text-base"
              />
              <DollarSign className="w-5 h-5 text-neutral-400 absolute left-3 top-9" />
            </div>
            <div className="relative">
              <label className="block text-sm text-neutral-700 mb-1 font-medium">Precio máximo</label>
              <Input
                type="number"
                min="0"
                placeholder="Máximo"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                className="w-36 pl-10 h-12 text-base"
              />
              <DollarSign className="w-5 h-5 text-neutral-400 absolute left-3 top-9" />
            </div>
          </div>
        </Card>
        <h2 className="text-2xl font-semibold text-neutral-900 mb-6 tracking-tight">Productos de esta categoría</h2>
        {productosFiltrados.length === 0 ? (
          <div className="text-neutral-500 text-lg">No hay productos que coincidan con los filtros.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {productosFiltrados.map((prod) => (
              <div key={prod.id} className="group">
                <Link to={`/producto/${prod.slug}`}>
                  <div className="aspect-square overflow-hidden bg-gray-50 mb-3">
                    {prod.colors && prod.colors[0]?.images && prod.colors[0].images[0] ? (
                      <OptimizedImage
                        src={prod.colors[0].images[0]}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                        <span className="text-gray-400">Sin imagen</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 text-center">
                    <h4 className="text-base font-medium text-neutral-800 tracking-wide group-hover:text-neutral-900 transition-colors duration-300">
                      {prod.name}
                    </h4>
                    <p className="text-xs text-neutral-400 uppercase tracking-widest font-light">
                      {categoria?.nombre || 'Producto'}
                    </p>
                    <p className="text-lg font-semibold text-neutral-900">
                      {prod.price}
                    </p>
                    {prod.colors && (
                      <div className="flex justify-center mt-2">
                        <ColorDisplay colors={prod.colors} maxColors={4} size="sm" />
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriaPage;
