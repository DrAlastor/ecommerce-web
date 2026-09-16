import { Controller, Get, Post, Patch, Body, Request, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { RegisterClienteDto } from './dto/register-cliente.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Controller('auth')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post('register')
  async register(@Body() dto: RegisterClienteDto) {
    return this.profileService.registerCliente(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: { user: { id_usuario: number } }) {
    return this.profileService.getProfile(req.user.id_usuario);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req: { user: { id_usuario: number } }, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.id_usuario, dto);
  }
}
