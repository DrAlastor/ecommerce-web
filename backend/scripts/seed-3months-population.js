import pg from 'pg';
const { Pool } = pg;

const connectionString = 'postgresql://dressly_user:dressly_password@localhost:5433/dressly_db?schema=public';
const pool = new Pool({ connectionString });

async function seed() {
  const client = await pool.connect();
  console.log('Iniciando script de poblacion de 3 meses para Dressly DB...');

  try {
    await client.query('BEGIN');

    // 1. Verificar o crear empleado dedicado para Sucursal 4 (Sucre Centro) si no existe
    const empSucreCheck = await client.query(`
      SELECT e.id_empleado 
      FROM empleado e
      JOIN empleado_sucursal es ON e.id_empleado = es.id_empleado
      WHERE es.id_sucursal = 4 AND e.id_empleado NOT IN (6)
      LIMIT 1
    `);

    let empSucreId = 6;
    if (empSucreCheck.rows.length === 0) {
      const newEmp = await client.query(`
        INSERT INTO empleado (codigo_empleado, ci, nombre, apellido, telefono, fecha_contratacion, estado)
        VALUES ('EMP-SUC-011', '4591238', 'Raul', 'Vargas Miranda', '79841230', '2026-06-01', 'activo')
        RETURNING id_empleado
      `);
      empSucreId = newEmp.rows[0].id_empleado;
      await client.query(`
        INSERT INTO empleado_sucursal (id_empleado, id_sucursal)
        VALUES ($1, 4)
      `, [empSucreId]);
      console.log(`Empleado para Sucre Centro creado con ID ${empSucreId}`);
    } else {
      empSucreId = empSucreCheck.rows[0].id_empleado;
    }

    // Mapeo de empleados por sucursal
    // Sucursal 1 (Ventura Mall, Santa Cruz): 7 (Jorge) y 8 (Paola)
    // Sucursal 2 (Sopocachi, La Paz): 9 (Andres)
    // Sucursal 3 (Cochabamba Norte): 10 (Valeria)
    // Sucursal 4 (Sucre Centro): empSucreId
    const branchEmployees = {
      1: [7, 8],
      2: [9],
      3: [10],
      4: [empSucreId]
    };

    // 2. Crear clientes adicionales para robustecer los 4 clusters RFM
    const additionalClients = [
      // VIP Oro adicional
      { id: 15, email: 'mateo.morales@example.com', ci: '4581290', nombre: 'Mateo', apellido: 'Morales Ortiz', sexo: 'Masculino', puntos: 620 },
      // Frecuentes adicionales
      { id: 16, email: 'camila.rios@example.com', ci: '5692341', nombre: 'Camila', apellido: 'Rios Paredes', sexo: 'Femenino', puntos: 190 },
      { id: 17, email: 'mariana.paz@example.com', ci: '6783452', nombre: 'Mariana', apellido: 'Paz Soldan', sexo: 'Femenino', puntos: 240 },
      // Ocasionales / Recientes adicionales
      { id: 18, email: 'gabriel.soliz@example.com', ci: '7894563', nombre: 'Gabriel', apellido: 'Soliz Camacho', sexo: 'Masculino', puntos: 30 },
      { id: 19, email: 'laura.torrico@example.com', ci: '8905674', nombre: 'Laura', apellido: 'Torrico Baldivieso', sexo: 'Femenino', puntos: 40 },
      { id: 20, email: 'alejandro.justiniano@example.com', ci: '9016785', nombre: 'Alejandro', apellido: 'Justiniano Ribera', sexo: 'Masculino', puntos: 50 },
      // Churn / En Riesgo adicionales (compraron en agosto/septiembre y no volvieron)
      { id: 21, email: 'rodrigo.guzman@example.com', ci: '3124567', nombre: 'Rodrigo', apellido: 'Guzman Barrientos', sexo: 'Masculino', puntos: 150 },
      { id: 22, email: 'patricia.quiroga@example.com', ci: '4235678', nombre: 'Patricia', apellido: 'Quiroga Santa Cruz', sexo: 'Femenino', puntos: 130 },
      { id: 23, email: 'fernando.ortiz@example.com', ci: '5346789', nombre: 'Fernando', apellido: 'Ortiz Mercado', sexo: 'Masculino', puntos: 110 },
      { id: 24, email: 'gabriela.menacho@example.com', ci: '6457890', nombre: 'Gabriela', apellido: 'Menacho Hurtado', sexo: 'Femenino', puntos: 140 },
    ];

    for (const c of additionalClients) {
      const exists = await client.query('SELECT id_usuario FROM usuario WHERE id_usuario = $1 OR email = $2', [c.id, c.email]);
      if (exists.rows.length === 0) {
        await client.query(`
          INSERT INTO usuario (id_usuario, email, password_hash, estado, id_rol)
          VALUES ($1, $2, '$2b$10$wTqKj1y5hJm7U6eEwLhKx.Q2xZ0i1s2d3f4g5h6j7k8l9z0x1c2v3', 'activo', 2)
        `, [c.id, c.email]);

        await client.query(`
          INSERT INTO cliente (id_cliente, ci, nombre, apellido, sexo, fecha_nacimiento, preferencias_estilo, puntos_fidelidad)
          VALUES ($1, $2, $3, $4, $5, '1995-05-15', 'Moda urbana y formal contemporanea', $6)
        `, [c.id, c.ci, c.nombre, c.apellido, c.sexo, c.puntos]);
      }
    }
    console.log('Clientes y usuarios listos para segmentacion RFM.');

    // 3. Cargar catalogo de variantes de productos activas
    const varRes = await client.query(`
      SELECT pv.id_producto_variante, pv.id_producto, p.nombre, p.precio_base, pv.precio_adicional,
             (p.precio_base + pv.precio_adicional) as precio_unitario
      FROM producto_variante pv
      JOIN producto p ON pv.id_producto = p.id_producto
      WHERE pv.estado = 'activo'
    `);
    const variants = varRes.rows.map(v => ({
      id_producto_variante: Number(v.id_producto_variante),
      id_producto: Number(v.id_producto),
      nombre: v.nombre,
      precio_unitario: Number(v.precio_unitario)
    }));
    console.log(`Variantes activas cargadas: ${variants.length}`);

    // Limpiar tablas previas en estricto orden de dependencias de claves foraneas
    console.log('Limpiando tablas de ventas, reservas y movimientos anteriores...');
    await client.query('DELETE FROM detalle_devolucion');
    await client.query('DELETE FROM devolucion');
    await client.query('DELETE FROM envio');
    await client.query('DELETE FROM pago');
    await client.query('DELETE FROM detalle_venta');
    await client.query('DELETE FROM venta');
    await client.query('DELETE FROM detalle_reserva');
    await client.query('DELETE FROM reserva');
    await client.query('DELETE FROM movimiento_inventario');

    // 4. Definir fechas base de calculo: dias relativos desde el 10 de Noviembre (dia 0 = 2026-11-10)
    const baseDate = new Date(2026, 10, 10, 18, 0, 0); // 10 de nov 2026

    function getDateDaysAgo(daysAgo, hour = 11, minute = 30) {
      const d = new Date(baseDate.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      d.setHours(hour, minute, Math.floor(Math.random() * 60));
      return d;
    }

    // Planes RFM por cliente
    // Recencia (dias atras de su ultima compra), Frecuencia (numero de compras), Rango ticket
    const clientPurchasePlans = [
      // --- VIP ORO ---
      { clientId: 1, purchases: [88, 81, 74, 68, 60, 53, 47, 40, 33, 27, 20, 14, 8, 4, 2], minSpend: 350, maxSpend: 650 },
      { clientId: 2, purchases: [85, 78, 71, 64, 57, 49, 42, 35, 28, 21, 15, 7, 3], minSpend: 380, maxSpend: 700 },
      { clientId: 15, purchases: [87, 80, 73, 65, 58, 50, 43, 36, 29, 22, 16, 9, 4, 1], minSpend: 360, maxSpend: 680 },

      // --- FRECUENTES / LEALES ---
      { clientId: 3, purchases: [82, 70, 58, 46, 35, 26, 18, 12], minSpend: 200, maxSpend: 360 },
      { clientId: 4, purchases: [80, 67, 54, 43, 33, 23, 16], minSpend: 190, maxSpend: 320 },
      { clientId: 5, purchases: [84, 72, 61, 51, 39, 29, 19, 10], minSpend: 220, maxSpend: 380 },
      { clientId: 16, purchases: [76, 62, 48, 36, 24, 14], minSpend: 210, maxSpend: 340 },
      { clientId: 17, purchases: [79, 66, 53, 41, 30, 20, 11], minSpend: 230, maxSpend: 370 },

      // --- OCASIONALES / RECIENTES ---
      { clientId: 11, purchases: [5, 2], minSpend: 160, maxSpend: 240 },
      { clientId: 13, purchases: [4], minSpend: 180, maxSpend: 260 },
      { clientId: 14, purchases: [6, 3], minSpend: 190, maxSpend: 270 },
      { clientId: 18, purchases: [5], minSpend: 150, maxSpend: 220 },
      { clientId: 19, purchases: [3], minSpend: 170, maxSpend: 250 },
      { clientId: 20, purchases: [7, 2], minSpend: 180, maxSpend: 260 },

      // --- EN RIESGO DE ABANDONO / CHURN ---
      { clientId: 12, purchases: [86, 79, 73, 69], minSpend: 280, maxSpend: 420 },
      { clientId: 21, purchases: [87, 82, 76, 71, 66], minSpend: 270, maxSpend: 400 },
      { clientId: 22, purchases: [89, 83, 78, 73], minSpend: 260, maxSpend: 390 },
      { clientId: 23, purchases: [88, 82, 76], minSpend: 250, maxSpend: 360 },
      { clientId: 24, purchases: [85, 80, 75, 70], minSpend: 270, maxSpend: 410 },
    ];

    let facturaCounter = 1;
    let totalSalesCreated = 0;

    // Helper para seleccionar empleado y sucursal segun pesos realistas
    // Ventura (42%), Sopocachi (28%), Cochabamba (18%), Sucre (12%)
    function getRandomBranchAndEmployee() {
      const r = Math.random();
      let branchId = 1;
      if (r < 0.42) {
        branchId = 1;
      } else if (r < 0.70) {
        branchId = 2;
      } else if (r < 0.88) {
        branchId = 3;
      } else {
        branchId = 4;
      }
      const emps = branchEmployees[branchId];
      const empId = emps[Math.floor(Math.random() * emps.length)];
      return { branchId, empId };
    }

    const paymentMethods = ['Efectivo', 'Tarjeta', 'QR', 'Transferencia'];
    const paymentWeights = [0.35, 0.30, 0.25, 0.10];

    function getRandomPaymentMethod() {
      const r = Math.random();
      let accum = 0;
      for (let i = 0; i < paymentMethods.length; i++) {
        accum += paymentWeights[i];
        if (r <= accum) return paymentMethods[i];
      }
      return 'Efectivo';
    }

    // A. Registrar ventas de los clientes planificados (Segmentos RFM)
    for (const plan of clientPurchasePlans) {
      for (const daysAgo of plan.purchases) {
        facturaCounter++;
        const saleDate = getDateDaysAgo(daysAgo, 10 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60));
        const { branchId, empId } = getRandomBranchAndEmployee();
        const codigoFactura = `FAC-2026-${String(facturaCounter).padStart(6, '0')}`;
        const tipoVenta = Math.random() < 0.20 ? 'online' : 'tienda_fisica';

        // Seleccionar 1 a 3 prendas unicas
        const itemCount = Math.random() < 0.6 ? 1 : (Math.random() < 0.85 ? 2 : 3);
        const selectedItems = [];
        const usedVariantIds = new Set();
        let subtotal = 0;

        for (let i = 0; i < itemCount; i++) {
          let variant = variants[Math.floor(Math.random() * variants.length)];
          let tries = 0;
          while (usedVariantIds.has(variant.id_producto_variante) && tries < 10) {
            variant = variants[Math.floor(Math.random() * variants.length)];
            tries++;
          }
          if (usedVariantIds.has(variant.id_producto_variante)) continue;
          usedVariantIds.add(variant.id_producto_variante);

          const cantidad = Math.random() < 0.85 ? 1 : 2;
          const precioUnitario = variant.precio_unitario;
          subtotal += cantidad * precioUnitario;
          selectedItems.push({ variantId: variant.id_producto_variante, cantidad, precioUnitario });
        }

        const descuento = Math.random() < 0.15 ? Math.round(subtotal * 0.10) : 0;
        const total = subtotal - descuento;

        // Insertar Venta
        const ventaRes = await client.query(`
          INSERT INTO venta (codigo_factura, tipo_venta, subtotal, descuento, estado, fecha_venta, id_cliente, id_empleado)
          VALUES ($1, $2, $3, $4, 'completada', $5, $6, $7)
          RETURNING id_venta
        `, [codigoFactura, tipoVenta, subtotal, descuento, saleDate, plan.clientId, empId]);
        const idVenta = ventaRes.rows[0].id_venta;

        // Insertar Detalles
        for (const it of selectedItems) {
          await client.query(`
            INSERT INTO detalle_venta (cantidad, precio_unitario, id_venta, id_producto_variante)
            VALUES ($1, $2, $3, $4)
          `, [it.cantidad, it.precioUnitario, idVenta, it.variantId]);
        }

        // Insertar Pago
        const metodo = getRandomPaymentMethod();
        const txRef = `${metodo.toUpperCase().slice(0, 2)}-${saleDate.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
        await client.query(`
          INSERT INTO pago (metodo_pago, importe, transaccion_externa, estado, fecha_pago, id_venta)
          VALUES ($1, $2, $3, 'completado', $4, $5)
        `, [metodo, total, txRef, saleDate, idVenta]);

        totalSalesCreated++;
      }
    }
    console.log(`Ventas de segmentacion RFM creadas: ${totalSalesCreated}`);

    // B. Registrar ventas generales / mostrador para curva temporal completa de 13 semanas
    for (let day = 89; day >= 0; day--) {
      const currentDate = getDateDaysAgo(day);
      const dayOfWeek = currentDate.getDay(); // 0: domingo, 6: sabado
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 5;

      const trendBonus = Math.floor((90 - day) / 30);
      const baseDailySales = isWeekend ? (3 + trendBonus + Math.floor(Math.random() * 3)) : (1 + trendBonus + Math.floor(Math.random() * 2));

      for (let s = 0; s < baseDailySales; s++) {
        facturaCounter++;
        const saleDate = getDateDaysAgo(day, 10 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60));
        const { branchId, empId } = getRandomBranchAndEmployee();
        const codigoFactura = `FAC-2026-${String(facturaCounter).padStart(6, '0')}`;
        const tipoVenta = Math.random() < 0.15 ? 'online' : 'tienda_fisica';

        let clientId = null;
        if (Math.random() < 0.40) {
          const randomClients = [1, 2, 3, 4, 5, 11, 13, 14, 15, 16, 17, 18, 19, 20];
          clientId = randomClients[Math.floor(Math.random() * randomClients.length)];
        }

        const itemCount = Math.random() < 0.7 ? 1 : 2;
        const selectedItems = [];
        const usedVariantIds = new Set();
        let subtotal = 0;

        for (let i = 0; i < itemCount; i++) {
          let variant = variants[Math.floor(Math.random() * variants.length)];
          let tries = 0;
          while (usedVariantIds.has(variant.id_producto_variante) && tries < 10) {
            variant = variants[Math.floor(Math.random() * variants.length)];
            tries++;
          }
          if (usedVariantIds.has(variant.id_producto_variante)) continue;
          usedVariantIds.add(variant.id_producto_variante);

          const cantidad = 1;
          const precioUnitario = variant.precio_unitario;
          subtotal += cantidad * precioUnitario;
          selectedItems.push({ variantId: variant.id_producto_variante, cantidad, precioUnitario });
        }

        const descuento = Math.random() < 0.12 ? Math.round(subtotal * 0.10) : 0;
        const total = subtotal - descuento;

        const ventaRes = await client.query(`
          INSERT INTO venta (codigo_factura, tipo_venta, subtotal, descuento, estado, fecha_venta, id_cliente, id_empleado)
          VALUES ($1, $2, $3, $4, 'completada', $5, $6, $7)
          RETURNING id_venta
        `, [codigoFactura, tipoVenta, subtotal, descuento, saleDate, clientId, empId]);
        const idVenta = ventaRes.rows[0].id_venta;

        for (const it of selectedItems) {
          await client.query(`
            INSERT INTO detalle_venta (cantidad, precio_unitario, id_venta, id_producto_variante)
            VALUES ($1, $2, $3, $4)
          `, [it.cantidad, it.precioUnitario, idVenta, it.variantId]);
        }

        const metodo = getRandomPaymentMethod();
        const txRef = `${metodo.toUpperCase().slice(0, 2)}-${saleDate.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
        await client.query(`
          INSERT INTO pago (metodo_pago, importe, transaccion_externa, estado, fecha_pago, id_venta)
          VALUES ($1, $2, $3, 'completado', $4, $5)
        `, [metodo, total, txRef, saleDate, idVenta]);

        totalSalesCreated++;
      }
    }
    console.log(`Poblacion de ventas finalizada: ${totalSalesCreated} ventas registradas exitosamente.`);

    // 5. Generar Reservas (CU20)
    console.log('Generando reservas de prueba para las 4 sucursales...');
    for (let r = 1; r <= 48; r++) {
      const daysAgo = Math.floor(Math.random() * 75);
      const resDate = getDateDaysAgo(daysAgo, 11, 0);
      const horaEstimada = new Date(resDate.getTime() + (24 + Math.random() * 48) * 60 * 60 * 1000);
      const branchId = (r % 4) + 1;
      const clientPool = [1, 2, 3, 4, 5, 11, 14, 15, 16, 17, 18, 19, 20];
      const clientId = clientPool[r % clientPool.length];
      
      // Estados validos segun detalle_reserva_estado_check: 'pendiente', 'completada', 'cancelada'
      let estado = 'completada';
      if (daysAgo <= 4) {
        estado = 'pendiente';
      } else if (r % 7 === 0) {
        estado = 'cancelada';
      }

      const resCode = `RES-2026-${String(r).padStart(4, '0')}`;
      const resResult = await client.query(`
        INSERT INTO reserva (codigo, fecha_reserva, horario_estimado, estado, observaciones, id_cliente, id_sucursal)
        VALUES ($1, $2, $3, $4, 'Reserva para prueba en probador de boutique', $5, $6)
        RETURNING id_reserva
      `, [resCode, resDate, horaEstimada, estado, clientId, branchId]);
      const idReserva = resResult.rows[0].id_reserva;

      // 1 a 2 variantes reservadas
      const v1 = variants[Math.floor(Math.random() * variants.length)];
      await client.query(`
        INSERT INTO detalle_reserva (cantidad, estado, id_reserva, id_producto_variante)
        VALUES (1, $1, $2, $3)
      `, [estado, idReserva, v1.id_producto_variante]);

      if (r % 3 === 0) {
        let v2 = variants[Math.floor(Math.random() * variants.length)];
        let tries = 0;
        while (v2.id_producto_variante === v1.id_producto_variante && tries < 10) {
          v2 = variants[Math.floor(Math.random() * variants.length)];
          tries++;
        }
        if (v2.id_producto_variante !== v1.id_producto_variante) {
          await client.query(`
            INSERT INTO detalle_reserva (cantidad, estado, id_reserva, id_producto_variante)
            VALUES (1, $1, $2, $3)
          `, [estado, idReserva, v2.id_producto_variante]);
        }
      }
    }
    console.log('48 reservas registradas.');

    // 6. Generar Movimientos de Inventario (Entradas de lotes y reposicion)
    console.log('Generando movimientos de inventario...');
    const lotDates = [85, 60, 35, 12];
    for (const dAgo of lotDates) {
      const movDate = getDateDaysAgo(dAgo, 9, 15);
      for (let branchId = 1; branchId <= 4; branchId++) {
        const emps = branchEmployees[branchId];
        const empId = emps[0];
        for (let k = 0; k < 5; k++) {
          const v = variants[(branchId * 10 + k) % variants.length];
          await client.query(`
            INSERT INTO movimiento_inventario (tipo_movimiento, cantidad, fecha, motivo, id_producto_variante, id_sucursal, id_empleado)
            VALUES ('Entrada', $1, $2, 'Recepcion de lote de reposicion de coleccion estacional', $3, $4, $5)
          `, [25 + k * 5, movDate, v.id_producto_variante, branchId, empId]);
        }
      }
    }
    console.log('Movimientos de inventario registrados.');

    // 7. Ajustar Stock en inventario_sucursal para la Matriz de Reabastecimiento
    console.log('Calibrando niveles de stock en inventario_sucursal para la red neuronal prescriptiva...');
    
    // Stock optimo general
    await client.query(`
      UPDATE inventario_sucursal
      SET stock_disponible = 28, stock_minimo = 8, ultima_actualizacion = CURRENT_TIMESTAMP
    `);

    // Asignar criticos en sucursal 1 (Ventura) y 2 (Sopocachi)
    const criticalVariants = [variants[0].id_producto_variante, variants[3].id_producto_variante, variants[7].id_producto_variante];
    for (const vId of criticalVariants) {
      await client.query(`
        UPDATE inventario_sucursal
        SET stock_disponible = 2, stock_minimo = 8, ultima_actualizacion = CURRENT_TIMESTAMP
        WHERE id_producto_variante = $1 AND id_sucursal IN (1, 2)
      `, [vId]);
    }

    // Asignar recomendados
    const recommendedVariants = [variants[1].id_producto_variante, variants[4].id_producto_variante, variants[8].id_producto_variante, variants[12].id_producto_variante];
    for (const vId of recommendedVariants) {
      await client.query(`
        UPDATE inventario_sucursal
        SET stock_disponible = 9, stock_minimo = 10, ultima_actualizacion = CURRENT_TIMESTAMP
        WHERE id_producto_variante = $1
      `, [vId]);
    }
    console.log('Matriz de stock calibrada con items Criticos, Recomendados y Optimos.');

    // 8. Generar devoluciones realistas
    console.log('Registrando devoluciones para alertas operativas...');
    const pastSalesForDev = await client.query(`
      SELECT v.id_venta, v.fecha_venta, dv.id_detalle_venta, dv.id_producto_variante
      FROM venta v
      JOIN detalle_venta dv ON v.id_venta = dv.id_venta
      ORDER BY v.id_venta ASC 
      LIMIT 5
    `);
    const returnReasons = [
      'Cambio de talla por preferencia del cliente',
      'Prenda con desajuste de costura menor en dobladillo',
      'Cambio de color por combinacion de vestuario',
      'Talla no coincide con ajuste ergonomico esperado',
      'Devolucion voluntaria dentro del plazo de satisfaccion'
    ];

    for (let i = 0; i < pastSalesForDev.rows.length; i++) {
      const v = pastSalesForDev.rows[i];
      const devDate = new Date(new Date(v.fecha_venta).getTime() + 24 * 60 * 60 * 1000);
      const devRes = await client.query(`
        INSERT INTO devolucion (fecha_hora, motivo, estado, observacion, id_venta)
        VALUES ($1, $2, 'Completada', 'Inspeccion fisica aprobada en sucursal', $3)
        RETURNING id_devolucion
      `, [devDate, returnReasons[i % returnReasons.length], v.id_venta]);
      const idDev = devRes.rows[0].id_devolucion;

      await client.query(`
        INSERT INTO detalle_devolucion (cantidad, motivo, id_venta, id_devolucion, id_detalle_venta)
        VALUES (1, $1, $2, $3, $4)
      `, [returnReasons[i % returnReasons.length], v.id_venta, idDev, v.id_detalle_venta]);
    }
    console.log('5 devoluciones operativas registradas con detalle.');

    // 9. Sincronizar secuencias de PostgreSQL para evitar conflictos futuros
    console.log('Sincronizando secuencias de PostgreSQL...');
    const seqTables = [
      { table: 'venta', col: 'id_venta', seq: 'venta_id_venta_seq' },
      { table: 'detalle_venta', col: 'id_detalle_venta', seq: 'detalle_venta_id_detalle_venta_seq' },
      { table: 'pago', col: 'id_pago', seq: 'pago_id_pago_seq' },
      { table: 'reserva', col: 'id_reserva', seq: 'reserva_id_reserva_seq' },
      { table: 'detalle_reserva', col: 'id_detalle_reserva', seq: 'detalle_reserva_id_detalle_reserva_seq' },
      { table: 'movimiento_inventario', col: 'id_movimiento_inventario', seq: 'movimiento_inventario_id_movimiento_inventario_seq' },
      { table: 'usuario', col: 'id_usuario', seq: 'usuario_id_usuario_seq' },
      { table: 'empleado', col: 'id_empleado', seq: 'empleado_id_empleado_seq' },
      { table: 'devolucion', col: 'id_devolucion', seq: 'devolucion_id_devolucion_seq' },
      { table: 'detalle_devolucion', col: 'id_detalle_devolucion', seq: 'detalle_devolucion_id_detalle_devolucion_seq' },
    ];

    for (const st of seqTables) {
      await client.query(`
        SELECT setval('${st.seq}', COALESCE((SELECT MAX(${st.col}) FROM ${st.table}), 1), true)
      `);
    }

    await client.query('COMMIT');
    console.log('Poblacion completada con exito.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error durante la poblacion:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
