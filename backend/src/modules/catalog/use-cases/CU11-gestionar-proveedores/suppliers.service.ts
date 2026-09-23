/**
 * @file suppliers.service.ts
 * @caso-de-uso CU11 — Gestionar proveedores y compras de reabastecimiento
 * @subsistema Catálogo y Proveedores
 * @capa Lógica de Negocio y Persistencia — Backend
 * @responsabilidad Implementa las reglas comerciales para el registro y mantenimiento de proveedores,
 * vinculación de productos con costos pactados, emisión de órdenes de compra para sucursales físicas,
 * y recepción de mercancía mediante transacciones ACID que incrementan el inventario e insertan auditoría de movimientos.
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import {
  CreatePurchaseOrderDto,
  CreateSupplierDto,
  CreateSupplierProductDto,
  QueryPurchaseOrdersDto,
  QuerySuppliersDto,
  ReceivePurchaseOrderDto,
  UpdateSupplierDto,
  UpdateSupplierProductDto,
} from './dto/suppliers.dto.js';

/**
 * Servicio encargado de la gestión comercial de proveedores, órdenes de compra y recepción en inventario.
 */
@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene metadatos de referencia en paralelo para alimentar interfaces de compras:
   * productos, sucursales activas, variantes con SKU, temporadas y proveedores vigentes.
   *
   * @returns {Promise<Object>} Conjuntos maestros de datos para selección.
   */
  async getMetadata() {
    const [products, branches, variants, seasons, suppliers] = await Promise.all([
      this.prisma.producto.findMany({
        select: { id_producto: true, nombre: true, estado: true },
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.sucursal.findMany({
        select: { id_sucursal: true, nombre: true, estado: true },
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.producto_variante.findMany({
        select: {
          id_producto_variante: true,
          sku: true,
          estado: true,
          producto: { select: { id_producto: true, nombre: true } },
          talla: { select: { codigo: true } },
          color: { select: { nombre: true } },
        },
        orderBy: { sku: 'asc' },
      }),
      this.prisma.temporada.findMany({
        select: { id_temporada: true, nombre: true, estado: true },
        orderBy: { fecha_inicio: 'desc' },
      }),
      this.prisma.proveedor.findMany({
        select: { id_proveedor: true, razon_social: true, nit: true },
        orderBy: { razon_social: 'asc' },
      }),
    ]);

    return { products, branches, variants, seasons, suppliers };
  }

  /**
   * Lista los proveedores registrados aplicando búsqueda libre por razón social, NIT, contacto o email,
   * con paginación y conteo de productos u órdenes vinculadas.
   *
   * @param {QuerySuppliersDto} query - Parámetros de búsqueda y paginación.
   * @returns {Promise<Object>} Lista de proveedores con metadatos de paginación.
   */
  async findAllSuppliers(query: QuerySuppliersDto) {
    const { search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search?.trim()) {
      const term = search.trim();
      where.OR = [
        { razon_social: { contains: term, mode: 'insensitive' } },
        { nit: { contains: term, mode: 'insensitive' } },
        { contacto_nombre: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, suppliers] = await Promise.all([
      this.prisma.proveedor.count({ where }),
      this.prisma.proveedor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { razon_social: 'asc' },
        include: {
          _count: {
            select: {
              proveedor_producto: true,
              orden_compra: true,
            },
          },
        },
      }),
    ]);

    return {
      data: suppliers.map((supplier: any) => ({
        ...supplier,
        total_productos: supplier._count.proveedor_producto,
        total_ordenes: supplier._count.orden_compra,
        _count: undefined,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Consulta un proveedor por su ID, recuperando la lista de productos asociados con sus costos pactados
   * y el historial de órdenes de compra emitidas a su nombre.
   *
   * @param {number} id - ID del proveedor.
   * @returns {Promise<Object>} Ficha del proveedor con productos y órdenes.
   * @throws {NotFoundException} Si el proveedor no existe.
   */
  async findSupplierById(id: number) {
    const supplier = await this.prisma.proveedor.findUnique({
      where: { id_proveedor: id },
      include: {
        proveedor_producto: {
          include: {
            producto: {
              select: {
                id_producto: true,
                nombre: true,
                estado: true,
                categoria: { select: { nombre: true } },
              },
            },
          },
        },
        orden_compra: {
          include: { sucursal: { select: { id_sucursal: true, nombre: true } } },
          orderBy: { fecha_orden: 'desc' },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException(`El proveedor con ID ${id} no existe.`);
    }

    return {
      ...supplier,
      proveedor_producto: supplier.proveedor_producto.map((item: any) => ({
        ...item,
        costo_referencia:
          item.costo_referencia === null ? null : Number(item.costo_referencia),
      })),
    };
  }

  /**
   * Registra un nuevo proveedor en la base de datos previa validación de unicidad de NIT.
   *
   * @param {CreateSupplierDto} dto - Datos de la empresa proveedora (razón social, NIT, contacto, teléfono, email, dirección).
   * @returns {Promise<Object>} Proveedor creado.
   * @throws {ConflictException} Si el NIT ya se encuentra registrado.
   */
  async createSupplier(dto: CreateSupplierDto) {
    const nit = dto.nit.trim();
    const conflict = await this.prisma.proveedor.findUnique({ where: { nit } });

    if (conflict) {
      throw new ConflictException(`El NIT "${nit}" ya se encuentra registrado.`);
    }

    const max = await this.prisma.proveedor.aggregate({ _max: { id_proveedor: true } });
    const nextId = (max._max.id_proveedor || 0) + 1;

    const created = await this.prisma.proveedor.create({
      data: {
        id_proveedor: nextId,
        razon_social: dto.razon_social.trim(),
        nit,
        contacto_nombre: dto.contacto_nombre?.trim() || null,
        telefono: dto.telefono?.trim() || null,
        email: dto.email?.trim() || null,
        direccion: dto.direccion?.trim() || null,
      },
    });

    return { message: 'Proveedor creado exitosamente.', data: created };
  }

  /**
   * Actualiza la información tributaria, datos de contacto o ubicación de un proveedor.
   *
   * @param {number} id - ID del proveedor.
   * @param {UpdateSupplierDto} dto - Campos a actualizar.
   * @returns {Promise<Object>} Proveedor actualizado.
   * @throws {NotFoundException} Si el proveedor no existe.
   * @throws {ConflictException} Si el nuevo NIT colisiona con otro registro existente.
   */
  async updateSupplier(id: number, dto: UpdateSupplierDto) {
    const existing = await this.prisma.proveedor.findUnique({ where: { id_proveedor: id } });
    if (!existing) {
      throw new NotFoundException(`El proveedor con ID ${id} no existe.`);
    }

    if (dto.nit && dto.nit.trim() !== existing.nit) {
      const conflict = await this.prisma.proveedor.findUnique({
        where: { nit: dto.nit.trim() },
      });
      if (conflict) {
        throw new ConflictException(`El NIT "${dto.nit}" ya se encuentra registrado.`);
      }
    }

    const updated = await this.prisma.proveedor.update({
      where: { id_proveedor: id },
      data: {
        razon_social:
          dto.razon_social !== undefined ? dto.razon_social.trim() : undefined,
        nit: dto.nit !== undefined ? dto.nit.trim() : undefined,
        contacto_nombre:
          dto.contacto_nombre !== undefined
            ? dto.contacto_nombre?.trim() || null
            : undefined,
        telefono: dto.telefono !== undefined ? dto.telefono?.trim() || null : undefined,
        email: dto.email !== undefined ? dto.email?.trim() || null : undefined,
        direccion: dto.direccion !== undefined ? dto.direccion?.trim() || null : undefined,
      },
    });

    return { message: 'Proveedor actualizado exitosamente.', data: updated };
  }

  /**
   * Elimina un proveedor si no posee órdenes de compra emitidas en el histórico comercial.
   *
   * @param {number} id - ID del proveedor.
   * @returns {Promise<Object>} Confirmación de eliminación.
   * @throws {NotFoundException} Si el proveedor no existe.
   * @throws {ConflictException} Si posee órdenes de compra registradas.
   */
  async deleteSupplier(id: number) {
    const existing = await this.prisma.proveedor.findUnique({
      where: { id_proveedor: id },
      include: {
        _count: { select: { proveedor_producto: true, orden_compra: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException(`El proveedor con ID ${id} no existe.`);
    }

    if (existing._count.orden_compra > 0) {
      throw new ConflictException('No se puede eliminar un proveedor con ordenes de compra registradas.');
    }

    await this.prisma.proveedor_producto.deleteMany({ where: { id_proveedor: id } });
    await this.prisma.proveedor.delete({ where: { id_proveedor: id } });

    return { message: 'Proveedor eliminado exitosamente.' };
  }

  /**
   * Lista los productos vinculados a un proveedor específico con sus costos de adquisición.
   *
   * @param {number} supplierId - ID del proveedor.
   * @returns {Promise<Array>} Lista de productos con precios normalizados a número.
   */
  async findSupplierProducts(supplierId: number) {
    await this.ensureSupplierExists(supplierId);

    const products = await this.prisma.proveedor_producto.findMany({
      where: { id_proveedor: supplierId },
      include: {
        producto: {
          select: {
            id_producto: true,
            nombre: true,
            precio_base: true,
            estado: true,
            categoria: { select: { nombre: true } },
          },
        },
      },
      orderBy: { producto: { nombre: 'asc' } },
    });

    return products.map((item: any) => ({
      ...item,
      costo_referencia:
        item.costo_referencia === null ? null : Number(item.costo_referencia),
      producto: {
        ...item.producto,
        precio_base: Number(item.producto.precio_base),
      },
    }));
  }

  /**
   * Vincula un producto del catálogo general a la lista de suministros de un proveedor.
   *
   * @param {number} supplierId - ID del proveedor.
   * @param {CreateSupplierProductDto} dto - ID del producto, costo de referencia y estado de disponibilidad.
   * @returns {Promise<Object>} Registro creado de proveedor-producto.
   * @throws {ConflictException} Si el producto ya está asociado al proveedor.
   */
  async addSupplierProduct(supplierId: number, dto: CreateSupplierProductDto) {
    await this.ensureSupplierExists(supplierId);
    await this.ensureProductExists(dto.id_producto);

    const conflict = await this.prisma.proveedor_producto.findUnique({
      where: {
        id_proveedor_id_producto: {
          id_proveedor: supplierId,
          id_producto: dto.id_producto,
        },
      },
    });

    if (conflict) {
      throw new ConflictException('El producto ya esta asociado a este proveedor.');
    }

    const created = await this.prisma.proveedor_producto.create({
      data: {
        id_proveedor: supplierId,
        id_producto: dto.id_producto,
        costo_referencia: dto.costo_referencia ?? null,
        estado: dto.estado || 'DISPONIBLE',
      },
      include: { producto: true },
    });

    return {
      message: 'Producto asociado al proveedor exitosamente.',
      data: {
        ...created,
        costo_referencia:
          created.costo_referencia === null ? null : Number(created.costo_referencia),
        producto: {
          ...created.producto,
          precio_base: Number(created.producto.precio_base),
        },
      },
    };
  }

  /**
   * Actualiza el costo de referencia pactado o estado de suministro de un producto de este proveedor.
   *
   * @param {number} supplierId - ID del proveedor.
   * @param {number} productId - ID del producto.
   * @param {UpdateSupplierProductDto} dto - Nuevos valores de costo o estado.
   * @returns {Promise<Object>} Relación actualizada.
   * @throws {NotFoundException} Si la asociación no existe.
   */
  async updateSupplierProduct(
    supplierId: number,
    productId: number,
    dto: UpdateSupplierProductDto,
  ) {
    const existing = await this.prisma.proveedor_producto.findUnique({
      where: {
        id_proveedor_id_producto: {
          id_proveedor: supplierId,
          id_producto: productId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('La asociacion proveedor-producto no existe.');
    }

    const updated = await this.prisma.proveedor_producto.update({
      where: {
        id_proveedor_id_producto: {
          id_proveedor: supplierId,
          id_producto: productId,
        },
      },
      data: {
        costo_referencia:
          dto.costo_referencia !== undefined ? dto.costo_referencia : undefined,
        estado: dto.estado !== undefined ? dto.estado : undefined,
      },
      include: { producto: true },
    });

    return {
      message: 'Relacion proveedor-producto actualizada.',
      data: {
        ...updated,
        costo_referencia:
          updated.costo_referencia === null ? null : Number(updated.costo_referencia),
        producto: {
          ...updated.producto,
          precio_base: Number(updated.producto.precio_base),
        },
      },
    };
  }

  /**
   * Desvincula un producto del catálogo de suministro de un proveedor.
   *
   * @param {number} supplierId - ID del proveedor.
   * @param {number} productId - ID del producto.
   * @returns {Promise<Object>} Confirmación de desvinculación.
   * @throws {NotFoundException} Si la asociación no existe.
   */
  async removeSupplierProduct(supplierId: number, productId: number) {
    const existing = await this.prisma.proveedor_producto.findUnique({
      where: {
        id_proveedor_id_producto: {
          id_proveedor: supplierId,
          id_producto: productId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('La asociacion proveedor-producto no existe.');
    }

    await this.prisma.proveedor_producto.delete({
      where: {
        id_proveedor_id_producto: {
          id_proveedor: supplierId,
          id_producto: productId,
        },
      },
    });

    return { message: 'Producto desasociado del proveedor.' };
  }

  /**
   * Consulta las órdenes de compra emitidas aplicando filtros por proveedor, sucursal o estado.
   *
   * @param {QueryPurchaseOrdersDto} query - Criterios de filtrado.
   * @returns {Promise<Array>} Lista de órdenes con totales calculados y variantes incluidas.
   */
  async findPurchaseOrders(query: QueryPurchaseOrdersDto) {
    const where: any = {};
    if (query.id_proveedor) where.id_proveedor = query.id_proveedor;
    if (query.id_sucursal) where.id_sucursal = query.id_sucursal;
    if (query.estado) where.estado = query.estado;

    const orders = await this.prisma.orden_compra.findMany({
      where,
      include: {
        proveedor: { select: { id_proveedor: true, razon_social: true, nit: true } },
        sucursal: { select: { id_sucursal: true, nombre: true } },
        detalle_orden_compra: {
          include: {
            producto_variante: {
              select: {
                id_producto_variante: true,
                sku: true,
                producto: { select: { id_producto: true, nombre: true } },
                talla: { select: { codigo: true } },
                color: { select: { nombre: true } },
              },
            },
            temporada: { select: { id_temporada: true, nombre: true } },
          },
        },
      },
      orderBy: { fecha_orden: 'desc' },
    });

    return orders.map((order: any) => this.mapPurchaseOrder(order));
  }

  /**
   * Obtiene una orden de compra específica con su desglose detallado de ítems y temporadas.
   *
   * @param {number} id - ID de la orden de compra.
   * @returns {Promise<Object>} Orden de compra mapeada con totales monetarios y de unidades.
   * @throws {NotFoundException} Si la orden de compra no existe.
   */
  async findPurchaseOrderById(id: number) {
    const order = await this.prisma.orden_compra.findUnique({
      where: { id_orden_compra: id },
      include: {
        proveedor: { select: { id_proveedor: true, razon_social: true, nit: true } },
        sucursal: { select: { id_sucursal: true, nombre: true } },
        detalle_orden_compra: {
          include: {
            producto_variante: {
              include: {
                producto: { select: { id_producto: true, nombre: true } },
                talla: { select: { codigo: true } },
                color: { select: { nombre: true } },
              },
            },
            temporada: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`La orden de compra con ID ${id} no existe.`);
    }

    return this.mapPurchaseOrder(order);
  }

  /**
   * Genera una nueva orden de compra para un proveedor y sucursal destino:
   * 1. Valida existencia de proveedor, sucursal, variantes y temporadas.
   * 2. Comprueba que la fecha estimada de entrega no sea en el pasado.
   * 3. Registra en transacción la cabecera y el array de detalles con costo unitario pactado.
   * Nota: Crear la orden NO incrementa el stock; el inventario solo sube al recibir físicamente el pedido.
   *
   * @param {CreatePurchaseOrderDto} dto - Datos de la orden y líneas de detalle.
   * @returns {Promise<Object>} Orden de compra generada con estado inicial 'pendiente'.
   */
  async createPurchaseOrder(dto: CreatePurchaseOrderDto) {
    await this.ensureSupplierExists(dto.id_proveedor);
    await this.ensureBranchExists(dto.id_sucursal);
    this.validateEstimatedDate(dto.fecha_estimada);

    const variantIds = [...new Set(dto.detalles.map((detail) => detail.id_producto_variante))];
    const seasonIds = [...new Set(dto.detalles.map((detail) => detail.id_temporada))];

    const [variants, seasons] = await Promise.all([
      this.prisma.producto_variante.findMany({
        where: { id_producto_variante: { in: variantIds } },
        select: { id_producto_variante: true },
      }),
      this.prisma.temporada.findMany({
        where: { id_temporada: { in: seasonIds } },
        select: { id_temporada: true },
      }),
    ]);

    if (variants.length !== variantIds.length) {
      throw new BadRequestException('Una o mas variantes no existen.');
    }
    if (seasons.length !== seasonIds.length) {
      throw new BadRequestException('Una o mas temporadas no existen.');
    }

    const created = await this.prisma.$transaction(async (tx: any) => {
      const [orderMax, detailMax] = await Promise.all([
        tx.orden_compra.aggregate({ _max: { id_orden_compra: true } }),
        tx.detalle_orden_compra.aggregate({ _max: { id_detalle_orden_compra: true } }),
      ]);

      const orderId = (orderMax._max.id_orden_compra || 0) + 1;
      let detailId = (detailMax._max.id_detalle_orden_compra || 0) + 1;

      return tx.orden_compra.create({
        data: {
          id_orden_compra: orderId,
          fecha_estimada: dto.fecha_estimada ? new Date(dto.fecha_estimada) : null,
          estado: 'pendiente',
          observaciones: dto.observaciones?.trim() || null,
          id_proveedor: dto.id_proveedor,
          id_sucursal: dto.id_sucursal,
          detalle_orden_compra: {
            create: dto.detalles.map((detail) => ({
              id_detalle_orden_compra: detailId++,
              id_producto_variante: detail.id_producto_variante,
              cantidad: detail.cantidad,
              costo_unitario: detail.costo_unitario,
              id_temporada: detail.id_temporada,
            })),
          },
        },
        include: {
          proveedor: { select: { id_proveedor: true, razon_social: true, nit: true } },
          sucursal: { select: { id_sucursal: true, nombre: true } },
          detalle_orden_compra: {
            include: {
              producto_variante: {
                include: {
                  producto: { select: { id_producto: true, nombre: true } },
                  talla: { select: { codigo: true } },
                  color: { select: { nombre: true } },
                },
              },
              temporada: true,
            },
          },
        },
      });
    });

    return {
      message: 'Orden de compra creada exitosamente. Crear la orden no incrementa el stock.',
      data: this.mapPurchaseOrder(created),
    };
  }

  /**
   * Cambia el estado de una orden de compra existente (pendiente, en_transito, cancelada),
   * impidiendo modificar órdenes que ya fueron recibidas en almacén.
   *
   * @param {number} id - ID de la orden de compra.
   * @param {'pendiente' | 'en_transito' | 'cancelada'} estado - Nuevo estado.
   * @returns {Promise<Object>} Orden actualizada.
   * @throws {NotFoundException} Si la orden no existe.
   * @throws {ConflictException} Si la orden ya se encuentra en estado 'recibida'.
   */
  async updatePurchaseOrderStatus(
    id: number,
    estado: 'pendiente' | 'en_transito' | 'cancelada',
  ) {
    const existing = await this.prisma.orden_compra.findUnique({
      where: { id_orden_compra: id },
    });

    if (!existing) {
      throw new NotFoundException(`La orden de compra con ID ${id} no existe.`);
    }

    if (existing.estado === 'recibida') {
      throw new ConflictException('No se puede cambiar el estado de una orden ya recibida.');
    }

    const updated = await this.prisma.orden_compra.update({
      where: { id_orden_compra: id },
      data: { estado },
    });

    return { message: `Orden actualizada a estado "${estado}".`, data: updated };
  }

  /**
   * Ejecuta la recepción física de mercancía amparada en una orden de compra:
   * 1. Valida que la orden no esté cancelada ni haya sido recibida con anterioridad.
   * 2. Verifica la identidad del empleado responsable del ingreso a bodega.
   * 3. Dentro de una transacción ACID:
   *    - Itera cada variante en el detalle de la orden.
   *    - Si la variante ya tiene inventario en la sucursal, suma la cantidad recibida.
   *    - Si no existe el registro de inventario, lo inicializa con stock disponible.
   *    - Registra un movimiento de inventario de tipo 'entrada' por motivo de recepción.
   *    - Marca la orden de compra como 'recibida' con su respectiva marca de tiempo.
   *
   * @param {number} id - ID de la orden de compra.
   * @param {ReceivePurchaseOrderDto} dto - ID del empleado responsable y fecha de recepción opcional.
   * @returns {Promise<Object>} Orden de compra recibida con inventario actualizado.
   * @throws {NotFoundException} Si la orden no existe.
   * @throws {ConflictException} Si la orden ya fue recibida o está cancelada.
   * @throws {BadRequestException} Si no se especifica un empleado válido.
   */
  async receivePurchaseOrder(id: number, dto: ReceivePurchaseOrderDto) {
    const order = await this.prisma.orden_compra.findUnique({
      where: { id_orden_compra: id },
      include: { detalle_orden_compra: true },
    });

    if (!order) {
      throw new NotFoundException(`La orden de compra con ID ${id} no existe.`);
    }

    if (order.estado === 'recibida' || order.fecha_recepcion) {
      throw new ConflictException('La orden de compra ya fue recibida previamente.');
    }

    if (order.estado === 'cancelada') {
      throw new ConflictException('No se puede recibir una orden cancelada.');
    }

    if (!dto.id_empleado_responsable) {
      throw new BadRequestException('La recepcion requiere un empleado responsable para registrar inventario.');
    }

    const employee = await this.prisma.empleado.findUnique({
      where: { id_empleado: dto.id_empleado_responsable },
    });
    if (!employee) {
      throw new BadRequestException('El empleado responsable no existe.');
    }

    const received = await this.prisma.$transaction(async (tx: any) => {
      const [inventoryMax, movementMax] = await Promise.all([
        tx.inventario_sucursal.aggregate({ _max: { id_inventario_sucursal: true } }),
        tx.movimiento_inventario.aggregate({ _max: { id_movimiento_inventario: true } }),
      ]);
      let nextInventoryId = (inventoryMax._max.id_inventario_sucursal || 0) + 1;
      let nextMovementId = (movementMax._max.id_movimiento_inventario || 0) + 1;

      for (const detail of order.detalle_orden_compra) {
        const inventory = await tx.inventario_sucursal.findUnique({
          where: {
            id_sucursal_id_producto_variante: {
              id_sucursal: order.id_sucursal,
              id_producto_variante: detail.id_producto_variante,
            },
          },
        });

        if (inventory) {
          await tx.inventario_sucursal.update({
            where: { id_inventario_sucursal: inventory.id_inventario_sucursal },
            data: {
              stock_disponible: inventory.stock_disponible + detail.cantidad,
              ultima_actualizacion: new Date(),
            },
          });
        } else {
          await tx.inventario_sucursal.create({
            data: {
              id_inventario_sucursal: nextInventoryId++,
              id_sucursal: order.id_sucursal,
              id_producto_variante: detail.id_producto_variante,
              stock_disponible: detail.cantidad,
              stock_reservado: 0,
              stock_minimo: 0,
            },
          });
        }

        await tx.movimiento_inventario.create({
          data: {
            id_movimiento_inventario: nextMovementId++,
            tipo_movimiento: 'entrada',
            cantidad: detail.cantidad,
            motivo: `Recepcion de orden de compra ${id}`,
            id_producto_variante: detail.id_producto_variante,
            id_sucursal: order.id_sucursal,
            id_empleado: dto.id_empleado_responsable,
          },
        });
      }

      return tx.orden_compra.update({
        where: { id_orden_compra: id },
        data: {
          estado: 'recibida',
          fecha_recepcion: dto.fecha_recepcion ? new Date(dto.fecha_recepcion) : new Date(),
        },
        include: {
          proveedor: { select: { id_proveedor: true, razon_social: true, nit: true } },
          sucursal: { select: { id_sucursal: true, nombre: true } },
          detalle_orden_compra: {
            include: {
              producto_variante: {
                include: {
                  producto: { select: { id_producto: true, nombre: true } },
                  talla: { select: { codigo: true } },
                  color: { select: { nombre: true } },
                },
              },
              temporada: true,
            },
          },
        },
      });
    });

    return {
      message: 'Orden recibida e inventario actualizado exitosamente.',
      data: this.mapPurchaseOrder(received),
    };
  }

  /**
   * Helper de validación que asegura la existencia de un proveedor en la base de datos.
   */
  private async ensureSupplierExists(id: number) {
    const supplier = await this.prisma.proveedor.findUnique({ where: { id_proveedor: id } });
    if (!supplier) {
      throw new NotFoundException(`El proveedor con ID ${id} no existe.`);
    }
    return supplier;
  }

  /**
   * Helper de validación que asegura la existencia de un producto base en catálogo.
   */
  private async ensureProductExists(id: number) {
    const product = await this.prisma.producto.findUnique({ where: { id_producto: id } });
    if (!product) {
      throw new BadRequestException(`El producto con ID ${id} no existe.`);
    }
    return product;
  }

  /**
   * Helper de validación que asegura la existencia de una sucursal destino.
   */
  private async ensureBranchExists(id: number) {
    const branch = await this.prisma.sucursal.findUnique({ where: { id_sucursal: id } });
    if (!branch) {
      throw new BadRequestException(`La sucursal con ID ${id} no existe.`);
    }
    return branch;
  }

  /**
   * Helper de validación de fechas que garantiza que la fecha estimada no esté en el pasado.
   */
  private validateEstimatedDate(fechaEstimada?: string) {
    if (!fechaEstimada) return;

    const estimated = new Date(fechaEstimada);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (estimated < today) {
      throw new BadRequestException('La fecha estimada no puede ser anterior a la fecha actual.');
    }
  }

  /**
   * Helper de mapeo que normaliza los números decimales y calcula el total monetario estimado
   * y la suma total de unidades físicas de una orden de compra.
   */
  private mapPurchaseOrder(order: any) {
    const detalles = order.detalle_orden_compra || [];
    const total = detalles.reduce(
      (acc: number, detail: any) => acc + detail.cantidad * Number(detail.costo_unitario),
      0,
    );

    return {
      ...order,
      detalle_orden_compra: detalles.map((detail: any) => ({
        ...detail,
        costo_unitario: Number(detail.costo_unitario),
      })),
      total_estimado: total,
      total_unidades: detalles.reduce((acc: number, detail: any) => acc + detail.cantidad, 0),
    };
  }
}
