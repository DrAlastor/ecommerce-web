/**
 * @caso-de-uso CU25 — Utilizar vestidor virtual
 * @subsistema Experiencia Móvil
 * @capa Control/Service de dominio — Backend
 * @responsabilidad Ejecuta las reglas del negocio y coordina persistencia, auditoría e integraciones del caso de uso.
 * @secuencia Cliente -> vestidor virtual -> controlador de experiencia -> servicios de cámara y renderizado -> Producto/Variante/Recursos 3D.
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import type {
  ArVariantDto,
  ArVariantDetailDto,
  ArVariantsResponseDto,
} from './dto/virtual-fitting.dto.js';

@Injectable()
export class VirtualFittingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene los datos de una variante específica para el vestidor virtual.
   * Valida que el producto y la variante estén activos y que la variante
   * disponga de un modelo 3D (RN-M6-05, RN-M6-06).
   */
  async getVariantForFitting(variantId: number): Promise<ArVariantDetailDto> {
    const variant = await this.prisma.producto_variante.findFirst({
      where: {
        id_producto_variante: variantId,
        estado: 'activo',
        modelo_3d_url: { not: null },
        producto: { estado: 'activo' },
      },
      include: {
        talla: true,
        color: true,
        producto: {
          include: {
            categoria: true,
            promocion_producto: {
              include: { promocion: true },
            },
          },
        },
        inventario_sucursal: true,
      },
    });

    if (!variant) {
      throw new NotFoundException(
        'La variante solicitada no existe, no está activa o no dispone de modelo 3D para el vestidor virtual.',
      );
    }

    const precioBase = Number(variant.producto.precio_base);
    const { tieneDescuento, descuentoPorcentaje, precioFinal, precioVariante } =
      this.calcularPrecios(precioBase, Number(variant.precio_adicional), variant.producto.promocion_producto);

    const totalStock = variant.inventario_sucursal.reduce(
      (sum, inv) => sum + inv.stock_disponible, 0,
    );

    return {
      id_producto_variante: variant.id_producto_variante,
      sku: variant.sku,
      precio_variante: precioVariante,
      precio_final: precioFinal,
      tiene_descuento: tieneDescuento,
      descuento_porcentaje: descuentoPorcentaje,
      modelo_3d_url: variant.modelo_3d_url!,
      imagen_url: variant.imagen_url,
      estado: variant.estado,
      talla: { id_talla: variant.talla.id_talla, codigo: variant.talla.codigo },
      color: {
        id_color: variant.color.id_color,
        nombre: variant.color.nombre,
        codigo_hex: variant.color.codigo_hex,
      },
      total_stock: totalStock,
      producto: {
        id_producto: variant.producto.id_producto,
        nombre: variant.producto.nombre,
        descripcion: variant.producto.descripcion,
        precio_base: precioBase,
        categoria: variant.producto.categoria.nombre,
      },
    };
  }

  /**
   * Obtiene todas las variantes de un producto compatibles con RA.
   * Solo retorna variantes activas con modelo_3d_url != null.
   */
  async getArVariantsByProduct(productId: number): Promise<ArVariantsResponseDto> {
    const product = await this.prisma.producto.findFirst({
      where: {
        id_producto: productId,
        estado: 'activo',
      },
      include: {
        categoria: true,
        promocion_producto: {
          include: { promocion: true },
        },
        producto_variante: {
          where: {
            estado: 'activo',
            modelo_3d_url: { not: null },
          },
          include: {
            talla: true,
            color: true,
            inventario_sucursal: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(
        `El producto #${productId} no existe o no se encuentra activo.`,
      );
    }

    const esAccesorio = product.categoria.id_categoria === 2 || product.categoria.nombre.toLowerCase().includes('accesorio');
    if (esAccesorio || product.producto_variante.length === 0) {
      throw new BadRequestException(
        'Este producto (o accesorio) no dispone de prendas compatibles con el vestidor virtual tridimensional.',
      );
    }

    const precioBase = Number(product.precio_base);

    const tallasMap = new Map<number, { id_talla: number; codigo: string }>();
    const coloresMap = new Map<number, { id_color: number; nombre: string; codigo_hex: string | null }>();

    const variantes: ArVariantDto[] = product.producto_variante.map((v) => {
      const { tieneDescuento, descuentoPorcentaje, precioFinal, precioVariante } =
        this.calcularPrecios(precioBase, Number(v.precio_adicional), product.promocion_producto);

      const totalStock = v.inventario_sucursal.reduce(
        (sum, inv) => sum + inv.stock_disponible, 0,
      );

      tallasMap.set(v.talla.id_talla, { id_talla: v.talla.id_talla, codigo: v.talla.codigo });
      coloresMap.set(v.color.id_color, {
        id_color: v.color.id_color,
        nombre: v.color.nombre,
        codigo_hex: v.color.codigo_hex,
      });

      return {
        id_producto_variante: v.id_producto_variante,
        sku: v.sku,
        precio_variante: precioVariante,
        precio_final: precioFinal,
        tiene_descuento: tieneDescuento,
        descuento_porcentaje: descuentoPorcentaje,
        modelo_3d_url: v.modelo_3d_url!,
        imagen_url: v.imagen_url,
        estado: v.estado,
        talla: { id_talla: v.talla.id_talla, codigo: v.talla.codigo },
        color: { id_color: v.color.id_color, nombre: v.color.nombre, codigo_hex: v.color.codigo_hex },
        total_stock: totalStock,
      };
    });

    return {
      producto: {
        id_producto: product.id_producto,
        nombre: product.nombre,
        descripcion: product.descripcion,
        precio_base: precioBase,
        categoria: product.categoria.nombre,
      },
      variantes,
      tallas_disponibles: Array.from(tallasMap.values()),
      colores_disponibles: Array.from(coloresMap.values()),
    };
  }

  /**
   * Registra una interacción de tipo vestidor_virtual en CLIENTE_INTERACCION_IA.
   * No almacena imágenes ni video (RN-M6-11, RN-M6-17).
   */
  async registerInteraction(clienteId: number, productoId: number): Promise<{ registered: boolean }> {
    // Verificar que el producto existe y está activo
    const product = await this.prisma.producto.findFirst({
      where: { id_producto: productoId, estado: 'activo' },
    });

    if (!product) {
      throw new NotFoundException(`El producto #${productoId} no existe o no está activo.`);
    }

    // Verificar que el cliente existe
    const cliente = await this.prisma.cliente.findFirst({
      where: { id_cliente: clienteId },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado.');
    }

    // Obtener siguiente ID (autoincremento manual, patrón existente en CU12)
    const max = await this.prisma.cliente_interaccion_ia.aggregate({
      _max: { id_cliente_interaccion_ia: true },
    });
    const nextId = (max._max.id_cliente_interaccion_ia || 0) + 1;

    await this.prisma.cliente_interaccion_ia.create({
      data: {
        id_cliente_interaccion_ia: nextId,
        tipo_interaccion: 'vestidor_virtual',
        id_cliente: clienteId,
        id_producto: productoId,
      },
    });

    return { registered: true };
  }

  /* ───────────────── Helpers privados ───────────────── */

  /**
   * Calcula precios considerando la promoción activa del producto.
   * Reutiliza la misma lógica de product-detail.service.ts.
   */
  private calcularPrecios(
    precioBase: number,
    precioAdicional: number,
    promocionProducto: Array<{ promocion: any }>,
  ) {
    const now = new Date();
    const activePromo = promocionProducto
      .map((pp) => pp.promocion)
      .find(
        (p: any) =>
          p.estado === 'activo' &&
          new Date(p.fecha_inicio) <= now &&
          new Date(p.fecha_fin) >= now,
      );

    const tieneDescuento = Boolean(activePromo);
    let descuentoPorcentaje = 0;

    if (activePromo) {
      if (activePromo.tipo_descuento === 'porcentaje') {
        descuentoPorcentaje = Number(activePromo.valor_descuento);
      } else {
        descuentoPorcentaje =
          precioBase > 0
            ? Math.round((Number(activePromo.valor_descuento) / precioBase) * 100)
            : 0;
      }
    }

    const precioVariante = Math.round((precioBase + precioAdicional) * 100) / 100;
    const precioFinal = tieneDescuento
      ? activePromo?.tipo_descuento === 'porcentaje'
        ? Math.round(precioVariante * (1 - descuentoPorcentaje / 100) * 100) / 100
        : Math.max(Math.round((precioVariante - Number(activePromo?.valor_descuento || 0)) * 100) / 100, 0)
      : precioVariante;

    return { tieneDescuento, descuentoPorcentaje, precioFinal, precioVariante };
  }
}
