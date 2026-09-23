/**
 * @caso-de-uso CU22 — Consultar historial de compras
 * @subsistema Ventas, Pagos y Compras
 * @capa Control/Service de dominio — Backend
 * @responsabilidad Ejecuta las reglas del negocio y coordina persistencia, auditoría e integraciones del caso de uso.
 * @secuencia Cliente -> historial -> controlador de compras -> servicio de historial -> Venta/DetalleVenta/Pago.
 */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { PurchasesFilterDto } from './dto/purchases-filter.dto.js';

@Injectable()
export class PurchasesHistoryService {
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

    // Si es un usuario registrado sin perfil cliente, se crea de forma transparente
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
   * Obtiene la lista paginada y filtrada del historial de compras del cliente
   */
  async getPurchases(user: any, filter: PurchasesFilterDto) {
    const idCliente = await this.resolveClientId(user);
    const { estado, search, tipo_venta, page = 1, limit = 10 } = filter;

    const skip = (page - 1) * limit;

    // Filtros de búsqueda
    const whereClause: any = {
      id_cliente: idCliente,
    };

    if (estado && estado !== 'todos') {
      whereClause.estado = {
        equals: estado,
        mode: 'insensitive',
      };
    }

    if (tipo_venta && tipo_venta !== 'todos') {
      whereClause.tipo_venta = tipo_venta;
    }

    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereClause.OR = [
        { codigo_factura: { contains: searchTerm, mode: 'insensitive' } },
        {
          detalle_venta: {
            some: {
              producto_variante: {
                producto: {
                  nombre: { contains: searchTerm, mode: 'insensitive' },
                },
              },
            },
          },
        },
      ];
    }

