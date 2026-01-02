// Configuración mock para desarrollo sin backend
export const API_CONFIG_MOCK = {
  BASE_URL: 'http://localhost:3001',
  TIMEOUT: 5000,
  FAST_TIMEOUT: 3000,
  API_URL: 'http://localhost:3001/api',
  
  ENDPOINTS: {
    PRODUCTOS: '/api/productos/productos/',
    CATEGORIAS: '/api/categorias/',
    VENTAS: '/api/ventas/',
    PEDIDOS: '/api/pedidos/',
    AUTH: {
      LOGIN: '/auth/token/',
      REFRESH: '/auth/token/refresh/',
      PROFILE: '/auth/user/profile/'
    }
  }
};

// Datos mock para productos
export const MOCK_PRODUCTOS = [
  {
    id: 1,
    nombre: "Bolso Grande Elegante",
    slug: "bolso-grande-elegante",
    precio: "150000",
    descripcion_corta: "Bolso grande de alta calidad",
    descripcion_larga: "Bolso grande con diseño elegante y materiales de alta calidad. Perfecto para el día a día.",
    imagen_principal_url: "https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=Bolso+Grande",
    stock: 10,
    categoria: { nombre: "Bolsos Grandes", slug: "bolsos-grandes" },
    colores: [
      {
        id: 1,
        nombre: "Negro",
        hex_code: "#000000",
        imagenes: [
          { id: 1, url_imagen: "https://via.placeholder.com/400x400/000000/FFFFFF?text=Bolso+Negro", es_principal: true }
        ]
      }
    ]
  },
  {
    id: 2,
    nombre: "Billetera Premium",
    slug: "billetera-premium",
    precio: "80000",
    descripcion_corta: "Billetera de cuero genuino",
    descripcion_larga: "Billetera de cuero genuino con múltiples compartimentos y diseño moderno.",
    imagen_principal_url: "https://via.placeholder.com/400x400/10B981/FFFFFF?text=Billetera",
    stock: 15,
    categoria: { nombre: "Billeteras", slug: "billeteras" },
    colores: [
      {
        id: 2,
        nombre: "Marrón",
        hex_code: "#8B4513",
        imagenes: [
          { id: 2, url_imagen: "https://via.placeholder.com/400x400/8B4513/FFFFFF?text=Billetera+Marrón", es_principal: true }
        ]
      }
    ]
  }
];

// Datos mock para categorías
export const MOCK_CATEGORIAS = [
  { id: 1, nombre: "Bolsos Grandes", slug: "bolsos-grandes", activa: true },
  { id: 2, nombre: "Bolsos Pequeños", slug: "bolsos-pequenos", activa: true },
  { id: 3, nombre: "Billeteras", slug: "billeteras", activa: true },
  { id: 4, nombre: "Canguros", slug: "canguros", activa: true },
  { id: 5, nombre: "Complementos", slug: "complementos", activa: true }
];

// Funciones mock
export const mockApiCall = async (data: any, delay = 500) => {
  await new Promise(resolve => setTimeout(resolve, delay));
  return data;
};

export const getMockImageUrl = (text: string, bgColor = "4F46E5", textColor = "FFFFFF") => {
  return `https://via.placeholder.com/400x400/${bgColor}/${textColor}?text=${encodeURIComponent(text)}`;
};