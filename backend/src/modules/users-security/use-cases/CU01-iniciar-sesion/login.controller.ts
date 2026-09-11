import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { LoginService } from './login.service.js';
import { LoginDto } from '../../shared/dto/login.dto.js';

@Controller('auth')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const user = await this.loginService.validateUser(loginDto.email, loginDto.password);
    return this.loginService.login(user);
  }
}
