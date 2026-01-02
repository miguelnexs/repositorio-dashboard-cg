// Este hook requiere que React esté instalado y tipado correctamente en el proyecto.
import * as React from "react";
import { API_CONFIG, getImageUrl, buildTenantQuery } from '../config/api';

export interface ProductColor {
  name: string;
  images: string[];
  hex_code?: string;
}

export interface Product {
  id: number;
  name: string;
  price: string;
  priceNumber: number;
  category: string;
  categoryId?: number;
  colors: ProductColor[];
  slug: string; // <-- Agregado
}

// Utilidad para asegurar URLs absolutas y seguras

export function useProductos() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_CONFIG.API_URL}/webconfig/public/products/${buildTenantQuery()}`, { headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) throw new Error("Error al obtener productos");
        const data = await res.json();
        const productosRaw = Array.isArray(data) ? data : data.results;
        if (!Array.isArray(productosRaw)) throw new Error("La respuesta de la API no es un array de productos");
        const mapped: Product[] = await Promise.all(
          productosRaw.map(async (p: any) => {
            const productColors: ProductColor[] = Array.isArray(p.colors) && p.colors.length > 0
              ? p.colors.map((color: any) => ({
                  name: color.name || color.nombre || 'Color',
                  hex_code: color.hex,
                  images: Array.isArray(color.images) && color.images.length > 0
                    ? color.images.map((img: any) => getImageUrl(img.image))
                    : p.image ? [getImageUrl(p.image)] : []
                }))
              : [
                  {
                    name: 'Único',
                    images: p.image ? [getImageUrl(p.image)] : [],
                  },
                ];
            return {
              id: p.id,
              name: p.name || p.nombre,
              price: `${Number(p.price || p.precio || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}`,
              priceNumber: Number(p.price || p.precio || 0),
              category: p.category_name || p.category?.name || p.categoria?.nombre || 'Sin categoría',
              categoryId: typeof p.category === 'number' ? p.category : undefined,
              colors: productColors,
              slug: String(p.id),
            };
          })
        );
        setProducts(mapped);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return { products, loading, error };
}
