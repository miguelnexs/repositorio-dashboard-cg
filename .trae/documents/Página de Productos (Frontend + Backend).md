## Alcance
- Crear página de Productos con formulario (imagen + descripción) y tabla de listado
- Implementar API CRUD en Django para productos con subida de imagen
- Integrar en frontend React (Electron + Vite) usando estado local y llamadas a API existentes

## Backend (Django + DRF)
- Nueva app `products` con modelo `Product`:
  - Campos: `id`, `description` (TextField), `image` (ImageField, `upload_to='products/'`), `tenant` (FK opcional a `users.Tenant`), `created_at`
- Configurar media en `globetrek_backend/settings.py`:
  - `MEDIA_URL='/media/'`, `MEDIA_ROOT=BASE_DIR / 'media'`
- Servir media en desarrollo en `globetrek_backend/urls.py`:
  - `urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)`
- Serializers y vistas DRF:
  - `ProductSerializer`: maneja `image` y `description`
  - `ProductListCreateView` (ListCreateAPIView, `IsAuthenticated`, `parser_classes=[MultiPartParser, FormParser]`)
  - `ProductDetailView` (RetrieveUpdateDestroyAPIView, `IsAuthenticated`)
  - Filtrar por `tenant` si el middleware de tenant está activo; asignar `tenant` al crear
- Rutas:
  - `path('products/', include('products.urls'))` con:
    - `GET /products/` lista
    - `POST /products/` crea (multipart/form-data)
    - `GET/PUT/PATCH/DELETE /products/<id>/`

## Frontend (React + Tailwind)
- Ampliar `frontend/src/renderer/src/components/Dashboard.jsx`:
  - Añadir entrada de menú `Productos`; mantener patrón de `view` local `setView('productos')`
- Nuevo componente `ProductosManager.jsx` en `components/`:
  - Formulario: `descripcion` (textarea) y `imagen` (`<input type='file'>`)
  - Envío: `FormData` a `POST /products/` con `authHeaders(token)` del `App.jsx` y `apiBase`
  - Tabla Tailwind: columnas `Imagen` (preview desde `MEDIA_URL`), `Descripción`, `Fecha`, `Acciones` (editar/eliminar opcional)
  - Cargar listado con `GET /products/` al montar; refrescar tras crear/eliminar
- Reutilizar dependencias existentes; no introducir librerías nuevas (tabla simple con Tailwind en lugar de antd/MUI)

## Seguridad y Permisos
- Proteger endpoints con JWT (`IsAuthenticated`); usar token actual del login
- Opcional: RBAC simple (crear/editar sólo `admin`), lectura para `employee`; seguir patrón usado en `users/api.py`
- Multi-tenant: al crear producto, asignar `tenant` del request si aplica; listar filtrando por `tenant`

## Validación
- Backend: probar `POST /products/` con imagen y descripción; confirmar archivo en `media/products/`
- Frontend: verificar preview de imagen, refresco de tabla, manejo de errores
- Servir media correctamente desde Django y que Electron pueda cargarla via `http://127.0.0.1:8000/media/...`

## Entregables
- Código de la app `products` (modelos, serializers, vistas, urls)
- Configuración de media en settings/urls
- Página de Productos integrada en el Dashboard con formulario y tabla
- Documentación mínima de endpoints en comentarios de vistas/serializers si es necesario

¿Confirmas que proceda con esta implementación?