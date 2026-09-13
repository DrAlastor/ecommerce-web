import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../../prisma/prisma.module.js';

import { LoginController } from '../use-cases/CU01-iniciar-sesion/login.controller.js';
import { LoginService } from '../use-cases/CU01-iniciar-sesion/login.service.js';
import { LogoutController } from '../use-cases/CU02-cerrar-sesion/logout.controller.js';
import { LogoutService } from '../use-cases/CU02-cerrar-sesion/logout.service.js';
import { ProfileController } from '../use-cases/CU03-gestionar-perfil/profile.controller.js';
import { ProfileService } from '../use-cases/CU03-gestionar-perfil/profile.service.js';
import { PasswordController } from '../use-cases/CU04-gestionar-contrasena/password.controller.js';
import { PasswordService } from '../use-cases/CU04-gestionar-contrasena/password.service.js';

import { JwtStrategy } from '../shared/strategies/jwt.strategy.js';
import { ActiveSessionService } from '../shared/services/active-session.service.js';
import { BitacoraService } from '../shared/services/bitacora.service.js';
import { ResendModule } from '../shared/modules/resend.module.js';

@Module({
  imports: [
    PrismaModule,
    ResendModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION', '1h') as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      }),
    }),
  ],
  controllers: [
    LoginController,
    LogoutController,
    ProfileController,
    PasswordController,
  ],
  providers: [
    LoginService,
    LogoutService,
    ProfileService,
    PasswordService,
    JwtStrategy,
    BitacoraService,
    ActiveSessionService,
  ],
  exports: [
    LoginService,
    LogoutService,
    ProfileService,
    JwtModule,
    PassportModule,
    ActiveSessionService,
  ],
})
export class AuthModule {}
