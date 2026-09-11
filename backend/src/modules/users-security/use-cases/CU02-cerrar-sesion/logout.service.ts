import { Injectable } from '@nestjs/common';

@Injectable()
export class LogoutService {
  async logout() {
    return { message: 'Sesión finalizada exitosamente' };
  }
}
