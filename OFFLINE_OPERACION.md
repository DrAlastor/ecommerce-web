# Operación offline: web y aplicación móvil

## Estado de implementación

Web: preparación de terminal, catálogo local, ventas en efectivo, comprobante provisional imprimible, cola persistente, sincronización idempotente, recuperación de respaldos, conciliación administrativa y cierre del turno de efectivo. Móvil: adaptación de las funciones que ya existían; véase `ecommerce-movil/OFFLINE.md`. No se añadió un POS móvil.

El repositorio móvil local se reemplazó desde `main`, commit `0e66b67936a9528bbf24e38419245a7e7e5ca574`, antes de aplicar cambios. Su carpeta anterior, incluidos cambios locales, está respaldada en `/tmp/examen2-movil-respaldo-antes-offline-20261111`. No se publicaron commits, despliegues ni APK.

## Preparación en un entorno aislado

Ejecutor de migración: `backend/scripts/migrate-offline.mjs`. Desde backend, validar primero con `node scripts/migrate-offline.mjs --env=.env.offline-migration --databases=dressly_db` usando las bases explícitas del entorno elegido. Sin `--apply` solo consulta el destino y verifica requisitos. Para aplicar requiere además `--apply --backup-dir=/ruta/privada --pg-dump=/ruta/a/pg_dump`; debe existir también `pg_restore` en el mismo directorio. Antes del DDL genera y verifica todos los respaldos, aplica por base en transacción y guarda un informe con hashes. El archivo `.env.offline-migration` está excluido de Git por la regla `.env.*`.

Migración aplicada el 11 de noviembre de 2026 en Azure a `dressly_db`, `urbanly_db` y `aura_sport_db`, con respaldos completos previos. El informe privado está en `backend/.offline-backups/20261111/offline-migration-report.json`; respaldos e informe están excluidos de Git. Se verificaron hashes y lectura completa de los tres archivos mediante pg_restore. SHA-256 del SQL aplicado: `11b6abe4317550c5bc6fa79a12abb4a2a1ba1c4ff6aaf4d0f4c1105927449025`. No se ejecutó despliegue ni push.

1. Respaldar la base de prueba y aplicar `backend/prisma/offline-schema.sql`. El script es repetible y se aplica por tenant; el servidor no modifica bases al arrancar. Las tablas se gestionan mediante este SQL y deben conservarse al planificar otras migraciones Prisma.
2. Compilar backend y frontend y servir la web mediante HTTPS o localhost. El service worker se genera para producción y toma el control al activarse. La primera visita necesita conexión para descargar la aplicación y los datos.
3. Iniciar sesión y elegir sucursal: el catálogo se prepara automáticamente al entrar al POS, recuperar conexión y volver a primer plano. No existe un interruptor de modo offline. Para cobrar, abrir el turno de caja con su fondo inicial; esta operación de negocio sigue siendo explícita y requiere conexión. Un empleado debe estar asignado a la sucursal. Una segunda terminal/usuario no puede abrir otro turno de la misma sucursal.
4. La preparación dura ocho horas. Se guarda el catálogo completo de POS y sus existencias. Durante el turno preparado, el POS utiliza esos precios y existencias locales. Las ventas en efectivo se registran primero localmente tanto con red como sin red, para que entren en el mismo turno; con conexión se intenta confirmarlas inmediatamente. Si falla el servidor, se conserva el comprobante provisional.
5. Desconectar, vender en efectivo, imprimir el provisional, cerrar y reabrir el navegador y comprobar pendientes e inventario local. Una venta no se confirma localmente si no se guardaron juntos el registro y el descuento de existencias.
6. Reconectar y sincronizar. Las ventas confirmadas conservan su resultado y permiten imprimir el comprobante conciliado desde el panel. Las que requieren revisión no se borran. Reintentar conserva UUID y contenido.

## Conciliación y caja

- El administrador consulta incidencias desde el POS. Debe verificar el cobro y regularizar inventario usando los movimientos ya existentes antes de aprobar una venta. La aprobación comprueba existencias, respeta el precio de la preparación autorizada y registra responsable, justificación y resultados antes/después. Repetir una aprobación confirmada no vuelve a crear venta o pago.
- Si el cajero no puede autenticarse, se puede recuperar un respaldo JSON: el administrador obtiene las colas de la tienda de esa terminal, descarga el archivo y lo importa con una justificación. El backend lo recibe como evidencia en revisión; no registra ventas oficiales automáticamente en nombre del cajero. Una venta sin preparación válida o con fecha fuera del periodo requiere investigación; no se fuerza una regularización contable arbitraria.
- El arqueo local es provisional y está asociado al turno. Para cerrar con conexión, la terminal envía el efectivo contado y los UUID de todas las ventas del turno. El servidor comprueba que coincidan exactamente con las operaciones recibidas y que estén conciliadas. Guarda esperado, contado, diferencia, responsable y fecha. Un reintento devuelve el mismo cierre; un arqueo diferente para un turno cerrado se rechaza.
- El esperado incluye el fondo y las ventas en efectivo de la terminal preparada. Pagos electrónicos no incrementan efectivo. No sustituye un informe contable global de todas las cajas, canales o movimientos externos. El piloto requiere operar el mostrador desde la terminal preparada.
- Cerrar sesión no borra la cola. Descargar respaldos antes de borrar datos del navegador. Si se pierde el dispositivo sin respaldo, registrar el incidente y conciliar tickets/efectivo; la persistencia local no garantiza recuperar un dispositivo perdido.

