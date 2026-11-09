import { Controller, Get, Post, Body, UseGuards, Req, Ip } from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { FunctionGuard } from '../../shared/guards/function.guard.js';
import { FunctionRequired } from '../../shared/decorators/function-required.decorator.js';
import { BackupService } from './backup.service.js';
import { CreateBackupDto, RestoreBackupDto } from './dto/backup.dto.js';

@Controller('users-security/backups')
@UseGuards(JwtAuthGuard, FunctionGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  @FunctionRequired('Gestionar backups y restore', 'Lectura')
  listBackups(@Req() req: any, @Ip() ip: string) {
    return this.backupService.listBackups(req.user?.id_usuario || 1, ip);
  }

  @Post()
  @FunctionRequired('Gestionar backups y restore', 'Edicion')
  createBackup(@Body() dto: CreateBackupDto, @Req() req: any, @Ip() ip: string) {
    return this.backupService.createBackup(dto, req.user?.id_usuario || 1, ip);
  }

  @Post('restore')
  @FunctionRequired('Gestionar backups y restore', 'Edicion')
  restoreBackup(@Body() dto: RestoreBackupDto, @Req() req: any, @Ip() ip: string) {
    return this.backupService.restoreBackup(dto, req.user?.id_usuario || 1, ip);
  }
}

