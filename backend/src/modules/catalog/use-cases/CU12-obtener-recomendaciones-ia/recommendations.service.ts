/**
 * @file recommendations.service.ts
 * @caso-de-uso CU12 — Obtener recomendaciones de prendas mediante IA
 * @subsistema Experiencia Inteligente
 * @capa Lógica de Negocio, Integración Externa y Heurística Local — Backend
 * @responsabilidad Implementa el motor de sugerencias inteligentes con arquitectura híbrida:
 * 1. Consulta candidatos disponibles con existencias en stock.
 * 2. Si hay servicio de IA configurado, envía el contexto del cliente, prompt libre y candidatos a un modelo LLM.
 * 3. En caso de timeout o indisponibilidad del servicio externo, aplica una heurística local de scoring basada en
 *    coincidencia léxica, interacciones previas, género, categoría y promociones activas.
 * 4. Registra interacciones de recomendación en la base de datos para aprendizaje continuo.
 */

import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { GetRecommendationsDto } from './dto/recommendations.dto.js';

interface AiRecommendation {
  id_producto: number;
  reason?: string;
}

/**
 * Servicio encargado de computar sugerencias personalizadas de prendas y complementos de moda.
 */
@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Obtiene recomendaciones de catálogo para un usuario registrado o visitante anónimo:
   * - Recupera perfil de cliente (género, estilo, historial de clics e interacciones recientes).
   * - Filtra hasta 40 productos candidatos activos con stock positivo en tiendas físicas.
   * - Intenta scoring mediante modelo de IA externo vía REST.
   * - Si la IA falla o no está configurada, utiliza scoring determinista local (`rankLocally`).
   * - Asocia la justificación de la recomendación y registra la sugerencia en la bitácora de interacción.
   *
   * @param {number} [userId] - Identificador de usuario autenticado (opcional).
   * @param {GetRecommendationsDto} [dto] - Prompt del usuario (ej. "vestido para boda de día") y límite de resultados.
   * @returns {Promise<Object>} Conjunto de productos recomendados con imágenes, precios y razones de afinidad.
   * @throws {BadRequestException} Si no existen productos activos disponibles con stock.
   */
  async getRecommendations(userId?: number, dto: GetRecommendationsDto = {}) {
    const limit = dto.limit || 6;
    let cliente: any = null;

    if (userId) {
      cliente = await this.prisma.cliente.findUnique({
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
    }

    // Si es un invitado anónimo o usuario no cliente, usar perfil base neutro
    if (!cliente) {
      cliente = {
        id_cliente: 0,
        sexo: null,
        preferencias_estilo: null,
        cliente_interaccion_ia: [],
      };
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

    if (cliente.id_cliente > 0) {
      await this.registerInteractions(cliente.id_cliente, officialProducts.map((product: any) => product.id_producto));
    }

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
        personalized: cliente.id_cliente > 0,
        source: aiRecommendations.length > 0 ? 'ai' : 'local',
      },
    };
  }

  /**
   * Obtiene hasta 40 productos candidatos activos que posean stock disponible mayor a 0 en sucursales físicas.
   *
   * @returns {Promise<Array>} Lista de productos con variantes, imágenes y promociones vigentes.
   */
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

  /**
   * Intenta consultar el servicio de Inteligencia Artificial externo mediante HTTP POST,
   * enviando el perfil de estilo, interacciones recientes y candidatos.
   * Incluye control de tiempo de espera (timeout) mediante AbortController.
   *
   * @param {any} cliente - Perfil del cliente actual.
   * @param {any[]} candidates - Productos candidatos prefiltrados.
   * @param {string} [prompt] - Texto ingresado por el usuario.
   * @param {number} limit - Cantidad máxima de recomendaciones.
   * @returns {Promise<AiRecommendation[]>} Recomendaciones devueltas por la IA o array vacío si falla.
   */
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

  /**
   * Normaliza la respuesta JSON del servicio de IA tolerando múltiples estructuras de datos devueltas.
   */
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

  /**
   * Empareja las IDs sugeridas por el modelo de IA con los objetos completos de producto en catálogo.
   */
  private mergeAiRecommendations(recommendations: AiRecommendation[], candidates: any[]) {
    const candidateMap = new Map(candidates.map((product) => [product.id_producto, product]));
    return recommendations
      .filter((item) => candidateMap.has(item.id_producto))
      .map((item) => ({
        ...candidateMap.get(item.id_producto),
        reason: item.reason || 'Seleccionado por el modelo segun tu contexto de busqueda.',
      }));
  }

  /**
   * Motor de puntuación heurística local (fallback) en caso de ausencia de IA:
   * - Coincidencia de tokens léxicos del prompt en nombre, categoría, colección o temporada (+2 pts c/u).
   * - Coincidencia de género del cliente con el producto (+2 pts).
   * - Categorías en las que el cliente ya interactuó (+3 pts).
   * - Existencia de promociones comerciales (+1 pt).
   * - Stock positivo disponible (+5 pts).
   *
   * @param {any} cliente - Perfil del cliente.
   * @param {any[]} candidates - Candidatos a puntuar.
   * @param {string} [prompt] - Texto libre opcional del usuario.
   * @returns {Array} Productos ordenados de mayor a menor puntuación y stock.
   */
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

  /**
   * Construye una explicación textual amigable en español sobre por qué se le recomienda la prenda al usuario.
   */
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

  /**
   * Consulta formal en base de datos para recuperar la estructura comercial completa
   * (precios finales con descuento, variantes activas, mapas de colores y tallas) para las IDs seleccionadas.
   */
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

  /**
   * Registra las interacciones generadas por la recomendación en la tabla `cliente_interaccion_ia`
   * para retroalimentar futuros cálculos de preferencia del usuario.
   */
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
