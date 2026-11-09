/**
 * @caso-de-uso CU23 — Procesar pago electrónico y facturación
 * @subsistema Ventas, Pagos y Compras
 * @capa Control/Service de dominio — Backend
 * @responsabilidad Ejecuta las reglas del negocio y coordina persistencia, auditoría e integraciones del caso de uso.
 * @secuencia Cliente -> interfaz de pago -> controlador de pagos -> servicio de pago y facturación -> Pasarela de Pago/Pago/Venta/Factura.
 */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { BitacoraService } from '../../../users-security/shared/services/bitacora.service.js';
import { ProcessPaymentDto } from './dto/process-payment.dto.js';

@Injectable()
export class PaymentBillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  /**
   * Procesa el cobro de una venta y genera el comprobante fiscal oficial
   */
  async processPayment(user: any, dto: ProcessPaymentDto, ip?: string) {
    const userId = Number(user?.id_usuario ?? user?.sub);

    // 1. Identificar la venta asociada
    const venta = await this.prisma.venta.findUnique({
      where: { id_venta: dto.id_venta },
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
            direccion: { include: { ciudad: true } },
          },
        },
      },
    });

    if (!venta) {
      throw new NotFoundException(`La venta #${dto.id_venta} no existe o no fue encontrada.`);
    }

    // 2. Control antifraude y no duplicidad
    const estadoNorm = venta.estado.toLowerCase().trim();
    if (estadoNorm === 'pagada' || estadoNorm === 'completada') {
      throw new BadRequestException(
        `La venta #${venta.id_venta} ya se encuentra pagada y dispone de la factura oficial ${venta.codigo_factura || ''}. No es posible procesar un cobro duplicado.`,
      );
    }

    const pagoCompletadoPrevio = venta.pago.find(
      (p) => p.estado.toLowerCase() === 'completado' || p.estado.toLowerCase() === 'aprobado',
    );
    if (pagoCompletadoPrevio) {
      throw new BadRequestException(
        `La venta #${venta.id_venta} ya registra un pago completado por ${pagoCompletadoPrevio.importe} Bs (${pagoCompletadoPrevio.metodo_pago}).`,
      );
    }

    // 3. Validar montos
    const totalVenta = Math.round((Number(venta.subtotal) - Number(venta.descuento)) * 100) / 100;
    const montoEnviado = Math.round(dto.monto * 100) / 100;

    if (Math.abs(montoEnviado - totalVenta) > 0.05) {
      throw new BadRequestException(
        `El monto a pagar (${montoEnviado.toFixed(2)} Bs) no coincide exactamente con el saldo de la venta (${totalVenta.toFixed(2)} Bs).`,
      );
    }

    // Cálculo de cambio en efectivo
    let cambioEfectivo = 0;
    if (dto.metodo_pago === 'efectivo') {
      const montoRecibido = dto.monto_recibido ? Number(dto.monto_recibido) : dto.monto;
      if (montoRecibido < totalVenta) {
        throw new BadRequestException(
          `El dinero recibido (${montoRecibido.toFixed(2)} Bs) es menor al importe total de la venta (${totalVenta.toFixed(2)} Bs).`,
        );
      }
      cambioEfectivo = Math.round((montoRecibido - totalVenta) * 100) / 100;
    }

    // 4. Generación correlativa de factura sin duplicidad
    let codigoFacturaFinal = venta.codigo_factura;
    if (!codigoFacturaFinal) {
      codigoFacturaFinal = `FAC-2026-${String(venta.id_venta).padStart(5, '0')}`;
    }

    // Identificador de transacción
    let transaccionRef = dto.transaccion_externa;
    if (!transaccionRef) {
      if (dto.metodo_pago === 'efectivo') {
        transaccionRef = `EFECTIVO-CAJA-${Date.now()}`;
      } else if (dto.metodo_pago === 'qr') {
        transaccionRef = `QR-CONFIRMED-${Date.now()}`;
      } else if (dto.metodo_pago === 'stripe' || dto.metodo_pago === 'tarjeta') {
        transaccionRef = `CARD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      } else {
        transaccionRef = `DEP-${Date.now()}`;
      }
    }

    // 5. Operación Transaccional Atómica (Pago + Facturación + Venta)
    await this.prisma.$transaction(async (tx) => {
      // Registrar pago
      const pagoMax = await tx.pago.aggregate({
        _max: { id_pago: true },
      });
      const nextPagoId = (pagoMax._max.id_pago || 0) + 1;

      await tx.pago.create({
        data: {
          id_pago: nextPagoId,
          metodo_pago: dto.metodo_pago,
          importe: totalVenta,
          transaccion_externa: transaccionRef,
          estado: 'completado',
          fecha_pago: new Date(),
          id_venta: venta.id_venta,
        },
      });

      // Actualizar venta
      await tx.venta.update({
        where: { id_venta: venta.id_venta },
        data: {
          estado: 'Pagada',
          codigo_factura: codigoFacturaFinal,
        },
      });
    });

    // 6. Registro de Auditoría en Bitácora
    if (userId) {
      await this.bitacora.logAction(
        `Pago procesado de ${totalVenta} Bs mediante ${dto.metodo_pago.toUpperCase()} para venta #${venta.id_venta}. Factura emitida: ${codigoFacturaFinal}`,
        'VENTA',
        userId,
        ip,
      );
    }

    // 7. Retornar comprobante fiscal estructurado
    const numeroAutorizacion = `AUT-FAS-${venta.id_venta}-83910`;
    const codigoControl = `CF-${venta.id_venta}B-${String(codigoFacturaFinal).slice(-4)}`;
    const leyendaLegal =
      'ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS. EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE ACUERDO A LEY.';

    const items = venta.detalle_venta.map((d) => {
      const prod = d.producto_variante.producto;
      return {
        id_detalle_venta: d.id_detalle_venta,
        id_producto: prod.id_producto,
        nombre_producto: prod.nombre,
        sku: d.producto_variante.sku,
        talla: d.producto_variante.talla?.codigo || 'N/A',
        color: d.producto_variante.color?.nombre || 'N/A',
        imagen: prod.imagen_producto?.[0]?.url || d.producto_variante.imagen_url || null,
        cantidad: d.cantidad,
        precio_unitario: Number(d.precio_unitario),
        subtotal: Number(d.subtotal),
      };
    });

    return {
      success: true,
      mensaje: 'Pago registrado y factura emitida con éxito.',
      id_venta: venta.id_venta,
      codigo_factura: codigoFacturaFinal,
      estado_venta: 'Pagada',
      fecha: new Date().toISOString(),
      cliente: {
        id_cliente: venta.cliente?.id_cliente,
        nombre_completo:
          dto.razon_social_factura ||
          `${venta.cliente?.nombre || ''} ${venta.cliente?.apellido || ''}`.trim() ||
          'Cliente Final',
        nit_ci: dto.nit_factura || venta.cliente?.ci || '0',
      },
      pago: {
        metodo_pago: dto.metodo_pago,
        monto_pagado: totalVenta,
        monto_recibido: dto.metodo_pago === 'efectivo' ? (dto.monto_recibido || totalVenta) : totalVenta,
        cambio: cambioEfectivo,
        transaccion: transaccionRef,
        fecha_pago: new Date().toISOString(),
      },
      liquidacion: {
        subtotal: Number(venta.subtotal),
        descuento: Number(venta.descuento),
        total: totalVenta,
      },
      factura: {
        numero_factura: codigoFacturaFinal,
        numero_autorizacion: numeroAutorizacion,
        codigo_control: codigoControl,
        leyenda: leyendaLegal,
      },
      items,
    };
  }

  /**
   * Obtiene la lista de ventas pendientes de cobro para el cajero y el cliente
   */
  async getPendingSales(user: any) {
    const rolNorm = (user?.rol || user?.rol?.nombre || '').toLowerCase().trim();
    const esPersonal = rolNorm === 'cajero' || rolNorm === 'administrador' || Boolean(user?.empleado);

    const whereClause: any = {
      OR: [
        { estado: { equals: 'pendiente', mode: 'insensitive' } },
        { estado: { equals: 'Pendiente de Pago', mode: 'insensitive' } },
      ],
    };

    // Si es un cliente común, restringir a sus compras pendientes
    if (!esPersonal) {
      const userId = Number(user?.id_usuario ?? user?.sub);
      whereClause.id_cliente = userId;
    }

    const ventas = await this.prisma.venta.findMany({
      where: whereClause,
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
      },
      orderBy: { fecha_venta: 'desc' },
      take: 50,
    });

    return ventas.map((v) => {
      const totalVenta = Math.round((Number(v.subtotal) - Number(v.descuento)) * 100) / 100;
      return {
        id_venta: v.id_venta,
        codigo_factura: v.codigo_factura || `PEND-${v.id_venta}`,
        tipo_venta: v.tipo_venta,
        estado: v.estado,
        fecha_venta: v.fecha_venta,
        subtotal: Number(v.subtotal),
        descuento: Number(v.descuento),
        total: totalVenta,
        cliente: {
          id_cliente: v.cliente?.id_cliente,
          nombre_completo: `${v.cliente?.nombre || ''} ${v.cliente?.apellido || ''}`.trim() || 'Cliente Final',
          ci: v.cliente?.ci || '0',
        },
        total_articulos: v.detalle_venta.reduce((sum, d) => sum + d.cantidad, 0),
        items: v.detalle_venta.map((d) => ({
          id_detalle_venta: d.id_detalle_venta,
          nombre: d.producto_variante.producto.nombre,
          sku: d.producto_variante.sku,
          talla: d.producto_variante.talla?.codigo,
          color: d.producto_variante.color?.nombre,
          cantidad: d.cantidad,
          precio_unitario: Number(d.precio_unitario),
          subtotal: Number(d.subtotal),
          imagen:
            d.producto_variante.producto.imagen_producto?.[0]?.url ||
            d.producto_variante.imagen_url ||
            null,
        })),
      };
    });
  }

  /**
   * Consulta la factura emitida de una venta
   */
  async getInvoice(idVenta: number) {
    const venta = await this.prisma.venta.findUnique({
      where: { id_venta: idVenta },
      include: {
        cliente: true,
        detalle_venta: {
          include: {
            producto_variante: {
              include: {
                producto: true,
                talla: true,
                color: true,
              },
            },
          },
        },
        pago: true,
      },
    });

    if (!venta) {
      throw new NotFoundException(`La venta #${idVenta} no fue encontrada.`);
    }

    const totalVenta = Math.round((Number(venta.subtotal) - Number(venta.descuento)) * 100) / 100;
    const pago = venta.pago?.[0];

    return {
      numero_factura: venta.codigo_factura || `FAC-2026-${String(venta.id_venta).padStart(5, '0')}`,
      fecha_emision: venta.fecha_venta,
      estado: venta.estado,
      numero_autorizacion: `AUT-FAS-${venta.id_venta}-83910`,
      codigo_control: `CF-${venta.id_venta}B-${String(venta.codigo_factura || '').slice(-4)}`,
      leyenda: 'ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS. EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE ACUERDO A LEY.',
      cliente: {
        id_cliente: venta.cliente?.id_cliente,
        nombre: `${venta.cliente?.nombre || ''} ${venta.cliente?.apellido || ''}`.trim() || 'Cliente Final',
        ci_nit: venta.cliente?.ci || '0',
      },
      pago: pago
        ? {
            metodo: pago.metodo_pago,
            transaccion: pago.transaccion_externa,
            fecha: pago.fecha_pago,
          }
        : null,
      totales: {
        subtotal: Number(venta.subtotal),
        descuento: Number(venta.descuento),
        total: totalVenta,
      },
      detalles: venta.detalle_venta.map((d) => ({
        descripcion: `${d.producto_variante.producto.nombre} (${d.producto_variante.talla?.codigo || ''} - ${d.producto_variante.color?.nombre || ''})`,
        cantidad: d.cantidad,
        precio_unitario: Number(d.precio_unitario),
        subtotal: Number(d.subtotal),
      })),
    };
  }
}
