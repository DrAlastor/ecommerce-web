/**
 * @caso-de-uso CU10 — Gestionar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Control/Service de dominio — Backend
 * @responsabilidad Ejecuta las reglas del negocio y coordina persistencia, auditoría e integraciones del caso de uso.
 * @secuencia Administrador -> administración de catálogo -> controlador de productos -> servicio de catálogo -> Producto/Variante/Categoría/Colección/Promoción.
 */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import {
  QueryAdminProductsDto,
  CreateProductDto,
  UpdateProductDto,
  CreateVariantDto,
  UpdateVariantDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateSizeDto,
  CreateColorDto,
  UpdateColorDto,
  CreateSeasonDto,
  UpdateSeasonDto,
  CreateCollectionDto,
  UpdateCollectionDto,
  CreateSizeGuideDto,
  UpdateSizeGuideDto,
  CreatePromotionDto,
  UpdatePromotionDto,
  CreateProductImageDto,
} from './dto/catalog-admin.dto.js';

@Injectable()
export class CatalogAdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // METADATA HELPER
  // ==========================================

  /**
   * Obtiene en paralelo las listas maestras de referencia necesarias para alimentar formularios de administración:
   * Categorías, Tallas, Colores, Temporadas y Colecciones.
   *
   * @returns {Promise<Object>} Listas de entidades maestras para selección en interfaces de usuario.
   */
  async getMetadata() {
    const [categories, sizes, colors, seasons, collections] = await Promise.all([
      this.prisma.categoria.findMany({
        select: { id_categoria: true, nombre: true, id_categoria_padre: true },
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
      this.prisma.temporada.findMany({
        select: { id_temporada: true, nombre: true, fecha_inicio: true, fecha_fin: true, estado: true },
        orderBy: { fecha_inicio: 'desc' },
      }),
      this.prisma.coleccion.findMany({
        select: {
          id_coleccion: true,
          nombre: true,
          id_temporada: true,
          temporada: { select: { nombre: true } },
        },
        orderBy: { nombre: 'asc' },
      }),
    ]);

    return {
      categories,
      sizes,
      colors,
      seasons,
      collections,
    };
  }

  // ==========================================
  // PRODUCTS CRUD
  // ==========================================

  /**
   * Consulta productos con paginación y filtros administrativos avanzados:
   * término de búsqueda libre en nombre/descripción, categoría, colección, género y estado.
   * Transforma las promociones activas e incluye las variantes y la imagen principal.
   *
   * @param {QueryAdminProductsDto} query - Criterios de filtrado y parámetros de paginación (página, límite).
   * @returns {Promise<Object>} Lista paginada de productos formateados y metadatos de paginación.
   */
  async findAllProducts(query: QueryAdminProductsDto) {
    const { search, id_categoria, id_coleccion, genero, estado, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (estado) {
      where.estado = estado;
    }

    if (id_categoria) {
      where.id_categoria = id_categoria;
    }

    if (id_coleccion) {
      where.id_coleccion = id_coleccion;
    }

    if (genero && genero !== 'todos') {
      where.genero = { equals: genero, mode: 'insensitive' };
    }

    if (search && search.trim() !== '') {
      const term = search.trim();
      where.OR = [
        { nombre: { contains: term, mode: 'insensitive' } },
        { descripcion: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, products] = await Promise.all([
      this.prisma.producto.count({ where }),
      this.prisma.producto.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id_producto: 'desc' },
        include: {
          categoria: {
            select: { id_categoria: true, nombre: true },
          },
          coleccion: {
            select: { id_coleccion: true, nombre: true },
          },
          imagen_producto: {
            select: { id_imagen_producto: true, url: true, es_principal: true, orden: true },
            orderBy: [{ es_principal: 'desc' }, { orden: 'asc' }],
          },
          producto_variante: {
            select: {
              id_producto_variante: true,
              sku: true,
              imagen_url: true,
              precio_adicional: true,
              modelo_3d_url: true,
              estado: true,
              talla: { select: { id_talla: true, codigo: true } },
              color: { select: { id_color: true, nombre: true, codigo_hex: true } },
            },
          },
          promocion_producto: {
            include: {
              promocion: {
                select: {
                  id_promocion: true,
                  nombre: true,
                  tipo_descuento: true,
                  valor_descuento: true,
                  fecha_fin: true,
                  estado: true,
                },
              },
            },
          },
          _count: {
            select: {
              producto_variante: true,
              imagen_producto: true,
            },
          },
        },
      }),
    ]);

    const items = products.map((p: any) => {
      // Imagen representativa
      const mainImg =
        p.imagen_producto.find((img: any) => img.es_principal)?.url ||
        p.imagen_producto[0]?.url ||
        p.producto_variante.find((v: any) => v.imagen_url)?.imagen_url ||
        '';

      const activePromo = p.promocion_producto
        .map((pp: any) => pp.promocion)
        .find((pr: any) => pr.estado === 'activo' && new Date(pr.fecha_fin) >= new Date());

      return {
        id_producto: p.id_producto,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio_base: Number(p.precio_base),
        genero: p.genero,
        estado: p.estado,
        categoria: p.categoria,
        coleccion: p.coleccion,
        imagen_principal: mainImg,
        total_variantes: p._count.producto_variante,
        total_imagenes: p._count.imagen_producto,
        variantes: p.producto_variante.map((v: any) => ({
          ...v,
          precio_adicional: Number(v.precio_adicional),
        })),
        promocion_activa: activePromo
          ? {
              id_promocion: activePromo.id_promocion,
              nombre: activePromo.nombre,
              tipo_descuento: activePromo.tipo_descuento,
              valor_descuento: Number(activePromo.valor_descuento),
            }
          : null,
      };
    });

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Busca un producto por su clave primaria, recuperando relaciones completas (categoría, colección,
   * temporada, imágenes ordenadas, variantes con stock total consolidado y promociones asociadas).
   *
   * @param {number} id - ID del producto.
   * @returns {Promise<Object>} Registro detallado del producto con sus variantes y stock.
   * @throws {NotFoundException} Si el producto no existe en el sistema.
   */
  async findProductById(id: number) {
    const p = await this.prisma.producto.findUnique({
      where: { id_producto: id },
      include: {
        categoria: true,
        coleccion: {
          include: { temporada: true },
        },
        imagen_producto: {
          orderBy: [{ es_principal: 'desc' }, { orden: 'asc' }],
        },
        producto_variante: {
          include: {
            talla: true,
            color: true,
            inventario_sucursal: {
              include: { sucursal: { select: { id_sucursal: true, nombre: true } } },
            },
          },
          orderBy: { id_producto_variante: 'asc' },
        },
        promocion_producto: {
          include: { promocion: true },
        },
      },
    });

    if (!p) {
      throw new NotFoundException(`El producto con ID ${id} no existe.`);
    }

    return {
      ...p,
      precio_base: Number(p.precio_base),
      producto_variante: p.producto_variante.map((v: any) => ({
        ...v,
        precio_adicional: Number(v.precio_adicional),
        stock_total: v.inventario_sucursal.reduce((acc: number, curr: any) => acc + curr.stock_disponible, 0),
      })),
    };
  }

  /**
   * Crea un nuevo producto base:
   * 1. Valida existencia de categoría y colección asociada (si se especifica).
   * 2. Calcula correlativo manual de ID para compatibilidad con el esquema.
   * 3. Registra el producto con sus atributos iniciales.
   *
   * @param {CreateProductDto} dto - Datos de entrada para la creación del producto.
   * @returns {Promise<Object>} Producto creado con su precio base normalizado a número.
   * @throws {BadRequestException} Si la categoría o colección no existen.
   */
  async createProduct(dto: CreateProductDto) {
    // Validar categoría
    const cat = await this.prisma.categoria.findUnique({
      where: { id_categoria: dto.id_categoria },
    });
    if (!cat) {
      throw new BadRequestException(`La categoría con ID ${dto.id_categoria} no existe.`);
    }

    // Validar colección si se proporciona
    if (dto.id_coleccion) {
      const col = await this.prisma.coleccion.findUnique({
        where: { id_coleccion: dto.id_coleccion },
      });
      if (!col) {
        throw new BadRequestException(`La colección con ID ${dto.id_coleccion} no existe.`);
      }
    }

    // Generar ID
    const max = await this.prisma.producto.aggregate({ _max: { id_producto: true } });
    const nextId = (max._max.id_producto || 0) + 1;

    const created = await this.prisma.producto.create({
      data: {
        id_producto: nextId,
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || null,
        precio_base: dto.precio_base,
        genero: dto.genero || 'Unisex',
        estado: dto.estado || 'activo',
        id_categoria: dto.id_categoria,
        id_coleccion: dto.id_coleccion || null,
      },
      include: {
        categoria: true,
        coleccion: true,
      },
    });

    return {
      message: 'Producto creado exitosamente.',
      data: {
        ...created,
        precio_base: Number(created.precio_base),
      },
    };
  }

  /**
   * Actualiza parcialmente la información comercial, clasificación o precio de un producto.
   *
   * @param {number} id - ID del producto a actualizar.
   * @param {UpdateProductDto} dto - Campos modificados del producto.
   * @returns {Promise<Object>} Producto actualizado con precio numérico.
   * @throws {NotFoundException} Si el producto no existe.
   * @throws {BadRequestException} Si la nueva categoría o colección no existen.
   */
  async updateProduct(id: number, dto: UpdateProductDto) {
    const existing = await this.prisma.producto.findUnique({ where: { id_producto: id } });
    if (!existing) {
      throw new NotFoundException(`El producto con ID ${id} no existe.`);
    }

    if (dto.id_categoria) {
      const cat = await this.prisma.categoria.findUnique({
        where: { id_categoria: dto.id_categoria },
      });
      if (!cat) {
        throw new BadRequestException(`La categoría con ID ${dto.id_categoria} no existe.`);
      }
    }

    if (dto.id_coleccion) {
      const col = await this.prisma.coleccion.findUnique({
        where: { id_coleccion: dto.id_coleccion },
      });
      if (!col) {
        throw new BadRequestException(`La colección con ID ${dto.id_coleccion} no existe.`);
      }
    }

    const updated = await this.prisma.producto.update({
      where: { id_producto: id },
      data: {
        nombre: dto.nombre !== undefined ? dto.nombre.trim() : undefined,
        descripcion: dto.descripcion !== undefined ? dto.descripcion?.trim() || null : undefined,
        precio_base: dto.precio_base !== undefined ? dto.precio_base : undefined,
        genero: dto.genero !== undefined ? dto.genero : undefined,
        estado: dto.estado !== undefined ? dto.estado : undefined,
        id_categoria: dto.id_categoria !== undefined ? dto.id_categoria : undefined,
        id_coleccion: dto.id_coleccion !== undefined ? dto.id_coleccion : undefined,
      },
      include: {
        categoria: true,
        coleccion: true,
      },
    });

    return {
      message: 'Producto actualizado exitosamente.',
      data: {
        ...updated,
        precio_base: Number(updated.precio_base),
      },
    };
  }

  /**
   * Modifica el estado operativo (activo / inactivo) de un producto en catálogo.
   *
   * @param {number} id - ID del producto.
   * @param {'activo' | 'inactivo'} estado - Nuevo estado asignado.
   * @returns {Promise<Object>} Mensaje de éxito y entidad actualizada.
   * @throws {NotFoundException} Si el producto no existe.
   */
  async toggleProductStatus(id: number, estado: 'activo' | 'inactivo') {
    const existing = await this.prisma.producto.findUnique({ where: { id_producto: id } });
    if (!existing) {
      throw new NotFoundException(`El producto con ID ${id} no existe.`);
    }

    const updated = await this.prisma.producto.update({
      where: { id_producto: id },
      data: { estado },
    });

    return {
      message: `Estado del producto cambiado a "${estado}".`,
      data: updated,
    };
  }

  // ==========================================
  // VARIANTS CRUD
  // ==========================================

  /**
   * Obtiene la totalidad de variantes registradas para un producto, calculando la sumatoria de stock
   * disponible en todas las sucursales físicas.
   *
   * @param {number} productId - ID del producto padre.
   * @returns {Promise<Array>} Lista de variantes con tallas, colores, precios calculados y stock total.
   */
  async findVariantsByProduct(productId: number) {
    const variants = await this.prisma.producto_variante.findMany({
      where: { id_producto: productId },
      include: {
        talla: true,
        color: true,
        inventario_sucursal: {
          select: { stock_disponible: true },
        },
      },
      orderBy: { id_producto_variante: 'asc' },
    });

    return variants.map((v: any) => ({
      ...v,
      precio_adicional: Number(v.precio_adicional),
      total_stock: v.inventario_sucursal.reduce((acc: number, curr: any) => acc + curr.stock_disponible, 0),
    }));
  }

  /**
   * Crea una nueva variante física para un producto:
   * 1. Verifica existencia del producto, talla y color.
   * 2. Comprueba que el código SKU no esté duplicado en la base de datos.
   * 3. Garantiza que la combinación específica [id_producto, id_talla, id_color] sea única.
   * 4. Registra la variante con su precio adicional y enlace a modelo 3D.
   *
   * @param {number} productId - ID del producto al que se añade la variante.
   * @param {CreateVariantDto} dto - Datos de la variante (SKU, talla, color, precio adicional, modelo 3D).
   * @returns {Promise<Object>} Variante creada con relaciones.
   * @throws {NotFoundException} Si el producto no existe.
   * @throws {BadRequestException} Si la talla o el color no existen.
   * @throws {ConflictException} Si el SKU o la combinación talla/color ya existen.
   */
  async createVariant(productId: number, dto: CreateVariantDto) {
    // Validar existencia de producto
    const prod = await this.prisma.producto.findUnique({ where: { id_producto: productId } });
    if (!prod) {
      throw new NotFoundException(`El producto con ID ${productId} no existe.`);
    }

    // Validar talla y color
    const [talla, color] = await Promise.all([
      this.prisma.talla.findUnique({ where: { id_talla: dto.id_talla } }),
      this.prisma.color.findUnique({ where: { id_color: dto.id_color } }),
    ]);
    if (!talla) throw new BadRequestException(`La talla con ID ${dto.id_talla} no existe.`);
    if (!color) throw new BadRequestException(`El color con ID ${dto.id_color} no existe.`);

    // Validar SKU único
    const skuConflict = await this.prisma.producto_variante.findUnique({
      where: { sku: dto.sku.trim() },
    });
    if (skuConflict) {
      throw new ConflictException(`El SKU "${dto.sku}" ya se encuentra registrado.`);
    }

    // Validar combinación única [id_producto, id_talla, id_color]
    const comboConflict = await this.prisma.producto_variante.findUnique({
      where: {
        id_producto_id_talla_id_color: {
          id_producto: productId,
          id_talla: dto.id_talla,
          id_color: dto.id_color,
        },
      },
    });
    if (comboConflict) {
      throw new ConflictException(
        `Ya existe una variante de talla "${talla.codigo}" y color "${color.nombre}" para este producto.`,
      );
    }

    const max = await this.prisma.producto_variante.aggregate({
      _max: { id_producto_variante: true },
    });
    const nextId = (max._max.id_producto_variante || 0) + 1;

    const created = await this.prisma.producto_variante.create({
      data: {
        id_producto_variante: nextId,
        id_producto: productId,
        id_talla: dto.id_talla,
        id_color: dto.id_color,
        sku: dto.sku.trim(),
        precio_adicional: dto.precio_adicional || 0,
        modelo_3d_url: dto.modelo_3d_url?.trim() || null,
        imagen_url: dto.imagen_url?.trim() || null,
        estado: dto.estado || 'activo',
      },
      include: {
        talla: true,
        color: true,
      },
    });

    return {
      message: 'Variante creada exitosamente.',
      data: {
        ...created,
        precio_adicional: Number(created.precio_adicional),
      },
    };
  }

  /**
   * Actualiza los atributos de una variante existente, asegurando la no duplicidad de SKU y combinación talla/color.
   *
   * @param {number} id - ID de la variante a actualizar.
   * @param {UpdateVariantDto} dto - Datos modificados de la variante.
   * @returns {Promise<Object>} Variante actualizada con relaciones y precio adicional numérico.
   * @throws {NotFoundException} Si la variante no existe.
   * @throws {ConflictException} Si el SKU o la combinación de talla y color ya están en uso.
   */
  async updateVariant(id: number, dto: UpdateVariantDto) {
    const existing = await this.prisma.producto_variante.findUnique({
      where: { id_producto_variante: id },
    });
    if (!existing) {
      throw new NotFoundException(`La variante con ID ${id} no existe.`);
    }

    // Validar SKU único si cambia
    if (dto.sku && dto.sku.trim() !== existing.sku) {
      const skuConflict = await this.prisma.producto_variante.findUnique({
        where: { sku: dto.sku.trim() },
      });
      if (skuConflict) {
        throw new ConflictException(`El SKU "${dto.sku}" ya se encuentra registrado.`);
      }
    }

    // Validar combinación talla/color si cambia
    const targetTalla = dto.id_talla !== undefined ? dto.id_talla : existing.id_talla;
    const targetColor = dto.id_color !== undefined ? dto.id_color : existing.id_color;

    if (targetTalla !== existing.id_talla || targetColor !== existing.id_color) {
      const comboConflict = await this.prisma.producto_variante.findUnique({
        where: {
          id_producto_id_talla_id_color: {
            id_producto: existing.id_producto,
            id_talla: targetTalla,
            id_color: targetColor,
          },
        },
      });
      if (comboConflict && comboConflict.id_producto_variante !== id) {
        throw new ConflictException(
          'Ya existe otra variante para este producto con esa misma combinación de talla y color.',
        );
      }
    }

    const updated = await this.prisma.producto_variante.update({
      where: { id_producto_variante: id },
      data: {
        sku: dto.sku !== undefined ? dto.sku.trim() : undefined,
        id_talla: dto.id_talla !== undefined ? dto.id_talla : undefined,
        id_color: dto.id_color !== undefined ? dto.id_color : undefined,
        precio_adicional: dto.precio_adicional !== undefined ? dto.precio_adicional : undefined,
        modelo_3d_url: dto.modelo_3d_url !== undefined ? dto.modelo_3d_url?.trim() || null : undefined,
        imagen_url: dto.imagen_url !== undefined ? dto.imagen_url?.trim() || null : undefined,
        estado: dto.estado !== undefined ? dto.estado : undefined,
      },
      include: {
        talla: true,
        color: true,
      },
    });

    return {
      message: 'Variante actualizada exitosamente.',
      data: {
        ...updated,
        precio_adicional: Number(updated.precio_adicional),
      },
    };
  }

  /**
   * Cambia el estado de activación (activo / inactivo) de una variante.
   *
   * @param {number} id - ID de la variante.
   * @param {'activo' | 'inactivo'} estado - Nuevo estado asignado.
   * @returns {Promise<Object>} Mensaje y variante actualizada.
   * @throws {NotFoundException} Si la variante no existe.
   */
  async toggleVariantStatus(id: number, estado: 'activo' | 'inactivo') {
    const existing = await this.prisma.producto_variante.findUnique({
      where: { id_producto_variante: id },
    });
    if (!existing) {
      throw new NotFoundException(`La variante con ID ${id} no existe.`);
    }

    const updated = await this.prisma.producto_variante.update({
      where: { id_producto_variante: id },
      data: { estado },
    });

    return {
      message: `Estado de la variante cambiado a "${estado}".`,
      data: updated,
    };
  }

  // ==========================================
  // CATEGORIES CRUD
  // ==========================================

  /**
   * Obtiene la jerarquía completa de categorías comerciales con conteos de subcategorías, productos y guías de tallas.
   *
   * @returns {Promise<Array>} Lista de categorías con métricas agregadas.
   */
  async findAllCategories() {
    const categories = await this.prisma.categoria.findMany({
      include: {
        categoria: { select: { id_categoria: true, nombre: true } },
        _count: {
          select: {
            other_categoria: true,
            producto: true,
            guia_talla: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return categories.map((c: any) => ({
      id_categoria: c.id_categoria,
      nombre: c.nombre,
      descripcion: c.descripcion,
      id_categoria_padre: c.id_categoria_padre,
      categoria_padre_nombre: c.categoria?.nombre || null,
      total_subcategorias: c._count.other_categoria,
      total_productos: c._count.producto,
      total_guias: c._count.guia_talla,
    }));
  }

  /**
   * Crea una nueva categoría en el catálogo, opcionalmente asignando una categoría padre jerárquica.
   *
   * @param {CreateCategoryDto} dto - Datos de la categoría (nombre, descripción, ID de categoría padre).
   * @returns {Promise<Object>} Categoría creada.
   * @throws {BadRequestException} Si la categoría padre no existe.
   */
  async createCategory(dto: CreateCategoryDto) {
    if (dto.id_categoria_padre) {
      const parent = await this.prisma.categoria.findUnique({
        where: { id_categoria: dto.id_categoria_padre },
      });
      if (!parent) {
        throw new BadRequestException(`La categoría padre con ID ${dto.id_categoria_padre} no existe.`);
      }
    }

    const max = await this.prisma.categoria.aggregate({ _max: { id_categoria: true } });
    const nextId = (max._max.id_categoria || 0) + 1;

    const created = await this.prisma.categoria.create({
      data: {
        id_categoria: nextId,
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || null,
        id_categoria_padre: dto.id_categoria_padre || null,
      },
    });

    return {
      message: 'Categoría creada exitosamente.',
      data: created,
    };
  }

  /**
   * Actualiza el nombre, descripción o jerarquía de una categoría, previniendo ciclos padre-hijo autorreferenciales.
   *
   * @param {number} id - ID de la categoría a actualizar.
   * @param {UpdateCategoryDto} dto - Datos a modificar.
   * @returns {Promise<Object>} Categoría actualizada.
   * @throws {NotFoundException} Si la categoría no existe.
   * @throws {BadRequestException} Si la categoría intenta ser padre de sí misma o la padre no existe.
   */
  async updateCategory(id: number, dto: UpdateCategoryDto) {
    const existing = await this.prisma.categoria.findUnique({ where: { id_categoria: id } });
    if (!existing) {
      throw new NotFoundException(`La categoría con ID ${id} no existe.`);
    }

    if (dto.id_categoria_padre) {
      if (dto.id_categoria_padre === id) {
        throw new BadRequestException('Una categoría no puede ser padre de sí misma.');
      }
      const parent = await this.prisma.categoria.findUnique({
        where: { id_categoria: dto.id_categoria_padre },
      });
      if (!parent) {
        throw new BadRequestException(`La categoría padre con ID ${dto.id_categoria_padre} no existe.`);
      }
    }

    const updated = await this.prisma.categoria.update({
      where: { id_categoria: id },
      data: {
        nombre: dto.nombre !== undefined ? dto.nombre.trim() : undefined,
        descripcion: dto.descripcion !== undefined ? dto.descripcion?.trim() || null : undefined,
        id_categoria_padre:
          dto.id_categoria_padre !== undefined ? dto.id_categoria_padre : undefined,
      },
    });

    return {
      message: 'Categoría actualizada exitosamente.',
      data: updated,
    };
  }

  /**
   * Elimina una categoría si no contiene productos ni subcategorías activas vinculadas.
   *
   * @param {number} id - ID de la categoría a eliminar.
   * @returns {Promise<Object>} Confirmación de eliminación.
   * @throws {NotFoundException} Si la categoría no existe.
   * @throws {ConflictException} Si tiene productos o subcategorías asociadas.
   */
  async deleteCategory(id: number) {
    const existing = await this.prisma.categoria.findUnique({
      where: { id_categoria: id },
      include: {
        _count: {
          select: { producto: true, other_categoria: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`La categoría con ID ${id} no existe.`);
    }

    if (existing._count.producto > 0 || existing._count.other_categoria > 0) {
      throw new ConflictException(
        `No se puede eliminar la categoría porque tiene ${existing._count.producto} productos y ${existing._count.other_categoria} subcategorías asociadas.`,
      );
    }

    await this.prisma.categoria.delete({ where: { id_categoria: id } });

    return { message: 'Categoría eliminada exitosamente.' };
  }

  // ==========================================
  // SIZES CRUD
  // ==========================================

  /**
   * Obtiene la totalidad de tallas registradas en el sistema con el conteo de variantes asociadas.
   *
   * @returns {Promise<Array>} Lista de tallas ordenadas por ID ascendente.
   */
  async findAllSizes() {
    return this.prisma.talla.findMany({
      include: {
        _count: { select: { producto_variante: true } },
      },
      orderBy: { id_talla: 'asc' },
    });
  }

  /**
   * Registra una nueva talla asegurando que no exista un código repetido en mayúsculas.
   *
   * @param {CreateSizeDto} dto - Datos de la talla (código alfanumérico, ej. "M", "38").
   * @returns {Promise<Object>} Talla registrada.
   * @throws {ConflictException} Si el código de talla ya existe.
   */
  async createSize(dto: CreateSizeDto) {
    const codigo = dto.codigo.trim().toUpperCase();
    const conflict = await this.prisma.talla.findUnique({ where: { codigo } });
    if (conflict) {
      throw new ConflictException(`La talla con código "${codigo}" ya existe.`);
    }

    const max = await this.prisma.talla.aggregate({ _max: { id_talla: true } });
    const nextId = (max._max.id_talla || 0) + 1;

    const created = await this.prisma.talla.create({
      data: {
        id_talla: nextId,
        codigo,
      },
    });

    return {
      message: 'Talla creada exitosamente.',
      data: created,
    };
  }

  /**
   * Elimina una talla si no está asignada a ninguna variante de producto existente.
   *
   * @param {number} id - ID de la talla.
   * @returns {Promise<Object>} Confirmación de eliminación.
   * @throws {NotFoundException} Si la talla no existe.
   * @throws {ConflictException} Si hay variantes usando esta talla.
   */
  async deleteSize(id: number) {
    const existing = await this.prisma.talla.findUnique({
      where: { id_talla: id },
      include: { _count: { select: { producto_variante: true } } },
    });
    if (!existing) throw new NotFoundException(`La talla con ID ${id} no existe.`);

    if (existing._count.producto_variante > 0) {
      throw new ConflictException(
        `No se puede eliminar la talla porque está siendo utilizada en ${existing._count.producto_variante} variantes de productos.`,
      );
    }

    await this.prisma.talla.delete({ where: { id_talla: id } });
    return { message: 'Talla eliminada exitosamente.' };
  }

  // ==========================================
  // COLORS CRUD
  // ==========================================

  /**
   * Obtiene la totalidad de colores comerciales registrados junto con el conteo de variantes asociadas.
   *
   * @returns {Promise<Array>} Lista de colores ordenados alfabéticamente.
   */
  async findAllColors() {
    return this.prisma.color.findMany({
      include: {
        _count: { select: { producto_variante: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  /**
   * Registra un nuevo color para su utilización en variantes.
   *
   * @param {CreateColorDto} dto - Nombre y código hexadecimal del color.
   * @returns {Promise<Object>} Color creado.
   */
  async createColor(dto: CreateColorDto) {
    const max = await this.prisma.color.aggregate({ _max: { id_color: true } });
    const nextId = (max._max.id_color || 0) + 1;

    const created = await this.prisma.color.create({
      data: {
        id_color: nextId,
        nombre: dto.nombre.trim(),
        codigo_hex: dto.codigo_hex?.trim() || null,
      },
    });

    return {
      message: 'Color creado exitosamente.',
      data: created,
    };
  }

  /**
   * Actualiza el nombre o código hexadecimal de un color existente.
   *
   * @param {number} id - ID del color.
   * @param {UpdateColorDto} dto - Campos modificados.
   * @returns {Promise<Object>} Color actualizado.
   * @throws {NotFoundException} Si el color no existe.
   */
  async updateColor(id: number, dto: UpdateColorDto) {
    const existing = await this.prisma.color.findUnique({ where: { id_color: id } });
    if (!existing) throw new NotFoundException(`El color con ID ${id} no existe.`);

    const updated = await this.prisma.color.update({
      where: { id_color: id },
      data: {
        nombre: dto.nombre !== undefined ? dto.nombre.trim() : undefined,
        codigo_hex: dto.codigo_hex !== undefined ? dto.codigo_hex?.trim() || null : undefined,
      },
    });

    return {
      message: 'Color actualizado exitosamente.',
      data: updated,
    };
  }

  /**
   * Elimina un color si no está vinculado a variantes de productos activas.
   *
   * @param {number} id - ID del color.
   * @returns {Promise<Object>} Confirmación de eliminación.
   * @throws {NotFoundException} Si el color no existe.
   * @throws {ConflictException} Si hay variantes usando este color.
   */
  async deleteColor(id: number) {
    const existing = await this.prisma.color.findUnique({
      where: { id_color: id },
      include: { _count: { select: { producto_variante: true } } },
    });
    if (!existing) throw new NotFoundException(`El color con ID ${id} no existe.`);

    if (existing._count.producto_variante > 0) {
      throw new ConflictException(
        `No se puede eliminar el color porque está siendo utilizado en ${existing._count.producto_variante} variantes de productos.`,
      );
    }

    await this.prisma.color.delete({ where: { id_color: id } });
    return { message: 'Color eliminado exitosamente.' };
  }

  // ==========================================
  // SEASONS & COLLECTIONS CRUD
  // ==========================================

  /**
   * Lista todas las temporadas cronológicas registradas con el conteo de colecciones vinculadas.
   *
   * @returns {Promise<Array>} Temporadas ordenadas por fecha de inicio descendente.
   */
  async findAllSeasons() {
    return this.prisma.temporada.findMany({
      include: {
        _count: { select: { coleccion: true } },
      },
      orderBy: { fecha_inicio: 'desc' },
    });
  }

  /**
   * Crea una nueva temporada de moda, validando coherencia de fechas cronológicas.
   *
   * @param {CreateSeasonDto} dto - Datos de la temporada (nombre, fecha_inicio, fecha_fin, estado).
   * @returns {Promise<Object>} Temporada creada.
   * @throws {BadRequestException} Si la fecha de inicio es posterior a la de finalización.
   */
  async createSeason(dto: CreateSeasonDto) {
    if (new Date(dto.fecha_inicio) > new Date(dto.fecha_fin)) {
      throw new BadRequestException('La fecha de inicio no puede ser posterior a la fecha de finalización.');
    }

    const max = await this.prisma.temporada.aggregate({ _max: { id_temporada: true } });
    const nextId = (max._max.id_temporada || 0) + 1;

    const created = await this.prisma.temporada.create({
      data: {
        id_temporada: nextId,
        nombre: dto.nombre.trim(),
        fecha_inicio: new Date(dto.fecha_inicio),
        fecha_fin: new Date(dto.fecha_fin),
        estado: dto.estado || 'activo',
      },
    });

    return {
      message: 'Temporada creada exitosamente.',
      data: created,
    };
  }

  /**
   * Actualiza el rango temporal o estado de una temporada existente.
   *
   * @param {number} id - ID de la temporada.
   * @param {UpdateSeasonDto} dto - Datos modificados.
   * @returns {Promise<Object>} Temporada actualizada.
   * @throws {NotFoundException} Si la temporada no existe.
   * @throws {BadRequestException} Si el rango de fechas resulta inconsistente.
   */
  async updateSeason(id: number, dto: UpdateSeasonDto) {
    const existing = await this.prisma.temporada.findUnique({ where: { id_temporada: id } });
    if (!existing) throw new NotFoundException(`La temporada con ID ${id} no existe.`);

    const start = dto.fecha_inicio ? new Date(dto.fecha_inicio) : existing.fecha_inicio;
    const end = dto.fecha_fin ? new Date(dto.fecha_fin) : existing.fecha_fin;

    if (start > end) {
      throw new BadRequestException('La fecha de inicio no puede ser posterior a la fecha de finalización.');
    }

    const updated = await this.prisma.temporada.update({
      where: { id_temporada: id },
      data: {
        nombre: dto.nombre !== undefined ? dto.nombre.trim() : undefined,
        fecha_inicio: dto.fecha_inicio ? new Date(dto.fecha_inicio) : undefined,
        fecha_fin: dto.fecha_fin ? new Date(dto.fecha_fin) : undefined,
        estado: dto.estado !== undefined ? dto.estado : undefined,
      },
    });

    return {
      message: 'Temporada actualizada exitosamente.',
      data: updated,
    };
  }

  /**
   * Lista todas las colecciones temáticas con su temporada asociada y cantidad de productos.
   *
   * @returns {Promise<Array>} Colecciones registradas.
   */
  async findAllCollections() {
    return this.prisma.coleccion.findMany({
      include: {
        temporada: { select: { id_temporada: true, nombre: true } },
        _count: { select: { producto: true } },
      },
      orderBy: { id_coleccion: 'desc' },
    });
  }

  /**
   * Registra una nueva colección asociada opcionalmente a una temporada vigente.
   *
   * @param {CreateCollectionDto} dto - Datos de la colección.
   * @returns {Promise<Object>} Colección creada.
   * @throws {BadRequestException} Si la temporada especificada no existe.
   */
  async createCollection(dto: CreateCollectionDto) {
    if (dto.id_temporada) {
      const temp = await this.prisma.temporada.findUnique({
        where: { id_temporada: dto.id_temporada },
      });
      if (!temp) {
        throw new BadRequestException(`La temporada con ID ${dto.id_temporada} no existe.`);
      }
    }

    const max = await this.prisma.coleccion.aggregate({ _max: { id_coleccion: true } });
    const nextId = (max._max.id_coleccion || 0) + 1;

    const created = await this.prisma.coleccion.create({
      data: {
        id_coleccion: nextId,
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || null,
        id_temporada: dto.id_temporada || null,
      },
      include: { temporada: true },
    });

    return {
      message: 'Colección creada exitosamente.',
      data: created,
    };
  }

  /**
   * Modifica el nombre, descripción o temporada vinculada de una colección.
   *
   * @param {number} id - ID de la colección.
   * @param {UpdateCollectionDto} dto - Datos a modificar.
   * @returns {Promise<Object>} Colección actualizada.
   * @throws {NotFoundException} Si la colección no existe.
   * @throws {BadRequestException} Si la nueva temporada no existe.
   */
  async updateCollection(id: number, dto: UpdateCollectionDto) {
    const existing = await this.prisma.coleccion.findUnique({ where: { id_coleccion: id } });
    if (!existing) throw new NotFoundException(`La colección con ID ${id} no existe.`);

    if (dto.id_temporada) {
      const temp = await this.prisma.temporada.findUnique({
        where: { id_temporada: dto.id_temporada },
      });
      if (!temp) {
        throw new BadRequestException(`La temporada con ID ${dto.id_temporada} no existe.`);
      }
    }

    const updated = await this.prisma.coleccion.update({
      where: { id_coleccion: id },
      data: {
        nombre: dto.nombre !== undefined ? dto.nombre.trim() : undefined,
        descripcion: dto.descripcion !== undefined ? dto.descripcion?.trim() || null : undefined,
        id_temporada: dto.id_temporada !== undefined ? dto.id_temporada : undefined,
      },
      include: { temporada: true },
    });

    return {
      message: 'Colección actualizada exitosamente.',
      data: updated,
    };
  }

  /**
   * Elimina una colección si no contiene productos asociados.
   *
   * @param {number} id - ID de la colección.
   * @returns {Promise<Object>} Confirmación de eliminación.
   * @throws {NotFoundException} Si la colección no existe.
   * @throws {ConflictException} Si tiene productos asociados.
   */
  async deleteCollection(id: number) {
    const existing = await this.prisma.coleccion.findUnique({
      where: { id_coleccion: id },
      include: { _count: { select: { producto: true } } },
    });
    if (!existing) throw new NotFoundException(`La colección con ID ${id} no existe.`);

    if (existing._count.producto > 0) {
      throw new ConflictException(
        `No se puede eliminar la colección porque tiene ${existing._count.producto} productos asociados.`,
      );
    }

    await this.prisma.coleccion.delete({ where: { id_coleccion: id } });
    return { message: 'Colección eliminada exitosamente.' };
  }

  // ==========================================
  // SIZE GUIDES CRUD
  // ==========================================

  /**
   * Obtiene la tabla de medidas corporales y correspondencia de tallas, opcionalmente filtrada por categoría.
   *
   * @param {number} [categoryId] - Filtro opcional por ID de categoría de vestimenta.
   * @returns {Promise<Array>} Reglas de guía de tallas con valores numéricos en centímetros.
   */
  async findAllSizeGuides(categoryId?: number) {
    const where: any = {};
    if (categoryId) where.id_categoria = categoryId;

    const guides = await this.prisma.guia_talla.findMany({
      where,
      include: {
        categoria: { select: { id_categoria: true, nombre: true } },
      },
      orderBy: [{ id_categoria: 'asc' }, { parte_cuerpo: 'asc' }, { talla_etiqueta: 'asc' }],
    });

    return guides.map((g: any) => ({
      ...g,
      min_cm: Number(g.min_cm),
      max_cm: Number(g.max_cm),
    }));
  }

  /**
   * Crea una regla de guía de tallas (ej. Busto, Cintura, Cadera) para una categoría específica.
   *
   * @param {CreateSizeGuideDto} dto - Datos de la regla de medición (categoría, parte del cuerpo, talla, min_cm, max_cm).
   * @returns {Promise<Object>} Regla creada.
   * @throws {BadRequestException} Si min_cm >= max_cm o la categoría no existe.
   * @throws {ConflictException} Si ya existe una regla para esa misma combinación.
   */
  async createSizeGuide(dto: CreateSizeGuideDto) {
    if (dto.min_cm >= dto.max_cm) {
      throw new BadRequestException('El valor mínimo en cm debe ser estrictamente menor que el valor máximo.');
    }

    const cat = await this.prisma.categoria.findUnique({ where: { id_categoria: dto.id_categoria } });
    if (!cat) throw new BadRequestException(`La categoría con ID ${dto.id_categoria} no existe.`);

    const conflict = await this.prisma.guia_talla.findUnique({
      where: {
        id_categoria_parte_cuerpo_talla_etiqueta: {
          id_categoria: dto.id_categoria,
          parte_cuerpo: dto.parte_cuerpo.trim(),
          talla_etiqueta: dto.talla_etiqueta.trim(),
        },
      },
    });
    if (conflict) {
      throw new ConflictException(
        `Ya existe una guía registrada para la categoría "${cat.nombre}", zona "${dto.parte_cuerpo}" y talla "${dto.talla_etiqueta}".`,
      );
    }

    const max = await this.prisma.guia_talla.aggregate({ _max: { id_guia_talla: true } });
    const nextId = (max._max.id_guia_talla || 0) + 1;

    const created = await this.prisma.guia_talla.create({
      data: {
        id_guia_talla: nextId,
        id_categoria: dto.id_categoria,
        parte_cuerpo: dto.parte_cuerpo.trim(),
        talla_etiqueta: dto.talla_etiqueta.trim(),
        min_cm: dto.min_cm,
        max_cm: dto.max_cm,
      },
      include: { categoria: true },
    });

    return {
      message: 'Guía de talla creada exitosamente.',
      data: {
        ...created,
        min_cm: Number(created.min_cm),
        max_cm: Number(created.max_cm),
      },
    };
  }

  /**
   * Actualiza el rango de centímetros o etiqueta de una regla de guía de tallas.
   *
   * @param {number} id - ID de la regla de guía de talla.
   * @param {UpdateSizeGuideDto} dto - Datos modificados.
   * @returns {Promise<Object>} Regla actualizada.
   * @throws {NotFoundException} Si la regla no existe.
   * @throws {BadRequestException} Si el valor mínimo es mayor o igual al máximo.
   */
  async updateSizeGuide(id: number, dto: UpdateSizeGuideDto) {
    const existing = await this.prisma.guia_talla.findUnique({ where: { id_guia_talla: id } });
    if (!existing) throw new NotFoundException(`La guía de talla con ID ${id} no existe.`);

    const min = dto.min_cm !== undefined ? dto.min_cm : Number(existing.min_cm);
    const max = dto.max_cm !== undefined ? dto.max_cm : Number(existing.max_cm);

    if (min >= max) {
      throw new BadRequestException('El valor mínimo en cm debe ser estrictamente menor que el valor máximo.');
    }

    const updated = await this.prisma.guia_talla.update({
      where: { id_guia_talla: id },
      data: {
        parte_cuerpo: dto.parte_cuerpo !== undefined ? dto.parte_cuerpo.trim() : undefined,
        talla_etiqueta: dto.talla_etiqueta !== undefined ? dto.talla_etiqueta.trim() : undefined,
        min_cm: dto.min_cm !== undefined ? dto.min_cm : undefined,
        max_cm: dto.max_cm !== undefined ? dto.max_cm : undefined,
      },
      include: { categoria: true },
    });

    return {
      message: 'Guía de talla actualizada exitosamente.',
      data: {
        ...updated,
        min_cm: Number(updated.min_cm),
        max_cm: Number(updated.max_cm),
      },
    };
  }

  /**
   * Elimina un registro de guía de talla.
   *
   * @param {number} id - ID de la regla a eliminar.
   * @returns {Promise<Object>} Confirmación de eliminación.
   * @throws {NotFoundException} Si la regla no existe.
   */
  async deleteSizeGuide(id: number) {
    const existing = await this.prisma.guia_talla.findUnique({ where: { id_guia_talla: id } });
    if (!existing) throw new NotFoundException(`La guía de talla con ID ${id} no existe.`);

    await this.prisma.guia_talla.delete({ where: { id_guia_talla: id } });
    return { message: 'Guía de talla eliminada exitosamente.' };
  }

  // ==========================================
  // PROMOTIONS CRUD
  // ==========================================

  /**
   * Lista todas las promociones comerciales con sus productos asociados y valores de descuento numéricos.
   *
   * @returns {Promise<Array>} Campañas promocionales registradas.
   */
  async findAllPromotions() {
    const promos = await this.prisma.promocion.findMany({
      include: {
        promocion_producto: {
          include: {
            producto: { select: { id_producto: true, nombre: true } },
          },
        },
      },
      orderBy: { id_promocion: 'desc' },
    });

    return promos.map((pr: any) => ({
      ...pr,
      valor_descuento: Number(pr.valor_descuento),
      productos_asociados: pr.promocion_producto.map((pp: any) => pp.producto),
    }));
  }

  /**
   * Crea una nueva campaña de descuento promocional y vincula opcionalmente los productos participantes.
   *
   * @param {CreatePromotionDto} dto - Datos de la promoción (tipo, valor, vigencia, límite de usos, IDs de productos).
   * @returns {Promise<Object>} Promoción creada.
   * @throws {BadRequestException} Si el rango de fechas es inválido o el porcentaje supera 100%.
   */
  async createPromotion(dto: CreatePromotionDto) {
    if (new Date(dto.fecha_inicio) > new Date(dto.fecha_fin)) {
      throw new BadRequestException('La fecha de inicio no puede ser posterior a la fecha de finalización.');
    }

    if (dto.tipo_descuento === 'porcentaje' && dto.valor_descuento > 100) {
      throw new BadRequestException('El porcentaje de descuento no puede ser superior al 100%.');
    }

    const max = await this.prisma.promocion.aggregate({ _max: { id_promocion: true } });
    const nextId = (max._max.id_promocion || 0) + 1;

    const created = await this.prisma.promocion.create({
      data: {
        id_promocion: nextId,
        nombre: dto.nombre.trim(),
        limite_usos: dto.limite_usos || null,
        usos_actuales: 0,
        tipo_descuento: dto.tipo_descuento,
        valor_descuento: dto.valor_descuento,
        fecha_inicio: new Date(dto.fecha_inicio),
        fecha_fin: new Date(dto.fecha_fin),
        estado: dto.estado || 'activo',
      },
    });

    // Asociar productos si vienen en el payload
    if (dto.product_ids && dto.product_ids.length > 0) {
      await this.prisma.promocion_producto.createMany({
        data: dto.product_ids.map((prodId) => ({
          id_promocion: nextId,
          id_producto: prodId,
        })),
        skipDuplicates: true,
      });
    }

    return {
      message: 'Promoción creada exitosamente.',
      data: {
        ...created,
        valor_descuento: Number(created.valor_descuento),
      },
    };
  }

  /**
   * Actualiza las condiciones comerciales, vigencia temporal o estado de una promoción.
   *
   * @param {number} id - ID de la promoción.
   * @param {UpdatePromotionDto} dto - Datos modificados.
   * @returns {Promise<Object>} Promoción actualizada.
   * @throws {NotFoundException} Si la promoción no existe.
   * @throws {BadRequestException} Si las fechas o el porcentaje son inválidos.
   */
  async updatePromotion(id: number, dto: UpdatePromotionDto) {
    const existing = await this.prisma.promocion.findUnique({ where: { id_promocion: id } });
    if (!existing) throw new NotFoundException(`La promoción con ID ${id} no existe.`);

    const start = dto.fecha_inicio ? new Date(dto.fecha_inicio) : existing.fecha_inicio;
    const end = dto.fecha_fin ? new Date(dto.fecha_fin) : existing.fecha_fin;

    if (start > end) {
      throw new BadRequestException('La fecha de inicio no puede ser posterior a la fecha de finalización.');
    }

    const type = dto.tipo_descuento || existing.tipo_descuento;
    const val = dto.valor_descuento !== undefined ? dto.valor_descuento : Number(existing.valor_descuento);

    if (type === 'porcentaje' && val > 100) {
      throw new BadRequestException('El porcentaje de descuento no puede ser superior al 100%.');
    }

    const updated = await this.prisma.promocion.update({
      where: { id_promocion: id },
      data: {
        nombre: dto.nombre !== undefined ? dto.nombre.trim() : undefined,
        limite_usos: dto.limite_usos !== undefined ? dto.limite_usos : undefined,
        tipo_descuento: dto.tipo_descuento !== undefined ? dto.tipo_descuento : undefined,
        valor_descuento: dto.valor_descuento !== undefined ? dto.valor_descuento : undefined,
        fecha_inicio: dto.fecha_inicio ? new Date(dto.fecha_inicio) : undefined,
        fecha_fin: dto.fecha_fin ? new Date(dto.fecha_fin) : undefined,
        estado: dto.estado !== undefined ? dto.estado : undefined,
      },
    });

    return {
      message: 'Promoción actualizada exitosamente.',
      data: {
        ...updated,
        valor_descuento: Number(updated.valor_descuento),
      },
    };
  }

  /**
   * Reemplaza masivamente la lista de productos asignados a una promoción comercial.
   *
   * @param {number} id - ID de la promoción.
   * @param {number[]} productIds - Array de identificadores de productos participantes.
   * @returns {Promise<Object>} Resumen de asignación.
   * @throws {NotFoundException} Si la promoción no existe.
   */
  async assignProductsToPromotion(id: number, productIds: number[]) {
    const existing = await this.prisma.promocion.findUnique({ where: { id_promocion: id } });
    if (!existing) throw new NotFoundException(`La promoción con ID ${id} no existe.`);

    // Eliminar asociaciones actuales
    await this.prisma.promocion_producto.deleteMany({
      where: { id_promocion: id },
    });

    if (productIds.length > 0) {
      await this.prisma.promocion_producto.createMany({
        data: productIds.map((prodId) => ({
          id_promocion: id,
          id_producto: prodId,
        })),
        skipDuplicates: true,
      });
    }

    return {
      message: `Se actualizaron los productos asociados a la promoción (${productIds.length} asignados).`,
    };
  }

  /**
   * Modifica el estado de vigencia comercial (activo / inactivo) de una promoción.
   *
   * @param {number} id - ID de la promoción.
   * @param {'activo' | 'inactivo'} estado - Nuevo estado asignado.
   * @returns {Promise<Object>} Promoción actualizada.
   * @throws {NotFoundException} Si la promoción no existe.
   */
  async togglePromotionStatus(id: number, estado: 'activo' | 'inactivo') {
    const existing = await this.prisma.promocion.findUnique({ where: { id_promocion: id } });
    if (!existing) throw new NotFoundException(`La promoción con ID ${id} no existe.`);

    const updated = await this.prisma.promocion.update({
      where: { id_promocion: id },
      data: { estado },
    });

    return {
      message: `Estado de la promoción cambiado a "${estado}".`,
      data: updated,
    };
  }

  // ==========================================
  // PRODUCT IMAGES
  // ==========================================

  /**
   * Asocia una nueva imagen a la galería de un producto, gestionando la exclusividad de imagen principal.
   *
   * @param {number} productId - ID del producto padre.
   * @param {CreateProductImageDto} dto - Datos de la imagen (URL, texto alternativo, orden, principal).
   * @returns {Promise<Object>} Registro de imagen creado.
   * @throws {NotFoundException} Si el producto no existe.
   */
  async addProductImage(productId: number, dto: CreateProductImageDto) {
    const prod = await this.prisma.producto.findUnique({ where: { id_producto: productId } });
    if (!prod) throw new NotFoundException(`El producto con ID ${productId} no existe.`);

    // Si se marca como principal, desmarcar las otras
    if (dto.es_principal) {
      await this.prisma.imagen_producto.updateMany({
        where: { id_producto: productId },
        data: { es_principal: false },
      });
    }

    const max = await this.prisma.imagen_producto.aggregate({
      _max: { id_imagen_producto: true },
    });
    const nextId = (max._max.id_imagen_producto || 0) + 1;

    const created = await this.prisma.imagen_producto.create({
      data: {
        id_imagen_producto: nextId,
        id_producto: productId,
        url: dto.url.trim(),
        texto_alternativo: dto.texto_alternativo?.trim() || null,
        es_principal: dto.es_principal || false,
        orden: dto.orden || 0,
      },
    });

    return {
      message: 'Imagen agregada al producto.',
      data: created,
    };
  }

  /**
   * Elimina un registro de imagen de producto en la base de datos.
   *
   * @param {number} imageId - ID de la imagen a eliminar.
   * @returns {Promise<Object>} Confirmación de eliminación.
   * @throws {NotFoundException} Si la imagen no existe.
   */
  async deleteProductImage(imageId: number) {
    const existing = await this.prisma.imagen_producto.findUnique({
      where: { id_imagen_producto: imageId },
    });
    if (!existing) throw new NotFoundException(`La imagen con ID ${imageId} no existe.`);

    await this.prisma.imagen_producto.delete({ where: { id_imagen_producto: imageId } });
    return { message: 'Imagen eliminada exitosamente.' };
  }

  /**
   * Marca una imagen específica como la portada principal del producto y desmarca todas las demás.
   *
   * @param {number} productId - ID del producto.
   * @param {number} imageId - ID de la imagen a designar como principal.
   * @returns {Promise<Object>} Confirmación de asignación.
   * @throws {NotFoundException} Si la imagen no pertenece al producto.
   */
  async setMainProductImage(productId: number, imageId: number) {
    const img = await this.prisma.imagen_producto.findUnique({
      where: { id_imagen_producto: imageId },
    });
    if (!img || img.id_producto !== productId) {
      throw new NotFoundException(`La imagen con ID ${imageId} no pertenece al producto ${productId}.`);
    }

    await this.prisma.imagen_producto.updateMany({
      where: { id_producto: productId },
      data: { es_principal: false },
    });

    await this.prisma.imagen_producto.update({
      where: { id_imagen_producto: imageId },
      data: { es_principal: true },
    });

    return { message: 'Imagen establecida como principal.' };
  }
}
