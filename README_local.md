# repositorio-dashboard-cg

Backend del sistema de gestión de productos y ventas para CG by Caro.

## Tecnologías utilizadas

- **Framework**: Django 4.2+
- **Lenguaje**: Python 3.11+
- **Base de datos**: PostgreSQL
- **API**: Django REST Framework
- **Autenticación**: Token Authentication
- **Servidor**: Gunicorn

## Estructura del proyecto

```
backend/
├── clients/          # Gestión de clientes
├── products/         # Gestión de productos
├── sales/           # Gestión de ventas
├── users/           # Gestión de usuarios y autenticación
├── webconfig/       # Configuración web
├── scripts/         # Scripts de utilidad
├── staticfiles/     # Archivos estáticos
└── globetrek_backend/ # Configuración principal del proyecto
```

## Instalación

1. Clonar el repositorio
2. Crear entorno virtual: `python -m venv venv`
3. Activar entorno virtual: `venv\Scripts\activate`
4. Instalar dependencias: `pip install -r requirements.txt`
5. Configurar variables de entorno
6. Ejecutar migraciones: `python manage.py migrate`
7. Crear superusuario: `python manage.py createsuperuser`

## Uso

```bash
# Desarrollo
python manage.py runserver

# Producción
gunicorn globetrek_backend.wsgi:application
```

## Endpoints principales

- `/api/auth/` - Autenticación
- `/api/products/` - Gestión de productos
- `/api/clients/` - Gestión de clientes
- `/api/sales/` - Gestión de ventas

## Autor

CG by Caro - Sistema de gestión empresarial