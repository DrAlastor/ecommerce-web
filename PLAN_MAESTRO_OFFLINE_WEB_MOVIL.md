# Plan maestro offline para web y aplicación móvil

**Estado:** implementación local del alcance acordado, con pruebas automatizadas y de PostgreSQL aislado; pendiente de validación en teléfono y en el entorno de despliegue. Este documento parte de `PLAN_OFFLINE_PWA_CIERRE_CAJA.md`. La carpeta `ecommerce-movil` fue reemplazada desde el main indicado por el usuario antes de aplicar los cambios offline.

### Avance técnico inicial

El estado operativo actualizado, contrato y pasos de validación están en `OFFLINE_OPERACION.md`. Se añadieron recepción idempotente, preparación, POS local en efectivo, comprobantes, recuperación, conciliación administrativa, cierre de turno y service worker. También se adaptaron las funciones existentes del repositorio móvil, partiendo de una copia limpia de main; el alcance y las pruebas están en `ecommerce-movil/OFFLINE.md`. Las pruebas con PostgreSQL real ya son ejecutables sin Docker mediante una base temporal. Quedan las verificaciones en dispositivo y del recorrido completo desplegado antes de habilitar producción. Las fases siguientes conservan sus criterios originales y no representan por sí solas el estado actual de cada entrega.

- IndexedDB integra preparación, venta/stock atómicos, comprobantes, respaldos y arqueos por turno. Las comprobaciones de Chromium pasaron.
- Compilan frontend y backend; pasan siete pruebas unitarias del POS. PostgreSQL real verificó idempotencia concurrente, rollback, recuperación, aprobación histórica auditada y cierre de caja repetible.
- La app móvil conserva sus funciones existentes y añade persistencia de consultas/imágenes, borradores y reconexión. TypeScript, veinte pruebas y el bundle Android de Metro pasan. No se añadió un POS móvil.
- La escritura offline bloquea las tablas de identificadores compartidos. La migración global de `MAX + 1` a secuencias sigue pendiente como mejora de concurrencia de los demás módulos; no se amplía el piloto a múltiples terminales.

## 1. Objetivo y alcance

Permitir que una tienda preparada previamente siga registrando ventas presenciales en efectivo durante una interrupción de internet y que las concilie al recuperar acceso al backend. La web y la aplicación móvil mantendrán el contexto de tienda y usuario; cada plataforma tendrá su propia persistencia según sus funciones existentes.

La aplicación móvil de referencia es principalmente de comercio electrónico: ofrece catálogo, carrito y compra digital. Allí el objetivo inicial es consultar los datos previamente guardados y conservar el carrito como borrador. Una compra digital, pago electrónico o reserva no se confirma sin respuesta del servidor. Por instrucción del usuario, este trabajo adapta las funciones móviles existentes y excluye crear un POS móvil.

**Primera entrega propuesta:** POS web, una terminal preparada por turno, ventas presenciales de contado en efectivo, ticket provisional, sincronización y resolución de incidencias. No incluye pagos con tarjeta, QR o Stripe sin conexión, reservas, devoluciones ni ventas a crédito. Esas funciones requieren reglas y pruebas propias antes de habilitarse. Las operaciones online actuales deberán seguir funcionando.

## 2. Punto de partida antes de la implementación

- El POS web está en `frontend/src/modules/sales-billing/use-cases/CU26-procesar-pagos-facturacion/pages/POSPage.tsx`; consume `frontend/src/modules/sales-billing/services/presential-sale.service.ts`.
- El controlador y servicio de venta presencial están en `backend/src/modules/sales-billing/use-cases/CU27-registrar-venta-presencial/`. El servidor calcula precios y promociones, verifica existencias y crea venta, pago y movimientos. La comprobación de stock ocurre antes de la transacción y existen identificadores calculados con máximo más uno: ambos requieren revisión de concurrencia.
- `frontend/vite.config.ts` no configura todavía PWA. La sesión web se restaura desde almacenamiento local y se intenta actualizar desde el servidor; esto no define por sí solo una autorización offline.
- La copia móvil usa React Native y AsyncStorage para datos como tenant, sesión y carrito. El checkout digital llama al backend. AsyncStorage, tal como se usa actualmente, no constituye una cola transaccional de ventas. No se encontró un POS móvil equivalente al web en la revisión inicial.
- El backend es multiinquilino. La resolución efectiva del tenant, permisos, asignaciones de sucursal y migraciones por base deben verificarse en el código y las bases reales antes de diseñar la persistencia final. La aplicación móvil real puede diferir de esta copia.

