/**
 * @file inventory.service.ts
 * @caso-de-uso CU15 — Consultar inventario
 * @subsistema Sucursales e Inventario
 * @capa Lógica de Negocio y Persistencia — Backend
 * @responsabilidad Centraliza las consultas y auditorías de existencias físicas por tienda:
 * - Aplica alcance de sucursales según el perfil del usuario (SuperAdmin accede a todas; personal solo a sus tiendas asignadas).
 * - Evalúa estados cualitativos de stock: 'agotado' (0), 'bajo' (<= stock_minimo) y 'normal'.
 * - Calcula estadísticas agregadas globales (stock disponible, stock reservado, ítems agotados y bajo mínimo).
 */

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { QueryInventoryDto, StockStatusFilter } from './dto/inventory.dto.js';

/**
 * Servicio encargado de la consulta y estadísticas de existencias de almacén por tienda.
 */
@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Determina las sucursales a las que el usuario autenticado tiene acceso legal:
   * - Administrador (id_rol === 1 o nombre 'administrador'): Todas las sucursales de la red.
   * - Encargados / Vendedores: Únicamente las tiendas vinculadas en la tabla `empleado_sucursal`.
   *
   * @param {any} user - Entidad de usuario autenticado extraída del token JWT.
   * @returns {Promise<{ isSuperAdmin: boolean, allowedBranchIds: number[] }>} Identificadores permitidos.
   */
  private async getAllowedBranchIds(user: any): Promise<{
    isSuperAdmin: boolean;
    allowedBranchIds: number[];
  }> {
    const isSuperAdmin =
      user?.rol?.id_rol === 1 ||
      (user?.rol?.nombre || '').toLowerCase().trim() === 'administrador';

    if (isSuperAdmin) {
      return { isSuperAdmin: true, allowedBranchIds: [] };
    }

    const assigned = await this.prisma.empleado_sucursal.findMany({
      where: { id_empleado: user.id_usuario },
      select: { id_sucursal: true },
    });

    const allowedBranchIds = assigned.map((a) => a.id_sucursal);
    return { isSuperAdmin: false, allowedBranchIds };
  }

  /**
   * Obtiene metadatos para inicializar los filtros en la interfaz (sucursales habilitadas para el operador,
   * tallas, colores y categorías activas).
   *
   * @param {any} user - Usuario autenticado.
   * @returns {Promise<Object>} Conjunto de metadatos de filtrado.
   */
  async getMetadata(user: any) {
    const { isSuperAdmin, allowedBranchIds } = await this.getAllowedBranchIds(user);

    const sucursalWhere: any = { estado: 'activo' };
    if (!isSuperAdmin) {
      sucursalWhere.id_sucursal = { in: allowedBranchIds };
    }

    const [branches, sizes, colors, categories] = await Promise.all([
      this.prisma.sucursal.findMany({
        where: sucursalWhere,
        orderBy: [{ ciudad: { nombre: 'asc' } }, { nombre: 'asc' }],
        select: {
          id_sucursal: true,
          nombre: true,
          ciudad: {
            select: { id_ciudad: true, nombre: true },
          },
        },
      }),
      this.prisma.talla.findMany({
        orderBy: { id_talla: 'asc' },
        select: { id_talla: true, codigo: true },
      }),
      this.prisma.color.findMany({
        orderBy: { nombre: 'asc' },
        select: { id_color: true, nombre: true, codigo_hex: true },
      }),
      this.prisma.categoria.findMany({
        orderBy: { nombre: 'asc' },
        select: { id_categoria: true, nombre: true },
      }),
    ]);

    return {
      branches: branches.map((b) => ({
        id_sucursal: b.id_sucursal,
        nombre: b.nombre,
        ciudad: b.ciudad.nombre,
      })),
      sizes,
      colors,
      categories,
      isSuperAdmin,
    };
  }

  /**
   * Consulta existencias de inventario por producto/variante según sucursales autorizadas:
   * 1. Restringe la consulta a las sucursales asignadas si el usuario no es superadministrador.
   * 2. Aplica filtros opcionales de búsqueda por SKU o nombre de producto, talla y color.
   * 3. Filtra por estado de stock: disponible (>0), bajo (<= mínimo) o agotado (=0).
   * 4. Computa estadísticas globales consolidadas del universo autorizado en tiempo real.
   *
   * @param {any} user - Usuario autenticado.
   * @param {QueryInventoryDto} query - Criterios de filtrado y paginación.
   * @returns {Promise<Object>} Datos paginados, metadatos y estadísticas de existencias.
   * @throws {ForbiddenException} Si un usuario intenta consultar una sucursal fuera de sus tiendas permitidas.
   */
  async getInventory(user: any, query: QueryInventoryDto) {
    const {
      search,
      id_sucursal,
      id_talla,
      id_color,
      stock_status,
      page = 1,
      limit = 15,
    } = query;

    const { isSuperAdmin, allowedBranchIds } = await this.getAllowedBranchIds(user);

    // Validación de sucursal permitida
    const where: any = {};

    if (!isSuperAdmin) {
      if (allowedBranchIds.length === 0) {
        return {
          data: [],
          meta: { total: 0, page, limit, totalPages: 0 },
          stats: {
            total_disponible: 0,
            total_reservado: 0,
            items_bajo_stock: 0,
            items_agotados: 0,
          },
        };
      }

      if (id_sucursal) {
        if (!allowedBranchIds.includes(Number(id_sucursal))) {
          throw new ForbiddenException(
            'No tiene permisos para consultar el inventario de esta sucursal.',
          );
        }
        where.id_sucursal = Number(id_sucursal);
      } else {
        where.id_sucursal = { in: allowedBranchIds };
      }
    } else {
      if (id_sucursal) {
        where.id_sucursal = Number(id_sucursal);
      }
    }

    // Filtros de Variante (Talla, Color, Búsqueda)
    const varianteWhere: any = {};

    if (id_talla) {
      varianteWhere.id_talla = Number(id_talla);
    }

    if (id_color) {
      varianteWhere.id_color = Number(id_color);
    }

    if (search?.trim()) {
      const term = search.trim();
      varianteWhere.OR = [
        { sku: { contains: term, mode: 'insensitive' } },
        { producto: { nombre: { contains: term, mode: 'insensitive' } } },
      ];
    }

    if (Object.keys(varianteWhere).length > 0) {
      where.producto_variante = varianteWhere;
    }

    // Filtro por estado de stock
    if (stock_status && stock_status !== StockStatusFilter.TODOS) {
      if (stock_status === StockStatusFilter.AGOTADO) {
        where.stock_disponible = 0;
      } else if (stock_status === StockStatusFilter.DISPONIBLE) {
        where.stock_disponible = { gt: 0 };
      }
    }

    const skip = (page - 1) * limit;

    const [total, items, allAuthorizedItems] = await Promise.all([
      this.prisma.inventario_sucursal.count({ where }),
      this.prisma.inventario_sucursal.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { sucursal: { nombre: 'asc' } },
          { producto_variante: { producto: { nombre: 'asc' } } },
        ],
        include: {
          sucursal: {
            select: {
              id_sucursal: true,
              nombre: true,
              ciudad: { select: { nombre: true } },
            },
          },
          producto_variante: {
            select: {
              id_producto_variante: true,
              sku: true,
              precio_adicional: true,
              imagen_url: true,
              estado: true,
              producto: {
                select: {
                  id_producto: true,
                  nombre: true,
                  precio_base: true,
                  categoria: { select: { nombre: true } },
                },
              },
              talla: { select: { id_talla: true, codigo: true } },
              color: { select: { id_color: true, nombre: true, codigo_hex: true } },
            },
          },
        },
      }),
      // Para estadísticas globales del universo autorizado
      this.prisma.inventario_sucursal.findMany({
        where: !isSuperAdmin
          ? id_sucursal
            ? { id_sucursal: Number(id_sucursal) }
            : { id_sucursal: { in: allowedBranchIds } }
          : id_sucursal
          ? { id_sucursal: Number(id_sucursal) }
          : {},
        select: {
          stock_disponible: true,
          stock_reservado: true,
          stock_minimo: true,
        },
      }),
    ]);

    // Cálculo de estadísticas
    let total_disponible = 0;
    let total_reservado = 0;
    let items_bajo_stock = 0;
    let items_agotados = 0;

    for (const item of allAuthorizedItems) {
      total_disponible += item.stock_disponible;
      total_reservado += item.stock_reservado;
      if (item.stock_disponible === 0) {
        items_agotados++;
      } else if (item.stock_disponible <= item.stock_minimo) {
        items_bajo_stock++;
      }
    }

    const data = items.map((i) => {
      const precioUnitario =
        Number(i.producto_variante.producto.precio_base) +
        Number(i.producto_variante.precio_adicional);

      let estadoStock: 'normal' | 'bajo' | 'agotado' = 'normal';
      if (i.stock_disponible === 0) {
        estadoStock = 'agotado';
      } else if (i.stock_disponible <= i.stock_minimo) {
        estadoStock = 'bajo';
      }

      return {
        id_inventario_sucursal: i.id_inventario_sucursal,
        stock_disponible: i.stock_disponible,
        stock_reservado: i.stock_reservado,
        stock_total: i.stock_disponible + i.stock_reservado,
        stock_minimo: i.stock_minimo,
        estado_stock: estadoStock,
        ultima_actualizacion: i.ultima_actualizacion,
        sucursal: {
          id_sucursal: i.sucursal.id_sucursal,
          nombre: i.sucursal.nombre,
          ciudad: i.sucursal.ciudad.nombre,
        },
        variante: {
          id_producto_variante: i.producto_variante.id_producto_variante,
          sku: i.producto_variante.sku,
          imagen_url: i.producto_variante.imagen_url,
          precio: precioUnitario,
          producto_id: i.producto_variante.producto.id_producto,
          producto_nombre: i.producto_variante.producto.nombre,
          categoria: i.producto_variante.producto.categoria?.nombre || 'General',
          talla: i.producto_variante.talla.codigo,
          color: {
            nombre: i.producto_variante.color.nombre,
            codigo_hex: i.producto_variante.color.codigo_hex,
          },
        },
      };
    });

    // Si el usuario pidió específicamente 'bajo', filtramos en data si aplica
    const filteredData =
      stock_status === StockStatusFilter.BAJO
        ? data.filter((d) => d.estado_stock === 'bajo')
        : data;

    return {
      data: filteredData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total_disponible,
        total_reservado,
        items_bajo_stock,
        items_agotados,
      },
    };
  }

  /**
   * Obtiene el detalle de un registro específico de inventario verificando autorización sobre la sucursal.
   *
   * @param {any} user - Usuario autenticado.
   * @param {number} id - ID del registro de inventario_sucursal.
   * @returns {Promise<Object>} Registro detallado con sucursal y variante.
   * @throws {NotFoundException} Si el registro no existe.
   * @throws {ForbiddenException} Si el usuario no tiene acceso a dicha sucursal.
   */
  async getInventoryDetail(user: any, id: number) {
    const item = await this.prisma.inventario_sucursal.findUnique({
      where: { id_inventario_sucursal: id },
      include: {
        sucursal: {
          include: { ciudad: true },
        },
        producto_variante: {
          include: {
            producto: { include: { categoria: true } },
            talla: true,
            color: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Registro de inventario no encontrado.');
    }

    const { isSuperAdmin, allowedBranchIds } = await this.getAllowedBranchIds(user);
    if (!isSuperAdmin && !allowedBranchIds.includes(item.id_sucursal)) {
      throw new ForbiddenException(
        'No tiene permisos para consultar el inventario de esta sucursal.',
      );
    }

    return item;
  }
}
