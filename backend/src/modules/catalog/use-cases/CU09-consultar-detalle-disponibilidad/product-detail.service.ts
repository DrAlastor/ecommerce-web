/**
 * @file product-detail.service.ts
 * @caso-de-uso CU09 — Consultar detalle y disponibilidad de producto
 * @subsistema Catálogo e Inventario
 * @capa Lógica de Negocio y Persistencia — Backend
 * @responsabilidad Recupera de la base de datos la información completa de un producto, evalúa promociones
 * activas temporales para calcular precios con descuento, estructura las variantes con sus modelos 3D y agrega
 * el stock físico disponible en cada sucursal de la cadena.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import type {
  ProductDetailResponseDto,
  VariantDto,
  BranchStockDto,
  SizeGuideDto,
} from './dto/product-detail.dto.js';

/**
 * Servicio encargado de orquestar la obtención y transformación del detalle de productos y existencias.
 */
@Injectable()
export class ProductDetailService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Consulta y estructura toda la información requerida para la vista de detalle de un producto:
   * 1. Valida existencia y estado activo en base de datos.
   * 2. Incluye categoría, guía de tallas, colección, temporada e imágenes ordenadas.
   * 3. Evalúa si el producto cuenta con promociones vigentes dentro del rango de fechas.
   * 4. Calcula precios base y con descuento porcentual o por monto fijo.
   * 5. Mapea cada variante activa con su SKU, talla, color, modelo 3D y desglose de stock por sucursal física.
   * 6. Retorna mapas consolidados de tallas/colores disponibles y el total de stock global.
   *
   * @param {number} id_producto - Identificador numérico del producto a consultar.
   * @returns {Promise<ProductDetailResponseDto>} Objeto formateado con toda la información técnica y comercial.
   * @throws {NotFoundException} Si el producto no existe o está inactivo.
   */
  async getProductDetail(id_producto: number): Promise<ProductDetailResponseDto> {
    // 1. Consulta en la base de datos con relaciones completas
    const product = await this.prisma.producto.findFirst({
      where: {
        id_producto,
        estado: 'activo',
      },
      include: {
        categoria: {
          include: {
            guia_talla: {
              orderBy: [
                { parte_cuerpo: 'asc' },
                { talla_etiqueta: 'asc' },
              ],
            },
          },
        },
        coleccion: {
          include: {
            temporada: true,
          },
        },
        imagen_producto: {
          orderBy: [
            { es_principal: 'desc' },
            { orden: 'asc' },
          ],
        },
        producto_variante: {
          where: {
            estado: 'activo',
          },
          include: {
            talla: true,
            color: true,
            inventario_sucursal: {
              include: {
                sucursal: {
                  include: {
                    ciudad: true,
                  },
                },
              },
              orderBy: {
                stock_disponible: 'desc',
              },
            },
          },
        },
        promocion_producto: {
          include: {
            promocion: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`El producto #${id_producto} no existe o no se encuentra disponible.`);
    }

    // 2. Calcular promoción activa en el instante de tiempo actual
    const now = new Date();
    const activePromo = product.promocion_producto
      .map((pp) => pp.promocion)
      .find(
        (p) =>
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
        // En caso de monto fijo, aproximamos el porcentaje para insignias visuales (badges)
        const base = Number(product.precio_base);
        descuentoPorcentaje = base > 0 ? Math.round((Number(activePromo.valor_descuento) / base) * 100) : 0;
      }
    }

    const precioBase = Number(product.precio_base);
    const precioFinalBase = tieneDescuento
      ? activePromo?.tipo_descuento === 'porcentaje'
        ? Math.round(precioBase * (1 - descuentoPorcentaje / 100) * 100) / 100
        : Math.max(Math.round((precioBase - Number(activePromo?.valor_descuento || 0)) * 100) / 100, 0)
      : precioBase;

    // 3. Procesar variantes, modelos 3D y stock por sucursal
    let totalStockGlobal = 0;
    let tieneModelo3D = false;

    const variantesDto: VariantDto[] = product.producto_variante.map((v) => {
      const precioAdicional = Number(v.precio_adicional);
      const precioVariante = Math.round((precioBase + precioAdicional) * 100) / 100;
      const precioFinal = tieneDescuento
        ? activePromo?.tipo_descuento === 'porcentaje'
          ? Math.round(precioVariante * (1 - descuentoPorcentaje / 100) * 100) / 100
          : Math.max(Math.round((precioVariante - Number(activePromo?.valor_descuento || 0)) * 100) / 100, 0)
        : precioVariante;

      // Disponibilidad en cada tienda física
      const disponibilidadSucursales: BranchStockDto[] = v.inventario_sucursal.map((inv) => ({
        id_sucursal: inv.sucursal.id_sucursal,
        nombre: inv.sucursal.nombre,
        direccion: inv.sucursal.direccion,
        ciudad: inv.sucursal.ciudad?.nombre,
        stock_disponible: inv.stock_disponible,
        disponible: inv.stock_disponible > 0,
      }));

      const totalStockVariante = disponibilidadSucursales.reduce(
        (sum, s) => sum + s.stock_disponible,
        0,
      );
      totalStockGlobal += totalStockVariante;

      const esPrendaVestir = product.id_categoria !== 2 && !product.categoria.nombre.toLowerCase().includes('accesorio');

      if (esPrendaVestir && v.modelo_3d_url) {
        tieneModelo3D = true;
      }

      return {
        id_producto_variante: v.id_producto_variante,
        sku: v.sku,
        precio_adicional: precioAdicional,
        precio_variante: precioVariante,
        precio_final: precioFinal,
        tiene_descuento: tieneDescuento,
        descuento_porcentaje: descuentoPorcentaje,
        modelo_3d_url: esPrendaVestir ? v.modelo_3d_url : null,
        imagen_url: v.imagen_url,
        estado: v.estado,
        talla: {
          id_talla: v.talla.id_talla,
          codigo: v.talla.codigo,
        },
        color: {
          id_color: v.color.id_color,
          nombre: v.color.nombre,
          codigo_hex: v.color.codigo_hex,
        },
        total_stock: totalStockVariante,
        disponibilidad_sucursales: disponibilidadSucursales,
      };
    });

    // 4. Mapear conjuntos únicos de tallas y colores
    const tallasMap = new Map<number, { id_talla: number; codigo: string }>();
    const coloresMap = new Map<number, { id_color: number; nombre: string; codigo_hex: string | null }>();

    product.producto_variante.forEach((v) => {
      tallasMap.set(v.talla.id_talla, {
        id_talla: v.talla.id_talla,
        codigo: v.talla.codigo,
      });
      coloresMap.set(v.color.id_color, {
        id_color: v.color.id_color,
        nombre: v.color.nombre,
        codigo_hex: v.color.codigo_hex,
      });
    });

    // 5. Guía de tallas de la categoría asociada
    const guiaTallas: SizeGuideDto[] = product.categoria.guia_talla.map((g) => ({
      id_guia_talla: g.id_guia_talla,
      parte_cuerpo: g.parte_cuerpo,
      talla_etiqueta: g.talla_etiqueta,
      min_cm: Number(g.min_cm),
      max_cm: Number(g.max_cm),
    }));

    // 6. Retorno de la estructura consolidada
    return {
      id_producto: product.id_producto,
      nombre: product.nombre,
      descripcion: product.descripcion,
      precio_base: precioBase,
      precio_final_base: precioFinalBase,
      tiene_descuento: tieneDescuento,
      descuento_porcentaje: descuentoPorcentaje,
      promocion: activePromo
        ? {
            id_promocion: activePromo.id_promocion,
            nombre: activePromo.nombre,
            tipo_descuento: activePromo.tipo_descuento,
            valor_descuento: Number(activePromo.valor_descuento),
            fecha_fin: activePromo.fecha_fin.toISOString(),
          }
        : undefined,
      genero: product.genero,
      estado: product.estado,
      categoria: {
        id_categoria: product.categoria.id_categoria,
        nombre: product.categoria.nombre,
        descripcion: product.categoria.descripcion,
      },
      coleccion: product.coleccion
        ? {
            id_coleccion: product.coleccion.id_coleccion,
            nombre: product.coleccion.nombre,
            descripcion: product.coleccion.descripcion,
            temporada: product.coleccion.temporada
              ? {
                  id_temporada: product.coleccion.temporada.id_temporada,
                  nombre: product.coleccion.temporada.nombre,
                }
              : undefined,
          }
        : undefined,
      imagenes: product.imagen_producto.map((img) => ({
        id_imagen_producto: img.id_imagen_producto,
        url: img.url,
        texto_alternativo: img.texto_alternativo,
        es_principal: img.es_principal,
        orden: img.orden,
      })),
      guia_tallas: guiaTallas,
      tallas_disponibles: Array.from(tallasMap.values()),
      colores_disponibles: Array.from(coloresMap.values()),
      variantes: variantesDto,
      tiene_modelo_3d: tieneModelo3D,
      total_stock_global: totalStockGlobal,
    };
  }
}