## 3. Reglas de operación propuestas

### Preparación y acceso

1. Con internet, el cajero se autentica, selecciona una sucursal autorizada y abre un turno asociado a una terminal identificada. El servidor entrega una autorización offline acotada a usuario, tenant, sucursal, terminal, operaciones y periodo definidos.
2. La terminal descarga una instantánea completa y versionada del catálogo necesario, precios, promociones aplicables y stock de la sucursal. Solo declara «lista para operar offline» después de guardar y verificar íntegramente los datos y recursos necesarios. Mostrar fecha de actualización y estado de preparación.
3. Inicialmente no se ofrece primer inicio de sesión offline ni cambio de usuario o sucursal sin validación online. Si la autorización o la instantánea dejan de cumplir los límites acordados, impedir nuevas ventas y conservar las pendientes. Definir duración, límites y tratamiento de revocaciones antes del piloto; una revocación no se puede conocer durante el corte.
4. El tenant se determina y autoriza en el servidor a partir del contexto autenticado; el identificador enviado por el cliente nunca basta para otorgar acceso. El almacenamiento local se separa por tenant, usuario, sucursal y terminal, y las operaciones pendientes no se borran al cerrar sesión o cambiar de contexto.

### Venta y disponibilidad

1. Registrar productos, cantidades, precio y descuento aplicados, versión de catálogo y promoción, importes en unidades monetarias mínimas, efectivo recibido y cambio. Una venta terminada recibe un UUID estable, una secuencia local y fecha local; el reloj del dispositivo no se considera autoridad para ordenar entre terminales.
2. Validar y descontar el stock local y guardar íntegramente la venta pendiente en una única transacción local. Si falla el guardado, no confirmar la venta ni imprimir un ticket como registrado.
3. El stock local es una estimación de esa terminal, no una reserva global. En el piloto usar una sola terminal preparada por sucursal y evitar operaciones concurrentes sobre las mismas existencias; aun así, el servidor puede recibir movimientos de otros canales. Informar del riesgo y contar con un procedimiento de conciliación. Una futura estrategia de asignación de stock por terminal requerirá diseño propio.
4. Recomendación: respetar el precio y promociones de la instantánea autorizada en la venta efectivamente cobrada, dentro de su vigencia y límites definidos; guardar la evidencia y enviar a revisión cualquier excepción. El servidor valida el origen y la política, sin confiar ciegamente en importes del cliente. Acordar esta regla con el negocio antes de implementarla.
5. Emitir un ticket con identificador local y leyenda «Pendiente de sincronización». No presentarlo como factura fiscal definitiva. Definir con el responsable fiscal el procedimiento legal y la emisión posterior antes de operar en producción; el código actual genera referencias internas y no demuestra por sí solo validez fiscal.

### Caja y resolución

1. Cada venta pertenece a un turno y terminal. Registrar apertura, fondo inicial y movimientos de caja autorizados. El efectivo esperado se calcula con fondo inicial más cobros en efectivo y movimientos pertinentes; el estado offline es una dimensión de seguimiento, no otro medio de pago que se sume de nuevo.
2. Durante el corte se permite arqueo y cierre **provisional** local, con efectivo contado y pendientes visibles. El cierre definitivo se realiza en el servidor después de recibir y conciliar las ventas y movimientos del turno, incluidas incidencias resueltas. Una terminal sin comunicación no puede demostrar por sí sola que todas las demás entregaron sus pendientes.
3. Una venta cobrada con conflicto no se elimina ni se presenta como anulada. Debe quedar identificable con importes y evidencia, y entrar en una bandeja de revisión autorizada. El responsable decide la regularización de inventario o la corrección administrativa según reglas acordadas; toda acción se audita. No efectuar devoluciones automáticas ni alterar el dinero registrado.
4. Definir cómo proceder ante una terminal perdida, dañada o con datos borrados: notificación al responsable, bloqueo de cierre definitivo y conciliación manual documentada con tickets y arqueo. La persistencia local no sustituye un respaldo y no garantiza recuperación del dispositivo.

