# 👗 FashionStore — E-commerce Web

Plataforma inteligente de comercio electrónico para una cadena de tiendas de ropa, desarrollada como proyecto académico de **Sistemas de Información II**.

FashionStore integra comercio electrónico, gestión de inventario multisucursal, reservas de prendas, ventas presenciales y digitales, pagos electrónicos, inteligencia artificial y una aplicación móvil con vestidor virtual mediante realidad aumentada.

---

## 🚀 Tecnologías

### Backend
- Node.js
- TypeScript
- NestJS
- Prisma ORM
- PostgreSQL
- API REST

### Frontend
- React
- TypeScript
- Vite

### Infraestructura
- Microsoft Azure
- Git / GitHub

### Aplicación móvil
La aplicación móvil se desarrolla en un repositorio independiente utilizando:

- React Native
- TypeScript
- Android SDK
- Realidad aumentada
- Cámara del dispositivo

Repositorio móvil:

[DrAlastor/ecommerce-movil](https://github.com/DrAlastor/ecommerce-movil)

---

## 📂 Estructura del proyecto

```text
ecommerce-web/
│
├── backend/
│   ├── src/
│   ├── test/
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

🏗️ Arquitectura

La solución utiliza una arquitectura cliente-servidor basada en servicios REST.
```
┌─────────────────┐
│   React Web     │
│   Frontend      │
└────────┬────────┘
         │
         │ HTTP / REST
         ▼
┌─────────────────┐
│     NestJS      │
│     Backend     │
└────────┬────────┘
         │
         │ Prisma ORM
         ▼
┌─────────────────┐
│   PostgreSQL    │
│ Base de datos   │
└─────────────────┘
```
La aplicación móvil React Native consumirá la misma API REST proporcionada por NestJS.

📋 Funcionalidades principales

FashionStore contempla las siguientes funcionalidades:

- Gestión de usuarios y roles
- Gestión de clientes y empleados
- Gestión de ciudades y sucursales
- Catálogo de prendas
- Categorías, tallas y colores
- Temporadas y colecciones
- Gestión de proveedores
- Inventario por sucursal
- Reservas de múltiples prendas
- Carrito de compras
- Ventas digitales
- Punto de venta presencial
- Integración con pasarela de pago
- Actualización automática de inventario
- Reportes y dashboards
- Recomendaciones mediante inteligencia artificial
- Vestidor virtual mediante realidad aumentada

⚙️ Requisitos

Antes de ejecutar el proyecto se necesita:

- Node.js 24+
- npm
- PostgreSQL
- Git


📐 Metodología

El proyecto se desarrolla utilizando el:

Proceso Unificado de Desarrollo de Software (PUDS)

con un enfoque:

- Iterativo
- Incremental
- Orientado a un MVP
- Modelado mediante UML 2.5+

Los principales flujos de trabajo considerados son:

- Captura de requisitos
- Análisis
- Diseño
- Implementación
- Pruebas
☁️ Despliegue

La solución será desplegada en Microsoft Azure.

La arquitectura prevista contempla:

- Backend NestJS → Azure App Service / Container Apps
- Frontend React → Azure Static Web Apps
- PostgreSQL → Azure Database for PostgreSQL
- Archivos e imágenes → Azure Blob Storage


👨‍💻 Proyecto

FashionStore

Proyecto desarrollado para la asignatura:

Sistemas de Información II — 2026
