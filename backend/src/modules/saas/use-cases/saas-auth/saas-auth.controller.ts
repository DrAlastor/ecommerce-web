import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { SaasAuthService } from './saas-auth.service.js';
import { SaasLoginDto, SaasLoginResponse, SaasUserPayload } from './saas-auth.dto.js';
import { SaasSuperAdminGuard } from '../../guards/saas-superadmin.guard.js';

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
  @UseGuards(SaasSuperAdminGuard)
  async me(@Req() req: any): Promise<SaasUserPayload> {
    return req.user;
  }
}

