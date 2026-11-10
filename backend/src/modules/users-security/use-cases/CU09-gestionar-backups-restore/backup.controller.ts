import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
  Ip,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';
import { FunctionGuard } from '../../shared/guards/function.guard.js';
import { FunctionRequired } from '../../shared/decorators/function-required.decorator.js';
import { BackupService } from './backup.service.js';
import { CreateBackupDto, RestoreBackupDto, RestoreUploadDto } from './dto/backup.dto.js';

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

  @Post('generate')
  @FunctionRequired('Gestionar backups y restore', 'Edicion')
  generateBackup(@Body() dto: CreateBackupDto, @Req() req: any, @Ip() ip: string) {
    return this.backupService.createBackup(dto, req.user?.id_usuario || 1, ip);
  }

  @Get('download/:id')
  @FunctionRequired('Gestionar backups y restore', 'Lectura')
  async downloadBackup(
    @Param('id') id: string,
    @Req() req: any,
    @Ip() ip: string,
    @Res() res: Response,
  ) {
    const file = await this.backupService.downloadBackup(id, req.user?.id_usuario || 1, ip);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    return res.send(file.content);
  }

  @Get(':id/download')
  @FunctionRequired('Gestionar backups y restore', 'Lectura')
  async downloadBackupAlt(
    @Param('id') id: string,
    @Req() req: any,
    @Ip() ip: string,
    @Res() res: Response,
  ) {
    const file = await this.backupService.downloadBackup(id, req.user?.id_usuario || 1, ip);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    return res.send(file.content);
  }

  @Post('restore')
  @FunctionRequired('Gestionar backups y restore', 'Edicion')
  restoreBackup(@Body() dto: RestoreBackupDto, @Req() req: any, @Ip() ip: string) {
    return this.backupService.restoreBackup(dto, req.user?.id_usuario || 1, ip);
  }

  @Post('restore/:id')
  @FunctionRequired('Gestionar backups y restore', 'Edicion')
  restoreBackupParam(@Param('id') id: string, @Req() req: any, @Ip() ip: string) {
    return this.backupService.restoreBackup({ backup_id: id }, req.user?.id_usuario || 1, ip);
  }

  @Post('restore-upload')
  @FunctionRequired('Gestionar backups y restore', 'Edicion')
  restoreUpload(@Body() dto: RestoreUploadDto, @Req() req: any, @Ip() ip: string) {
    return this.backupService.restoreFromUploadedJson(dto.backup_data, req.user?.id_usuario || 1, ip);
  }
}
