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

  @Get()
  @FunctionRequired('Consultar bitacora', 'Lectura')
  findAll(@Query() query: QueryBitacoraDto, @Req() req: any, @Ip() ip: string) {
    if (req.user?.id_usuario) {
      this.bitacoraService.logConsulta('registros de auditoría', 'Bitácora del sistema', req.user.id_usuario, ip);
    }
    return this.bitacoraService.findAll(query);
  }
}
