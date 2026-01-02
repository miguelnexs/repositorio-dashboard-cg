// Configuración centralizada de la API
export const API_CONFIG = {
  BASE_URL: 'https://softwarebycg.shop',
  TIMEOUT: 10000,
  FAST_TIMEOUT: 5000,
  API_URL: 'https://softwarebycg.shop',
  
  // Endpoints específicos
  ENDPOINTS: {
    PRODUCTOS: '/webconfig/public/products/',
    CATEGORIAS: '/products/categories/',
    VENTAS: '/api/ventas/',
    PEDIDOS: '/api/pedidos/',
    AUTH: {
      LOGIN: '/auth/token/',
      REFRESH: '/auth/token/refresh/',
      PROFILE: '/auth/user/profile/'
    }
  }
};

// Función helper para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_CONFIG.BASE_URL}${cleanEndpoint}`;
};

// Función helper para manejar URLs de imágenes con mejor manejo de errores
export const getImageUrl = (url: string): string => {
  if (!url) return '';
  
  // Si ya es una URL completa del backend, devolverla tal cual
  if (url.startsWith(API_CONFIG.BASE_URL)) {
    return url;
  }
  
  // Si es relativa, anteponer la URL del servidor
  if (url.startsWith('/')) {
    return `${API_CONFIG.BASE_URL}${url}`;
  }
  
  // Si es otra cosa, devolver como está
  return url;
};

// Función mejorada para manejar imágenes con fallback
export const getImageUrlWithFallback = (url: string, fallbackUrl?: string): string => {
  if (!url) {
    return fallbackUrl || '/placeholder-image.jpg';
  }
  
  // Procesar la URL normalmente
  const processedUrl = getImageUrl(url);
  return processedUrl;
};

// Función para verificar si una imagen existe
export const checkImageExists = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn(`Error verificando imagen: ${url}`, error);
    return false;
  }
};

// Función para obtener una imagen con retry
export const getImageWithRetry = async (url: string, maxRetries = 3): Promise<string> => {
  const processedUrl = getImageUrlWithFallback(url);
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const exists = await checkImageExists(processedUrl);
      if (exists) {
        return processedUrl;
      }
    } catch (error) {
      console.warn(`Intento ${i + 1} falló para: ${processedUrl}`);
    }
    
    // Esperar antes del siguiente intento
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  // Si todos los intentos fallan, devolver la URL procesada de todas formas
  return processedUrl;
};

export default API_CONFIG;

export const buildTenantQuery = (): string => {
  try {
    const params = new URLSearchParams(window.location.search);
    const aid = params.get('aid');
    const site = window.location.origin;
    const qp = new URLSearchParams();
    if (aid) qp.set('aid', aid);
    if (site) qp.set('site', site);
    const s = qp.toString();
    return s ? `?${s}` : '';
  } catch {
    return '';
  }
};
