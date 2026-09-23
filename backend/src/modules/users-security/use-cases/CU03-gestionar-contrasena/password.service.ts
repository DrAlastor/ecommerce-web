/**
 * @file password.service.ts
 * @caso-de-uso CU03 — Gestionar contraseña
 * @subsistema Usuarios y Seguridad
 * @capa Control/Service de dominio — Backend
 * @responsabilidad Implementa los procedimientos criptográficos de seguridad para cambio de contraseña,
 * generación y validación de tokens de recuperación aleatorios (SHA-256 / 15 min),
 * envío de correos electrónicos y auditoría en bitácora.
 */

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { ResendService } from '../../shared/services/resend.service.js';
import { BitacoraService } from '../../shared/services/bitacora.service.js';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/password.dto.js';

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly resendService: ResendService,
    private readonly bitacora: BitacoraService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Procedimiento de cambio voluntario de contraseña para usuarios autenticados.
   * Valida la contraseña actual mediante bcrypt y actualiza el hash de la nueva contraseña.
   *
   * @param {number} userId - ID del usuario autenticado.
   * @param {ChangePasswordDto} dto - Contraseña actual y nueva contraseña.
   * @returns {Promise<{ success: boolean, message: string }>} Resultado de la operación.
   * @throws {UnauthorizedException} Si el usuario no existe.
   * @throws {BadRequestException} Si la contraseña actual no coincide.
   */
  async changePassword(userId: number, dto: ChangePasswordDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: userId },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, usuario.password_hash);
    if (!isMatch) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.usuario.update({
      where: { id_usuario: userId },
      data: { password_hash: passwordHash },
    });

    await this.bitacora.logModificacion(
      'contraseña de usuario',
      `Usuario: ${usuario.email} (ID: ${userId})`,
      userId,
    );

    return { success: true, message: 'Contraseña actualizada exitosamente' };
  }

  /**
   * Procedimiento de solicitud de recuperación de contraseña olvidada.
   * Pasos de seguridad:
   * 1. Normaliza el correo. Si no existe o está inactivo, retorna mensaje neutro (anti-enumeración de usuarios).
   * 2. Invalida tokens previos emitidos para este usuario (`usado = true`).
   * 3. Genera un código criptográfico de 6 dígitos aleatorios (`crypto.randomInt`).
   * 4. Almacena en base de datos el hash SHA-256 del código con caducidad estricta de 15 minutos.
   * 5. Construye el enlace web y lo remite por correo electrónico mediante ResendService.
   * 6. Registra el evento en la bitácora de auditoría.
   *
   * @param {ForgotPasswordDto} dto - Correo del usuario que solicita recuperación.
   * @returns {Promise<{ success: boolean, message: string }>} Confirmación neutra.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const cleanEmail = dto.email.trim().toLowerCase();

    const usuario = await this.prisma.usuario.findUnique({
      where: { email: cleanEmail },
    });

    if (!usuario) {
      this.logger.warn(`Solicitud de recuperación para correo no registrado: ${cleanEmail}`);
      // Mensaje genérico de privacidad para evitar enumeración de usuarios
      return {
        success: true,
        message:
          'Si el correo electrónico coincide con una cuenta registrada, recibirás el código de recuperación.',
      };
    }

    if (usuario.estado !== 'activo') {
      this.logger.warn(`Solicitud de recuperación para cuenta desactivada: ${cleanEmail}`);
      return {
        success: true,
        message:
          'Si el correo electrónico coincide con una cuenta registrada, recibirás el código de recuperación.',
      };
    }

    // 1. Invalidar cualquier token activo previo para este usuario
    await this.prisma.token_recuperacion.updateMany({
      where: {
        id_usuario: usuario.id_usuario,
        usado: false,
      },
      data: {
        usado: true,
      },
    });

    // 2. Generar código numérico de 6 dígitos criptográficamente seguro
    const resetCode = crypto.randomInt(100000, 1000000).toString();

    // 3. Generar hash SHA-256 para búsqueda indexada inmediata
    const tokenHash = crypto.createHash('sha256').update(resetCode).digest('hex');

    // 4. Obtener id autoincremental
    const result = await this.prisma.token_recuperacion.aggregate({
      _max: { id_token_recuperacion: true },
    });
    const nextId = (result._max.id_token_recuperacion || 0) + 1;

    // 5. Expiración estricta a 15 minutos
    const expirationDate = new Date(Date.now() + 15 * 60 * 1000);

    // 6. Guardar en base de datos
    await this.prisma.token_recuperacion.create({
      data: {
        id_token_recuperacion: nextId,
        id_usuario: usuario.id_usuario,
        token_hash: tokenHash,
        fecha_expiracion: expirationDate,
        usado: false,
      },
    });

    // 7. Construir enlace directo para el frontend
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetCode}&email=${encodeURIComponent(
      usuario.email,
    )}`;

    // 8. Enviar correo electrónico mediante Resend
    await this.resendService.sendPasswordResetEmail(
      usuario.email,
      resetCode,
      resetLink,
    );

    // 9. Registrar evento en bitácora
    await this.bitacora.logConsulta(
      'solicitud de recuperación de contraseña',
      `Usuario: ${usuario.email} (ID: ${usuario.id_usuario})`,
      usuario.id_usuario,
    );

    return {
      success: true,
      message:
        'Si el correo electrónico coincide con una cuenta registrada, recibirás el código de recuperación.',
    };
  }

  /**
   * Procedimiento de restablecimiento de contraseña mediante token.
   * Pasos de validación y aplicación:
   * 1. Valida el formato del código recibido (mínimo 6 caracteres).
   * 2. Calcula el hash SHA-256 y busca en `token_recuperacion` tokens vigentes (`fecha_expiracion > now()`) y no usados.
   * 3. Aplica fallback retrocompatible para tokens antiguos hasheados con bcrypt.
   * 4. Encripta la nueva contraseña con bcrypt.
   * 5. En una transacción atómica actualiza la contraseña del usuario y marca el token como usado.
   * 6. Registra el evento en bitácora.
   *
   * @param {ResetPasswordDto} dto - Token o código de 6 dígitos y la nueva contraseña.
   * @returns {Promise<{ success: boolean, message: string }>} Confirmación de éxito.
   * @throws {BadRequestException} Si el token es inválido, expiró o ya fue consumido.
   */
  async resetPassword(dto: ResetPasswordDto) {
    const rawCode = dto.token.trim();

    if (!rawCode || rawCode.length < 6) {
      throw new BadRequestException('El formato del código de recuperación es inválido.');
    }

    // 1. Hash SHA-256 del código enviado
    const tokenHash = crypto.createHash('sha256').update(rawCode).digest('hex');

    // 2. Buscar token válido y vigente
    let matchedToken = await this.prisma.token_recuperacion.findFirst({
      where: {
        token_hash: tokenHash,
        usado: false,
        fecha_expiracion: { gt: new Date() },
      },
      include: { usuario: true },
    });

    // 3. Fallback retrocompatible para tokens antiguos hasheados con bcrypt
    if (!matchedToken) {
      const legacyTokens = await this.prisma.token_recuperacion.findMany({
        where: {
          usado: false,
          fecha_expiracion: { gt: new Date() },
        },
        include: { usuario: true },
      });

      for (const t of legacyTokens) {
        if (
          t.token_hash &&
          t.token_hash.startsWith('$2') &&
          (await bcrypt.compare(rawCode, t.token_hash))
        ) {
          matchedToken = t;
          break;
        }
      }
    }

    if (!matchedToken) {
      throw new BadRequestException(
        'El código de recuperación es inválido, ha expirado o ya fue utilizado.',
      );
    }

    // 4. Hashear nueva contraseña
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    // 5. Transacción atómica: actualizar usuario e invalidar token
    await this.prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id_usuario: matchedToken.id_usuario },
        data: { password_hash: passwordHash },
      });

      await tx.token_recuperacion.update({
        where: { id_token_recuperacion: matchedToken.id_token_recuperacion },
        data: { usado: true },
      });
    });

    // 6. Auditoría en bitácora
    await this.bitacora.logModificacion(
      'contraseña por recuperación',
      `Usuario: ${matchedToken.usuario.email} (ID: ${matchedToken.id_usuario})`,
      matchedToken.id_usuario,
    );

    this.logger.log(`Contraseña restablecida exitosamente para usuario ID ${matchedToken.id_usuario}`);

    return {
      success: true,
      message:
        'Contraseña restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.',
    };
  }
}
