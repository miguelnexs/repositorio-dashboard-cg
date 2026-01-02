import Header from "@/components/lovalbe/Header";
import Footer from "@/components/lovalbe/Footer";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type ProductColor = { id: number; name: string; hex?: string; stock?: number; images?: { id: number; image: string }[] };
type ProductVariant = { id: number; name: string; extra_price?: string };
type ProductFeature = { id: number; name: string };
type Banner = { position?: number; image?: string };

type ProductData = {
  id: number;
  name: string;
  description: string;
  image?: string | null;
  price?: string;
  category?: number;
  colors?: ProductColor[];
  variants?: ProductVariant[];
  features?: ProductFeature[];
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:8000";
  const [data, setData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState<string>("");
  const [recs, setRecs] = useState<ProductData[]>([]);
  const [bgUrl, setBgUrl] = useState<string>("");

  const absUrl = (path?: string | null) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    if (path.startsWith("/")) return `${API_BASE}${path}`;
    return `${API_BASE}/${path}`;
  };

  useEffect(() => {
    const site = (() => {
      try {
        const o = window.location.origin;
        return o.endsWith("/") ? o : `${o}/`;
      } catch { return "http://localhost:8000/"; }
    })();
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const pres = await fetch(`${API_BASE}/webconfig/public/products/${id}/?site=${encodeURIComponent(site)}`);
        const pdata = await pres.json();
        if (!pres.ok) throw new Error(pdata.detail || "Producto no disponible");
        setData(pdata);
        const sres = await fetch(`${API_BASE}/webconfig/public/settings/?site=${encodeURIComponent(site)}`);
        const sdata = await sres.json();
        if (sres.ok) {
          const phone = (sdata.company_whatsapp || sdata.company_phone || "").replace(/[^\d]/g, "");
          setWhatsapp(phone);
        }
        const bres = await fetch(`${API_BASE}/webconfig/public/banners/`);
        const bdata = await bres.json();
        if (bres.ok && Array.isArray(bdata) && bdata.length > 0) {
          const first = (bdata as Banner[]).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))[0];
          const url = typeof first?.image === "string" ? first.image : "";
          if (url) setBgUrl(url);
        } else if (sres.ok && sdata && typeof sdata.logo === "string") {
          const logo = sdata.logo.startsWith("http") ? sdata.logo : `${API_BASE}${sdata.logo}`;
          setBgUrl(logo);
        }
        const lres = await fetch(`${API_BASE}/webconfig/public/products/?site=${encodeURIComponent(site)}`);
        const ldata = await lres.json();
        if (lres.ok && Array.isArray(ldata)) {
          const filtered = (ldata as ProductData[])
            .filter((p) => p.id !== pdata.id && p.category === pdata.category)
            .slice(0, 4);
          setRecs(filtered);
        }
      } catch (e) { setError(e instanceof Error ? e.message : "Error cargando producto"); }
      finally { setLoading(false); }
    };
    load();
  }, [id, API_BASE]);

  const waLink = (() => {
    if (!whatsapp || !data) return "";
    const msg = `Hola, quiero más información y comprar el producto "${data.name}" (ID ${data.id}).`;
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
  })();

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 -z-10 bg-white" />
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <div className="mb-6 flex items-center justify-between text-gray-600 text-sm">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-accent">Inicio</Link>
            <span>/</span>
            <Link to="/productos" className="hover:text-accent">Productos</Link>
            <span>/</span>
            <span className="text-gray-900">{data?.name || "Detalle"}</span>
          </div>
          <Link to="/productos">
            <Button variant="outline">Volver a productos</Button>
          </Link>
        </div>
        {loading && <div className="text-gray-900">Cargando producto...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-2xl p-4 bg-white border border-gray-200 shadow-md">
              <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                {data.image ? (
                  <img src={absUrl(data.image)} alt={data.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">Sin imagen</div>
                )}
              </div>
              {data.colors && data.colors.length > 0 && (
                <div className="mt-4">
                  <div className="text-gray-900 font-medium mb-2">Colores</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {data.colors.map((c) => (
                      <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="text-gray-900 text-sm font-medium">{c.name}</div>
                          {c.hex && <div className="w-5 h-5 rounded-full border border-gray-300" style={{ backgroundColor: c.hex }} />}
                        </div>
                        <div className="text-gray-600 text-xs mt-1">Stock: {c.stock ?? 0}</div>
                        <div className="mt-2 grid grid-cols-3 gap-1">
                          {(c.images || []).map((im) => (
                            <img key={im.id} src={absUrl(im.image)} alt={c.name} className="w-full h-16 object-cover rounded" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="rounded-2xl p-6 bg-white border border-gray-200 shadow-md">
              <h1 className="text-2xl font-heading font-semibold text-gray-900">{data.name}</h1>
              <div className="text-gray-700 mt-2 whitespace-pre-wrap">{data.description || ""}</div>
              <div className="mt-3 text-gray-900 text-xl font-semibold">
                {typeof data.price === "string" ? Number(data.price).toLocaleString("es-CO", { style: "currency", currency: "COP" }) : ""}
              </div>
              {data.variants && data.variants.length > 0 && (
                <div className="mt-4">
                  <div className="text-gray-900 font-medium mb-2">Variantes</div>
                  <ul className="list-disc list-inside text-gray-700 text-sm">
                    {data.variants.map((v) => (
                      <li key={v.id}>{v.name}{v.extra_price ? ` (+${Number(v.extra_price).toLocaleString("es-CO", { style: "currency", currency: "COP" })})` : ""}</li>
                    ))}
                  </ul>
                </div>
              )}
              {data.features && data.features.length > 0 && (
                <div className="mt-4">
                  <div className="text-gray-900 font-medium mb-2">Características</div>
                  <ul className="list-disc list-inside text-gray-700 text-sm">
                    {data.features.map((f) => (<li key={f.id}>{f.name}</li>))}
                  </ul>
                </div>
              )}
              <div className="mt-6 flex items-center gap-3">
                {waLink && (
                  <a href={waLink} target="_blank" rel="noreferrer">
                    <Button className="btn-gold text-gray-900 flex items-center gap-2">
                      Comprar ahora
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
        {recs && recs.length > 0 && (
          <div className="mt-16">
            <h3 className="text-gray-900 font-heading text-xl mb-4">Te puede gustar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recs.map((p) => (
                <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                  <div className="aspect-video bg-gray-100 rounded mb-2 overflow-hidden">
                    {p.image ? (
                      <img src={absUrl(p.image)} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">Sin imagen</div>
                    )}
                  </div>
                  <div className="text-gray-900 font-medium">{p.name}</div>
                  <div className="text-gray-700 text-sm">
                    {typeof p.price === "string" ? Number(p.price).toLocaleString("es-CO", { style: "currency", currency: "COP" }) : ""}
                  </div>
                  <Link to={`/producto/${p.id}`} className="inline-block mt-2">
                    <Button size="sm" className="btn-gold">Ver detalles</Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-16 bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-md">
          <p className="text-gray-900 font-heading text-lg">
            Gracias por confiar en nosotros. Tu bienestar y belleza son nuestra inspiración.
          </p>
          <p className="text-gray-700 mt-2">
            Si tienes preguntas, estamos aquí para ayudarte. ¡Escríbenos por WhatsApp!
          </p>
          {waLink && (
            <a href={waLink} target="_blank" rel="noreferrer" className="inline-block mt-4">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full">
                Comprar por WhatsApp
              </Button>
            </a>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetailPage;
