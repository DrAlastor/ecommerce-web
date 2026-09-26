<p align="center">
  <img src="frontend/public/logo.jpg" alt="Dressly Fashion Store Logo" width="160" style="border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.18);" />
</p>

<h1 align="center">✨ Dressly Fashion Store</h1>

<p align="center">
  <strong>Plataforma Omnicanal Inteligente de Comercio Electrónico, Gestión Multisucursal y Moda Digital con Realidad Aumentada</strong>
</p>

<p align="center">
  <a href="https://proud-pond-01d50030f.6.azurestaticapps.net" target="_blank">
    <img src="https://img.shields.io/badge/Web%20en%20Vivo-Azure%20Static%20Apps-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white" alt="Live Demo" />
  </a>
  <a href="https://dressly-api-2026.azurewebsites.net" target="_blank">
    <img src="https://img.shields.io/badge/API%20REST-Azure%20App%20Service-5C2D91?style=for-the-badge&logo=nestjs&logoColor=white" alt="API REST" />
  </a>
  <a href="https://github.com/DrAlastor/ecommerce-movil" target="_blank">
    <img src="https://img.shields.io/badge/App%20M%C3%B3vil-React%20Native-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="App Móvil" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-24+-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Prisma%20ORM-6-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-Azure%20Database-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Docker-Multi--stage-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
</p>

---

## 🌟 Acerca de Dressly Fashion Store

**Dressly Fashion Store** es una solución de comercio omnicanal de vanguardia concebida para la industria de la moda contemporánea. Diseñada bajo una arquitectura empresarial orientada a servicios, integra:

- **E-Commerce Web de Alta Gama:** Experiencia de compra inmersiva, adaptativa y responsiva con visualización 3D interactiva en tiempo real.
- **Punto de Venta Presencial (POS):** Módulo administrativo para terminales físicas en tienda con facturación electrónica, lectura de códigos y control de stock inmediato.
- **Gestión Multisucursal & Logística:** Trazabilidad de inventario entre sucursales, traspasos de stock y auditoría de movimientos.
- **Recomendaciones con IA:** Motor inteligente para sugerencias personalizadas de prendas según perfiles de compra y tendencias.
- **Experiencia Móvil con Realidad Aumentada:** Vestidor virtual interactivo que permite probar prendas mediante cámara de dispositivo móvil.

---

## 🌐 Enlaces y Entornos de Producción

