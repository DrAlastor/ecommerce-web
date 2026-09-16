import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { GetRecommendationsDto } from './dto/recommendations.dto.js';

interface AiRecommendation {
  id_producto: number;
  reason?: string;
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getRecommendations(userId: number, dto: GetRecommendationsDto) {
    const limit = dto.limit || 6;
    const cliente = await this.prisma.cliente.findUnique({
      where: { id_cliente: userId },
      select: {
        id_cliente: true,
        sexo: true,
        preferencias_estilo: true,
        cliente_interaccion_ia: {
          take: 12,
          orderBy: { fecha: 'desc' },
          include: {
            producto: {
              select: {
                id_producto: true,
                nombre: true,
                id_categoria: true,
                genero: true,
              },
            },
          },
        },
      },
    });

    if (!cliente) {
      throw new BadRequestException('La cuenta autenticada no corresponde a un cliente.');
    }

    const candidates = await this.getCandidateProducts();
    if (candidates.length === 0) {
      throw new BadRequestException('No existen productos activos disponibles para recomendar.');
    }

    const aiRecommendations = await this.tryAiRecommendations(cliente, candidates, dto.prompt, limit);
    const ranked = aiRecommendations.length > 0
      ? this.mergeAiRecommendations(aiRecommendations, candidates)
      : this.rankLocally(cliente, candidates, dto.prompt);

    const selectedIds = ranked.slice(0, limit).map((item) => item.id_producto);
    const officialProducts = await this.getOfficialProducts(selectedIds);

    if (officialProducts.length === 0) {
      throw new BadRequestException('No existen productos compatibles para recomendar.');
    }

    await this.registerInteractions(cliente.id_cliente, officialProducts.map((product: any) => product.id_producto));

    const reasonMap = new Map(ranked.map((item) => [item.id_producto, item.reason]));
    const ordered = selectedIds
      .map((id) => officialProducts.find((product: any) => product.id_producto === id))
      .filter(Boolean)
      .map((product: any) => ({
        ...product,
        razon_recomendacion: reasonMap.get(product.id_producto) || 'Coincide con tu perfil y esta disponible en catalogo.',
      }));

    return {
      data: ordered,
      meta: {
        total: ordered.length,
        personalized: true,
        source: aiRecommendations.length > 0 ? 'ai' : 'local',
      },
    };
  }

  private async getCandidateProducts() {
    const now = new Date();
    const products = await this.prisma.producto.findMany({
      where: {
        estado: 'activo',
        producto_variante: {
          some: {
            estado: 'activo',
            inventario_sucursal: { some: { stock_disponible: { gt: 0 } } },
          },
        },
      },
      take: 40,
      orderBy: { id_producto: 'desc' },
      include: {
        categoria: { select: { id_categoria: true, nombre: true } },
        coleccion: {
          select: {
            id_coleccion: true,
            nombre: true,
            temporada: { select: { id_temporada: true, nombre: true, estado: true } },
          },
        },
        imagen_producto: { orderBy: [{ es_principal: 'desc' }, { orden: 'asc' }] },
        producto_variante: {
          where: { estado: 'activo' },
          include: {
            talla: { select: { id_talla: true, codigo: true } },
            color: { select: { id_color: true, nombre: true, codigo_hex: true } },
            inventario_sucursal: { select: { stock_disponible: true } },
          },
        },
        promocion_producto: { include: { promocion: true } },
      },
    });

    return products.map((product: any) => {
      const precioBase = Number(product.precio_base);
      const stockTotal = product.producto_variante.reduce(
        (sum: number, variant: any) =>
          sum + variant.inventario_sucursal.reduce((acc: number, inv: any) => acc + inv.stock_disponible, 0),
        0,
      );
      const activePromotion = product.promocion_producto
        .map((item: any) => item.promocion)
        .find((promo: any) => promo.estado === 'activo' && new Date(promo.fecha_inicio) <= now && new Date(promo.fecha_fin) >= now);

      return {
        id_producto: product.id_producto,
        id_categoria: product.id_categoria,
        nombre: product.nombre,
        descripcion: product.descripcion,
        precio_base: precioBase,
        genero: product.genero,
        categoria: product.categoria,
        coleccion: product.coleccion,
        imagen_producto: product.imagen_producto,
        producto_variante: product.producto_variante,
        promocion: activePromotion || null,
        stock_total: stockTotal,
      };
    });
  }

