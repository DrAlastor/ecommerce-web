/**
 * @file bitacora.controller.ts
 * @caso-de-uso CU07 — Consultar bitácora
 * @subsistema Usuarios y Seguridad
 * @capa Control (API REST) — Backend
 * @responsabilidad Expone el endpoint protegido para la visualización y filtrado de los registros de auditoría del sistema.
 */

import { Controller, Get, Query, UseGuards, Req, Ip } from '@nestjs/common';
import { BitacoraService } from '../../shared/services/bitacora.service.js';
import { QueryBitacoraDto } from '../../shared/dto/bitacora.dto.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { FunctionRequired } from '../../shared/decorators/function-required.decorator.js';
import { FunctionGuard } from '../../shared/guards/function.guard.js';

@Controller('users-security/bitacora')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class BitacoraController {
  constructor(private readonly bitacoraService: BitacoraService) {}

  /**
   * Endpoint para consultar y paginar los eventos históricos de la bitácora de auditoría.
   * Requiere permiso de 'Lectura' en 'Consultar bitacora'.
   * Registra a su vez el acceso a la bitácora para trazabilidad de quién supervisa la seguridad.
   *
   * @param {QueryBitacoraDto} query - Parámetros de búsqueda textual, ID de usuario, página y límite.
   * @param {any} req - Petición HTTP con datos del administrador que consulta.
   * @param {string} ip - Dirección IP de origen.
   * @returns {Promise<{ data: any[], meta: any }>} Lista de eventos con fecha, IP, usuario y entidad afectada.
   */
  @Get()
  @FunctionRequired('Consultar bitacora', 'Lectura')
  findAll(@Query() query: QueryBitacoraDto, @Req() req: any, @Ip() ip: string) {
    if (req.user?.id_usuario) {
      this.bitacoraService.logConsulta('registros de auditoría', 'Bitácora del sistema', req.user.id_usuario, ip);
    }
    return this.bitacoraService.findAll(query);
  }
}
