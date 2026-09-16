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
  async findAllSizes() {
    return this.prisma.talla.findMany({
      include: {
        _count: { select: { producto_variante: true } },
      },
      orderBy: { id_talla: 'asc' },
    });
  }

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
  async findAllColors() {
    return this.prisma.color.findMany({
      include: {
        _count: { select: { producto_variante: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

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
  async findAllSeasons() {
    return this.prisma.temporada.findMany({
      include: {
        _count: { select: { coleccion: true } },
      },
      orderBy: { fecha_inicio: 'desc' },
    });
  }

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

  async findAllCollections() {
    return this.prisma.coleccion.findMany({
      include: {
        temporada: { select: { id_temporada: true, nombre: true } },
        _count: { select: { producto: true } },
      },
      orderBy: { id_coleccion: 'desc' },
    });
  }

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

  async deleteSizeGuide(id: number) {
    const existing = await this.prisma.guia_talla.findUnique({ where: { id_guia_talla: id } });
    if (!existing) throw new NotFoundException(`La guía de talla con ID ${id} no existe.`);

    await this.prisma.guia_talla.delete({ where: { id_guia_talla: id } });
    return { message: 'Guía de talla eliminada exitosamente.' };
  }

  // ==========================================
  // PROMOTIONS CRUD
  // ==========================================
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

  async deleteProductImage(imageId: number) {
    const existing = await this.prisma.imagen_producto.findUnique({
      where: { id_imagen_producto: imageId },
    });
    if (!existing) throw new NotFoundException(`La imagen con ID ${imageId} no existe.`);

    await this.prisma.imagen_producto.delete({ where: { id_imagen_producto: imageId } });
    return { message: 'Imagen eliminada exitosamente.' };
  }

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
