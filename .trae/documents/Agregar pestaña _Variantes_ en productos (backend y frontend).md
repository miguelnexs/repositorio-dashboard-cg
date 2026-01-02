## Objetivo
- Añadir una pestaña "Variantes" en el formulario de productos para gestionar variaciones que incrementan el precio base.
- Implementar soporte en backend (modelo/API/serializers) y frontend (UI y sincronización CRUD).

## Contexto actual
- Backend productos y colores:
  - Modelo `Product` y variantes por color en `backend/products/models.py:36-45` y `backend/products/models.py:58-62`.
  - Serializador de producto con ensamblado de colores e imágenes en `backend/products/api.py:57-93`.
  - Endpoints de colores/imágenes en `backend/products/urls.py:9-12` y vistas/serializers en `backend/products/api.py:280-409`.
- Frontend (Electron + React) formulario de producto:
  - Pestañas "Detalles" y "Colores" en `frontend/src/renderer/src/components/ProductFormPage.jsx:257-265`.
  - CRUD y sincronización de colores e imágenes en `frontend/src/renderer/src/components/ProductFormPage.jsx:110-126, 175-233`.
- Frontend web (`tienda virtual`):
  - Componente de tabs disponible en `tienda virtual/src/components/ui/tabs.tsx:6-53`.
  - Formularios de producto vacíos en `tienda virtual/src/renderer/src/components/productos/ProductForm.jsx` y `ProductFormColors.jsx`.

## Cambios en Backend
- Modelo `ProductVariant` (nuevo) en `backend/products/models.py`:
  - Campos: `product` (FK a `Product`, `related_name='variants'`), `name` (`CharField(50)`), `extra_price` (`DecimalField(max_digits=10, decimal_places=2)`), `position` (`PositiveIntegerField`, default 0), `created_at`.
  - Restricciones: `extra_price >= 0` (validación en serializer), orden por `position`.
- Serializador `ProductVariantSerializer` en `backend/products/api.py`:
  - Campos: `id`, `product` (solo lectura), `name`, `extra_price`, `position`, `created_at`.
  - Validaciones: nombre requerido, `extra_price` positivo con hasta 2 decimales.
- Vistas DRF:
  - `ProductVariantListCreateView` (GET/POST por producto) similar a `ProductColorListCreateView` con chequeo de tenant.
  - `ProductVariantDetailView` (GET/PATCH/DELETE) similar a `ProductColorDetailView`.
- Rutas:
  - `path('<int:product_id>/variants/', ProductVariantListCreateView)` y `path('variants/<int:pk>/', ProductVariantDetailView)` en `backend/products/urls.py`.
- Inclusión en `ProductSerializer.to_representation`:
  - Agregar `variants: [{id, name, extra_price}]` para consumo de frontend.
- Admin:
  - Registrar `ProductVariant` en `backend/products/admin.py` con `list_display` y `search_fields` mínimos.
- Migraciones:
  - Crear y aplicar migración para el nuevo modelo.

## Cambios en Frontend (Electron)
- UI: añadir pestaña "Variantes" junto a "Detalles" y "Colores" en `ProductFormPage.jsx`.
  - Botón de tab: `setActiveTab('variantes')` junto con los existentes.
  - Contenido de la pestaña: lista editable de variantes con campos `Nombre` y `Sobrecosto` (moneda), y orden implícito por posición.
- Estado y carga:
  - Estados: `variants`, `initialVariants`, `variantName`, `variantExtraPrice`.
  - `useEffect` al editar: cargar `GET ${apiBase}/products/${product.id}/variants/` y poblar `variants`.
- Validación de formulario:
  - Verificar nombre no vacío y `extra_price` positivo (hasta 2 decimales).
- Sincronización en `handleSubmit`:
  - Tras guardar el producto, calcular diffs contra `initialVariants` y:
    - Crear: `POST /products/<product_id>/variants/` con `name`, `extra_price`, `position`.
    - Actualizar: `PATCH /products/variants/<id>/` si cambia `name/extra_price/position`.
    - Eliminar: `DELETE /products/variants/<id>/` si se quitó.
  - Mantener misma estrategia usada para colores en `frontend/src/renderer/src/components/ProductFormPage.jsx:175-233`.

## Cambios en Frontend web (`tienda virtual`) — opcional inicial
- Implementar `ProductForm.jsx` usando `Tabs/TabsList/TabsTrigger/TabsContent` de `tabs.tsx` para "Detalles", "Colores" y "Variantes".
- Replicar UI de variantes (nombre + sobrecosto) con `fetch` hacia los mismos endpoints.
- Dejar colores como futuro relleno si se usa este panel como administración.

## Consideraciones técnicas
- Moneda: usar `Decimal` en backend y normalizar en frontend con 2 decimales (similar a `normalizePrice` en `ProductFormPage.jsx:30-36`).
- Tenancy y permisos: copiar lógica de chequeo usada en colores (`api.py:303-316` y `340-346`).
- Límite de variantes: sin límite inicial; se puede añadir validación si lo requieren.
- Performance: endpoints simples sin paginación inicialmente (como colores); si la lista crece, se añade `Pagination`.

## Validación
- Backend: pruebas manuales con `POST/PATCH/DELETE` y verificación en `ProductSerializer` de que `variants` aparece.
- Frontend: flujo crear/editar producto, agregar/editar/eliminar variantes, persistencia y render del tab.
- No se alteran precios de detalle del producto en la web por ahora; si se desea, luego se añade selección de variante que ajuste el precio mostrado.

## Entregables
- Código backend con modelo/serializer/vistas/rutas/admin para `ProductVariant`.
- UI y lógica de sincronización del tab "Variantes" en `ProductFormPage.jsx`.
- (Opcional) `ProductForm.jsx` inicial con tabs y sección de variantes en `tienda virtual`.

¿Confirmo y procedo a implementar estos cambios?