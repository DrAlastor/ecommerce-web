import { Injectable } from '@nestjs/common';
import { BitacoraService } from '../../shared/services/bitacora.service.js';
import { ActiveSessionService } from '../../shared/services/active-session.service.js';

@Injectable()
export class LogoutService {
  constructor(
    private readonly bitacora: BitacoraService,
    private readonly activeSessionService: ActiveSessionService,
  ) {}

  async logout(idUsuario?: number, email?: string, ip?: string) {
    if (idUsuario) {
      this.activeSessionService.disconnect(idUsuario);
      await this.bitacora.logCierreSesion(
        idUsuario,
        email ? `Usuario: ${email} (ID: ${idUsuario})` : `Usuario ID: ${idUsuario}`,
        ip,
      );
    }
    return { message: 'Sesión finalizada exitosamente' };
  }
}
