import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   * Autentica al usuario y retorna JWT + info segura.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    return this.authService.login(user);
  }

  /**
   * GET /auth/profile
   * Retorna el perfil del usuario autenticado.
   * Requiere token JWT válido.
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(
    @Request() req: { user: { id_usuario: number } },
  ) {
    return this.authService.getProfile(req.user.id_usuario);
  }
}
