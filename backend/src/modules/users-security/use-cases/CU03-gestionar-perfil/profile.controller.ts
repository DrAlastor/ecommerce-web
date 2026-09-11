import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';

@Controller('auth')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: { user: { id_usuario: number } }) {
    return this.profileService.getProfile(req.user.id_usuario);
  }
}
