/**
 * @file notifications.service.ts
 * @description Servicio de gestión y envío automático de Notificaciones Push vía Firebase Admin SDK (FCM).
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface DeviceTokenRecord {
  token: string;
  platform: string;
  id_usuario?: number | string | null;
  tenant: string;
  updatedAt: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: any = null;
  private readonly tokensFilePath = path.resolve(process.cwd(), 'device-tokens.json');
  private deviceTokens: Map<string, DeviceTokenRecord> = new Map();

  async onModuleInit() {
    await this.initFirebase();
    this.loadTokensFromFile();
  }

  private async initFirebase() {
    try {
      let fbAppModule: any;
      try {
        fbAppModule = await import('firebase-admin/app');
      } catch (err: any) {
        this.logger.warn(`firebase-admin no está disponible en este entorno: ${err.message}`);
        return;
      }

      const { initializeApp, cert, getApps } = fbAppModule;
      const existingApps = getApps();
      if (existingApps.length > 0) {
        this.firebaseApp = existingApps[0]!;
        this.logger.log('Firebase Admin ya estaba inicializado.');
        return;
      }

      let serviceAccount: any = null;
      const envCreds = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (envCreds) {
        try {
          serviceAccount = JSON.parse(
            envCreds.startsWith('{') ? envCreds : Buffer.from(envCreds, 'base64').toString('utf8')
          );
        } catch (e) {
          this.logger.warn('Error al parsear FIREBASE_SERVICE_ACCOUNT desde env');
        }
      }

      if (!serviceAccount) {
        const credentialsPath = path.resolve(process.cwd(), 'src/config/firebase-service-account.json');
        if (fs.existsSync(credentialsPath)) {
          serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
        }
      }

      if (serviceAccount) {
        this.firebaseApp = initializeApp({
          credential: cert(serviceAccount),
        });
        this.logger.log('✅ Firebase Admin SDK inicializado exitosamente con fashionstore-push.');
      } else {
        this.logger.warn('No se encontraron credenciales de Firebase (FIREBASE_SERVICE_ACCOUNT o archivo local).');
      }
    } catch (error) {
      this.logger.error('Error al inicializar Firebase Admin:', error);
    }
  }

  private loadTokensFromFile() {
    try {
      if (fs.existsSync(this.tokensFilePath)) {
        const raw = fs.readFileSync(this.tokensFilePath, 'utf8');
        const list: DeviceTokenRecord[] = JSON.parse(raw);
        for (const item of list) {
          this.deviceTokens.set(item.token, item);
        }
        this.logger.log(`Cargados ${this.deviceTokens.size} tokens de dispositivos en memoria.`);
      }
    } catch (e) {
      this.logger.warn('No se pudo leer el archivo de tokens persistente:', e);
    }
  }

  private persistTokens() {
    try {
      const list = Array.from(this.deviceTokens.values());
      fs.writeFileSync(this.tokensFilePath, JSON.stringify(list, null, 2), 'utf8');
    } catch (e) {
      this.logger.error('Error al persistir tokens en archivo:', e);
    }
  }

  registerDeviceToken(record: DeviceTokenRecord): { success: boolean; total: number } {
    this.deviceTokens.set(record.token, {
      ...record,
      updatedAt: new Date().toISOString(),
    });
    this.persistTokens();
    this.logger.log(`📱 Token registrado para usuario ${record.id_usuario ?? 'anónimo'} (Tenant: ${record.tenant})`);
    return { success: true, total: this.deviceTokens.size };
  }

  getTokens(): DeviceTokenRecord[] {
    return Array.from(this.deviceTokens.values());
  }

  async sendPushToToken(token: string, payload: PushNotificationPayload): Promise<boolean> {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase Admin no está inicializado.');
      return false;
    }

    try {
      const { getMessaging } = await import('firebase-admin/messaging');

      const message: any = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data ?? {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'fashionstore_channel',
            priority: 'max',
            visibility: 'public',
          },
        },
      };

      const response = await getMessaging(this.firebaseApp).send(message);
      this.logger.log(`✅ Push enviado a ${token.slice(0, 15)}... ID: ${response}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Error al enviar push a token: ${error.message}`);
      if (error.code === 'messaging/registration-token-not-registered') {
        this.deviceTokens.delete(token);
        this.persistTokens();
      }
      return false;
    }
  }

  async sendPushToUser(userId: number | string, payload: PushNotificationPayload): Promise<number> {
    let targets = Array.from(this.deviceTokens.values()).filter(
      (t) => String(t.id_usuario) === String(userId)
    );

    // Fallback de resiliencia: si la cuenta es nueva o el token fue registrado antes de asociar el id,
    // enviar a todos los dispositivos registrados para garantizar que el cliente/empleado no pierda la notificación
    if (targets.length === 0 && this.deviceTokens.size > 0) {
      this.logger.log(
        `Dispositivos específicos no encontrados para userId ${userId}. Enviando notificación a los ${this.deviceTokens.size} dispositivos activos registrados.`
      );
      targets = Array.from(this.deviceTokens.values());
    }

    let sent = 0;
    for (const record of targets) {
      const ok = await this.sendPushToToken(record.token, payload);
      if (ok) sent++;
    }
    return sent;
  }

  async sendPushToTenant(tenant: string, payload: PushNotificationPayload): Promise<number> {
    const tenantTokens = Array.from(this.deviceTokens.values()).filter(
      (t) => t.tenant === tenant || t.tenant === 'global'
    );

    let sent = 0;
    for (const record of tenantTokens) {
      const ok = await this.sendPushToToken(record.token, payload);
      if (ok) sent++;
    }
    return sent;
  }

  async broadcastPush(payload: PushNotificationPayload): Promise<number> {
    const allTokens = Array.from(this.deviceTokens.values());
    let sent = 0;
    for (const record of allTokens) {
      const ok = await this.sendPushToToken(record.token, payload);
      if (ok) sent++;
    }
    return sent;
  }
}
