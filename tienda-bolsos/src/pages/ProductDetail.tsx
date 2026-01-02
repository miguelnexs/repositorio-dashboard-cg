import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MessageCircle, Heart, ArrowLeft, Minus, Plus, Truck, Shield, RotateCcw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:8000";

interface ProductData {
  id: number;
  name: string;
  description: string;
  image?: string | null;
  price?: number;
  category_id?: number;
  colors?: { id: number; name: string; hex?: string; images?: { id: number; image: string }[] }[];
  variants?: { id: number; name: string; extra_price?: string }[];
  features?: { id: number; name: string }[];
}

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [allImages, setAllImages] = useState<string[]>([]);
  const [whatsapp, setWhatsapp] = useState<string>("573143291149");
  const [displayWhatsapp, setDisplayWhatsapp] = useState<string>("+57 314 3291149");

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
      setLoading(true);
      try {
        const pres = await fetch(`${API_BASE}/webconfig/public/products/${id}/?site=${encodeURIComponent(site)}`);
        if (pres.ok) {
          const pdata = await pres.json();
          setProduct(pdata);
          
          // Collect all images
          const images: string[] = [];
          if (pdata.image) images.push(absUrl(pdata.image));
          if (pdata.colors) {
            pdata.colors.forEach((c: any) => {
              if (c.images) {
                c.images.forEach((img: any) => images.push(absUrl(img.image)));
              }
            });
          }
          if (images.length === 0) images.push(""); // Fallback
          setAllImages(images);
        }

        const sres = await fetch(`${API_BASE}/webconfig/public/settings/?site=${encodeURIComponent(site)}`);
        const sdata = await sres.json();
        if (sres.ok) {
          const rawPhone = sdata.company_whatsapp || sdata.company_phone || "+57 324 828 3866";
          setDisplayWhatsapp(rawPhone);
          const phone = rawPhone.replace(/[^\d]/g, "");
          setWhatsapp(phone);
        }

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const waLink = (() => {
    if (!product) return "";
    const targetPhone = whatsapp || "573248283866";
    const imageUrl = product.image ? absUrl(product.image) : "";
    const price = typeof product.price === "number" 
      ? product.price.toLocaleString("es-CO", { style: "currency", currency: "COP" }) 
      : product.price;
    
    const msg = `Hola, estoy interesado en este producto:
*${product.name}*
Precio: ${price}
Imagen: ${imageUrl}
Descripción: ${product.description || ""}
`.trim();

    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-32 text-center">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-32 text-center">
          <h1 className="font-display text-4xl text-foreground">Producto no encontrado</h1>
          <Link to="/" className="text-accent hover:underline mt-4 inline-block">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a productos</span>
          </Link>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Gallery */}
            <div className="space-y-4">
              <div className="aspect-square bg-secondary overflow-hidden relative">
                {allImages[selectedImage] ? (
                  <img
                    src={allImages[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sin imagen</div>
                )}
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 bg-secondary overflow-hidden border-2 transition-colors flex-shrink-0 ${
                      selectedImage === index ? "border-accent" : "border-transparent hover:border-muted-foreground"
                    }`}
                  >
                    {img && <img src={img} alt="" className="w-full h-full object-cover" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-4xl md:text-5xl text-foreground mt-2">
                  {product.name}
                </h1>
              </div>

              {/* Price */}
              <div className="flex items-center gap-4">
                <span className="font-display text-3xl text-foreground">
                  {typeof product.price === "number" 
                    ? product.price.toLocaleString("es-CO", { style: "currency", currency: "COP" }) 
                    : typeof product.price === "string" 
                      ? Number(product.price).toLocaleString("es-CO", { style: "currency", currency: "COP" }) 
                      : ""}
                </span>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>

              {/* Features from API if available */}
              {product.features && product.features.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Características</h3>
                  <ul className="grid grid-cols-2 gap-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        {feature.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
               {/* Variants/Colors from API if available */}
               {product.colors && product.colors.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Colores Disponibles</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                       <div key={color.id} className="flex items-center gap-2 border px-3 py-1 rounded-full">
                          {color.hex && <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: color.hex }} />}
                          <span className="text-sm">{color.name}</span>
                       </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-border">
                 <a href={waLink || "https://wa.me/"} target="_blank" rel="noreferrer" className="flex-1">
                   <Button size="xl" className="w-full">
                     <MessageCircle className="w-5 h-5 mr-2" />
                     Comprar por WhatsApp {displayWhatsapp && ` ${displayWhatsapp}`}
                   </Button>
                 </a>
                <Button size="xl" variant="outline" className="px-4">
                  <Heart className="w-5 h-5" />
                </Button>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 mx-auto bg-secondary rounded-full flex items-center justify-center text-foreground">
                    <Truck className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium">Envío Gratis</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 mx-auto bg-secondary rounded-full flex items-center justify-center text-foreground">
                    <Shield className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium">Garantía</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 mx-auto bg-secondary rounded-full flex items-center justify-center text-foreground">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium">Devoluciones</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
