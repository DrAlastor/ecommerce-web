/**
 * @file login.service.ts
 * @caso-de-uso CU01 — Gestionar acceso al sistema
 * @subsistema Usuarios y Seguridad
 * @capa Control/Service de dominio — Backend
 * @responsabilidad Ejecuta las reglas de negocio de autenticación: verificación de credenciales con bcrypt,
 * control de estado de la cuenta, emisión de JWT firmado, registro en bitácora y activación de sesión concurrente.
 */

import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import type { FuncionDto, LoginResponseDto } from '../../shared/dto/login-response.dto.js';
import { BitacoraService } from '../../shared/services/bitacora.service.js';
import { ActiveSessionService } from '../../shared/services/active-session.service.js';

@Injectable()
export class LoginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly bitacora: BitacoraService,
    private readonly activeSessionService: ActiveSessionService,
  ) {}

  /**
   * Valida la identidad del usuario a partir de sus credenciales.
   * Flujo:
   * 1. Normaliza el correo electrónico (espacios y minúsculas).
   * 2. Consulta al usuario incluyendo sus perfiles polimórficos asociados (cliente o empleado).
   * 3. Comprueba que el usuario exista; de lo contrario lanza UnauthorizedException.
   * 4. Valida que el estado del usuario sea 'activo'.
   * 5. Compara la contraseña en texto claro contra el hash bcrypt almacenado.
   *
   * @param {string} email - Correo electrónico del usuario.
   * @param {string} password - Contraseña en texto plano.
   * @returns {Promise<Omit<Usuario, 'password_hash'>>} Entidad de usuario sin el hash de contraseña.
   * @throws {UnauthorizedException} Si las credenciales no coinciden o el correo no existe.
   * @throws {ForbiddenException} Si la cuenta de usuario se encuentra desactivada o suspendida.
   */
  async validateUser(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: normalizedEmail },
      include: { cliente: true, empleado: true }
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (usuario.estado !== 'activo') {
      throw new ForbiddenException('La cuenta se encuentra desactivada');
    }

    const isPasswordValid = await bcrypt.compare(password, usuario.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { password_hash, ...userWithoutPassword } = usuario;
    return userWithoutPassword;
  }

  /**
   * Procedimiento de inicio de sesión exitoso.
   * - Marca al usuario como conectado en el servicio en memoria de sesiones activas.
   * - Registra el evento 'Inicio de Sesion' en la bitácora con IP y timestamp.
   * - Consulta el rol del usuario y extrae la matriz de funciones autorizadas con su nivel (Lectura/Edición).
   * - Emite y firma criptográficamente el token JWT (Bearer).
   *
   * @param {any} user - Usuario validado previamente con `validateUser()`.
   * @param {string} [ip] - Dirección IP de origen para trazabilidad en auditoría.
   * @returns {Promise<LoginResponseDto>} Objeto con accessToken, usuario, rol y lista de funciones disponibles.
   * @throws {UnauthorizedException} Si el rol asignado no existe en la base de datos.
   */
  async login(user: any, ip?: string): Promise<LoginResponseDto> {
    // Registrar al usuario como CONECTADO en tiempo real
    this.activeSessionService.connect(user.id_usuario);

    // Auditoría en bitácora
    await this.bitacora.logInicioSesion(
      user.id_usuario,
      `Usuario: ${user.email} (ID: ${user.id_usuario})`,
      ip,
    );

    const rol = await this.prisma.rol.findUnique({
      where: { id_rol: user.id_rol },
    });

    if (!rol) {
      throw new UnauthorizedException('Rol no encontrado o inválido');
    }

    // Consulta de funciones y módulos asignados al rol en la base de datos
    const rolFunciones = await this.prisma.rol_funcion.findMany({
      where: { id_rol: user.id_rol },
      include: { funcion: { include: { modulo: true } } },
      orderBy: { id_funcion: 'asc' },
    });

    const funciones: FuncionDto[] = rolFunciones.map((rf) => ({
      id_funcion: rf.funcion.id_funcion,
      nombre: rf.funcion.nombre,
      modulo: rf.funcion.modulo.nombre,
      nivel_acceso: rf.descripcion ?? 'Lectura',
    }));

    // Firma del token JWT
    const payload = { sub: user.id_usuario, email: user.email, rol: rol.nombre, id_rol: rol.id_rol };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id_usuario: user.id_usuario,
        email: user.email,
        estado: user.estado,
        cliente: user.cliente,
        empleado: user.empleado
      },
      rol: { id_rol: rol.id_rol, nombre: rol.nombre },
      funciones,
    };
  }
}
