/**
 * @file app.service.ts
 * @description Servicio raíz de soporte para la aplicación.
 * Proporciona métodos de utilidad global y respuestas base.
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /**
   * Genera el mensaje de bienvenida y estado para la ruta raíz de la API.
   *
   * @returns {string} Mensaje confirmando que el Backend Dressly API está activo.
   */
  getHello(): string {
    return 'Dressly Store Backend API - Online & Healthy';
  }
}
