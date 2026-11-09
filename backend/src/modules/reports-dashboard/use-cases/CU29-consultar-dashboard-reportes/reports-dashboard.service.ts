/**
 * @caso-de-uso CU27 — Consultar dashboard y reportes
 * @subsistema Reportes y Dashboard
 * @capa Control/Service de dominio — Backend
 * @responsabilidad Ejecuta las reglas del negocio y coordina persistencia, auditoría e integraciones del caso de uso.
 * @secuencia Administrador o Encargado -> dashboard -> controlador de reportes -> servicio de agregación/exportación -> Ventas/Pagos/Inventario/Reservas/Compras.
 */
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import {
  QueryDashboardDto,
  QueryReportDto,
  ReportType,
} from '../../dto/query-reports.dto.js';
import {
  ReportColumn,
  ReportIndicator,
  ReportPayload,
} from '../../shared/services/report-exporter.service.js';

@Injectable()
export class ReportsDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private static dashboardCache = new Map<string, { data: any; expiresAt: number }>();
  private static branchesCache: { data: any; expiresAt: number } | null = null;

  /**
   * Determina las sucursales autorizadas para el usuario en sesión:
   * - Administrador (id_rol === 1): Acceso a todas las sucursales del sistema.
   * - Encargado de Sucursal: Acceso restringido a sus sucursales asignadas en empleado_sucursal.
   */
  async getAuthorizedBranches(user: any, requestedSucursalId?: number) {
    const isAdmin =
      user?.id_rol === 1 ||
      (typeof user?.rol === 'string' &&
        user.rol.toLowerCase().includes('admin'));

    let allBranches: any[];
    if (ReportsDashboardService.branchesCache && ReportsDashboardService.branchesCache.expiresAt > Date.now()) {
      allBranches = ReportsDashboardService.branchesCache.data;
    } else {
      allBranches = await this.prisma.sucursal.findMany({
        where: { estado: 'activo' },
        include: { ciudad: true },
        orderBy: { nombre: 'asc' },
      });
      ReportsDashboardService.branchesCache = { data: allBranches, expiresAt: Date.now() + 60000 };
    }

    if (isAdmin) {
      if (requestedSucursalId) {
        const found = allBranches.find(
          (s) => s.id_sucursal === Number(requestedSucursalId),
        );
        return {
          isAdmin: true,
          isGlobal: false,
          activeSucursal: found || null,
          branchIds: found ? [found.id_sucursal] : [],
          branches: allBranches,
        };
      }
      return {
        isAdmin: true,
        isGlobal: true,
        activeSucursal: null,
        branchIds: allBranches.map((s) => s.id_sucursal),
        branches: allBranches,
      };
    }

    // Para colaboradores / encargados: consultar asignación en empleado_sucursal
    const idEmpleado = user?.id_usuario;
    const asignaciones = await this.prisma.empleado_sucursal.findMany({
      where: { id_empleado: idEmpleado },
      include: { sucursal: { include: { ciudad: true } } },
    });

    const userBranches = asignaciones
      .map((a) => a.sucursal)
      .filter((s) => s.estado === 'activo');

    // Fallback: si no tiene sucursales explícitas pero es staff, permitir la primera sucursal activa
    const allowedBranches =
      userBranches.length > 0 ? userBranches : allBranches.slice(0, 1);
    const allowedIds = allowedBranches.map((s) => s.id_sucursal);

    if (requestedSucursalId) {
      const targetId = Number(requestedSucursalId);
      if (!allowedIds.includes(targetId)) {
        throw new ForbiddenException(
          'No tienes permisos autorizados para consultar información de la sucursal seleccionada.',
        );
      }
      const found = allowedBranches.find((s) => s.id_sucursal === targetId);
      return {
        isAdmin: false,
        isGlobal: false,
        activeSucursal: found || null,
        branchIds: [targetId],
        branches: allowedBranches,
      };
    }

    return {
      isAdmin: false,
      isGlobal: false,
      activeSucursal: allowedBranches[0] || null,
      branchIds: allowedIds,
      branches: allowedBranches,
    };
  }

  /**
   * Helper para construir filtros de fecha (desde - hasta)
   */
  private parseDateRange(fecha_inicio?: string, fecha_fin?: string) {
    let gte: Date | undefined;
    let lte: Date | undefined;

    if (fecha_inicio) {
      const d = new Date(fecha_inicio);
      d.setHours(0, 0, 0, 0);
      gte = d;
    }
    if (fecha_fin) {
      const d = new Date(fecha_fin);
      d.setHours(23, 59, 59, 999);
      lte = d;
    }

    const periodoText =
      fecha_inicio && fecha_fin
        ? `${fecha_inicio} al ${fecha_fin}`
        : fecha_inicio
          ? `Desde ${fecha_inicio}`
          : fecha_fin
            ? `Hasta ${fecha_fin}`
            : 'Histórico Completo';

    return { gte, lte, periodoText };
  }

  /**
   * Helper para filtrar ventas por sucursales autorizadas:
   * Para ventas presenciales: se busca a través del empleado y sus sucursales asignadas.
   * Para ventas digitales: se consideran de alcance global o a través de movimientos de salida.
   */
  private buildVentaBranchFilter(branchIds: number[], isGlobal: boolean) {
    if (isGlobal || branchIds.length === 0) {
      return {};
    }

    return {
      OR: [
        {
          empleado: {
            empleado_sucursal: {
              some: { id_sucursal: { in: branchIds } },
            },
          },
        },
        // Ventas presenciales sin empleado registrado explícitamente se muestran si no hay restricción estricta
        { id_empleado: null },
      ],
    };
  }

  // =========================================================================
  // 1. DASHBOARD GENERAL (CU27)
  // =========================================================================
  async getDashboardMetrics(query: QueryDashboardDto, user: any) {
    const userId = user?.id_usuario || user?.sub || 'user';
    const roleId = user?.id_rol || 0;
    const cacheKey = `dash_${userId}_${roleId}_${query.id_sucursal || 'all'}_${query.fecha_inicio || ''}_${query.fecha_fin || ''}`;
    const cached = ReportsDashboardService.dashboardCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const auth = await this.getAuthorizedBranches(user, query.id_sucursal);
    const { gte, lte, periodoText } = this.parseDateRange(
      query.fecha_inicio,
      query.fecha_fin,
    );

    const dateFilter = gte || lte ? { fecha_venta: { gte, lte } } : {};
    const branchFilter = this.buildVentaBranchFilter(auth.branchIds, auth.isGlobal);

    const reservaDateFilter =
      gte || lte ? { fecha_reserva: { gte, lte } } : {};
    const reservaBranchFilter =
      auth.isGlobal || auth.branchIds.length === 0
        ? {}
        : { id_sucursal: { in: auth.branchIds } };

    const invBranchFilter =
      auth.isGlobal || auth.branchIds.length === 0
        ? {}
        : { id_sucursal: { in: auth.branchIds } };

    const devDateFilter = gte || lte ? { fecha_hora: { gte, lte } } : {};

    // Ejecutar todas las consultas a la base de datos concurrentemente en paralelo
    const [ventas, totalReservas, reservasPendientes, inventarios, totalDevoluciones] =
      await Promise.all([
        this.prisma.venta.findMany({
          where: {
            ...dateFilter,
            ...branchFilter,
          },
          include: {
            detalle_venta: {
              include: {
                producto_variante: {
                  include: {
                    producto: true,
                  },
                },
              },
            },
            pago: true,
            empleado: {
              include: {
                empleado_sucursal: {
                  include: {
                    sucursal: true,
                  },
                },
              },
            },
          },
          orderBy: { fecha_venta: 'desc' },
        }),
        this.prisma.reserva.count({
          where: { ...reservaDateFilter, ...reservaBranchFilter },
        }),
        this.prisma.reserva.count({
          where: {
            ...reservaDateFilter,
            ...reservaBranchFilter,
            estado: { in: ['pendiente', 'Pendiente'] },
          },
        }),
        this.prisma.inventario_sucursal.findMany({
          where: invBranchFilter,
          include: {
            producto_variante: {
              include: {
                producto: true,
                color: true,
                talla: true,
              },
            },
            sucursal: true,
          },
        }),
        this.prisma.devolucion.count({
          where: devDateFilter,
        }),
      ]);

    const totalVentas = ventas.length;
    let totalIngresos = 0;
    let totalDescuentos = 0;
    let totalUnidadesVendidas = 0;

    for (const v of ventas) {
      totalIngresos += Number(v.total || 0);
      totalDescuentos += Number(v.descuento || 0);
      for (const d of v.detalle_venta) {
        totalUnidadesVendidas += d.cantidad;
      }
    }

    const ticketPromedio = totalVentas > 0 ? totalIngresos / totalVentas : 0;

    // 3. Inventario Crítico
    let productosBajoStock = 0;
    let productosAgotados = 0;
    const criticalList: any[] = [];

    for (const inv of inventarios) {
      if (inv.stock_disponible === 0) {
        productosAgotados++;
        criticalList.push({
          id_inventario: inv.id_inventario_sucursal,
          producto: inv.producto_variante.producto.nombre,
          sku: inv.producto_variante.sku,
          variante: `${inv.producto_variante.color.nombre} / ${inv.producto_variante.talla.codigo}`,
          sucursal: inv.sucursal.nombre,
          stock_disponible: 0,
          stock_minimo: inv.stock_minimo,
          estado: 'Agotado',
        });
      } else if (inv.stock_disponible <= inv.stock_minimo) {
        productosBajoStock++;
        criticalList.push({
          id_inventario: inv.id_inventario_sucursal,
          producto: inv.producto_variante.producto.nombre,
          sku: inv.producto_variante.sku,
          variante: `${inv.producto_variante.color.nombre} / ${inv.producto_variante.talla.codigo}`,
          sucursal: inv.sucursal.nombre,
          stock_disponible: inv.stock_disponible,
          stock_minimo: inv.stock_minimo,
          estado: 'Bajo stock',
        });
      }
    }

    // 5. Agrupación: Ventas por Período (para Gráfico de Líneas/Área)
    const salesByDayMap = new Map<
      string,
      { fecha: string; total: number; ventas: number }
    >();
    for (const v of ventas) {
      const dayKey = v.fecha_venta.toISOString().split('T')[0];
      if (!salesByDayMap.has(dayKey)) {
        salesByDayMap.set(dayKey, { fecha: dayKey, total: 0, ventas: 0 });
      }
      const entry = salesByDayMap.get(dayKey)!;
      entry.total += Number(v.total || 0);
      entry.ventas += 1;
    }
    const ventasPorPeriodo = Array.from(salesByDayMap.values()).sort((a, b) =>
      a.fecha.localeCompare(b.fecha),
    );

    // 6. Agrupación: Ventas por Canal (Presencial vs Digital)
    let ventasPresencialTotal = 0;
    let ventasPresencialCount = 0;
    let ventasDigitalTotal = 0;
    let ventasDigitalCount = 0;

    for (const v of ventas) {
      const tipo = (v.tipo_venta || '').toLowerCase();
      if (tipo.includes('digital') || tipo.includes('online')) {
        ventasDigitalTotal += Number(v.total || 0);
        ventasDigitalCount += 1;
      } else {
        ventasPresencialTotal += Number(v.total || 0);
        ventasPresencialCount += 1;
      }
    }

    const ventasPorCanal = [
      { canal: 'Presencial', total: ventasPresencialTotal, cantidad: ventasPresencialCount },
      { canal: 'Digital', total: ventasDigitalTotal, cantidad: ventasDigitalCount },
    ];

    // 7. Agrupación: Ventas por Sucursal (para Gráfico de Barras)
    const branchSalesMap = new Map<
      string,
      { sucursal: string; total: number; cantidad: number }
    >();
    for (const s of auth.branches) {
      branchSalesMap.set(s.nombre, { sucursal: s.nombre, total: 0, cantidad: 0 });
    }

    for (const v of ventas) {
      const sucursalNombre =
        v.empleado?.empleado_sucursal?.[0]?.sucursal?.nombre ||
        (auth.activeSucursal ? auth.activeSucursal.nombre : 'Ventas Digitales');

      if (!branchSalesMap.has(sucursalNombre)) {
        branchSalesMap.set(sucursalNombre, {
          sucursal: sucursalNombre,
          total: 0,
          cantidad: 0,
        });
      }
      const entry = branchSalesMap.get(sucursalNombre)!;
      entry.total += Number(v.total || 0);
      entry.cantidad += 1;
    }

    const ventasPorSucursal = Array.from(branchSalesMap.values()).filter(
      (b) => b.total > 0 || auth.branches.some((ab) => ab.nombre === b.sucursal),
    );

    // 8. Top Productos Más Vendidos
    const productStatsMap = new Map<
      number,
      { nombre: string; unidades: number; total: number }
    >();

    for (const v of ventas) {
      for (const d of v.detalle_venta) {
        const prodId = d.producto_variante?.id_producto || d.id_producto_variante;
        const prodNombre =
          d.producto_variante?.producto?.nombre || `Producto #${prodId}`;

        if (!productStatsMap.has(prodId)) {
          productStatsMap.set(prodId, {
            nombre: prodNombre,
            unidades: 0,
            total: 0,
          });
        }
        const pEntry = productStatsMap.get(prodId)!;
        pEntry.unidades += d.cantidad;
        pEntry.total += Number(d.subtotal || Number(d.precio_unitario) * d.cantidad);
      }
    }

    const productosMasVendidos = Array.from(productStatsMap.values())
      .sort((a, b) => b.unidades - a.unidades)
      .slice(0, 5);

    // Actividad reciente (últimas 5 ventas)
    const ultimasVentas = ventas.slice(0, 5).map((v) => ({
      id_venta: v.id_venta,
      codigo: v.codigo_factura || `FAC-${v.id_venta}`,
      fecha: v.fecha_venta.toISOString(),
      tipo: v.tipo_venta,
      total: Number(v.total || 0),
      estado: v.estado,
    }));

    const result = {
      periodo: periodoText,
      sucursalNombre: auth.isGlobal
        ? 'Todas las sucursales (Consolidado Global)'
        : auth.activeSucursal?.nombre || 'Sucursal Asignada',
      kpis: {
        totalVentas,
        totalIngresos,
        totalDescuentos,
        totalUnidadesVendidas,
        ticketPromedio,
        totalReservas,
        reservasPendientes,
        productosBajoStock,
        productosAgotados,
        totalDevoluciones,
        sucursalesActivas: auth.branches.length,
      },
      charts: {
        ventasPorPeriodo,
        ventasPorCanal,
        ventasPorSucursal,
        productosMasVendidos,
      },
      criticalInventory: criticalList.slice(0, 8),
      recentActivity: ultimasVentas,
      authorizedBranches: auth.branches,
      isAdmin: auth.isAdmin,
    };

    // Guardar en caché con TTL de 30 segundos
    ReportsDashboardService.dashboardCache.set(cacheKey, { data: result, expiresAt: Date.now() + 30000 });

    return result;
  }

  // =========================================================================
  // 2. GENERACIÓN DE REPORTES ESPECIALIZADOS (11 REPORTES)
  // =========================================================================

  async generateReport(query: QueryReportDto, user: any): Promise<ReportPayload> {
    switch (query.tipo_reporte) {
      case ReportType.ECONOMIC:
        return this.getEconomicReport(query, user);
      case ReportType.SALES:
        return this.getSalesReport(query, user);
      case ReportType.TOP_PRODUCTS:
        return this.getTopProductsReport(query, user);
      case ReportType.SALES_BY_BRANCH:
        return this.getSalesByBranchReport(query, user);
      case ReportType.PAYMENT_METHODS:
        return this.getPaymentMethodsReport(query, user);
      case ReportType.INVENTORY:
        return this.getInventoryReport(query, user);
      case ReportType.CRITICAL_INVENTORY:
        return this.getCriticalInventoryReport(query, user);
      case ReportType.MOVEMENTS:
        return this.getMovementsReport(query, user);
      case ReportType.RESERVATIONS:
        return this.getReservationsReport(query, user);
      case ReportType.RETURNS:
        return this.getReturnsReport(query, user);
      case ReportType.PURCHASES:
        return this.getPurchasesReport(query, user);
      default:
        return this.getSalesReport(query, user);
    }
  }

  // --- REPORTE 1: ECONÓMICO / FINANCIERO OPERATIVO ---
  private async getEconomicReport(query: QueryReportDto, user: any): Promise<ReportPayload> {
    const auth = await this.getAuthorizedBranches(user, query.id_sucursal);
    const { gte, lte, periodoText } = this.parseDateRange(
      query.fecha_inicio,
      query.fecha_fin,
    );
    const dateFilter = gte || lte ? { fecha_venta: { gte, lte } } : {};
    const branchFilter = this.buildVentaBranchFilter(auth.branchIds, auth.isGlobal);

    const ventas = await this.prisma.venta.findMany({
      where: { ...dateFilter, ...branchFilter },
      include: { pago: true },
      orderBy: { fecha_venta: 'desc' },
    });

    let ventasBrutas = 0;
    let descuentos = 0;
    let ventasNetas = 0;

    for (const v of ventas) {
      ventasBrutas += Number(v.subtotal || 0);
      descuentos += Number(v.descuento || 0);
      ventasNetas += Number(v.total || 0);
    }

    // Compras a proveedores en el período
    const ocDateFilter = gte || lte ? { fecha_orden: { gte, lte } } : {};
    const ordenesCompra = await this.prisma.orden_compra.findMany({
      where: ocDateFilter,
      include: { detalle_orden_compra: true },
    });

    let totalComprasProveedores = 0;
    for (const oc of ordenesCompra) {
      for (const d of oc.detalle_orden_compra) {
        totalComprasProveedores += Number(d.costo_unitario) * d.cantidad;
      }
    }

    const devolucionesCount = await this.prisma.devolucion.count({
      where: gte || lte ? { fecha_hora: { gte, lte } } : {},
    });

    // Margen preliminar operativo (Ventas Netas - Abastecimiento)
    const margenEstimado = ventasNetas - totalComprasProveedores;

    const indicators: ReportIndicator[] = [
      { label: 'Ventas Brutas', value: ventasBrutas, suffix: 'Bs.', description: 'Suma de subtotales facturados' },
      { label: 'Descuentos Totales', value: descuentos, suffix: 'Bs.', description: 'Descuentos y promociones aplicados' },
      { label: 'Ventas Netas', value: ventasNetas, suffix: 'Bs.', description: 'Ingresos netos por ventas (Brutas - Descuentos)' },
      { label: 'Transacciones', value: ventas.length, description: 'Cantidad total de operaciones comerciales' },
      { label: 'Devoluciones Registradas', value: devolucionesCount, description: 'Incidentes de devolución en el período' },
      { label: 'Compras a Proveedores', value: totalComprasProveedores, suffix: 'Bs.', description: 'Costo total de abastecimiento registrado' },
      { label: 'Margen Estimado', value: margenEstimado, suffix: 'Bs.', description: 'Ventas netas menos abastecimiento en período' },
    ];

    const columns: ReportColumn[] = [
      { key: 'codigo', label: 'Código Factura', type: 'text' },
      { key: 'fecha', label: 'Fecha', type: 'date' },
      { key: 'tipo', label: 'Canal de Venta', type: 'text' },
      { key: 'metodo_pago', label: 'Método de Pago', type: 'text' },
      { key: 'subtotal', label: 'Subtotal (Bs.)', type: 'currency' },
      { key: 'descuento', label: 'Descuento (Bs.)', type: 'currency' },
      { key: 'total', label: 'Total Neto (Bs.)', type: 'currency' },
      { key: 'estado', label: 'Estado', type: 'text' },
    ];

    const rows = ventas.map((v) => ({
      codigo: v.codigo_factura || `FAC-${v.id_venta}`,
      fecha: v.fecha_venta.toISOString().split('T')[0],
      tipo: v.tipo_venta.toUpperCase(),
      metodo_pago: v.pago[0]?.metodo_pago || 'No especificado',
      subtotal: Number(v.subtotal || 0),
      descuento: Number(v.descuento || 0),
      total: Number(v.total || 0),
      estado: v.estado,
    }));

    return {
      title: 'Reporte Económico / Financiero Operativo',
      code: 'REP-ECO-01',
      periodo: periodoText,
      sucursalNombre: auth.isGlobal ? 'Consolidado Global' : auth.activeSucursal?.nombre || 'Sucursal',
      generatedBy: user.email,
      generatedAt: new Date().toLocaleString('es-BO'),
      indicators,
      columns,
      rows,
      chartData: {
        ventasNetas,
        ventasBrutas,
        totalComprasProveedores,
        descuentos,
      },
    };
  }

  // --- REPORTE 2: VENTAS Y FACTURACIÓN ---
  private async getSalesReport(query: QueryReportDto, user: any): Promise<ReportPayload> {
    const auth = await this.getAuthorizedBranches(user, query.id_sucursal);
    const { gte, lte, periodoText } = this.parseDateRange(query.fecha_inicio, query.fecha_fin);
    const dateFilter = gte || lte ? { fecha_venta: { gte, lte } } : {};
    const branchFilter = this.buildVentaBranchFilter(auth.branchIds, auth.isGlobal);

    const tipoFilter = query.tipo_venta ? { tipo_venta: query.tipo_venta } : {};
    const estadoFilter = query.estado ? { estado: query.estado } : {};

    const ventas = await this.prisma.venta.findMany({
      where: {
        ...dateFilter,
        ...branchFilter,
        ...tipoFilter,
        ...estadoFilter,
      },
      include: {
        cliente: true,
        empleado: { include: { empleado_sucursal: { include: { sucursal: true } } } },
        detalle_venta: true,
        pago: true,
      },
      orderBy: { fecha_venta: 'desc' },
    });

    let totalVendido = 0;
    let totalDescuentos = 0;
    let totalPrendas = 0;

    for (const v of ventas) {
      totalVendido += Number(v.total || 0);
      totalDescuentos += Number(v.descuento || 0);
      for (const d of v.detalle_venta) {
        totalPrendas += d.cantidad;
      }
    }

    const ticketPromedio = ventas.length > 0 ? totalVendido / ventas.length : 0;

    const indicators: ReportIndicator[] = [
      { label: 'Total Facturado', value: totalVendido, suffix: 'Bs.', description: 'Ingresos netos por ventas' },
      { label: 'Operaciones', value: ventas.length, description: 'Número total de ventas realizadas' },
      { label: 'Ticket Promedio', value: ticketPromedio, suffix: 'Bs.', description: 'Promedio facturado por venta' },
      { label: 'Unidades Vendidas', value: totalPrendas, description: 'Prendas y artículos despachados' },
      { label: 'Descuentos Otorgados', value: totalDescuentos, suffix: 'Bs.', description: 'Ahorro total para clientes' },
    ];

    const columns: ReportColumn[] = [
      { key: 'codigo', label: 'Factura', type: 'text' },
      { key: 'fecha', label: 'Fecha', type: 'date' },
      { key: 'tipo', label: 'Tipo Venta', type: 'text' },
      { key: 'cliente', label: 'Cliente', type: 'text' },
      { key: 'empleado', label: 'Cajero / Responsable', type: 'text' },
      { key: 'prendas', label: 'Cant. Prendas', type: 'number' },
      { key: 'subtotal', label: 'Subtotal (Bs.)', type: 'currency' },
      { key: 'descuento', label: 'Descuento (Bs.)', type: 'currency' },
      { key: 'total', label: 'Total (Bs.)', type: 'currency' },
      { key: 'estado', label: 'Estado', type: 'text' },
    ];

    const rows = ventas.map((v) => {
      const cantPrendas = v.detalle_venta.reduce((acc, curr) => acc + curr.cantidad, 0);
      const clienteStr = v.cliente ? `${v.cliente.nombre} ${v.cliente.apellido}` : 'Cliente General';
      const empleadoStr = v.empleado ? `${v.empleado.nombre} ${v.empleado.apellido}` : 'Venta en Línea';

      return {
        codigo: v.codigo_factura || `FAC-${v.id_venta}`,
        fecha: v.fecha_venta.toISOString().split('T')[0],
        tipo: v.tipo_venta.toUpperCase(),
        cliente: clienteStr,
        empleado: empleadoStr,
        prendas: cantPrendas,
        subtotal: Number(v.subtotal || 0),
        descuento: Number(v.descuento || 0),
        total: Number(v.total || 0),
        estado: v.estado,
      };
    });

    // Serie temporal para gráfico
    const timelineMap = new Map<string, number>();
    for (const v of ventas) {
      const d = v.fecha_venta.toISOString().split('T')[0];
      timelineMap.set(d, (timelineMap.get(d) || 0) + Number(v.total || 0));
    }
    const chartSeries = Array.from(timelineMap.entries())
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    return {
      title: 'Reporte de Ventas y Facturación',
      code: 'REP-VNT-02',
      periodo: periodoText,
      sucursalNombre: auth.isGlobal ? 'Consolidado Global' : auth.activeSucursal?.nombre || 'Sucursal',
      generatedBy: user.email,
      generatedAt: new Date().toLocaleString('es-BO'),
      indicators,
      columns,
      rows,
      chartData: chartSeries,
    };
  }

  // --- REPORTE 3: PRODUCTOS MÁS VENDIDOS ---
  private async getTopProductsReport(query: QueryReportDto, user: any): Promise<ReportPayload> {
    const auth = await this.getAuthorizedBranches(user, query.id_sucursal);
    const { gte, lte, periodoText } = this.parseDateRange(query.fecha_inicio, query.fecha_fin);
    const dateFilter = gte || lte ? { fecha_venta: { gte, lte } } : {};
    const branchFilter = this.buildVentaBranchFilter(auth.branchIds, auth.isGlobal);

    const ventas = await this.prisma.venta.findMany({
      where: { ...dateFilter, ...branchFilter },
      include: {
        detalle_venta: {
          include: {
            producto_variante: {
              include: {
                producto: { include: { categoria: true } },
                color: true,
                talla: true,
              },
            },
          },
        },
      },
    });

    const map = new Map<
      number,
      {
        sku: string;
        producto: string;
        categoria: string;
        variante: string;
        unidades: number;
        totalGenerado: number;
      }
    >();

    for (const v of ventas) {
      for (const d of v.detalle_venta) {
        const pv = d.producto_variante;
        if (query.categoria_id && pv.producto.id_categoria !== Number(query.categoria_id)) {
          continue;
        }

        const id = pv.id_producto_variante;
        if (!map.has(id)) {
          map.set(id, {
            sku: pv.sku,
            producto: pv.producto.nombre,
            categoria: pv.producto.categoria?.nombre || 'General',
            variante: `${pv.color.nombre} / ${pv.talla.codigo}`,
            unidades: 0,
            totalGenerado: 0,
          });
        }
        const item = map.get(id)!;
        item.unidades += d.cantidad;
        item.totalGenerado += Number(d.subtotal || Number(d.precio_unitario) * d.cantidad);
      }
    }

    const rows = Array.from(map.values()).sort((a, b) => b.unidades - a.unidades);

    let totalUnidades = 0;
    let totalFacturado = 0;
    for (const r of rows) {
      totalUnidades += r.unidades;
      totalFacturado += r.totalGenerado;
    }

    const productoLider = rows[0]?.producto || 'Sin ventas en período';

    const indicators: ReportIndicator[] = [
      { label: 'Unidades Vendidas', value: totalUnidades, description: 'Prendas totales vendidas' },
      { label: 'Ingresos por Productos', value: totalFacturado, suffix: 'Bs.', description: 'Total generado por catálogo' },
      { label: 'Producto Estrella', value: productoLider, description: 'Prenda con mayor volumen de salida' },
      { label: 'Variantes con Demanda', value: rows.length, description: 'Variantes con al menos 1 venta' },
    ];

    const columns: ReportColumn[] = [
      { key: 'sku', label: 'SKU / Código', type: 'text' },
      { key: 'producto', label: 'Nombre de Producto', type: 'text' },
      { key: 'categoria', label: 'Categoría', type: 'text' },
      { key: 'variante', label: 'Color / Talla', type: 'text' },
      { key: 'unidades', label: 'Unidades Vendidas', type: 'number' },
      { key: 'totalGenerado', label: 'Total Generado (Bs.)', type: 'currency' },
    ];

    const topChart = rows.slice(0, 8).map((r) => ({
      name: `${r.producto.substring(0, 18)} (${r.variante})`,
      unidades: r.unidades,
      total: r.totalGenerado,
    }));

    return {
      title: 'Reporte de Productos Más Vendidos / Rotación de Catálogo',
      code: 'REP-PROD-03',
      periodo: periodoText,
      sucursalNombre: auth.isGlobal ? 'Consolidado Global' : auth.activeSucursal?.nombre || 'Sucursal',
      generatedBy: user.email,
      generatedAt: new Date().toLocaleString('es-BO'),
      indicators,
      columns,
      rows,
      chartData: topChart,
    };
  }

  // --- REPORTE 4: VENTAS POR SUCURSAL ---
  private async getSalesByBranchReport(query: QueryReportDto, user: any): Promise<ReportPayload> {
    const auth = await this.getAuthorizedBranches(user, query.id_sucursal);
    const { gte, lte, periodoText } = this.parseDateRange(query.fecha_inicio, query.fecha_fin);
    const dateFilter = gte || lte ? { fecha_venta: { gte, lte } } : {};
    const branchFilter = this.buildVentaBranchFilter(auth.branchIds, auth.isGlobal);

    const ventas = await this.prisma.venta.findMany({
      where: { ...dateFilter, ...branchFilter },
      include: {
        detalle_venta: true,
        empleado: { include: { empleado_sucursal: { include: { sucursal: { include: { ciudad: true } } } } } },
      },
    });

    const branchStats = new Map<
      number,
      {
        id_sucursal: number;
        nombre: string;
        ciudad: string;
        ventas: number;
        unidades: number;
        total: number;
      }
    >();

    for (const b of auth.branches) {
      branchStats.set(b.id_sucursal, {
        id_sucursal: b.id_sucursal,
        nombre: b.nombre,
        ciudad: b.ciudad?.nombre || 'Sin ciudad',
        ventas: 0,
        unidades: 0,
        total: 0,
      });
    }

    let ventasDigitales = 0;
    let unidadesDigitales = 0;
    let totalDigital = 0;

    for (const v of ventas) {
      const sucursal = v.empleado?.empleado_sucursal?.[0]?.sucursal;
      const cant = v.detalle_venta.reduce((acc, curr) => acc + curr.cantidad, 0);
      const monto = Number(v.total || 0);

      if (sucursal && branchStats.has(sucursal.id_sucursal)) {
        const item = branchStats.get(sucursal.id_sucursal)!;
        item.ventas += 1;
        item.unidades += cant;
        item.total += monto;
      } else {
        ventasDigitales += 1;
        unidadesDigitales += cant;
        totalDigital += monto;
      }
    }

    const rows: any[] = Array.from(branchStats.values()).map((b) => ({
      sucursal: b.nombre,
      ciudad: b.ciudad,
      ventas: b.ventas,
      unidades: b.unidades,
      total: b.total,
    }));

    if (ventasDigitales > 0 && auth.isGlobal) {
      rows.push({
        sucursal: 'Plataforma Web E-commerce',
        ciudad: 'Digital Nacional',
        ventas: ventasDigitales,
        unidades: unidadesDigitales,
        total: totalDigital,
      });
    }

    let totalRecaudado = 0;
    let totalUnidadesGlobal = 0;
    let sucursalLider = '-';
    let maxVenta = -1;

    for (const r of rows) {
      totalRecaudado += r.total;
      totalUnidadesGlobal += r.unidades;
      if (r.total > maxVenta) {
        maxVenta = r.total;
        sucursalLider = r.sucursal;
      }
    }

    const indicators: ReportIndicator[] = [
      { label: 'Total Vendido', value: totalRecaudado, suffix: 'Bs.', description: 'Ingresos consolidados por sucursales' },
      { label: 'Unidades Vendidas', value: totalUnidadesGlobal, description: 'Prendas entregadas en sucursales' },
      { label: 'Sucursal Líder', value: sucursalLider, description: 'Punto de venta con mayor facturación' },
      { label: 'Puntos Evaluados', value: rows.length, description: 'Sucursales / Canales analizados' },
    ];

    const columns: ReportColumn[] = [
      { key: 'sucursal', label: 'Sucursal / Canal', type: 'text' },
      { key: 'ciudad', label: 'Ciudad', type: 'text' },
      { key: 'ventas', label: 'Operaciones', type: 'number' },
      { key: 'unidades', label: 'Prendas Vendidas', type: 'number' },
      { key: 'total', label: 'Total Vendido (Bs.)', type: 'currency' },
    ];

    return {
      title: 'Reporte de Ventas por Sucursal',
      code: 'REP-SUC-04',
      periodo: periodoText,
      sucursalNombre: auth.isGlobal ? 'Consolidado Nacional' : auth.activeSucursal?.nombre || 'Sucursal',
      generatedBy: user.email,
      generatedAt: new Date().toLocaleString('es-BO'),
      indicators,
      columns,
      rows,
      chartData: rows.map((r) => ({ name: r.sucursal, total: r.total })),
    };
  }

  // --- REPORTE 5: MÉTODOS DE PAGO ---
  private async getPaymentMethodsReport(query: QueryReportDto, user: any): Promise<ReportPayload> {
    const auth = await this.getAuthorizedBranches(user, query.id_sucursal);
    const { gte, lte, periodoText } = this.parseDateRange(query.fecha_inicio, query.fecha_fin);
    const dateFilter = gte || lte ? { fecha_venta: { gte, lte } } : {};
    const branchFilter = this.buildVentaBranchFilter(auth.branchIds, auth.isGlobal);

    const ventas = await this.prisma.venta.findMany({
      where: { ...dateFilter, ...branchFilter },
      include: { pago: true },
    });

    const methodsMap = new Map<
      string,
      { metodo: string; transacciones: number; importeTotal: number }
    >();

    let granTotal = 0;
    let totalTransacciones = 0;

    for (const v of ventas) {
      for (const p of v.pago) {
        const m = (p.metodo_pago || 'OTROS').toUpperCase();
        if (!methodsMap.has(m)) {
          methodsMap.set(m, { metodo: m, transacciones: 0, importeTotal: 0 });
        }
        const entry = methodsMap.get(m)!;
        const imp = Number(p.importe || 0);
        entry.transacciones += 1;
        entry.importeTotal += imp;
        granTotal += imp;
        totalTransacciones += 1;
      }
    }

    const rows = Array.from(methodsMap.values()).map((entry) => ({
      metodo: entry.metodo,
      transacciones: entry.transacciones,
      importeTotal: entry.importeTotal,
      participacion: granTotal > 0 ? Number(((entry.importeTotal / granTotal) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.importeTotal - a.importeTotal);

    const metodoLider = rows[0]?.metodo || 'Sin registros';

    const indicators: ReportIndicator[] = [
      { label: 'Total Recaudado', value: granTotal, suffix: 'Bs.', description: 'Importe consolidado por pagos' },
      { label: 'Total Pagos Registrados', value: totalTransacciones, description: 'Transacciones de cobro procesadas' },
      { label: 'Método Principal', value: metodoLider, description: 'Canal de pago con mayor recaudación' },
      { label: 'Métodos Habilitados', value: rows.length, description: 'Variedad de métodos utilizados' },
    ];

    const columns: ReportColumn[] = [
      { key: 'metodo', label: 'Método de Pago', type: 'text' },
      { key: 'transacciones', label: 'Nº Transacciones', type: 'number' },
      { key: 'importeTotal', label: 'Importe Total (Bs.)', type: 'currency' },
      { key: 'participacion', label: 'Participación (%)', type: 'number' },
    ];

    return {
      title: 'Reporte de Métodos de Pago',
      code: 'REP-PAG-05',
      periodo: periodoText,
      sucursalNombre: auth.isGlobal ? 'Consolidado Global' : auth.activeSucursal?.nombre || 'Sucursal',
      generatedBy: user.email,
      generatedAt: new Date().toLocaleString('es-BO'),
      indicators,
      columns,
      rows,
      chartData: rows.map((r) => ({ name: r.metodo, total: r.importeTotal, porcentaje: r.participacion })),
    };
  }

  // --- REPORTE 6: INVENTARIO GENERAL ---
  private async getInventoryReport(query: QueryReportDto, user: any): Promise<ReportPayload> {
    const auth = await this.getAuthorizedBranches(user, query.id_sucursal);
    const branchFilter = auth.isGlobal || auth.branchIds.length === 0 ? {} : { id_sucursal: { in: auth.branchIds } };
    const catFilter = query.categoria_id ? { producto: { id_categoria: Number(query.categoria_id) } } : {};

    const items = await this.prisma.inventario_sucursal.findMany({
      where: {
        ...branchFilter,
        producto_variante: catFilter,
      },
      include: {
        sucursal: true,
        producto_variante: {
          include: {
            producto: { include: { categoria: true } },
            color: true,
            talla: true,
          },
        },
      },
      orderBy: [{ sucursal: { nombre: 'asc' } }, { producto_variante: { sku: 'asc' } }],
    });

    let totalDisponible = 0;
    let totalReservado = 0;
    let valorEstimado = 0;

    const rows = items.map((inv) => {
      const pv = inv.producto_variante;
      const precio = Number(pv.producto.precio_base || 0) + Number(pv.precio_adicional || 0);
      totalDisponible += inv.stock_disponible;
      totalReservado += inv.stock_reservado;
      valorEstimado += inv.stock_disponible * precio;

      return {
        producto: pv.producto.nombre,
        sku: pv.sku,
        categoria: pv.producto.categoria?.nombre || 'General',
        talla: pv.talla.codigo,
        color: pv.color.nombre,
        sucursal: inv.sucursal.nombre,
        stock_disponible: inv.stock_disponible,
        stock_reservado: inv.stock_reservado,
        stock_minimo: inv.stock_minimo,
        actualizacion: inv.ultima_actualizacion.toISOString().split('T')[0],
      };
    });

    const indicators: ReportIndicator[] = [
      { label: 'Variantes en Catálogo', value: rows.length, description: 'Registros de inventario evaluados' },
      { label: 'Stock Disponible', value: totalDisponible, description: 'Prendas listas para venta inmediata' },
      { label: 'Stock Reservado', value: totalReservado, description: 'Prendas reservadas por clientes' },
      { label: 'Valor Estimado', value: valorEstimado, suffix: 'Bs.', description: 'Valor comercial del inventario disponible' },
    ];

    const columns: ReportColumn[] = [
      { key: 'producto', label: 'Producto', type: 'text' },
      { key: 'sku', label: 'SKU', type: 'text' },
      { key: 'categoria', label: 'Categoría', type: 'text' },
      { key: 'talla', label: 'Talla', type: 'text' },
      { key: 'color', label: 'Color', type: 'text' },
      { key: 'sucursal', label: 'Sucursal', type: 'text' },
      { key: 'stock_disponible', label: 'Disponible', type: 'number' },
      { key: 'stock_reservado', label: 'Reservado', type: 'number' },
      { key: 'stock_minimo', label: 'Mínimo', type: 'number' },
      { key: 'actualizacion', label: 'Última Act.', type: 'date' },
    ];

    // Gráfico: Stock por Sucursal
    const chartMap = new Map<string, number>();
    for (const r of rows) {
      chartMap.set(r.sucursal, (chartMap.get(r.sucursal) || 0) + r.stock_disponible);
    }
    const chartData = Array.from(chartMap.entries()).map(([name, unidades]) => ({ name, unidades }));

    return {
      title: 'Reporte de Inventario General',
      code: 'REP-INV-06',
      periodo: 'Existencias Actuales',
      sucursalNombre: auth.isGlobal ? 'Todas las sucursales' : auth.activeSucursal?.nombre || 'Sucursal',
      generatedBy: user.email,
      generatedAt: new Date().toLocaleString('es-BO'),
      indicators,
      columns,
      rows,
      chartData,
    };
  }

  // --- REPORTE 7: INVENTARIO CRÍTICO ---
  private async getCriticalInventoryReport(query: QueryReportDto, user: any): Promise<ReportPayload> {
    const auth = await this.getAuthorizedBranches(user, query.id_sucursal);
    const branchFilter = auth.isGlobal || auth.branchIds.length === 0 ? {} : { id_sucursal: { in: auth.branchIds } };

    const items = await this.prisma.inventario_sucursal.findMany({
      where: branchFilter,
      include: {
        sucursal: true,
        producto_variante: {
          include: {
            producto: true,
            color: true,
            talla: true,
          },
        },
      },
    });

    let countBajoStock = 0;
    let countAgotados = 0;
    const branchAlertsMap = new Map<string, number>();

    const rows: any[] = [];

    for (const inv of items) {
      const pv = inv.producto_variante;
      const disponible = inv.stock_disponible;
      const minimo = inv.stock_minimo;

      if (disponible === 0) {
        countAgotados++;
        const sucursal = inv.sucursal.nombre;
        branchAlertsMap.set(sucursal, (branchAlertsMap.get(sucursal) || 0) + 1);

        rows.push({
          producto: pv.producto.nombre,
          sku: pv.sku,
          variante: `${pv.color.nombre} / ${pv.talla.codigo}`,
          sucursal,
          disponible: 0,
          minimo,
          diferencia: minimo,
          estado: 'Agotado',
        });
      } else if (disponible <= minimo) {
        countBajoStock++;
        const sucursal = inv.sucursal.nombre;
        branchAlertsMap.set(sucursal, (branchAlertsMap.get(sucursal) || 0) + 1);

        rows.push({
          producto: pv.producto.nombre,
          sku: pv.sku,
          variante: `${pv.color.nombre} / ${pv.talla.codigo}`,
          sucursal,
          disponible,
          minimo,
          diferencia: minimo - disponible,
          estado: 'Bajo stock',
        });
      }
    }

    let sucursalConMasAlertas = '-';
    let maxAlerts = -1;
    for (const [sucursal, count] of branchAlertsMap.entries()) {
      if (count > maxAlerts) {
        maxAlerts = count;
        sucursalConMasAlertas = `${sucursal} (${count} alertas)`;
      }
    }

    const indicators: ReportIndicator[] = [
      { label: 'Productos con Bajo Stock', value: countBajoStock, description: 'Prendas con existencias ≤ stock mínimo' },
      { label: 'Productos Agotados', value: countAgotados, description: 'Prendas con stock exactamente en 0' },
      { label: 'Total Variantes en Alerta', value: countBajoStock + countAgotados, description: 'Total de ítems que requieren reposición' },
      { label: 'Sucursal Más Crítica', value: sucursalConMasAlertas, description: 'Punto de venta con mayor déficit de prendas' },
    ];

    const columns: ReportColumn[] = [
      { key: 'producto', label: 'Producto', type: 'text' },
      { key: 'sku', label: 'SKU', type: 'text' },
      { key: 'variante', label: 'Color / Talla', type: 'text' },
      { key: 'sucursal', label: 'Sucursal', type: 'text' },
      { key: 'disponible', label: 'Disponible', type: 'number' },
      { key: 'minimo', label: 'Mínimo', type: 'number' },
      { key: 'diferencia', label: 'Faltante Reposición', type: 'number' },
      { key: 'estado', label: 'Nivel Alerta', type: 'text' },
    ];

    const chartData = Array.from(branchAlertsMap.entries()).map(([name, alertas]) => ({ name, alertas }));

    return {
      title: 'Reporte de Inventario Crítico y Alertas de Stock',
      code: 'REP-CRI-07',
      periodo: 'Estado Actual de Alertas',
      sucursalNombre: auth.isGlobal ? 'Todas las sucursales' : auth.activeSucursal?.nombre || 'Sucursal',
      generatedBy: user.email,
      generatedAt: new Date().toLocaleString('es-BO'),
      indicators,
      columns,
      rows: rows.sort((a, b) => a.disponible - b.disponible),
      chartData,
    };
  }

  // --- REPORTE 8: MOVIMIENTOS DE INVENTARIO ---
  private async getMovementsReport(query: QueryReportDto, user: any): Promise<ReportPayload> {
    const auth = await this.getAuthorizedBranches(user, query.id_sucursal);
    const { gte, lte, periodoText } = this.parseDateRange(query.fecha_inicio, query.fecha_fin);
    const dateFilter = gte || lte ? { fecha: { gte, lte } } : {};
    const branchFilter = auth.isGlobal || auth.branchIds.length === 0 ? {} : { id_sucursal: { in: auth.branchIds } };
    const tipoFilter = query.tipo_venta ? { tipo_movimiento: query.tipo_venta } : {};

    const movs = await this.prisma.movimiento_inventario.findMany({
      where: {
        ...dateFilter,
        ...branchFilter,
        ...tipoFilter,
      },
      include: {
        sucursal: true,
        empleado: true,
        producto_variante: {
          include: {
            producto: true,
            color: true,
            talla: true,
          },
        },
      },
      orderBy: { fecha: 'desc' },
    });

    let totalEntradas = 0;
    let totalSalidas = 0;
    let totalReservas = 0;
    let totalAjustes = 0;

    const typeStats = new Map<string, number>();

    const rows = movs.map((m) => {
      const tipoNorm = (m.tipo_movimiento || '').toLowerCase();
      typeStats.set(tipoNorm, (typeStats.get(tipoNorm) || 0) + m.cantidad);

      if (tipoNorm.includes('entrada')) totalEntradas += m.cantidad;
      else if (tipoNorm.includes('salida')) totalSalidas += m.cantidad;
      else if (tipoNorm.includes('reserva')) totalReservas += m.cantidad;
      else totalAjustes += m.cantidad;

      const pv = m.producto_variante;
      return {
        id: m.id_movimiento_inventario,
        fecha: m.fecha.toISOString().split('T')[0],
        tipo: m.tipo_movimiento.toUpperCase(),
        cantidad: m.cantidad,
        producto: pv.producto.nombre,
        sku: pv.sku,
        variante: `${pv.color.nombre} / ${pv.talla.codigo}`,
        sucursal: m.sucursal.nombre,
        motivo: m.motivo || 'Operación ordinaria',
        empleado: m.empleado ? `${m.empleado.nombre} ${m.empleado.apellido}` : 'Sistema automático',
      };
    });

    const indicators: ReportIndicator[] = [
      { label: 'Total Movimientos', value: movs.length, description: 'Operaciones de inventario registradas' },
      { label: 'Unidades Entradas', value: totalEntradas, description: 'Recepciones y altas de prendas' },
      { label: 'Unidades Salidas', value: totalSalidas, description: 'Ventas y despachos definitivos' },
      { label: 'Unidades en Reserva', value: totalReservas, description: 'Prendas apartadas para probador' },
    ];

    const columns: ReportColumn[] = [
      { key: 'fecha', label: 'Fecha', type: 'date' },
      { key: 'tipo', label: 'Tipo Movimiento', type: 'text' },
      { key: 'cantidad', label: 'Cantidad', type: 'number' },
      { key: 'producto', label: 'Producto', type: 'text' },
      { key: 'sku', label: 'SKU', type: 'text' },
      { key: 'variante', label: 'Color / Talla', type: 'text' },
      { key: 'sucursal', label: 'Sucursal', type: 'text' },
      { key: 'motivo', label: 'Motivo / Referencia', type: 'text' },
      { key: 'empleado', label: 'Responsable', type: 'text' },
    ];

    const chartData = Array.from(typeStats.entries()).map(([name, cantidad]) => ({
      name: name.toUpperCase(),
      cantidad,
    }));

    return {
      title: 'Reporte de Movimientos de Inventario',
      code: 'REP-MOV-08',
      periodo: periodoText,
      sucursalNombre: auth.isGlobal ? 'Consolidado Global' : auth.activeSucursal?.nombre || 'Sucursal',
      generatedBy: user.email,
      generatedAt: new Date().toLocaleString('es-BO'),
      indicators,
      columns,
      rows,
      chartData,
    };
  }

  // --- REPORTE 9: RESERVAS DE PRENDAS ---
  private async getReservationsReport(query: QueryReportDto, user: any): Promise<ReportPayload> {
    const auth = await this.getAuthorizedBranches(user, query.id_sucursal);
    const { gte, lte, periodoText } = this.parseDateRange(query.fecha_inicio, query.fecha_fin);
    const dateFilter = gte || lte ? { fecha_reserva: { gte, lte } } : {};
    const branchFilter = auth.isGlobal || auth.branchIds.length === 0 ? {} : { id_sucursal: { in: auth.branchIds } };
    const estadoFilter = query.estado ? { estado: query.estado } : {};

    const reservas = await this.prisma.reserva.findMany({
      where: {
        ...dateFilter,
        ...branchFilter,
        ...estadoFilter,
      },
      include: {
        cliente: true,
        sucursal: true,
        detalle_reserva: {
          include: {
            producto_variante: {
              include: { producto: true, color: true, talla: true },
            },
          },
        },
      },
      orderBy: { fecha_reserva: 'desc' },
    });

    let pendientes = 0;
    let confirmadas = 0;
    let completadas = 0;
    let canceladas = 0;

    const rows = reservas.map((r) => {
      const st = (r.estado || '').toLowerCase();
      if (st.includes('pendiente')) pendientes++;
      else if (st.includes('confirmada') || st.includes('preparada')) confirmadas++;
      else if (st.includes('completada') || st.includes('vendida')) completadas++;
      else if (st.includes('cancelada')) canceladas++;

      const prendasCount = r.detalle_reserva.reduce((acc, curr) => acc + curr.cantidad, 0);
      const clienteStr = r.cliente ? `${r.cliente.nombre} ${r.cliente.apellido}` : 'Cliente Registrado';

      return {
        codigo: r.codigo,
        cliente: clienteStr,
        sucursal: r.sucursal.nombre,
        fecha: r.fecha_reserva.toISOString().split('T')[0],
        horario: r.horario_estimado ? r.horario_estimado.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }) : 'No fijado',
        prendas: prendasCount,
        estado: r.estado.toUpperCase(),
      };
    });

    const total = reservas.length;
    const tasaEfectividad = total > 0 ? Number(((completadas / total) * 100).toFixed(1)) : 0;

    const indicators: ReportIndicator[] = [
      { label: 'Total Reservas', value: total, description: 'Reservas registradas en período' },
      { label: 'Pendientes / Activas', value: pendientes, description: 'En espera de visita o preparación' },
      { label: 'Completadas en Venta', value: completadas, description: 'Prendas probadas y adquiridas' },
      { label: 'Canceladas', value: canceladas, description: 'Reservas declinadas o expiradas' },
      { label: 'Tasa de Efectividad', value: tasaEfectividad, suffix: '%', description: 'Porcentaje de reservas convertidas a venta' },
    ];

    const columns: ReportColumn[] = [
      { key: 'codigo', label: 'Código Reserva', type: 'text' },
      { key: 'cliente', label: 'Cliente', type: 'text' },
      { key: 'sucursal', label: 'Sucursal', type: 'text' },
      { key: 'fecha', label: 'Fecha Reserva', type: 'date' },
      { key: 'horario', label: 'Horario Estimado', type: 'text' },
      { key: 'prendas', label: 'Prendas', type: 'number' },
      { key: 'estado', label: 'Estado', type: 'text' },
    ];

    const chartData = [
      { name: 'Pendientes', cantidad: pendientes },
      { name: 'Confirmadas / Preparadas', cantidad: confirmadas },
      { name: 'Completadas', cantidad: completadas },
      { name: 'Canceladas', cantidad: canceladas },
    ];

    return {
      title: 'Reporte de Reservas de Sucursal',
      code: 'REP-RES-09',
      periodo: periodoText,
      sucursalNombre: auth.isGlobal ? 'Consolidado Global' : auth.activeSucursal?.nombre || 'Sucursal',
      generatedBy: user.email,
      generatedAt: new Date().toLocaleString('es-BO'),
      indicators,
      columns,
      rows,
      chartData,
    };
  }

  // --- REPORTE 10: DEVOLUCIONES ---
  private async getReturnsReport(query: QueryReportDto, user: any): Promise<ReportPayload> {
    const auth = await this.getAuthorizedBranches(user, query.id_sucursal);
    const { gte, lte, periodoText } = this.parseDateRange(query.fecha_inicio, query.fecha_fin);
    const dateFilter = gte || lte ? { fecha_hora: { gte, lte } } : {};

    const devoluciones = await this.prisma.devolucion.findMany({
      where: dateFilter,
      include: {
        venta: { include: { empleado: { include: { empleado_sucursal: true } } } },
        detalle_devolucion: {
          include: {
            detalle_venta: {
              include: {
                producto_variante: { include: { producto: true, color: true, talla: true } },
              },
            },
          },
        },
      },
      orderBy: { fecha_hora: 'desc' },
    });

    let totalPrendas = 0;
    const motivoStats = new Map<string, number>();

    const rows = devoluciones.map((d) => {
      const motivo = d.motivo || 'Motivo general';
      motivoStats.set(motivo, (motivoStats.get(motivo) || 0) + 1);

      let cantDev = 0;
      let prodName = 'Prenda';
      for (const det of d.detalle_devolucion) {
        cantDev += det.cantidad;
        totalPrendas += det.cantidad;
        prodName = det.detalle_venta?.producto_variante?.producto?.nombre || prodName;
      }

      return {
        id: d.id_devolucion,
        fecha: d.fecha_hora.toISOString().split('T')[0],
        venta: d.venta?.codigo_factura || `FAC-${d.id_venta}`,
        producto: prodName,
        cantidad: cantDev,
        motivo,
        estado: d.estado.toUpperCase(),
        observacion: d.observacion || '-',
      };
    });

    const indicators: ReportIndicator[] = [
      { label: 'Total Devoluciones', value: devoluciones.length, description: 'Incidentes de devolución atendidos' },
      { label: 'Prendas Devueltas', value: totalPrendas, description: 'Artículos reingresados o revisados' },
      { label: 'Motivo Más Frecuente', value: Array.from(motivoStats.keys())[0] || 'N/A', description: 'Causa primaria de cambio o devolución' },
    ];

    const columns: ReportColumn[] = [
      { key: 'fecha', label: 'Fecha', type: 'date' },
      { key: 'venta', label: 'Factura Relacionada', type: 'text' },
      { key: 'producto', label: 'Producto', type: 'text' },
      { key: 'cantidad', label: 'Cantidad', type: 'number' },
      { key: 'motivo', label: 'Motivo', type: 'text' },
      { key: 'estado', label: 'Estado', type: 'text' },
      { key: 'observacion', label: 'Observación', type: 'text' },
    ];

    const chartData = Array.from(motivoStats.entries()).map(([name, cantidad]) => ({ name, cantidad }));

    return {
      title: 'Reporte de Devoluciones y Garantías',
      code: 'REP-DEV-10',
      periodo: periodoText,
      sucursalNombre: auth.isGlobal ? 'Consolidado Global' : auth.activeSucursal?.nombre || 'Sucursal',
      generatedBy: user.email,
      generatedAt: new Date().toLocaleString('es-BO'),
      indicators,
      columns,
      rows,
      chartData,
    };
  }

  // --- REPORTE 11: COMPRAS Y PROVEEDORES ---
  private async getPurchasesReport(query: QueryReportDto, user: any): Promise<ReportPayload> {
    const auth = await this.getAuthorizedBranches(user, query.id_sucursal);
    const { gte, lte, periodoText } = this.parseDateRange(query.fecha_inicio, query.fecha_fin);
    const dateFilter = gte || lte ? { fecha_orden: { gte, lte } } : {};
    const branchFilter = auth.isGlobal || auth.branchIds.length === 0 ? {} : { id_sucursal: { in: auth.branchIds } };

    const ordenes = await this.prisma.orden_compra.findMany({
      where: { ...dateFilter, ...branchFilter },
      include: {
        proveedor: true,
        sucursal: true,
        detalle_orden_compra: {
          include: {
            producto_variante: { include: { producto: true } },
          },
        },
      },
      orderBy: { fecha_orden: 'desc' },
    });

    let totalCostoAbastecimiento = 0;
    let totalUnidadesAdquiridas = 0;
    let pendientes = 0;
    let recibidas = 0;

    const supplierStats = new Map<string, number>();

    const rows = ordenes.map((oc) => {
      let costoOrden = 0;
      let cantOrden = 0;

      for (const d of oc.detalle_orden_compra) {
        costoOrden += Number(d.costo_unitario) * d.cantidad;
        cantOrden += d.cantidad;
      }

      totalCostoAbastecimiento += costoOrden;
      totalUnidadesAdquiridas += cantOrden;

      const st = (oc.estado || '').toLowerCase();
      if (st.includes('recibida') || st.includes('completada')) recibidas++;
      else pendientes++;

      const prov = oc.proveedor.razon_social;
      supplierStats.set(prov, (supplierStats.get(prov) || 0) + costoOrden);

      return {
        codigo: `OC-${oc.id_orden_compra}`,
        proveedor: prov,
        sucursal: oc.sucursal.nombre,
        fechaOrden: oc.fecha_orden.toISOString().split('T')[0],
        fechaEstimada: oc.fecha_estimada ? oc.fecha_estimada.toISOString().split('T')[0] : '-',
        unidades: cantOrden,
        costoTotal: costoOrden,
        estado: oc.estado.toUpperCase(),
      };
    });

    const indicators: ReportIndicator[] = [
      { label: 'Costo de Abastecimiento', value: totalCostoAbastecimiento, suffix: 'Bs.', description: 'Inversión total en compras a proveedores' },
      { label: 'Órdenes de Compra', value: ordenes.length, description: 'Lotes de abastecimiento gestionados' },
      { label: 'Órdenes Recibidas', value: recibidas, description: 'Lotes ingresados a almacén' },
      { label: 'Órdenes Pendientes', value: pendientes, description: 'En tránsito o pendientes de recepción' },
      { label: 'Prendas Adquiridas', value: totalUnidadesAdquiridas, description: 'Unidades de prendas solicitadas' },
    ];

    const columns: ReportColumn[] = [
      { key: 'codigo', label: 'Código OC', type: 'text' },
      { key: 'proveedor', label: 'Proveedor', type: 'text' },
      { key: 'sucursal', label: 'Sucursal Destino', type: 'text' },
      { key: 'fechaOrden', label: 'Fecha Emisión', type: 'date' },
      { key: 'fechaEstimada', label: 'Fecha Estimada', type: 'date' },
      { key: 'unidades', label: 'Prendas', type: 'number' },
      { key: 'costoTotal', label: 'Costo Total (Bs.)', type: 'currency' },
      { key: 'estado', label: 'Estado', type: 'text' },
    ];

    const chartData = Array.from(supplierStats.entries()).map(([name, costo]) => ({ name, costo }));

    return {
      title: 'Reporte de Compras y Proveedores',
      code: 'REP-COM-11',
      periodo: periodoText,
      sucursalNombre: auth.isGlobal ? 'Consolidado Global' : auth.activeSucursal?.nombre || 'Sucursal',
      generatedBy: user.email,
      generatedAt: new Date().toLocaleString('es-BO'),
      indicators,
      columns,
      rows,
      chartData,
    };
  }

  /**
   * Obtiene las categorías de catálogo para los filtros del frontend
   */
  async getCategories() {
    return this.prisma.categoria.findMany({
      orderBy: { nombre: 'asc' },
      select: { id_categoria: true, nombre: true },
    });
  }
}
