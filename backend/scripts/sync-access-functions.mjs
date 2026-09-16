import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(backendRoot, '.env') });

const modules = [
  [1, 'Usuarios y Seguridad', 'Gestionar identidades, accesos, perfiles, permisos y seguridad del sistema.'],
  [2, 'Catálogo, Proveedores y Recomendaciones', 'Administrar prendas, productos, proveedores y recomendaciones inteligentes.'],
  [3, 'Sucursales e Inventario', 'Administrar ciudades, sucursales y existencias.'],
  [4, 'Reservas de Prendas', 'Gestionar reservas de prendas para pruebas en sucursal.'],
  [5, 'Ventas y Facturación', 'Gestionar carrito, compras digitales, pagos, historial y ventas presenciales.'],
];

const functions = [
  [1, 1, 'CU01 — Gestionar Acceso al Sistema', 'Iniciar y cerrar sesión para clientes y empleados.'],
  [2, 1, 'CU02 — Registrar y Gestionar Perfil de Cliente', 'Registrar cliente, consultar perfil y modificar datos personales.'],
  [3, 1, 'CU03 — Gestionar Contraseña', 'Cambiar, recuperar y restablecer contraseña.'],
  [4, 1, 'CU04 — Gestionar Usuarios', 'Crear, consultar, activar, desactivar y mantener usuarios del sistema.'],
  [5, 1, 'CU05 — Gestionar Roles y Permisos', 'Gestionar roles, permisos y asignación de funciones.'],
  [6, 1, 'CU06 — Gestionar Empleados', 'Gestionar empleados y su asociación con sucursales.'],
  [7, 1, 'CU07 — Consultar Bitácora', 'Consultar acciones registradas en la bitácora del sistema.'],

  [8, 2, 'CU08 — Consultar Catálogo de Productos', 'Consultar, buscar y filtrar productos del catálogo.'],
  [9, 2, 'CU09 — Consultar Detalle y Disponibilidad de Producto', 'Consultar detalle, imágenes, tallas, colores, guía, disponibilidad y promociones.'],
  [10, 2, 'CU10 — Gestionar Catálogo de Productos', 'Gestionar productos, categorías, variantes, imágenes, modelos 3D, temporadas, colecciones, promociones y guías.'],
  [11, 2, 'CU11 — Gestionar Proveedores', 'Gestionar proveedores, asociaciones con productos y órdenes de compra.'],
  [12, 2, 'CU12 — Obtener Recomendaciones de Prendas mediante IA', 'Obtener recomendaciones personalizadas y productos recomendados por IA.'],

  [13, 3, 'CU13 — Gestionar Ciudades y Sucursales', 'Gestionar ciudades, sucursales y su activación.'],
  [14, 3, 'CU14 — Consultar Sucursales', 'Consultar sucursales, ubicación y horarios de atención.'],
  [15, 3, 'CU15 — Consultar Inventario', 'Consultar inventario global, por sucursal, stock por variante, reservado y agotados.'],
  [16, 3, 'CU16 — Gestionar Movimientos de Inventario', 'Registrar entradas, salidas, ajustes, devoluciones e historial de movimientos.'],

  [17, 4, 'CU17 — Realizar Reserva de Prendas', 'Crear reserva, seleccionar sucursal y fecha u horario aproximado.'],
  [18, 4, 'CU18 — Consultar y Cancelar Reserva', 'Consultar reservas realizadas, estado y cancelar reservas.'],
  [19, 4, 'CU19 — Gestionar Reserva en Sucursal', 'Consultar, preparar, cambiar estado, confirmar llegada, vender o liberar prendas reservadas.'],

  [20, 5, 'CU20 — Gestionar Carrito de Compras', 'Agregar, modificar y eliminar productos del carrito.'],
  [21, 5, 'CU21 — Realizar Compra Digital', 'Realizar compra digital y seleccionar dirección de entrega.'],
  [22, 5, 'CU22 — Consultar Historial de Compras', 'Consultar historial de compras, estado de compra y envío.'],
  [23, 5, 'CU23 — Procesar Pago Electrónico', 'Procesar pagos electrónicos de compras digitales.'],
  [24, 5, 'CU24 — Registrar Venta Presencial', 'Registrar venta presencial, buscar productos, procesar pago, aplicar promociones, generar comprobante y gestionar devoluciones.'],
];

const rolePermissions = {
  Administrador: range(1, 24),
  Cliente: [1, 2, 3, 8, 9, 12, 14, 17, 18, 20, 21, 22, 23],
  'Encargado de sucursal': [1, 8, 9, 14, 15, 16, 19],
  Cajero: [1, 8, 9, 19, 24],
};

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function accessFor(functionId) {
  const readOnlyIds = new Set([1, 7, 8, 9, 12, 14, 15, 18, 22]);
  return readOnlyIds.has(functionId) ? 'Lectura' : 'Edicion';
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
const shouldApply = process.argv.includes('--apply');
await client.connect();

try {
  await client.query('begin');

  const snapshot = {
    generatedAt: new Date().toISOString(),
    modulo: (await client.query('select * from modulo order by id_modulo')).rows,
    funcion: (await client.query('select * from funcion order by id_funcion')).rows,
    rol_funcion: (await client.query('select * from rol_funcion order by id_rol, id_funcion')).rows,
  };
  const backupDir = path.join(backendRoot, 'backups');
  await fs.mkdir(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `access-functions-${Date.now()}.json`);
  await fs.writeFile(backupPath, JSON.stringify(snapshot, null, 2), 'utf8');

  if (!shouldApply) {
    await client.query('rollback');
    console.log('Dry run completed. No database changes were applied.');
    console.log(`Current-state backup: ${backupPath}`);
    console.log(`Modules to sync: ${modules.length}`);
    console.log(`Use cases to sync: ${functions.length}`);
    console.log(`Run with "--apply" to update modulo, funcion and rol_funcion.`);
    process.exit(0);
  }

  await client.query('delete from rol_funcion');
  await client.query('delete from funcion');
  await client.query('delete from modulo where id_modulo > 5');

  for (const [id, name, description] of modules) {
    await client.query(
      `insert into modulo (id_modulo, nombre, descripcion)
       values ($1, $2, $3)
       on conflict (id_modulo) do update set nombre = excluded.nombre, descripcion = excluded.descripcion`,
      [id, name, description],
    );
  }

  for (const [id, moduleId, name, description] of functions) {
    await client.query(
      `insert into funcion (id_funcion, id_modulo, nombre, descripcion)
       values ($1, $2, $3, $4)`,
      [id, moduleId, name, description],
    );
  }

  const roles = (await client.query('select id_rol, nombre from rol')).rows;
  for (const role of roles) {
    const permissionIds = rolePermissions[role.nombre] ?? [];
    for (const functionId of permissionIds) {
      await client.query(
        `insert into rol_funcion (id_rol, id_funcion, descripcion)
         values ($1, $2, $3)`,
        [role.id_rol, functionId, accessFor(functionId)],
      );
    }
  }

  await client.query('commit');
  console.log(`Access use cases synchronized. Backup: ${backupPath}`);
} catch (error) {
  await client.query('rollback');
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end();
}
