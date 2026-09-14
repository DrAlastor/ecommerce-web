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

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

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

  private async ensureSupplierExists(id: number) {
    const supplier = await this.prisma.proveedor.findUnique({ where: { id_proveedor: id } });
    if (!supplier) {
      throw new NotFoundException(`El proveedor con ID ${id} no existe.`);
    }
    return supplier;
  }

  private async ensureProductExists(id: number) {
    const product = await this.prisma.producto.findUnique({ where: { id_producto: id } });
    if (!product) {
      throw new BadRequestException(`El producto con ID ${id} no existe.`);
    }
    return product;
  }

  private async ensureBranchExists(id: number) {
    const branch = await this.prisma.sucursal.findUnique({ where: { id_sucursal: id } });
    if (!branch) {
      throw new BadRequestException(`La sucursal con ID ${id} no existe.`);
    }
    return branch;
  }

  private validateEstimatedDate(fechaEstimada?: string) {
    if (!fechaEstimada) return;

    const estimated = new Date(fechaEstimada);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (estimated < today) {
      throw new BadRequestException('La fecha estimada no puede ser anterior a la fecha actual.');
    }
  }

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
