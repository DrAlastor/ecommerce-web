# Migración de apariencia a PostgreSQL

Por defecto se conserva el almacenamiento en `data/tenants_appearance.json`. La opción `APPEARANCE_STORAGE=postgres` usa la tabla `saas_tenant_appearance` en la base central indicada por `DATABASE_URL` (la misma que utiliza el cliente predeterminado de Prisma). No activar esa opción antes de completar y verificar la migración.

1. Preparar una base PostgreSQL aislada y un respaldo de su estado y del archivo JSON. Ejecutar los comandos desde `backend/` con `DATABASE_URL` apuntando a esa base aislada.
2. Ejecutar `node scripts/migrate-appearance.mjs` para validar el JSON sin conectarse a la base. Se puede indicar otro archivo con `--file=/ruta/tenants_appearance.json`.
3. Ejecutar `node scripts/migrate-appearance.mjs --apply` únicamente contra la base de destino autorizada. La operación crea la tabla e importa los registros en una transacción. Las claves ya presentes no se sobrescriben: si sus datos difieren del archivo, la operación completa se revierte para resolver el conflicto antes de activar el nuevo almacenamiento.
4. Comparar todos los identificadores y contenidos del JSON con la tabla. Probar lecturas, cambios, aprovisionamiento de tiendas y respaldo/restauración en el entorno aislado.
5. Configurar `APPEARANCE_STORAGE=postgres` solo después de una migración y verificación satisfactorias y desplegar el backend. No ejecutar instancias que escriban simultáneamente en ambos modos: sus cambios no se sincronizan.

Para revertir, detener los escritores y ejecutar `node scripts/export-appearance.mjs /ruta/archivo-nuevo.json` con `DATABASE_URL` apuntando a la base central. El comando no sobrescribe un archivo existente. Verificar el contenido exportado, restaurarlo como `data/tenants_appearance.json` en almacenamiento persistente y volver al modo `file`. Cambiar la variable sin exportar primero perdería los cambios hechos durante el uso de PostgreSQL. La migración no elimina el JSON original ni borra registros existentes.

La migración y restauración deben ensayarse en PostgreSQL real antes de aplicarlas en producción. El script en modo de validación no prueba la conexión ni modifica una base de datos.