## 4. Arquitectura y contrato compartido

### Preparación y almacenamiento

- **Backend común:** API versionada para preparar terminal y turno, obtener instantánea paginada verificable, recibir lotes, consultar resultados y gestionar incidencias y caja. Los nombres de rutas son propuestas, sujetos a integrar las convenciones existentes.
- **Web:** PWA con recursos necesarios del POS precargados y persistencia transaccional en IndexedDB. No almacenar respuestas autenticadas de forma compartida o indiscriminada en caché. Comprobar instalación/carga inicial, actualización y compatibilidad de versiones.
- **Móvil:** almacenamiento local transaccional adecuado, por ejemplo SQLite tras evaluar la biblioteca compatible con el proyecto real; almacenamiento seguro de credenciales mediante mecanismos de plataforma. AsyncStorage puede conservar preferencias y borradores simples, pero no será la fuente transaccional de ventas. La app instalada no necesita un service worker.
- La instantánea incluye versión, tenant, sucursal, vigencia, fecha de generación y verificación de integridad/completitud. Prepararla sin reemplazar la versión utilizable hasta que la nueva esté completa. El catálogo público móvil se trata por separado y muestra antigüedad y disponibilidad no confirmada.

### Operaciones propuestas

| Operación | Propósito |
|---|---|
| `POST /sales-billing/pos/offline/prepare` | Autorizar terminal y contexto, y devolver versión y límites de preparación. |
| `GET /sales-billing/pos/offline/snapshot` | Descargar catálogo e inventario de la sucursal autorizada, con paginación y versión estable. |
| `POST /sales-billing/pos/offline/sync` | Enviar un lote limitado de operaciones versionadas; procesar cada venta de forma independiente. |
| `GET /sales-billing/pos/offline/operations/:id` | Consultar resultado cuando se perdió una respuesta. |
| Rutas de turnos e incidencias | Abrir y conciliar caja, consultar conflictos y registrar resoluciones autorizadas. |

Cada operación de venta incluye versión de contrato, UUID, tenant de referencia, terminal, turno, sucursal, usuario de origen, secuencia, fecha local, versión de instantánea, partidas y precios, cobro y ticket provisional. El servidor deriva el tenant efectivo y valida que todos los identificadores pertenezcan a él, que la terminal y el turno sean válidos y que el usuario de sincronización tenga permiso. La autorización para transmitir no sustituye la evidencia de quién realizó la venta. Diseñar explícitamente la recepción de ventas legítimas después de expirar la sesión o revocarse permisos: exigir reautenticación y revisión autorizada cuando corresponda, sin descartar la cola.

Respuesta por operación: UUID, estado, identificador oficial si existe, código y detalle de incidencia recuperable, y versión de respuesta. Estados mínimos: `PENDIENTE`, `ENVIANDO`, `CONFIRMADA`, `REQUIERE_REVISION` y `RECHAZADA_CON_ACCION`. Un envío interrumpido vuelve a pendiente con el mismo UUID; una respuesta incierta se consulta o reintenta. No borrar el registro hasta confirmación durable y conservar historial mínimo y evidencia según la política de retención.

### Idempotencia, concurrencia y seguridad