  private async tryAiRecommendations(
    cliente: any,
    candidates: any[],
    prompt: string | undefined,
    limit: number,
  ): Promise<AiRecommendation[]> {
    const url = this.configService.get<string>('AI_RECOMMENDATIONS_URL');
    if (!url) return [];

    const controller = new AbortController();
    const timeoutMs = Number(this.configService.get('AI_RECOMMENDATIONS_TIMEOUT_MS', 6000));
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.configService.get<string>('AI_RECOMMENDATIONS_API_KEY')
            ? { Authorization: `Bearer ${this.configService.get<string>('AI_RECOMMENDATIONS_API_KEY')}` }
            : {}),
        },
        body: JSON.stringify({
          prompt,
          limit,
          customer: {
            stylePreferences: cliente.preferencias_estilo,
            gender: cliente.sexo,
            recentInteractions: cliente.cliente_interaccion_ia.map((item: any) => ({
              type: item.tipo_interaccion,
              productId: item.id_producto,
              productName: item.producto.nombre,
              categoryId: item.producto.id_categoria,
            })),
          },
          candidates: candidates.map((product) => ({
            id_producto: product.id_producto,
            nombre: product.nombre,
            categoria: product.categoria?.nombre,
            genero: product.genero,
            coleccion: product.coleccion?.nombre,
            temporada: product.coleccion?.temporada?.nombre,
            precio: product.precio_base,
            tallas: product.producto_variante.map((variant: any) => variant.talla.codigo),
            colores: product.producto_variante.map((variant: any) => variant.color.nombre),
            stock_total: product.stock_total,
          })),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new ServiceUnavailableException('El servicio de IA no respondio correctamente.');
      }

      const payload: any = await response.json();
      return this.parseAiPayload(payload);
    } catch (error) {
      this.logger.warn(`Servicio de IA no disponible, se usara recomendacion local: ${error}`);
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseAiPayload(payload: any): AiRecommendation[] {
    const source = Array.isArray(payload) ? payload : payload?.recommendations || payload?.data || [];
    if (!Array.isArray(source)) return [];

    return source
      .map((item: any) => ({
        id_producto: Number(item.id_producto ?? item.productId ?? item.id),
        reason: item.reason || item.razon || item.razon_recomendacion,
      }))
      .filter((item) => Number.isInteger(item.id_producto));
  }

  private mergeAiRecommendations(recommendations: AiRecommendation[], candidates: any[]) {
    const candidateMap = new Map(candidates.map((product) => [product.id_producto, product]));
    return recommendations
      .filter((item) => candidateMap.has(item.id_producto))
      .map((item) => ({
        ...candidateMap.get(item.id_producto),
        reason: item.reason || 'Seleccionado por el modelo segun tu contexto de busqueda.',
      }));
  }

  private rankLocally(cliente: any, candidates: any[], prompt?: string) {
    const preferenceText = `${cliente.preferencias_estilo || ''} ${prompt || ''}`.toLowerCase();
    const interactedCategoryIds = new Set(
      cliente.cliente_interaccion_ia.map((item: any) => item.producto.id_categoria).filter(Boolean),
    );

    return candidates
      .map((product) => {
        let score = product.stock_total > 0 ? 5 : 0;
        const searchable = [
          product.nombre,
          product.descripcion,
          product.genero,
          product.categoria?.nombre,
          product.coleccion?.nombre,
          product.coleccion?.temporada?.nombre,
        ].filter(Boolean).join(' ').toLowerCase();

        for (const token of preferenceText.split(/\s+/).filter((word) => word.length > 2)) {
          if (searchable.includes(token)) score += 2;
        }

        if (cliente.sexo && product.genero && product.genero.toLowerCase() === cliente.sexo.toLowerCase()) score += 2;
        if (interactedCategoryIds.has(product.id_categoria)) score += 3;
        if (product.promocion) score += 1;

        return {
          ...product,
          score,
          reason: this.buildLocalReason(product, preferenceText),
        };
      })
      .sort((a, b) => b.score - a.score || b.stock_total - a.stock_total);
  }

  private buildLocalReason(product: any, preferenceText: string) {
    if (product.coleccion?.temporada?.nombre && preferenceText.includes(product.coleccion.temporada.nombre.toLowerCase())) {
      return `Coincide con la temporada ${product.coleccion.temporada.nombre} y tiene disponibilidad.`;
    }
    if (product.categoria?.nombre && preferenceText.includes(product.categoria.nombre.toLowerCase())) {
      return `Encaja con tu interes por ${product.categoria.nombre} y esta disponible.`;
    }
    if (product.promocion) {
      return 'Disponible en catalogo y con promocion activa.';
    }
    return 'Disponible en catalogo y alineado con tus preferencias.';
  }

  private async getOfficialProducts(productIds: number[]) {
    if (productIds.length === 0) return [];
    const now = new Date();
    const products = await this.prisma.producto.findMany({
      where: {
        id_producto: { in: productIds },
        estado: 'activo',
        producto_variante: {
          some: {
            estado: 'activo',
            inventario_sucursal: { some: { stock_disponible: { gt: 0 } } },
          },
        },
      },
      include: {
        categoria: { select: { id_categoria: true, nombre: true } },
        coleccion: {
          select: {
            id_coleccion: true,
            nombre: true,
            temporada: { select: { nombre: true } },
          },
        },
        imagen_producto: { orderBy: [{ es_principal: 'desc' }, { orden: 'asc' }] },
        producto_variante: {
          where: { estado: 'activo' },
          include: {
            talla: { select: { id_talla: true, codigo: true } },
            color: { select: { id_color: true, nombre: true, codigo_hex: true } },
            inventario_sucursal: { select: { stock_disponible: true } },
          },
        },
        promocion_producto: { include: { promocion: true } },
      },
    });

    return products.map((product: any) => {
      const precioBase = Number(product.precio_base);
      let descuento = 0;
      let promocion = null;

      for (const item of product.promocion_producto) {
        const promo = item.promocion;
        if (promo.estado === 'activo' && new Date(promo.fecha_inicio) <= now && new Date(promo.fecha_fin) >= now) {
          const value = Number(promo.valor_descuento);
          const currentDiscount = promo.tipo_descuento === 'porcentaje' ? (precioBase * value) / 100 : value;
          if (currentDiscount > descuento) {
            descuento = currentDiscount;
            promocion = {
              id_promocion: promo.id_promocion,
              nombre: promo.nombre,
              tipo_descuento: promo.tipo_descuento,
              valor_descuento: value,
            };
          }
        }
      }

      const colorMap = new Map();
      const sizeMap = new Map();
      let stockTotal = 0;
      for (const variant of product.producto_variante) {
        colorMap.set(variant.color.id_color, variant.color);
        sizeMap.set(variant.talla.id_talla, variant.talla);
        stockTotal += variant.inventario_sucursal.reduce((sum: number, inventory: any) => sum + inventory.stock_disponible, 0);
      }

      return {
        id_producto: product.id_producto,
        nombre: product.nombre,
        descripcion: product.descripcion,
        precio_base: precioBase,
        precio_final: Number(Math.max(0, precioBase - descuento).toFixed(2)),
        tiene_descuento: descuento > 0,
        descuento_porcentaje: descuento > 0 ? Math.round((descuento / precioBase) * 100) : 0,
        promocion,
        genero: product.genero,
        categoria: product.categoria,
        coleccion: product.coleccion
          ? {
              id_coleccion: product.coleccion.id_coleccion,
              nombre: product.coleccion.nombre,
              temporada: product.coleccion.temporada?.nombre || null,
            }
          : null,
        imagen_principal: product.imagen_producto.find((image: any) => image.es_principal)?.url || product.imagen_producto[0]?.url || null,
        imagenes: product.imagen_producto.map((image: any) => ({
          id_imagen_producto: image.id_imagen_producto,
          url: image.url,
          es_principal: image.es_principal,
        })),
        disponible: stockTotal > 0,
        total_variantes: product.producto_variante.length,
        colores_disponibles: Array.from(colorMap.values()),
        tallas_disponibles: Array.from(sizeMap.values()),
        stock_total: stockTotal,
      };
    });
  }

  private async registerInteractions(clienteId: number, productIds: number[]) {
    const max = await this.prisma.cliente_interaccion_ia.aggregate({
      _max: { id_cliente_interaccion_ia: true },
    });
    let nextId = (max._max.id_cliente_interaccion_ia || 0) + 1;

    await this.prisma.cliente_interaccion_ia.createMany({
      data: productIds.map((productId) => ({
        id_cliente_interaccion_ia: nextId++,
        tipo_interaccion: 'recomendacion',
        id_cliente: clienteId,
        id_producto: productId,
      })),
    });
  }
}
