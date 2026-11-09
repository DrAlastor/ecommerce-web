/**
 * @file recommendations.controller.ts
 * @caso-de-uso CU12 — Obtener recomendaciones de prendas mediante IA
 * @subsistema Experiencia Inteligente
 * @capa Control (API REST) — Backend
 * @responsabilidad Expone endpoints para el asistente virtual y motor de sugerencias personalizadas.
 * Utiliza autenticación opcional por JWT para enriquecer recomendaciones si el usuario ha iniciado sesión.
 */

import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../../../users-security/shared/guards/optional-jwt-auth.guard.js';
import { GetRecommendationsDto } from './dto/recommendations.dto.js';
import { RecommendationsService } from './recommendations.service.js';

/**
 * Controlador para la obtención de recomendaciones inteligentes basadas en IA o algoritmos heurísticos locales.
 */
@Controller('catalog/recommendations')
@UseGuards(OptionalJwtAuthGuard)
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  /**
   * Genera recomendaciones de productos:
   * Si el usuario está autenticado, recupera sus preferencias de estilo, género e interacciones previas.
   * Si es un visitante anónimo, procesa recomendaciones según el prompt de búsqueda o popularidad del catálogo.
   *
   * @param {any} request - Objeto Request de Express con usuario opcional inyectado por el guard.
   * @param {GetRecommendationsDto} dto - Prompt contextual del usuario y límite deseado de resultados.
   * @returns {Promise<Object>} Lista ordenada de productos recomendados con su justificación contextual.
   */
  @Post()
  getRecommendations(@Req() request: any, @Body() dto: GetRecommendationsDto) {
    const userId = request.user?.id_usuario;
    return this.recommendationsService.getRecommendations(userId, dto);
  }
}
