# Catálogo Integral de Casos de Uso — FashionStore SaaS Multi-Tenant
**Metodología de Desarrollo:** ICONIX (UML 2.5 / Estándar OMG)  
**Versión:** 3.0 (Arquitectura Enterprise SaaS & Business Intelligence)

---

## 1. Estructura Modular del Sistema

El sistema se estructura en **6 Módulos de Dominio** para la gestión integral de cada tienda (tenant) y plataforma SaaS, con un total de **32 Casos de Uso nucleares**:

```
FASHIONSTORE SAAS — ARQUITECTURA DE DOMINIO ICONIX
├── Módulo 1: Usuarios y Seguridad (CU01 al CU10)
├── Módulo 2: Catálogo, Proveedores y Recomendaciones (CU11 al CU15)
├── Módulo 3: Sucursales e Inventario (CU16 al CU19)
├── Módulo 4: Reservas de Prendas (CU20 al CU22)
├── Módulo 5: Ventas y Facturación (CU23 al CU28)
└── Módulo 6: Inteligencia de Negocios y Reportes (CU29 al CU32)
```

*(Nota: Las capacidades móviles interactivas de probador virtual corresponden a la aplicación móvil Expo / React Native y no forman parte del sistema web).*

---

## 2. Catálogo Oficial de Casos de Uso (CU01 - CU33)

### Módulo 1 — Usuarios y Seguridad
* **CU01 - Gestionar Acceso al Sistema**: Autenticación multi-tenant segura vía JWT con BCrypt, control de estado de cuenta y registro inmutable en bitácora.
* **CU02 - Registrar y Gestionar Perfil de Cliente**: Auto-registro público de clientes en la tienda del tenant, gestión de preferencias de estilo y acumulación de puntos de fidelidad.
* **CU03 - Gestionar Contraseña**: Recuperación y restablecimiento seguro mediante token hash temporal de un solo uso despachado por correo electrónico.
* **CU04 - Gestionar Usuarios**: Administración centralizada de cuentas de usuario dentro del tenant (creación, activación, suspensión y cambio de roles).
* **CU05 - Gestionar Roles y Permisos**: Matriz granular de control de acceso basada en roles (RBAC) con asignación de funciones operativas (Lectura / Edición).
* **CU06 - Gestionar Empleados**: Registro de personal de planta, datos de contratación, CI, cargo y vinculación laboral a sucursales físicas.
* **CU07 - Gestionar Empresas**: Configuración corporativa y legal del inquilino SaaS (Razón Social, Nombre Comercial, NIT, País, Moneda principal/secundaria, Logo y datos de contacto).
* **CU08 - Personalizar Apariencia**: Parametrización visual de la vitrina digital del tenant (paleta de colores primario/secundario/acento, tipografías y banners promocionales).
* **CU09 - Gestionar Backups y Restore**: Generación bajo demanda y programada de respaldos lógicos del esquema del tenant y restauración segura desde Azure Blob Storage (`fashionstorestorages`).
* **CU10 - Consultar Bitácora**: Auditoría cronológica de eventos críticos del sistema (login, transferencias, cambios de precio y ajustes) con dirección IP, timestamp y usuario autor.

---

### Módulo 2 — Catálogo, Proveedores y Recomendaciones
* **CU11 - Consultar Catálogo de Productos**: Vitrina pública y administrativa con motor de búsqueda insensible a acentos y filtros combinados (categoría, temporada, género, talla, color, rebajas y rango de precio).
* **CU12 - Consultar Detalle y Disponibilidad de Producto**: Ficha técnica completa de la prenda, carrusel de fotos en alta resolución en Azure Storage, selector interactivo de color/talla y stock en vivo por sucursal.
* **CU13 - Gestionar Catálogo de Productos**: Mantenimiento administrativo de prendas, definición de precios base, generación automática de variantes por talla/color (SKU) y gestión de imágenes.
* **CU14 - Gestionar Proveedores**: Directorio de proveedores, fabricantes textiles, catálogo de costos de referencia y órdenes de compra de reabastecimiento.
* **CU15 - Obtener Recomendaciones de Prendas mediante IA**: Motor de recomendaciones personalizadas basado en similitud de atributos, compras previas e interacciones del cliente con prendas relacionadas.

---

### Módulo 3 — Sucursales e Inventario
* **CU16 - Gestionar Ciudades y Sucursales**: Administración de la red de tiendas físicas de la empresa (dirección, teléfonos, horarios de atención y ciudad).
* **CU17 - Consultar Sucursales**: Visualización pública de tiendas activas para el cliente con mapa, horarios de apertura/cierre y canales de atención directa.
* **CU18 - Consultar Inventario**: Monitor multitienda en tiempo real del stock físico disponible, stock apartado por reservas y alertas visuales de quiebre de stock mínimo.
* **CU19 - Gestionar Movimientos de Inventario**: Ejecución transaccional de ingresos de mercadería, egresos por merma/daño, ajustes por inventario físico y transferencias entre sucursales con trazabilidad de empleado responsable.

---

### Módulo 4 — Reservas de Prendas
* **CU20 - Realizar Reserva de Prendas**: Bloqueo y apartado temporal de stock (máximo 48 horas) para que el cliente acuda a probarse la prenda en el probador de una sucursal específica.
* **CU21 - Consultar y Cancelar Reserva**: Consulta en tiempo real del estado de reservas por parte del cliente y opción de cancelación voluntaria liberando inmediatamente el stock reservado.
* **CU22 - Gestionar Reserva en Sucursal**: Recepción física del cliente en tienda, verificación del código de reserva, asignación de probador y conversión ágil a venta en mostrador o anulación por vencimiento.

---