| Componente | Servicio en la Nube | URL Pública / Acceso |
|---|---|---|
| **Frontend Web (React SPA)** | Azure Static Web Apps | [**proud-pond-01d50030f.6.azurestaticapps.net**](https://proud-pond-01d50030f.6.azurestaticapps.net) |
| **Backend API (NestJS + Docker)** | Azure App Service (Linux) | `https://dressly-api-2026.azurewebsites.net` |
| **Base de Datos Relacional** | Azure Database for PostgreSQL | `fashionstore-postgres-alessandro.postgres.database.azure.com` |
| **Almacenamiento Multimedia (Imágenes/3D)** | Azure Blob Storage | `https://fashionstorestorage.blob.core.windows.net/productos/` |
| **Repositorio Aplicación Móvil (AR)** | GitHub | [DrAlastor/ecommerce-movil](https://github.com/DrAlastor/ecommerce-movil) |

---

## 🧩 Módulos y Casos de Uso del Sistema (CU01 - CU27)

El sistema implementa 27 casos de uso completamente modelados, organizados en 7 subsistemas de negocio:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DRESSLY FASHION STORE                            │
├─────────────────────┬───────────────────────┬───────────────────────────────┤
│  Usuarios y         │  Catálogo,            │  Sucursales e                 │
│  Seguridad          │  Proveedores y        │  Inventario                   │
│  (CU01 — CU07)      │  Recomendaciones      │  (CU13 — CU16)                │
│                     │  (CU08 — CU12)        │                               │
├─────────────────────┼───────────────────────┼───────────────────────────────┤
│  Reservas de        │  Ventas y             │  Experiencia Móvil            │
│  Prendas            │  Facturación          │  Interactiva                  │
│  (CU17 — CU19)      │  (CU20 — CU24)        │  (CU25 — CU26)                │
├─────────────────────┴───────────────────────┴───────────────────────────────┤
│  Reportes (CU27)                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Usuarios y Seguridad
- **CU01 — Gestionar Acceso al Sistema:** Autenticación robusta con tokens JWT, hashing seguro de contraseñas y detección de roles.
- **CU02 — Registrar y Gestionar Perfil de Cliente:** Registro de nuevos clientes, actualización de datos personales y preferencias de compra.
- **CU03 — Gestionar Contraseña:** Políticas de seguridad, restablecimiento y actualización de credenciales de usuario.
- **CU04 — Gestionar Usuarios:** Administración de cuentas de usuario, control de estado y asignación granular de roles.
- **CU05 — Gestionar Roles y Permisos:** Control de acceso basado en roles (RBAC) con asignación dinámica de permisos sobre cada funcionalidad.
- **CU06 — Gestionar Empleados:** Administración y vinculación de personal con sus sucursales asignadas y cargos operativos.
- **CU07 — Consultar Bitácora:** Registro inmutable de eventos, accesos y operaciones críticas para auditoría integral del sistema.

### Catálogo, Proveedores y Recomendaciones
- **CU08 — Consultar Catálogo de Productos:** Navegación por colecciones, búsqueda en tiempo real y panel de filtros avanzado (categorías, precio, colores, tallas, rebajas y 3D) con interfaz responsiva moderna tipo *bottom sheet* en móviles.
- **CU09 — Consultar Detalle y Disponibilidad de Producto:** Ficha técnica de prendas, visualizador de modelos 3D interactivos y verificación de disponibilidad multitienda.
- **CU10 — Gestionar Catálogo de Productos:** Administración de prendas, variantes, fotografías, temporadas, categorías, tallas y colores.
- **CU11 — Gestionar Proveedores:** Padrón y administración de fabricantes y proveedores de prendas e insumos.
- **CU12 — Obtener Recomendaciones de Prendas mediante IA:** Algoritmo inteligente que sugiere prendas y combinaciones personalizadas según preferencias y tendencias.

### Sucursales e Inventario
- **CU13 — Gestionar Ciudades y Sucursales:** Administración de cobertura geográfica, ciudades y puntos de venta físicos de la cadena.
- **CU14 — Consultar Sucursales:** Directorio público y administrativo de tiendas físicas con direcciones, horarios de atención y georreferencia.
- **CU15 — Consultar Inventario:** Monitoreo y control de existencias en tiempo real por sucursal, alertas de stock mínimo y reabastecimiento.
- **CU16 — Gestionar Movimientos de Inventario:** Registro y trazabilidad de ingresos, egresos, ajustes y transferencias de stock entre sucursales.

### Reservas de Prendas
- **CU17 — Realizar Reserva de Prendas:** Apartado digital de artículos por tiempo determinado con generación de comprobante y código QR.
- **CU18 — Consultar y Cancelar Reserva:** Seguimiento, consulta y cancelación oportuna de reservas activas tanto por el cliente como por personal de tienda.
- **CU19 — Gestionar Reserva en Sucursal:** Procesamiento, verificación, entrega física o liberación de prendas reservadas en mostrador.

### Ventas y Facturación
- **CU20 — Gestionar Carrito de Compras:** Bolsa de compras interactiva y lista de deseos con cálculo dinámico de subtotales, descuentos y validación de stock.
- **CU21 — Realizar Compra Digital:** Proceso de checkout digital optimizado con selección de método de entrega, dirección y resumen de orden.
- **CU22 — Consultar Historial de Compras:** Consulta detallada de pedidos anteriores, estados de entrega y descarga de comprobantes de venta.
- **CU23 — Procesar Pago Electrónico:** Integración con pasarela de pagos digital segura para cobro con tarjeta y confirmación en tiempo real.
- **CU24 — Registrar Venta Presencial:** Módulo Punto de Venta (POS) para tienda física con soporte para cobro mixto (efectivo/tarjeta) y facturación inmediata.

### Experiencia Móvil Interactiva
- **CU25 — Utilizar Vestidor Virtual:** Experiencia inmersiva en la app móvil que proyecta prendas en 3D sobre la silueta del usuario mediante la cámara y realidad aumentada.
- **CU26 — Devolución de Productos:** Gestión y solicitud de devoluciones o garantías de prendas con validación de estado y reingreso al inventario.

### Reportes
- **CU27 — Consultar Dashboard y Reportes:** Panel ejecutivo analítico con KPIs estratégicos en tiempo real (ingresos por canal, productos más vendidos, rotación de stock y métricas operativas).

---

## 🏛️ Arquitectura del Sistema

Dressly implementa una arquitectura desacoplada basada en micro-servicios lógicos y patrones de diseño modernos:

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│         Clientes Web            │       │        App Móvil (AR)           │
│   React 19 + TypeScript + Vite  │       │     React Native + Camera AR    │
└────────────────┬────────────────┘       └────────────────┬────────────────┘
                 │                                         │
                 │              HTTPS / REST API           │
                 └────────────────────┬────────────────────┘
                                      │
                                      ▼
                 ┌─────────────────────────────────────────┐
                 │          Backend API (NestJS 11)        │
                 │   • Guards de JWT & RBAC (Roles)        │
                 │   • Módulos funcionales desacoplados    │
                 │   • Prisma ORM 6 Data Access Layer      │
                 └────────────┬───────────────────┬────────┘
                              │                   │
                     SQL / TCP│                   │HTTPS (SDK)
                              ▼                   ▼
    ┌───────────────────────────────┐   ┌───────────────────────────────────┐
    │ Azure Database for PostgreSQL │   │ Azure Blob Storage (CDN)          │
    │  • Tablas relacionales        │   │  • Modelos 3D (.glb, .gltf)       │
    │  • Bitácora inmutable         │   │  • Imágenes de catálogo           │
    │  • Triggers e integridad      │   │  • Comprobantes y facturas        │
    └───────────────────────────────┘   └───────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Propósito |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite 8 | Interfaz SPA ultra-rápida, modular y tipada de extremo a extremo. |
| **Estilos & UI** | Vanilla CSS Moderno, Lucide Icons | Sistema de diseño de lujo exclusivo con animaciones fluidas y soporte responsivo móvil/tablet. |
| **Modelos 3D** | Three.js, WebGL | Renderizado interactivo de prendas en 3D en el navegador. |
| **Backend** | NestJS 11, Node.js 24 | Framework empresarial modular basado en TypeScript e Inyección de Dependencias. |
| **ORM** | Prisma ORM 6 | Consultas tipo-seguras, migraciones versionadas y modelado declarativo. |
| **Base de Datos** | PostgreSQL 16 | Motor relacional robusto con transacciones ACID e índices optimizados. |
| **Contenedores** | Docker, Multi-stage builds | Entornos reproducibles y empaquetado liviano para producción. |
| **Nube & DevOps** | Microsoft Azure, GitHub Actions | Despliegue continuo (CI/CD) automatizado a Azure App Service y Static Web Apps. |

---

## 📁 Estructura del Repositorio

```text
ecommerce-web/
│
├── backend/                               # Servidor de aplicaciones NestJS
│   ├── prisma/                            # Esquema de Prisma y migraciones de BD
│   │   ├── schema.prisma                  # Modelado relacional completo
│   │   └── migrations/                    # Historial de migraciones SQL
│   ├── src/
│   │   ├── auth/                          # Autenticación, JWT y estrategias
│   │   ├── users/                         # Gestión de usuarios y bitácora
│   │   ├── catalog/                       # Prendas, variantes, marcas y categorías
│   │   ├── branches/                      # Sucursales e inventario
│   │   ├── reservations/                  # Flujo de reservas
│   │   ├── sales/                         # Ventas digitales, POS y facturación
│   │   ├── reports/                       # Reportes y métricas analíticas
│   │   └── main.ts                        # Punto de entrada de la aplicación
│   ├── Dockerfile                         # Imagen Docker multi-etapa
│   └── package.json
│
├── frontend/                              # Aplicación de cliente y panel admin React
│   ├── public/                            # Recursos públicos, logo y modelos 3D
│   ├── src/
│   │   ├── components/                    # Componentes compartidos (Navbar, Cart, UI)
│   │   ├── modules/
│   │   │   ├── users-security/            # CU01 a CU07 (Acceso, Perfil, Contraseña, Roles, Bitácora)
│   │   │   ├── catalog/                   # CU08 a CU12 (Catálogo, Filtros 3D, Proveedores, Recomendaciones IA)
│   │   │   ├── branches-inventory/        # CU13 a CU16 (Ciudades, Sucursales, Inventario, Movimientos)
│   │   │   ├── reservations/              # CU17 a CU19 (Reservas y Gestión en Sucursal)
│   │   │   ├── sales-billing/             # CU20 a CU24 (Carrito, Checkout, Historial, Pagos, Venta Presencial)
│   │   │   ├── mobile-experience/         # CU25 y CU26 (Vestidor Virtual AR, Devolución de Productos)
│   │   │   └── reports-dashboard/         # CU27 (Dashboard y Reportes Analíticos)
│   │   ├── shared/layouts/                # Layouts para Clientes y Panel Administrativo
│   │   └── main.tsx                       # Punto de entrada de React
│   ├── staticwebapp.config.json           # Reglas de enrutamiento SPA para Azure
│   └── package.json
│
├── .github/workflows/                     # Automatización CI/CD con Azure
├── docker-compose.yml                     # Orquestación de contenedores locales
└── README.md                              # Documentación principal del proyecto
```

---

## 🚀 Guía de Instalación y Puesta en Marcha Local

### Prerrequisitos
- **Node.js**: v20 o v24+
- **npm** o **pnpm**
- **PostgreSQL**: Instancia local o remota
- **Docker** *(opcional para ejecución en contenedores)*

### 1. Clonar el Repositorio
```bash
git clone https://github.com/DrAlastor/ecommerce-web.git
cd ecommerce-web
```

### 2. Configurar y Levantar el Backend
```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno (crear .env a partir de las credenciales de PostgreSQL)
# DATABASE_URL="postgresql://usuario:password@localhost:5432/dressly_db?schema=public"
# JWT_SECRET="tu_clave_secreta"

# Ejecutar migraciones de Prisma
npx prisma migrate dev

# Iniciar en modo desarrollo
npm run start:dev
```
> El backend quedará activo en: `http://localhost:3000`

### 3. Configurar y Levantar el Frontend
```bash
cd ../frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo con Vite
npm run dev
```
> La aplicación web abrirá en: `http://localhost:5173`

---

## 🐳 Ejecución con Docker Compose

Para levantar el entorno completo con un único comando:

```bash
docker compose up --build -d
```

---

## 📐 Metodología de Desarrollo

El proyecto sigue formalmente el **Proceso Unificado de Desarrollo de Software (PUDS)**:
- **Enfoque:** Iterativo, incremental y centrado en la arquitectura.
- **Modelado:** Estándar **UML 2.5+** (Diagramas de Casos de Uso, Secuencia, Actividades, Clases y Paquetes).
- **Control de Calidad:** Revisiones por pares, pruebas de integración y registro continuo en bitácora de auditoría.

---

## 👨‍💻 Información Académica

- **Desarrollado por:** Alessandro Yevara Ponce
- **Carrera:** Ingeniería Informática
- **Facultad:** FICCT — Facultad de Ingeniería en Ciencias de la Computación
- **Proyecto:** Dressly Fashion Store — Sistema de Información Web & Móvil
- **Asignatura:** Sistemas de Información II (INF412)
- **Periodo:** 2026

<p align="center">
  <sub>Desarrollado con dedicación, elegancia y excelencia en ingeniería de software por <strong>Alessandro Yevara Ponce</strong>.</sub>
</p>
