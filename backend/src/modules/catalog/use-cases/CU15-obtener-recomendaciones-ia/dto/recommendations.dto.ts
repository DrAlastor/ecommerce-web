/**
 * @caso-de-uso CU12 — Obtener recomendaciones de prendas mediante IA
 * @subsistema Experiencia Inteligente
 * @capa Entity/DTO — Backend
 * @responsabilidad Define los contratos de datos intercambiados entre la interfaz, los servicios y el backend.
 * @secuencia Cliente -> asistente de recomendaciones -> controlador de IA -> servicio de recomendaciones -> Catálogo/Preferencias/Proveedor de IA.
 */
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetRecommendationsDto {
  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  limit?: number = 6;
}