### Módulo 5 — Ventas y Facturación
* **CU23 - Gestionar Carrito de Compras**: Carrito de compras persistente con cálculo automático de promociones vigentes, descuentos porcentuales o de monto fijo y control de disponibilidad.
* **CU24 - Realizar Compra Digital**: Proceso de checkout digital integral con selección de dirección de despacho, validación de stock y emisión de factura con numeración correlativa.
* **CU25 - Consultar Historial de Compras**: Consulta del historial de transacciones, estados de entrega (preparación, despachado, entregado) y descarga de comprobantes en PDF.
* **CU26 - Procesar Pago Electrónico**: Pasarela de pagos con Stripe Checkout multi-moneda (BOB / USD con tasa de cambio dinámica), soporte para tarjetas de crédito/débito y pasarelas digitales.
* **CU27 - Registrar Venta Presencial (POS)**: Punto de venta optimizado para cajeros con lector de código de barras, selección de prendas, cobro en efectivo con cálculo de vuelto o QR/tarjeta, emisión de ticket y descuento atómico de stock.
* **CU28 - Devolución de Productos**: Protocolo formal de atención post-venta con verificación de factura original, inspección del estado de la prenda, reingreso a inventario y emisión de nota de crédito o reembolso.

---

### Módulo 6 — Inteligencia de Negocios y Reportes
* **CU29 - Consultar Dashboard (Business Intelligence & Machine Learning)**:
  * **Dashboard Ejecutivo estilo Power BI**: Visualización dinámica de KPIs de rendimiento comercial (ingresos netos, ticket promedio, margen bruto, rotación de inventario y conversión).
  * **Analítica Predictiva con Machine Learning (ML Supervisado)**: Modelo de regresión entrenado sobre series de tiempo y datasets de ventas para predecir la demanda de las próximas 4 semanas y recomendar sugerencias de abastecimiento por sucursal.
  * **Segmentación de Clientes RFM con K-Means (ML No Supervisado)**: Algoritmo de agrupamiento que clasifica la base de clientes según su *Recencia* (última compra), *Frecuencia* (visitas) y valor *Monetario* en cuadrantes accionables: Clientes VIP, Clientes Potenciales, Clientes Ocasionales y Clientes en Riesgo de Abandono.
  * **Simulación Probabilística con Datasets Estadísticos**: Calibración de modelos analíticos mediante distribuciones de Poisson (frecuencia de arribo de clientes y transacciones) y distribuciones Normales (valores de canasta de compra) para proyecciones de escenarios optimistas y conservadores.
* **CU30 - Gestionar Reportes Predefinidos**:
  * Emisión de reportes estándar operacionales: Resumen de Ventas por Período, Rotación y Existencias de Inventario por Sucursal, Arqueo de Caja y Rendimiento por Empleado.
  * Exportación con renderizado nativo vectorial a **PDF** estructurado (`pdfkit`) y hojas de cálculo **Excel** multi-pestaña (`exceljs`).
* **CU31 - Gestionar Reportes QBE (Query by Example)**:
  * Generador visual interactivo de consultas analíticas ad-hoc sin necesidad de escribir código SQL.
  * El usuario selecciona dinámicamente:
    1. Entidad principal (Ventas, Clientes, Inventario, Productos).
    2. Columnas deseadas a desplegar en la grilla.
    3. Criterios de filtrado mediante operadores visuales (`igual a`, `contiene`, `mayor que`, `entre fechas`).
    4. Funciones de agregación (`SUM`, `AVG`, `COUNT`, `MAX`, `MIN`) y ordenamiento multi-columna.
  * Previsualización instantánea en tabla interactiva con filtros locales y exportación inmediata a CSV y Excel.
* **CU32 - Gestionar Reportes por Voz y Lenguaje Natural con IA**:
  * Motor de consulta guiado por voz (Web Speech API) o texto libre en lenguaje natural para directivos y gerentes.
  * Flujo de ejecución seguro:
    1. El usuario expresa la consulta por micrófono o texto (ej.: *"Muéstrame las 5 prendas más vendidas en Santa Cruz el último mes"*).
    2. El modelo de lenguaje (LLM local / Qwen) traduce la intención a un objeto semántico estructurado en **JSON** con campos permitidos (sin concatenación directa de strings para blindaje total contra SQL Injection).
    3. El backend valida el JSON contra el catálogo de entidades y ejecuta la consulta analítica optimizada.
    4. La interfaz renderiza automáticamente tanto la tabla de resultados como la visualización gráfica más adecuada (gráfico de barras, pastel o líneas).

---

## 3. Matriz de Permisos por Rol (RBAC)

| Módulo | Casos de Uso | Administrador (Rol 1) | Cliente (Rol 2) | Encargado (Rol 3) | Cajero (Rol 4) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **M1: Seguridad** | CU01 - CU10 | Total (Edición) | CU01, CU02, CU03 | CU01, CU03 | CU01, CU03 |
| **M2: Catálogo** | CU11 - CU15 | Total (Edición) | CU11, CU12, CU15 | CU11, CU12, CU14 | CU11, CU12 |
| **M3: Inventario** | CU16 - CU19 | Total (Edición) | CU17 | CU16, CU17, CU18, CU19 | CU18 |
| **M4: Reservas** | CU20 - CU22 | Total (Edición) | CU20, CU21 | CU20, CU21, CU22 | CU22 |
| **M5: Ventas** | CU23 - CU28 | Total (Edición) | CU23, CU24, CU25, CU26 | CU27, CU28 | CU27, CU28 |
| **M6: BI & Reportes** | CU29 - CU32 | Total (Edición) | - | CU29, CU30, CU31, CU32 | - |