## API web

Todas las rutas bajo `/sales-billing/pos/offline` usan JWT y el tenant que valida el backend.

| Método y ruta | Operación |
|---|---|
| `GET /catalog` | Consulta automática con `branch` y `terminal`, sin abrir una caja. Una versión anterior del backend devuelve 404 y no puede abrir una caja por ignorar un campo nuevo. |
| `POST /prepare` | `{branch, terminal, initialMinor, catalogOnly?}`: `catalogOnly=true` descarga sin abrir caja; la apertura explícita genera turno y autorización temporal. |
| `POST /sync` | `{id, preparationId, createdAt, receivedMinor, items:[{variant, quantity, priceMinor}]}`: una venta de hasta 100 partidas. |
| `GET /operations/:id` | Resultado propio: pendiente, confirmado o revisión. |
| `GET /incidents` | Incidencias del tenant, solo administrador. |
| `POST /operations/:id/resolve` | `{note}`: aprobación auditada, con stock suficiente y precio preparado. |
| `POST /recover` | `{operation, note}`: recuperación administrativa de evidencia respaldada. |
| `GET /cash/:id` | Estado del turno para su propietario o administrador. |
| `POST /cash/:id/close` | `{countedMinor, operationIds}`: cierre con manifiesto completo. |

Los importes de los contratos locales se expresan en centavos enteros. Una misma clave con contenido distinto se rechaza. Venta, pago, inventario y resultado idempotente se confirman juntos; un fallo durante la venta se revierte antes de guardar la incidencia.

## Límites y decisiones documentadas

- Se mantiene una terminal preparada por sucursal. No hay reserva global de stock contra otros canales: se necesita conciliación cuando cambia el inventario central.
- El reloj local se compara con el periodo autorizado. Desfases o fechas inválidas producen revisión; no se cambia silenciosamente la evidencia.
- Los identificadores compartidos del sistema siguen usando asignación manual en varios módulos. La escritura offline bloquea temporalmente las tablas necesarias para asignarlos con seguridad dentro de su transacción; la migración global a secuencias sigue siendo una mejora de concurrencia del sistema y debe coordinarse con los demás módulos. No se habilita operación masiva de múltiples terminales.
- El ticket provisional no se presenta como factura fiscal. La emisión fiscal definitiva exige verificar la integración fiscal real antes de producción; el sistema existente genera referencias internas.
- No se implementaron pagos electrónicos sin red, reservas confirmadas sin servidor ni un POS móvil. La app móvil conserva las consultas y borradores existentes, sin encolar compras o reservas.

## Verificación reproducible

- Backend: `npm run build` y pruebas de `CU27-registrar-venta-presencial`.
- PostgreSQL real: después de compilar, `node backend/test/offline/postgres.mjs`. Solo admite servidor local y base con prefijo `offline_test`; crea una base única de prueba y la elimina al terminar. Prueba migración repetible, exclusividad, solicitudes simultáneas, respuesta perdida/reintento, rollback, precio preparado, auditoría, recuperación y cierre con manifiesto. No lee `DATABASE_URL` ni utiliza producción.
- Se pudo iniciar PostgreSQL temporal en localhost mediante `embedded-postgres`, instalado fuera del proyecto en `/tmp/examen2-offline-postgres`, resolviendo el bloqueo de Docker.
- IndexedDB: `npm run test:offline` en frontend, con Chromium instalado. Comprueba guardado atómico, rollback, aislamiento y protección de pendientes.
- Móvil: `npm run typecheck`, `npm test -- --runInBand` y bundle Android de Metro. Las pruebas nativas en teléfono y la actualización del service worker con colas reales deben verificarse antes del despliegue.

## Cliente de la tienda web

La preparación automática anterior corresponde al POS. En la tienda web del comprador se guardan los archivos generales de la aplicación, favoritos y un respaldo del carrito; el catálogo, los detalles y la reconciliación del carrito autenticado todavía dependen del servidor. No se debe presentar ese recorrido como equivalente al modo offline implementado en la aplicación móvil.
