import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../../../users-security/shared/guards/optional-jwt-auth.guard.js';
import { GetRecommendationsDto } from './dto/recommendations.dto.js';
import { RecommendationsService } from './recommendations.service.js';

@Controller('catalog/recommendations')
@UseGuards(OptionalJwtAuthGuard)
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Post()
  getRecommendations(@Req() request: any, @Body() dto: GetRecommendationsDto) {
    const userId = request.user?.id_usuario;
    return this.recommendationsService.getRecommendations(userId, dto);
  }
}
