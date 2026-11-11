import { Body, Controller, Get, Headers, Post, Req, UnauthorizedException } from '@nestjs/common';
import { SaasAuthService } from './saas-auth.service.js';
import { SaasLoginDto, SaasLoginResponse, SaasUserPayload } from './saas-auth.dto.js';

@Controller('saas/auth')
export class SaasAuthController {
  constructor(private readonly authService: SaasAuthService) {}

  @Post('login')
  async login(
    @Body() dto: SaasLoginDto,
    @Req() req: any,
  ): Promise<SaasLoginResponse> {
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.authService.login(dto, ip);
  }

  @Get('me')
  async me(@Headers('authorization') authHeader?: string): Promise<SaasUserPayload> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autenticación no proporcionado');
    }
    const token = authHeader.replace('Bearer ', '').trim();
    return this.authService.validateToken(token);
  }
}