- En la base del tenant, imponer unicidad de la clave en el ámbito definido, almacenar hash canónico del contenido y resultado estable. Misma clave y contenido devuelve el resultado anterior; misma clave con contenido diferente se rechaza y audita. Atender inserciones simultáneas mediante la restricción de base, no solo con una consulta previa.
- Cada venta se procesa en su propia transacción: reclamar idempotencia, validar y actualizar stock con bloqueo o actualización condicional, registrar venta, detalle, pago, movimientos y resultado. Una operación conflictiva no revierte las demás. Evitar generar IDs con `MAX + 1` bajo concurrencia; usar mecanismos seguros de la base y migrarlos sin perder datos.
- Si la venta física ya se cobró pero no se puede aplicar al inventario, persistir una incidencia durable con el payload y el resultado idempotente, sin inventar un éxito contable. Definir una transición auditada y repetible para resolverla sin duplicar venta ni pago.
- Evitar dos sincronizadores activos por terminal mediante coordinación local; el servidor sigue siendo la garantía final. Usar lotes acotados, tiempos de espera, reintentos con espera creciente y posibilidad manual. `online` o conectividad del sistema son señales; confirmar alcance real de la API. El trabajo en segundo plano es una mejora sujeta a plataforma, no una garantía de entrega.
- Minimizar datos personales locales, proteger credenciales y definir bloqueo del dispositivo, acceso compartido, retención y eliminación. No exponer tokens ni datos sensibles en logs. Evaluar cifrado y sus límites según plataforma y modelo de amenazas; una clave accesible al mismo usuario no resuelve todos los riesgos.

## 5. Fases y criterios de cierre

### Fase 0. Decisiones y diseño verificable

- [ ] Confirmar responsable, sucursal piloto, terminal, duración máxima offline, vigencia de datos y permisos, reglas de precios, incidencias y cierre. Acordar el tratamiento fiscal del ticket.
- [ ] Revisar el diseño funcional original y los flujos reales; inventariar permisos, tenants, caja, stock, promociones, identificadores y migraciones existentes. Verificar el repositorio móvil desplegado y su versión antes de planificar cambios allí.
- [ ] Publicar contrato versionado con ejemplos válidos y errores, matriz de estados y reglas de recuperación. Acordar cómo recibir operaciones de usuarios revocados o con sesión expirada.

**Cierre:** reglas aprobadas por negocio y responsables técnicos; contrato y escenarios de fallo revisados.

### Fase 1. Backend y consistencia

- [ ] Corregir concurrencia de stock e identificadores del POS online; validar autorización efectiva de sucursal y empleado, incluidos los caminos de respaldo actuales.
- [ ] Diseñar y migrar modelos de terminal, turno, operación idempotente e incidencia según esquema real. Probar migración y reversión en bases de tenants aisladas, sin afectar producción.
- [ ] Implementar preparación, instantánea consistente, sincronización por venta y consulta de resultado. Incorporar límites, validación, auditoría y resolución de incidencias.
- [ ] Implementar apertura y cierre provisional/definitivo, con conciliación por turno y control explícito de terminales y pendientes.

**Cierre:** pruebas de integración en PostgreSQL real pasan para concurrencia, duplicados, aislamiento de tenants, ventas conflictivas y caja; el flujo online conserva su comportamiento esperado.

### Fase 2. POS web offline

- [ ] Incorporar PWA y verificar carga del POS tras una preparación completa y reinicio sin red. Mantener versiones de recursos y migraciones locales compatibles con ventas pendientes.
- [ ] Guardar instantánea, turno, venta y stock local en IndexedDB; implementar operación atómica, coordinación entre pestañas y señalización de antigüedad y capacidad.
- [ ] Implementar venta en efectivo, ticket provisional, lista de pendientes y conflictos, arqueo provisional y sincronización manual/automática con el contrato común.
- [ ] Impedir operaciones no soportadas y mostrar instrucciones claras si no se preparó el dispositivo, faltan datos o no se puede guardar.

**Cierre:** un cajero completa el recorrido de preparación, corte, venta, reinicio, reconexión y conciliación sin pérdida ni duplicación en entorno de prueba.

### Fase 3. Móvil: comprador y adaptación del contrato

- [ ] Contrastar la copia local con el repositorio desplegado; documentar diferencias y coordinar cambios allí. No asumir que modificar esta carpeta actualiza la aplicación publicada.
- [ ] Incorporar lectura del catálogo previamente guardado y borrador de carrito por tenant, con fecha de actualización y disponibilidad no garantizada. Evitar que una respuesta de una tienda se muestre en otra.
- [ ] Durante el corte, conservar el carrito y bloquear la confirmación de compra, reservas y pago electrónico. Al recuperar conexión, actualizar precios y disponibilidad y solicitar confirmación explícita antes de comprar.
- [ ] Verificar compatibilidad con las consultas y operaciones actuales del backend y probar la persistencia de datos y borradores en dispositivos reales. No añadir funciones de negocio al móvil.

