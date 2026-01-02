## Objetivo

Crear una página de Productos que permita agregar (por ahora) imagen y descripción del producto y visualizar un listado en una tabla, con soporte en frontend y backend.

## Contexto Actual

* Frontend: React 18 en Electron con Vite y Tailwind; sin router; `apiBase` y manejo de token ya disponibles en `frontend/src/renderer/src/App.jsx`.

* Backend: Django + DRF + JWT; base de datos SQLite; media no configurada aún.

## Frontend

1. Añadir vista "Productos" en el menú de `frontend/src/renderer/src/components/Dashboard.jsx` y renderizarla con `view==='productos'`.
2. Crear `frontend/src/renderer/src/components/ProductosManager.jsx` que incluya:

   * Formulario con `descripcion` y `imagen` (`<input type="file">`). Enviar `FormData` vía POST a `api/products/` usando `apiBase` y `Authorization` existente.

   * Tabla de productos con columnas: Imagen (miniatura) y Descripción, basada en `antd.Table` (ya instalado) para rapidez.

   * Carga inicial de productos con GET `api/products/` y actualización al crear.
3. Mostrar imágenes usando URLs del backend (`MEDIA_URL`), sin almacenar binarios en frontend.

## Backend

1. Crear app `products`:

   * Modelo `Product` con campos: `description` (TextField) e `image` (ImageField, `upload_to='products/'`).
2. Configurar media en `backend/globetrek_backend/settings.py`:

   * `MEDIA_URL = '/media/'` y `MEDIA_ROOT = BASE_DIR / 'media'`.
3. Exponer media en desarrollo en `backend/globetrek_backend/urls.py`:

   * `urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)`.
4. API DRF en `products`:

   * Serializador `ProductSerializer`.

   * Vistas `ListCreateAPIView` (GET/POST `api/products/`) y `RetrieveUpdateDestroyAPIView` (GET/PUT/DELETE `api/products/<id>/`).

   * Aceptar `multipart/form-data` para subida de imagen.
5. Autenticación y permisos:

   * Proteger endpoints con JWT; permisos básicos: usuarios autenticados pueden listar y crear (se puede restringir creación a roles si lo solicitás).

## Opcional (Multi‑tenant)

* Si aplica, asociar `Product` a `Tenant` y filtrar por tenant actual, siguiendo el patrón existente. Por defecto, no se incluye para mantenerlo simple.

## Verificación

* Backend: iniciar servidor y probar POST con imagen y descripción, verificar archivo en `media/products/` y URL accesible.

* Frontend: ejecutar en modo dev, crear producto desde el formulario y validar aparición en la tabla con miniatura.

## Archivos a Impactar

* Frontend: `frontend/src/renderer/src/components/Dashboard.jsx`, `frontend/src/renderer/src/components/ProductosManager.jsx` (nuevo).

* Backend: `backend/globetrek_backend/settings.py`, `backend/globetrek_backend/urls.py`, `backend/products/models.py`, `backend/products/serializers.py`, `backend/products/api.py`, `backend/products/urls.py`. ¿Confirmás este plan para proceder a implementarlo?

