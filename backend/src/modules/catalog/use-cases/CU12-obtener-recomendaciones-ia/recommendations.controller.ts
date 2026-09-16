import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../users-security/shared/guards/jwt-auth.guard.js';
import { GetRecommendationsDto } from './dto/recommendations.dto.js';
import { RecommendationsService } from './recommendations.service.js';

@Controller('catalog/recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Post()
  getRecommendations(@Req() request: any, @Body() dto: GetRecommendationsDto) {
    return this.recommendationsService.getRecommendations(request.user.id_usuario, dto);
  }
}
