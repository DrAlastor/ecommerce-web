/**
 * @file notifications.controller.ts
 * @description Controlador para registro de tokens de dispositivos y despacho de notificaciones push.
 */

import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { NotificationsService, DeviceTokenRecord, PushNotificationPayload } from './notifications.service.js';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('device-token')
  @HttpCode(HttpStatus.OK)
  registerToken(
    @Body()
    body: {
      token: string;
      platform?: string;
      id_usuario?: number | string;
      tenant?: string;
    }
  ) {
    if (!body.token) {
      return { success: false, message: 'Token es requerido' };
    }

    const record: DeviceTokenRecord = {
      token: body.token,
      platform: body.platform || 'android',
      id_usuario: body.id_usuario ?? null,
      tenant: body.tenant || 'global',
      updatedAt: new Date().toISOString(),
    };

    return this.notificationsService.registerDeviceToken(record);
  }

  @Get('device-tokens')
  getTokens() {
    return {
      tokens: this.notificationsService.getTokens(),
    };
  }

  @Post('test-push')
  @HttpCode(HttpStatus.OK)
  async testPush(
    @Body()
    body: {
      token?: string;
      title?: string;
      body?: string;
      id_usuario?: number | string;
    }
  ) {
    const payload: PushNotificationPayload = {
      title: body.title || '🔔 Notificación de FashionStore',
      body: body.body || '¡Tu compra ha sido procesada con éxito! Gracias por elegirnos.',
      data: {
        timestamp: new Date().toISOString(),
        type: 'test_notification',
      },
    };

    if (body.token) {
      const ok = await this.notificationsService.sendPushToToken(body.token, payload);
      return { success: ok, mode: 'token', sentTo: body.token };
    }

    if (body.id_usuario) {
      const count = await this.notificationsService.sendPushToUser(body.id_usuario, payload);
      return { success: count > 0, count, mode: 'user', id_usuario: body.id_usuario };
    }

    const count = await this.notificationsService.broadcastPush(payload);
    return { success: count > 0, count, mode: 'broadcast' };
  }
}

