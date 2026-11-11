import { Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import { SaasBackupItem, SaasBackupsService } from './saas-backups.service.js';

@Controller('saas/backups')
export class SaasBackupsController {
  constructor(private readonly backupsService: SaasBackupsService) {}

  @Get()
  async listBackups(@Query('tenantKey') tenantKey?: string): Promise<SaasBackupItem[]> {
    return this.backupsService.listBackups(tenantKey);
  }

  @Post(':tenantKey/create')
  async createBackup(
    @Param('tenantKey') tenantKey: string,
    @Req() req: any,
  ): Promise<SaasBackupItem> {
    const userId = req.user?.id || 1;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    const solicitedBy = req.user?.email || 'Super Administrador';
    return this.backupsService.createBackup(tenantKey, solicitedBy, userId, ip);
  }

  @Post(':backupId/restore')
  async restoreBackup(
    @Param('backupId') backupId: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 1;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.backupsService.restoreBackup(backupId, userId, ip);
  }

  @Delete(':backupId')
  async deleteBackup(
    @Param('backupId') backupId: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 1;
    const ip = req.ip || req.headers?.['x-forwarded-for'];
    return this.backupsService.deleteBackup(backupId, userId, ip);
  }
}