**Cierre:** en la versión móvil real, catálogo y carrito sobreviven al corte según el alcance acordado; el checkout no genera compras silenciosas y las pruebas de aislamiento y reconexión pasan.

### Fase 4. Piloto y despliegue gradual

- [ ] Capacitar al cajero y responsable de incidencias; preparar guía de operación, pérdida de terminal, conciliación y soporte.
- [ ] Ejecutar piloto en entorno aislado y luego en sucursal controlada, tras aprobar requisitos fiscales y operativos. Registrar resultados y corregir incidencias antes de ampliar.
- [ ] Activar por tenant/sucursal mediante configuración controlada; medir preparación, antigüedad de pendientes, conflictos y tiempos de conciliación sin registrar datos sensibles. Comprobar que el plan contratado y permisos habiliten la función.
- [ ] Definir reversión: deshabilitar nuevas ventas offline conservando acceso a colas, sincronización y resolución; no retirar soporte de una versión con pendientes sin una vía probada de recuperación.

**Cierre:** conciliación de ventas y efectivo del piloto documentada, sin pérdidas ni duplicados conocidos, y autorización para ampliar.

## 6. Pruebas de aceptación necesarias

1. Preparación incompleta, primer arranque sin red, API caída con red disponible y datos o autorización vencidos: no se permite una venta insegura y se explica la causa.
2. Venta en efectivo con una o varias partidas, corte durante el guardado, cierre forzado y reinicio: existe toda la venta y descuento local, o no existe ninguno.
3. Pérdida de respuesta después del commit, reintentos simultáneos, doble pestaña y misma clave con distinto contenido: como máximo una venta y un pago; resultado estable y error explícito para contenido distinto.
4. Dos ventas por la última unidad, venta online simultánea y stock cambiado durante el corte: no hay descuento central indebido; las ventas cobradas que requieran revisión permanecen visibles y conciliables.
5. Cambios de precio y promoción, turno cerrado, usuario revocado, token vencido y tenant/sucursal incorrectos: aplicar la política aprobada sin pérdida de pendientes ni acceso cruzado.
6. Arqueo con pendientes, conflicto y dispositivo no disponible: cierre provisional correcto y cierre definitivo bloqueado hasta la conciliación autorizada. Verificar que offline y medio de pago no dupliquen importes.
7. Almacenamiento lleno o borrado, actualización de app con cola pendiente, dispositivo perdido y recuperación operativa: no afirmar que una operación se guardó si falló; seguir el procedimiento documentado cuando no pueda recuperarse.
8. Web en navegadores admitidos y móvil real en dispositivos y sistemas admitidos: reinicio sin red, reconexión intermitente, aislamiento de datos y compatibilidad de contrato. Comprobar impresión solo en dispositivos compatibles.

## 7. Decisiones pendientes antes de implementar

| Tema | Propuesta inicial | Responsable a definir |
|---|---|---|
| Alcance del piloto | POS web, efectivo, una terminal preparada | Negocio y operaciones |
| Autorización y datos | Sesión y turno preparados online; fijar vigencia y límites | Seguridad y operaciones |
| Precios | Respetar instantánea autorizada dentro de reglas; excepciones a revisión | Negocio |
| Conflicto de stock | Conservar venta cobrada y resolver con auditoría | Inventario y caja |
| Cierre | Provisional local y definitivo tras conciliación | Administración |
| Facturación | Ticket provisional; definir procedimiento fiscal antes de producción | Responsable fiscal |
| Móvil | Consultas, imágenes, sesión y borradores de las funciones existentes | Producto y equipo móvil |

El siguiente paso es cerrar estas decisiones y validar el contrato contra el repositorio móvil real; después comenzar por consistencia y sincronización del backend antes de habilitar ventas offline.
