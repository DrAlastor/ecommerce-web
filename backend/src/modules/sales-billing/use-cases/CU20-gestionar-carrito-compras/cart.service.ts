import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { AddToCartDto, SyncCartDto, UpdateCartItemDto } from '../../cart/dto/cart.dto.js';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resuelve el ID del cliente para el usuario autenticado
   */
  public async resolveClientId(user: any): Promise<number> {
    const userId = Number(user?.id_usuario ?? user?.sub);
    if (!userId) {
      throw new ForbiddenException('Usuario no identificado en la sesión.');
    }

    const cliente = await this.prisma.cliente.findUnique({
      where: { id_cliente: userId },
    });

    if (cliente) {
      return cliente.id_cliente;
    }

    // Si es un usuario registrado sin perfil de cliente, se crea automáticamente
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: userId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado en la base de datos.');
    }

    const emailName = usuario.email.split('@')[0] || 'Cliente';
    const nuevoCliente = await this.prisma.cliente.create({
      data: {
        id_cliente: userId,
        nombre: emailName,
        apellido: 'Fashion',
      },
    });

    return nuevoCliente.id_cliente;
  }

  /**
   * Obtiene o inicializa la cabecera del carrito activo del cliente
   */
  public async getOrCreateActiveCart(idCliente: number) {
    const existing = await this.prisma.carrito.findUnique({
      where: { id_cliente: idCliente },
    });

    if (existing) {
      return existing;
    }

    const maxRes = await this.prisma.carrito.aggregate({
      _max: { id_carrito: true },
    });
    const nextId = (maxRes._max.id_carrito || 0) + 1;

    return this.prisma.carrito.create({
      data: {
        id_carrito: nextId,
        id_cliente: idCliente,
        actualizado: new Date(),
      },
    });
  }

  /**
   * Calcula el precio vigente y promoción activa para una variante
   */
  public calculateLivePrice(producto: any, variante: any) {
    const now = new Date();
    const precioBase = Number(producto.precio_base);
    const precioAdicional = Number(variante.precio_adicional || 0);
    const precioUnitario = Math.round((precioBase + precioAdicional) * 100) / 100;

    // Buscar promoción activa asociada al producto
    const promoItem = (producto.promocion_producto || []).find((pp: any) => {
      const p = pp.promocion;
      if (!p || p.estado !== 'activo') return false;
      const ini = new Date(p.fecha_inicio);
      const fin = new Date(p.fecha_fin);
      return ini <= now && fin >= now;
    });

    let precioFinal = precioUnitario;
    let tieneDescuento = false;
    let porcentajeDescuento = 0;
    let promocionInfo: any = null;

    if (promoItem && promoItem.promocion) {
      const p = promoItem.promocion;
      tieneDescuento = true;
      if (p.tipo_descuento === 'porcentaje') {
        porcentajeDescuento = Number(p.valor_descuento);
        precioFinal = Math.round(precioUnitario * (1 - porcentajeDescuento / 100) * 100) / 100;
      } else {
        const montoDesc = Number(p.valor_descuento);
        precioFinal = Math.max(0, Math.round((precioUnitario - montoDesc) * 100) / 100);
        porcentajeDescuento = precioUnitario > 0 ? Math.round((montoDesc / precioUnitario) * 100) : 0;
      }

      promocionInfo = {
        id_promocion: p.id_promocion,
        nombre: p.nombre,
        tipo_descuento: p.tipo_descuento,
        valor_descuento: Number(p.valor_descuento),
        porcentaje: porcentajeDescuento,
      };
    }

    return {
      precioOriginal: precioUnitario,
      precioFinal,
      tieneDescuento,
      porcentajeDescuento,
      promocion: promocionInfo,
    };
  }

  /**
   * Obtiene el carrito activo del cliente con validación en tiempo real de precios y stock
   */
  public async getCart(user: any) {
    const idCliente = await this.resolveClientId(user);
    const cart = await this.getOrCreateActiveCart(idCliente);

    const itemsRaw = await this.prisma.item_carrito.findMany({
      where: { id_carrito: cart.id_carrito },
      include: {
        producto_variante: {
          include: {
            producto: {
              include: {
                imagen_producto: {
                  orderBy: { es_principal: 'desc' },
                },
                promocion_producto: {
                  include: {
                    promocion: true,
                  },
                },
              },
            },
            talla: true,
            color: true,
            inventario_sucursal: true,
          },
        },
      },
      orderBy: { id_item_carrito: 'asc' },
    });

    let subtotal = 0;
    let ahorroTotal = 0;
    let cantidadTotalArticulos = 0;

    const items = itemsRaw.map((it) => {
      const v = it.producto_variante;
      const prod = v.producto;

      // Calcular stock global disponible en sucursales
      const stockDisponible = (v.inventario_sucursal || []).reduce(
        (sum, inv) => sum + (inv.stock_disponible || 0),
        0,
      );

      // Calcular precio en tiempo real
      const pricing = this.calculateLivePrice(prod, v);
      const subtotalItem = Math.round(pricing.precioFinal * it.cantidad * 100) / 100;
      const subtotalOriginal = Math.round(pricing.precioOriginal * it.cantidad * 100) / 100;

      subtotal += subtotalItem;
      ahorroTotal += Math.max(0, subtotalOriginal - subtotalItem);
      cantidadTotalArticulos += it.cantidad;

      // Imagen
      const img = prod.imagen_producto?.[0]?.url || v.imagen_url || null;

      return {
        id_item_carrito: it.id_item_carrito,
        id_producto_variante: v.id_producto_variante,
        id_producto: prod.id_producto,
        nombre_producto: prod.nombre,
        sku: v.sku,
        talla: v.talla?.codigo || 'N/A',
        color: {
          nombre: v.color?.nombre || 'N/A',
          hex: v.color?.codigo_hex || '#000000',
        },
        imagen: img,
        cantidad: it.cantidad,
        stock_disponible: stockDisponible,
        disponible: stockDisponible >= it.cantidad,
        precio_unitario_registrado: Number(it.precio),
        precio_original: pricing.precioOriginal,
        precio_vigente: pricing.precioFinal,
        tiene_descuento: pricing.tieneDescuento,
        porcentaje_descuento: pricing.porcentajeDescuento,
        promocion: pricing.promocion,
        subtotal: subtotalItem,
      };
    });

    subtotal = Math.round(subtotal * 100) / 100;
    ahorroTotal = Math.round(ahorroTotal * 100) / 100;

    return {
      id_carrito: cart.id_carrito,
      id_cliente: idCliente,
      actualizado: cart.actualizado,
      items,
      cantidad_articulos: cantidadTotalArticulos,
      subtotal,
      ahorro_total: ahorroTotal,
      total: subtotal,
      todos_disponibles: items.every((i) => i.disponible),
    };
  }

  /**
   * Agrega un producto variante al carrito
   */
  public async addToCart(user: any, dto: AddToCartDto, _ip?: string) {
    const idCliente = await this.resolveClientId(user);

    let variantId = dto.id_producto_variante;

    // Si no se proporcionó id_producto_variante pero sí id_producto, buscar su primera variante activa
    if (!variantId && dto.id_producto) {
      const firstVar = await this.prisma.producto_variante.findFirst({
        where: { id_producto: dto.id_producto, estado: 'activo' },
        orderBy: { id_producto_variante: 'asc' },
      });
      if (firstVar) {
        variantId = firstVar.id_producto_variante;
      }
    }

    if (!variantId) {
      throw new BadRequestException('Se requiere especificar la variante o el producto para agregar a la bolsa.');
    }

    // 1. Validar existencia de la variante y producto
    const variante = await this.prisma.producto_variante.findUnique({
      where: { id_producto_variante: variantId },
      include: {
        producto: {
          include: {
            promocion_producto: {
              include: { promocion: true },
            },
          },
        },
        inventario_sucursal: true,
      },
    });

    if (!variante || variante.estado !== 'activo') {
      throw new NotFoundException('La prenda seleccionada no cuenta con existencias activas.');
    }

    if (!variante.producto || variante.producto.estado !== 'activo') {
      throw new BadRequestException('El producto seleccionado no está disponible.');
    }

    // 2. Validar disponibilidad global de stock
    const stockDisponibleGlobal = (variante.inventario_sucursal || []).reduce(
      (sum, inv) => sum + (inv.stock_disponible || 0),
      0,
    );

    if (stockDisponibleGlobal <= 0) {
      throw new BadRequestException('La variante seleccionada no cuenta con existencias disponibles.');
    }

    // 3. Obtener o crear carrito activo
    const cart = await this.getOrCreateActiveCart(idCliente);

    // 4. Verificar si ya existe el ítem en el carrito
    const existingItem = await this.prisma.item_carrito.findUnique({
      where: {
        id_carrito_id_producto_variante: {
          id_carrito: cart.id_carrito,
          id_producto_variante: variantId,
        },
      },
    });

    const pricing = this.calculateLivePrice(variante.producto, variante);

    if (existingItem) {
      const nuevaCantidad = existingItem.cantidad + dto.cantidad;
      if (nuevaCantidad > stockDisponibleGlobal) {
        throw new BadRequestException(
          `Solo hay ${stockDisponibleGlobal} unidades disponibles en stock (ya tienes ${existingItem.cantidad} en tu bolsa).`,
        );
      }

      await this.prisma.item_carrito.update({
        where: { id_item_carrito: existingItem.id_item_carrito },
        data: {
          cantidad: nuevaCantidad,
          precio: pricing.precioFinal,
        },
      });
    } else {
      if (dto.cantidad > stockDisponibleGlobal) {
        throw new BadRequestException(
          `Solo hay ${stockDisponibleGlobal} unidades disponibles en stock para esta variante.`,
        );
      }

      const maxItemRes = await this.prisma.item_carrito.aggregate({
        _max: { id_item_carrito: true },
      });
      const nextItemId = (maxItemRes._max.id_item_carrito || 0) + 1;

      await this.prisma.item_carrito.create({
        data: {
          id_item_carrito: nextItemId,
          id_carrito: cart.id_carrito,
          id_producto_variante: variantId,
          cantidad: dto.cantidad,
          precio: pricing.precioFinal,
        },
      });
    }

    // Actualizar marca de tiempo del carrito
    await this.prisma.carrito.update({
      where: { id_carrito: cart.id_carrito },
      data: { actualizado: new Date() },
    });

    return this.getCart(user);
  }

  /**
   * Modifica la cantidad de un ítem existente en el carrito
   */
  public async updateItemQuantity(user: any, idItem: number, dto: UpdateCartItemDto) {
    const idCliente = await this.resolveClientId(user);
    const cart = await this.getOrCreateActiveCart(idCliente);

    const item = await this.prisma.item_carrito.findUnique({
      where: { id_item_carrito: idItem },
      include: {
        producto_variante: {
          include: {
            producto: {
              include: {
                promocion_producto: {
                  include: { promocion: true },
                },
              },
            },
            inventario_sucursal: true,
          },
        },
      },
    });

    if (!item || item.id_carrito !== cart.id_carrito) {
      throw new NotFoundException('El artículo no existe en tu carrito de compras.');
    }

    const variante = item.producto_variante;
    const stockDisponibleGlobal = (variante.inventario_sucursal || []).reduce(
      (sum, inv) => sum + (inv.stock_disponible || 0),
      0,
    );

    if (dto.cantidad > stockDisponibleGlobal) {
      throw new BadRequestException(
        `Solo hay ${stockDisponibleGlobal} unidades disponibles en inventario para esta variante.`,
      );
    }

    const pricing = this.calculateLivePrice(variante.producto, variante);

    await this.prisma.item_carrito.update({
      where: { id_item_carrito: idItem },
      data: {
        cantidad: dto.cantidad,
        precio: pricing.precioFinal,
      },
    });

    await this.prisma.carrito.update({
      where: { id_carrito: cart.id_carrito },
      data: { actualizado: new Date() },
    });

    return this.getCart(user);
  }

  /**
   * Elimina un ítem del carrito
   */
  public async removeItem(user: any, idItem: number) {
    const idCliente = await this.resolveClientId(user);
    const cart = await this.getOrCreateActiveCart(idCliente);

    const item = await this.prisma.item_carrito.findUnique({
      where: { id_item_carrito: idItem },
    });

    if (!item || item.id_carrito !== cart.id_carrito) {
      throw new NotFoundException('El artículo no existe en tu carrito.');
    }

    await this.prisma.item_carrito.delete({
      where: { id_item_carrito: idItem },
    });

    await this.prisma.carrito.update({
      where: { id_carrito: cart.id_carrito },
      data: { actualizado: new Date() },
    });

    return this.getCart(user);
  }

  /**
   * Vacía por completo el carrito del cliente
   */
  public async clearCart(user: any) {
    const idCliente = await this.resolveClientId(user);
    const cart = await this.getOrCreateActiveCart(idCliente);

    await this.prisma.item_carrito.deleteMany({
      where: { id_carrito: cart.id_carrito },
    });

    await this.prisma.carrito.update({
      where: { id_carrito: cart.id_carrito },
      data: { actualizado: new Date() },
    });

    return this.getCart(user);
  }

  /**
   * Sincroniza ítems de sesión local/invitado con el carrito persistente del cliente
   */
  public async syncGuestCart(user: any, dto: SyncCartDto) {
    if (!dto.items || dto.items.length === 0) {
      return this.getCart(user);
    }

    for (const item of dto.items) {
      try {
        await this.addToCart(user, {
          id_producto_variante: item.id_producto_variante,
          cantidad: item.cantidad,
        });
      } catch {
        // Si algún ítem se quedó sin stock o no existe, se continúa con los demás
      }
    }

    return this.getCart(user);
  }
}