    const [total, ventasRaw] = await Promise.all([
      this.prisma.venta.count({ where: whereClause }),
      this.prisma.venta.findMany({
        where: whereClause,
        include: {
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
        orderBy: { fecha_venta: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const compras = ventasRaw.map((v) => {
      const pagoRegistrado = v.pago?.[0];
      const envioRegistrado = v.envio?.[0];
      const totalVenta = Number(v.subtotal) - Number(v.descuento);

      const items = v.detalle_venta.map((det) => {
        const prod = det.producto_variante.producto;
        const imagenUrl =
          prod.imagen_producto?.[0]?.url ||
          det.producto_variante.imagen_url ||
          'https://fashionstorestorage.blob.core.windows.net/productos/hero-model.jpg';

        return {
          id_detalle_venta: det.id_detalle_venta,
          id_producto: prod.id_producto,
          nombre_producto: prod.nombre,
          sku: det.producto_variante.sku,
          talla: det.producto_variante.talla?.codigo || 'N/A',
          color: det.producto_variante.color?.nombre || 'N/A',
          color_hex: det.producto_variante.color?.codigo_hex || '#1A1A1A',
          imagen: imagenUrl,
          cantidad: det.cantidad,
          precio_unitario: Number(det.precio_unitario),
          subtotal: Number(det.subtotal),
        };
      });

      const totalArticulos = items.reduce((acc, it) => acc + it.cantidad, 0);

      return {
        id_venta: v.id_venta,
        codigo_factura: v.codigo_factura,
        tipo_venta: v.tipo_venta,
        estado: v.estado,
        fecha_venta: v.fecha_venta,
        subtotal: Number(v.subtotal),
        descuento: Number(v.descuento),
        total: Math.max(0, totalVenta),
        total_articulos: totalArticulos,
        pago: pagoRegistrado
          ? {
              id_pago: pagoRegistrado.id_pago,
              metodo_pago: pagoRegistrado.metodo_pago,
              estado: pagoRegistrado.estado,
              importe: Number(pagoRegistrado.importe),
              transaccion_externa: pagoRegistrado.transaccion_externa,
              fecha_pago: pagoRegistrado.fecha_pago,
            }
          : null,
        envio: envioRegistrado
          ? {
              id_envio: envioRegistrado.id_envio,
              numero_guia: envioRegistrado.numero_guia,
              transportista: envioRegistrado.transportista,
              estado: envioRegistrado.estado,
              fecha_entrega: envioRegistrado.fecha_entrega,
              direccion: envioRegistrado.direccion
                ? {
                    destinatario: envioRegistrado.direccion.destinatario,
                    telefono: envioRegistrado.direccion.telefono,
                    calle: envioRegistrado.direccion.calle,
                    ciudad: envioRegistrado.direccion.ciudad?.nombre || 'Bolivia',
                  }
                : null,
            }
          : null,
        items,
      };
    });

    return {
      data: compras,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Consulta el detalle completo y comprobante de una compra específica
   */
  async getPurchaseById(user: any, idVenta: number) {
    const idCliente = await this.resolveClientId(user);

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
      throw new NotFoundException('La compra solicitada no existe o no fue encontrada.');
    }

    // Validar pertenencia: los clientes solo pueden ver sus compras
    const rolNorm = (user?.rol || user?.rol?.nombre || '').toLowerCase().trim();
    const esAdmin = rolNorm === 'administrador' || user?.id_rol === 1;

    if (!esAdmin && venta.id_cliente !== idCliente) {
      throw new ForbiddenException('No tienes autorización para consultar esta compra.');
    }

    const pagoRegistrado = venta.pago?.[0];
    const envioRegistrado = venta.envio?.[0];
    const totalVenta = Number(venta.subtotal) - Number(venta.descuento);

    const items = venta.detalle_venta.map((det) => {
      const prod = det.producto_variante.producto;
      const imagenUrl =
        prod.imagen_producto?.[0]?.url ||
        det.producto_variante.imagen_url ||
        'https://fashionstorestorage.blob.core.windows.net/productos/hero-model.jpg';

      return {
        id_detalle_venta: det.id_detalle_venta,
        id_producto: prod.id_producto,
        nombre_producto: prod.nombre,
        sku: det.producto_variante.sku,
        talla: det.producto_variante.talla?.codigo || 'N/A',
        color: det.producto_variante.color?.nombre || 'N/A',
        color_hex: det.producto_variante.color?.codigo_hex || '#1A1A1A',
        imagen: imagenUrl,
        cantidad: det.cantidad,
        precio_unitario: Number(det.precio_unitario),
        subtotal: Number(det.subtotal),
      };
    });

    const totalArticulos = items.reduce((acc, it) => acc + it.cantidad, 0);

    return {
      id_venta: venta.id_venta,
      codigo_factura: venta.codigo_factura,
      tipo_venta: venta.tipo_venta,
      estado: venta.estado,
      fecha_venta: venta.fecha_venta,
      subtotal: Number(venta.subtotal),
      descuento: Number(venta.descuento),
      total: Math.max(0, totalVenta),
      total_articulos: totalArticulos,
      cliente: {
        id_cliente: venta.cliente?.id_cliente,
        nombre_completo: `${venta.cliente?.nombre || ''} ${venta.cliente?.apellido || ''}`.trim(),
        ci: venta.cliente?.ci || '0',
      },
      pago: pagoRegistrado
        ? {
            id_pago: pagoRegistrado.id_pago,
            metodo_pago: pagoRegistrado.metodo_pago,
            estado: pagoRegistrado.estado,
            importe: Number(pagoRegistrado.importe),
            transaccion_externa: pagoRegistrado.transaccion_externa,
            fecha_pago: pagoRegistrado.fecha_pago,
          }
        : null,
      envio: envioRegistrado
        ? {
            id_envio: envioRegistrado.id_envio,
            numero_guia: envioRegistrado.numero_guia,
            transportista: envioRegistrado.transportista,
            estado: envioRegistrado.estado,
            fecha_entrega: envioRegistrado.fecha_entrega,
            direccion: envioRegistrado.direccion
              ? {
                  destinatario: envioRegistrado.direccion.destinatario,
                  telefono: envioRegistrado.direccion.telefono,
                  calle: envioRegistrado.direccion.calle,
                  detalle: envioRegistrado.direccion.detalle,
                  ciudad: envioRegistrado.direccion.ciudad?.nombre || 'Bolivia',
                }
              : null,
          }
        : null,
      items,
      factura: {
        numero_autorizacion: `AUT-IMP-${venta.id_venta}-99283`,
        codigo_control: `CC-${venta.id_venta}A-${String(venta.codigo_factura).slice(-4)}`,
        leyenda: 'ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS. EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE.',
      },
    };
  }
}
