import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { QueryCatalogDto } from './dto/catalog.dto.js';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * CU10 — Consultar catálogo de productos con filtros, búsqueda, ordenamiento y paginación
   */
  async getCatalog(query: QueryCatalogDto) {
    const {
      search,
      id_categoria,
      categoria,
      genero,
      id_talla,
      talla,
      id_color,
      color,
      id_coleccion,
      id_temporada,
      min_price,
      max_price,
      en_oferta,
      sort_by = 'recientes',
      page = 1,
      limit = 12,
    } = query;

    const skip = (page - 1) * limit;
    const now = new Date();

    // Construcción dinámica de la cláusula WHERE
    const where: any = {
      estado: 'activo',
    };

    // 1. Búsqueda por texto (nombre, descripción o categoría)
    if (search && search.trim() !== '') {
      const term = search.trim();
      where.OR = [
        { nombre: { contains: term, mode: 'insensitive' } },
        { descripcion: { contains: term, mode: 'insensitive' } },
        { categoria: { nombre: { contains: term, mode: 'insensitive' } } },
      ];
    }

    // 2. Filtro por Categoría
    if (id_categoria) {
      where.id_categoria = id_categoria;
    } else if (categoria && categoria.trim() !== '' && categoria !== 'all') {
      where.categoria = {
        nombre: { equals: categoria.trim(), mode: 'insensitive' },
      };
    }

    // 3. Filtro por Género
    if (genero && genero.trim() !== '' && genero !== 'all') {
      where.genero = { equals: genero.trim(), mode: 'insensitive' };
    }

    // 4. Filtro por Colección y Temporada
    if (id_coleccion) {
      where.id_coleccion = id_coleccion;
    }
    if (id_temporada) {
      where.coleccion = {
        id_temporada: id_temporada,
      };
    }

    // 5. Filtro por Rango de Precios
    if (min_price !== undefined || max_price !== undefined) {
      where.precio_base = {};
      if (min_price !== undefined) where.precio_base.gte = min_price;
      if (max_price !== undefined) where.precio_base.lte = max_price;
    }

    // 6. Filtros por Talla y Color a través de Variantes
    const variantFilters: any = { estado: 'activo' };
    let hasVariantFilter = false;

    if (id_talla) {
      variantFilters.id_talla = id_talla;
      hasVariantFilter = true;
    } else if (talla && talla.trim() !== '') {
      variantFilters.talla = { codigo: { equals: talla.trim(), mode: 'insensitive' } };
      hasVariantFilter = true;
    }

    if (id_color) {
      variantFilters.id_color = id_color;
      hasVariantFilter = true;
    } else if (color && color.trim() !== '') {
      variantFilters.color = {
        OR: [
          { nombre: { contains: color.trim(), mode: 'insensitive' } },
          { codigo_hex: { equals: color.trim(), mode: 'insensitive' } },
        ],
      };
      hasVariantFilter = true;
    }

    if (hasVariantFilter) {
      where.producto_variante = {
        some: variantFilters,
      };
    }

    // 7. Filtro por Productos en Oferta
    if (en_oferta) {
      where.promocion_producto = {
        some: {
          promocion: {
            estado: 'activo',
            fecha_inicio: { lte: now },
            fecha_fin: { gte: now },
          },
        },
      };
    }

    // Definición de ordenamiento
    let orderBy: any = { id_producto: 'desc' };
    switch (sort_by) {
      case 'precio_asc':
        orderBy = { precio_base: 'asc' };
        break;
      case 'precio_desc':
        orderBy = { precio_base: 'desc' };
        break;
      case 'nombre_asc':
        orderBy = { nombre: 'asc' };
        break;
      case 'nombre_desc':
        orderBy = { nombre: 'desc' };
        break;
      case 'destacados':
      case 'recientes':
      default:
        orderBy = { id_producto: 'desc' };
        break;
    }

    // Consulta en base de datos con paginación
    const [total, productos] = await Promise.all([
      this.prisma.producto.count({ where }),
      this.prisma.producto.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          categoria: {
            select: { id_categoria: true, nombre: true },
          },
          coleccion: {
            select: {
              id_coleccion: true,
              nombre: true,
              temporada: {
                select: { id_temporada: true, nombre: true },
              },
            },
          },
          imagen_producto: {
            orderBy: [{ es_principal: 'desc' }, { orden: 'asc' }],
          },
          producto_variante: {
            where: { estado: 'activo' },
            include: {
              talla: { select: { id_talla: true, codigo: true } },
              color: { select: { id_color: true, nombre: true, codigo_hex: true } },
            },
          },
          promocion_producto: {
            include: {
              promocion: true,
            },
          },
        },
      }),
    ]);

    // Transformación de los datos para consumo limpio en frontend
    const formattedProducts = productos.map((p) => {
      const precioBase = Number(p.precio_base);

      // Calcular la mejor promoción activa
      let mejorDescuento = 0;
      let promocionAplicada: any = null;

      for (const pp of p.promocion_producto) {
        const promo = pp.promocion;
        if (
          promo.estado === 'activo' &&
          new Date(promo.fecha_inicio) <= now &&
          new Date(promo.fecha_fin) >= now &&
          (promo.limite_usos === null || promo.usos_actuales < promo.limite_usos)
        ) {
          const valor = Number(promo.valor_descuento);
          let desc = 0;
          if (promo.tipo_descuento.toLowerCase() === 'porcentaje') {
            desc = (precioBase * valor) / 100;
          } else {
            desc = valor;
          }

          if (desc > mejorDescuento) {
            mejorDescuento = desc;
            promocionAplicada = {
              id_promocion: promo.id_promocion,
              nombre: promo.nombre,
              tipo_descuento: promo.tipo_descuento,
              valor_descuento: valor,
            };
          }
        }
      }

      const precioFinal = Math.max(0, precioBase - mejorDescuento);
      const tieneDescuento = mejorDescuento > 0;
      const descuentoPorcentaje = tieneDescuento
        ? Math.round((mejorDescuento / precioBase) * 100)
        : 0;

      // Imagen principal
      const imagenPrincipal =
        p.imagen_producto.find((img) => img.es_principal)?.url ||
        p.imagen_producto[0]?.url ||
        null;

      // Lista de colores únicos
      const colorMap = new Map<number, { id_color: number; nombre: string; codigo_hex: string | null }>();
      // Lista de tallas únicas
      const tallaMap = new Map<number, { id_talla: number; codigo: string }>();

      for (const v of p.producto_variante) {
        if (v.color && !colorMap.has(v.color.id_color)) {
          colorMap.set(v.color.id_color, v.color);
        }
        if (v.talla && !tallaMap.has(v.talla.id_talla)) {
          tallaMap.set(v.talla.id_talla, v.talla);
        }
      }

      return {
        id_producto: p.id_producto,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio_base: precioBase,
        precio_final: Number(precioFinal.toFixed(2)),
        tiene_descuento: tieneDescuento,
        descuento_porcentaje: descuentoPorcentaje,
        promocion: promocionAplicada,
        genero: p.genero,
        categoria: p.categoria
          ? { id_categoria: p.categoria.id_categoria, nombre: p.categoria.nombre }
          : null,
        coleccion: p.coleccion
          ? {
              id_coleccion: p.coleccion.id_coleccion,
              nombre: p.coleccion.nombre,
              temporada: p.coleccion.temporada?.nombre || null,
            }
          : null,
        imagen_principal: imagenPrincipal,
        imagenes: p.imagen_producto.map((img) => ({
          id_imagen_producto: img.id_imagen_producto,
          url: img.url,
          es_principal: img.es_principal,
        })),
        disponible: p.producto_variante.length > 0,
        total_variantes: p.producto_variante.length,
        colores_disponibles: Array.from(colorMap.values()),
        tallas_disponibles: Array.from(tallaMap.values()),
      };
    });

    return {
      data: formattedProducts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Obtiene metadatos para poblar dinámicamente los filtros de la interfaz
   */
  async getFilterMetadata() {
    const [categorias, colecciones, tallas, colores, precios] = await Promise.all([
      this.prisma.categoria.findMany({
        select: {
          id_categoria: true,
          nombre: true,
          _count: {
            select: { producto: { where: { estado: 'activo' } } },
          },
        },
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.coleccion.findMany({
        select: {
          id_coleccion: true,
          nombre: true,
          temporada: {
            select: { id_temporada: true, nombre: true },
          },
        },
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.talla.findMany({
        select: { id_talla: true, codigo: true },
        orderBy: { id_talla: 'asc' },
      }),
      this.prisma.color.findMany({
        select: { id_color: true, nombre: true, codigo_hex: true },
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.producto.aggregate({
        where: { estado: 'activo' },
        _min: { precio_base: true },
        _max: { precio_base: true },
      }),
    ]);

    return {
      categorias: categorias.map((c) => ({
        id_categoria: c.id_categoria,
        nombre: c.nombre,
        total_productos: c._count.producto,
      })),
      colecciones: colecciones.map((col) => ({
        id_coleccion: col.id_coleccion,
        nombre: col.nombre,
        temporada: col.temporada?.nombre || null,
      })),
      tallas: tallas.map((t) => ({
        id_talla: t.id_talla,
        codigo: t.codigo,
      })),
      colores: colores.map((c) => ({
        id_color: c.id_color,
        nombre: c.nombre,
        codigo_hex: c.codigo_hex,
      })),
      generos: ['Mujer', 'Hombre', 'Unisex', 'Niños'],
      precio_rango: {
        min: Number(precios._min.precio_base || 0),
        max: Number(precios._max.precio_base || 1000),
      },
    };
  }
}
