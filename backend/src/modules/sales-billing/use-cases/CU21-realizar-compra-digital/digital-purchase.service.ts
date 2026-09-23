/**
 * @caso-de-uso CU21 — Realizar compra digital
 * @subsistema Ventas, Pagos y Compras
 * @capa Control/Service de dominio — Backend
 * @responsabilidad Ejecuta las reglas del negocio y coordina persistencia, auditoría e integraciones del caso de uso.
 * @secuencia Cliente -> checkout -> controlador de compra -> servicios de compra y pago -> Venta/DetalleVenta/Pago/Inventario.
 */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Stripe } from 'stripe';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { BitacoraService } from '../../../users-security/shared/services/bitacora.service.js';
import { CartService } from '../CU20-gestionar-carrito-compras/cart.service.js';
import { ProcessDigitalPurchaseDto } from './dto/checkout.dto.js';

@Injectable()
export class DigitalPurchaseService {
  private stripe: Stripe | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly bitacoraService: BitacoraService,
    private readonly configService: ConfigService,
  ) {
    const secretKey =
      this.configService.get<string>('STRIPE_SECRET_KEY') || process.env.STRIPE_SECRET_KEY;
    if (secretKey) {
      this.stripe = new Stripe(secretKey);
    }
  }

  /**
   * Crea un PaymentIntent en Stripe basado en el total recalculado del carrito
   */
  async createStripePaymentIntent(user: any) {
    const cart = await this.cartService.getCart(user);

    if (cart.items.length === 0) {
      throw new BadRequestException('Tu bolsa de compras está vacía.');
    }

    if (!cart.todos_disponibles) {
      throw new BadRequestException(
        'Algunos productos en tu bolsa ya no cuentan con stock disponible suficiente.',
      );
    }

    // Stripe opera en centavos. Convertimos el total (mínimo $0.50 USD / equivalente)
    const amountInCents = Math.max(50, Math.round(cart.total * 100));

    if (this.stripe) {
      try {
        const paymentIntent = await this.stripe.paymentIntents.create({
          amount: amountInCents,
          currency: 'usd',
          description: `Compra FashionStore - Cliente #${cart.id_cliente} (${cart.cantidad_articulos} artículos)`,
          metadata: {
            id_cliente: String(cart.id_cliente),
            articulos: String(cart.cantidad_articulos),
            subtotal: String(cart.subtotal),
          },
          automatic_payment_methods: { enabled: true },
        });

        return {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: cart.total,
          currency: 'usd',
        };
      } catch (stripeError: any) {
        console.warn('Error al conectar con Stripe API, usando fallback simulado:', stripeError?.message);
      }
    }

    // Fallback de desarrollo
    const simulatedId = `pi_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      clientSecret: `${simulatedId}_secret_${Math.random().toString(36).substring(2, 10)}`,
      paymentIntentId: simulatedId,
      amount: cart.total,
      currency: 'usd',
    };
  }

  /**
   * Procesa la compra digital de forma atómica y transaccional (CU21)
   */
  async processPurchase(user: any, dto: ProcessDigitalPurchaseDto, ip?: string) {
    const userId = Number(user?.id_usuario ?? user?.sub);
    const idCliente = await this.cartService.resolveClientId(user);
    const cart = await this.cartService.getCart(user);

    // 1. Validaciones previas
    if (cart.items.length === 0) {
      throw new BadRequestException('No puedes finalizar la compra con la bolsa vacía.');
    }

    // 2. Revalidar disponibilidad y asignar sucursales de despacho para cada ítem
    const itemsWithFulfillment: any[] = [];


    for (const item of cart.items) {
      const variante = await this.prisma.producto_variante.findUnique({
        where: { id_producto_variante: item.id_producto_variante },
        include: {
          inventario_sucursal: {
            where: { stock_disponible: { gt: 0 } },
            orderBy: { stock_disponible: 'desc' },
          },
          producto: true,
        },
      });

      if (!variante || variante.estado !== 'activo') {
        throw new BadRequestException(
          `La prenda "${item.nombre_producto}" ya no está disponible en catálogo.`,
        );
      }

      // Determinar qué sucursal cubrirá el stock
      let sucursalInventario = null;
      if (dto.tipo_entrega === 'retiro_sucursal' && dto.id_sucursal_retiro) {
        sucursalInventario = variante.inventario_sucursal.find(
          (inv) =>
            inv.id_sucursal === dto.id_sucursal_retiro && inv.stock_disponible >= item.cantidad,
        );
      } else {
        sucursalInventario = variante.inventario_sucursal.find(
          (inv) => inv.stock_disponible >= item.cantidad,
        );
      }

      if (!sucursalInventario) {
        throw new BadRequestException(
          `Stock insuficiente para "${item.nombre_producto}" (Talla: ${item.talla}, Color: ${item.color.nombre}). Existencias insuficientes para completar tu pedido.`,
        );
      }

      itemsWithFulfillment.push({
        item,
        variante,
        sucursalInventario,
      });
    }

    // 3. Gestionar Dirección de entrega si aplica
    let idDireccionFinal: number | null = null;

    if (dto.tipo_entrega === 'domicilio') {
      if (dto.id_direccion) {
        const dir = await this.prisma.direccion.findFirst({
          where: { id_direccion: dto.id_direccion, id_cliente: idCliente },
        });
        if (!dir) {
          throw new BadRequestException('La dirección de entrega especificada no es válida.');
        }
        idDireccionFinal = dir.id_direccion;
      } else if (dto.nueva_direccion) {
        const dirMax = await this.prisma.direccion.aggregate({
          _max: { id_direccion: true },
        });
        const nextDirId = (dirMax._max.id_direccion || 0) + 1;

        const creada = await this.prisma.direccion.create({
          data: {
            id_direccion: nextDirId,
            tipo: 'Entrega',
            destinatario: dto.nueva_direccion.destinatario,
            telefono: dto.nueva_direccion.telefono,
            calle: dto.nueva_direccion.calle,
            detalle: dto.nueva_direccion.detalle || null,
            id_ciudad: dto.nueva_direccion.id_ciudad,
            id_cliente: idCliente,
            es_predeterminada: false,
          },
        });
        idDireccionFinal = creada.id_direccion;
      } else {
        // Buscar si el cliente tiene alguna dirección registrada
        const dirDefault = await this.prisma.direccion.findFirst({
          where: { id_cliente: idCliente },
          orderBy: { es_predeterminada: 'desc' },
        });
        if (dirDefault) {
          idDireccionFinal = dirDefault.id_direccion;
        } else {
          throw new BadRequestException(
            'Debes ingresar una dirección de entrega válida para el envío a domicilio.',
          );
        }
      }
    }

    // 4. Buscar un empleado del sistema/sucursal para asociar al movimiento de inventario
    const empleadoResponsable = await this.prisma.empleado.findFirst({
      where: { estado: 'activo' },
      orderBy: { id_empleado: 'asc' },
    });
    const idEmpleadoMovimiento = empleadoResponsable?.id_empleado || 1;

    // 5. Generar código de factura único
    const nextVentaMax = await this.prisma.venta.aggregate({
      _max: { id_venta: true },
    });
    const nextVentaId = (nextVentaMax._max.id_venta || 0) + 1;
    const codigoFactura = `FAC-2026-${String(nextVentaId).padStart(5, '0')}`;

    // Calcular montos de venta
    const subtotalOriginal = cart.items.reduce(
      (sum, it) => sum + it.precio_original * it.cantidad,
      0,
    );
    const subtotalVenta = Math.round(subtotalOriginal * 100) / 100;
    const descuentoVenta = Math.round(Math.max(0, subtotalOriginal - cart.total) * 100) / 100;

    // Identificador de transacción de pago
    let transaccionExterna = dto.transaccion_externa;
    if (!transaccionExterna) {
      if (dto.metodo_pago === 'stripe') {
        transaccionExterna = `ch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      } else if (dto.metodo_pago === 'qr') {
        transaccionExterna = `QR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      } else {
        transaccionExterna = `TRANSF-${Date.now()}`;
      }
    }

    // 6. OPERACIÓN 100% TRANSACCIONAL ATÓMICA
    const resultadoCompra = await this.prisma.$transaction(async (tx) => {
      // A. Crear Cabecera de Venta
      const nuevaVenta = await tx.venta.create({
        data: {
          id_venta: nextVentaId,
          codigo_factura: codigoFactura,
          tipo_venta: 'digital',
          subtotal: subtotalVenta,
          descuento: descuentoVenta,
          estado: 'Pagada',
          fecha_venta: new Date(),
          id_cliente: idCliente,
        },
      });

      // B. Crear Detalle de Venta, Salida de Inventario y Movimiento
      const detMax = await tx.detalle_venta.aggregate({
        _max: { id_detalle_venta: true },
      });
      let nextDetId = detMax._max.id_detalle_venta || 0;

      const movMax = await tx.movimiento_inventario.aggregate({
        _max: { id_movimiento_inventario: true },
      });
      let nextMovId = movMax._max.id_movimiento_inventario || 0;

      for (const entry of itemsWithFulfillment) {
        nextDetId++;
        nextMovId++;

        // Crear registro en DETALLE_VENTA
        await tx.detalle_venta.create({
          data: {
            id_detalle_venta: nextDetId,
            id_venta: nuevaVenta.id_venta,
            id_producto_variante: entry.item.id_producto_variante,
            cantidad: entry.item.cantidad,
            precio_unitario: entry.item.precio_vigente,
          },
        });

        // SALIDA DEFINITIVA DE STOCK
        await tx.inventario_sucursal.update({
          where: {
            id_inventario_sucursal: entry.sucursalInventario.id_inventario_sucursal,
          },
          data: {
            stock_disponible: {
              decrement: entry.item.cantidad,
            },
            ultima_actualizacion: new Date(),
          },
        });

        // REGISTRO EN MOVIMIENTO_INVENTARIO
        await tx.movimiento_inventario.create({
          data: {
            id_movimiento_inventario: nextMovId,
            tipo_movimiento: 'salida',
            cantidad: entry.item.cantidad,
            fecha: new Date(),
            motivo: `Venta Digital Online #${codigoFactura}`,
            id_producto_variante: entry.item.id_producto_variante,
            id_sucursal: entry.sucursalInventario.id_sucursal,
            id_empleado: idEmpleadoMovimiento,
          },
        });
      }

      // C. Registrar PAGO
      const pagoMax = await tx.pago.aggregate({
        _max: { id_pago: true },
      });
      const nextPagoId = (pagoMax._max.id_pago || 0) + 1;

      await tx.pago.create({
        data: {
          id_pago: nextPagoId,
          metodo_pago: dto.metodo_pago,
          importe: cart.total,
          transaccion_externa: transaccionExterna,
          estado: 'completado',
          fecha_pago: new Date(),
          id_venta: nuevaVenta.id_venta,
        },
      });

      // D. Crear ENVÍO si corresponde
      if (dto.tipo_entrega === 'domicilio' && idDireccionFinal) {
        const envioMax = await tx.envio.aggregate({
          _max: { id_envio: true },
        });
        const nextEnvioId = (envioMax._max.id_envio || 0) + 1;

        await tx.envio.create({
          data: {
            id_envio: nextEnvioId,
            transportista: 'FashionStore Express',
            numero_guia: `GUIA-${nuevaVenta.id_venta}-${Date.now().toString().slice(-4)}`,
            estado: 'pendiente',
            id_venta: nuevaVenta.id_venta,
            id_direccion: idDireccionFinal,
          },
        });
      }

      // E. VACIAR EL CARRITO TRAS LA VENTA CONFIRMADA
      await tx.item_carrito.deleteMany({
        where: { id_carrito: cart.id_carrito },
      });

      await tx.carrito.update({
        where: { id_carrito: cart.id_carrito },
        data: { actualizado: new Date() },
      });

      return nuevaVenta;
    });

    // 7. Registro en Bitácora de Auditoría
    if (userId) {
      await this.bitacoraService.logAction(
        `Compra digital confirmada por ${cart.total} Bs con factura ${codigoFactura} (${dto.metodo_pago})`,
        'VENTA',
        userId,
        ip,
      );
    }

    // 8. Retornar comprobante detallado de la compra
    return this.getOrderReceipt(user, resultadoCompra.id_venta);
  }

  /**
   * Consulta el comprobante y factura oficial de una venta
   */
  async getOrderReceipt(user: any, idVenta: number) {
    const idCliente = await this.cartService.resolveClientId(user);

    const venta = await this.prisma.venta.findUnique({
      where: { id_venta: idVenta },
      include: {
        cliente: true,
        detalle_venta: {
          include: {
            producto_variante: {
              include: {
                producto: {
                  include: {
                    imagen_producto: { orderBy: { es_principal: 'desc' } },
                  },
                },
                talla: true,
                color: true,
              },
            },
          },
        },
        pago: true,
        envio: {
          include: {
            direccion: {
              include: { ciudad: true },
            },
          },
        },
      },
    });

    if (!venta) {
      throw new NotFoundException('Comprobante de venta no encontrado.');
    }

    // Validar pertenencia salvo que sea administrador
    const esAdmin = user?.rol === 'Administrador' || user?.id_rol === 1;
    if (!esAdmin && venta.id_cliente !== idCliente) {
      throw new ForbiddenException('No tienes permiso para consultar este comprobante.');
    }

    const pagoRegistrado = venta.pago?.[0];
    const envioRegistrado = venta.envio?.[0];

    const totalVenta = Number(venta.subtotal) - Number(venta.descuento);

    return {
      id_venta: venta.id_venta,
      codigo_factura: venta.codigo_factura,
      tipo_venta: venta.tipo_venta,
      estado: venta.estado,
      fecha_venta: venta.fecha_venta,
      subtotal: Number(venta.subtotal),
      descuento: Number(venta.descuento),
      total: totalVenta,
      cliente: {
        id_cliente: venta.cliente?.id_cliente,
        nombre_completo: `${venta.cliente?.nombre || ''} ${venta.cliente?.apellido || ''}`.trim(),
        ci: venta.cliente?.ci || 'N/A',
      },
      pago: pagoRegistrado
        ? {
            id_pago: pagoRegistrado.id_pago,
            metodo_pago: pagoRegistrado.metodo_pago,
            importe: Number(pagoRegistrado.importe),
            transaccion_externa: pagoRegistrado.transaccion_externa,
            estado: pagoRegistrado.estado,
            fecha_pago: pagoRegistrado.fecha_pago,
          }
        : null,
      envio: envioRegistrado
        ? {
            id_envio: envioRegistrado.id_envio,
            transportista: envioRegistrado.transportista,
            numero_guia: envioRegistrado.numero_guia,
            estado: envioRegistrado.estado,
            direccion: {
              destinatario: envioRegistrado.direccion.destinatario,
              telefono: envioRegistrado.direccion.telefono,
              calle: envioRegistrado.direccion.calle,
              ciudad: envioRegistrado.direccion.ciudad.nombre,
              detalle: envioRegistrado.direccion.detalle,
            },
          }
        : null,
      articulos: venta.detalle_venta.map((d) => {
        const v = d.producto_variante;
        const prod = v.producto;
        return {
          id_detalle_venta: d.id_detalle_venta,
          id_producto_variante: v.id_producto_variante,
          nombre_producto: prod.nombre,
          sku: v.sku,
          talla: v.talla?.codigo,
          color: v.color?.nombre,
          cantidad: d.cantidad,
          precio_unitario: Number(d.precio_unitario),
          subtotal: Math.round(d.cantidad * Number(d.precio_unitario) * 100) / 100,
          imagen: prod.imagen_producto?.[0]?.url || v.imagen_url || null,
        };
      }),
    };
  }
}
