import { Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { LogoutService } from './logout.service.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';

@Controller('auth')
export class LogoutController {
  constructor(private readonly logoutService: LogoutService) {}

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    return this.logoutService.logout();
  }
}
