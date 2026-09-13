import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../../prisma/prisma.service.js';

@Injectable()
export class FunctionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFunc = this.reflector.get<{ modulo: string, permiso: string }>(
      'function_required',
      context.getHandler(),
    );

    if (!requiredFunc) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id_usuario) {
      throw new ForbiddenException('Sesión inválida');
    }

    const dbUser = await this.prisma.usuario.findUnique({
      where: { id_usuario: user.id_usuario },
      select: { id_rol: true }
    });

    if (!dbUser) {
      throw new ForbiddenException('Usuario no encontrado');
    }

    // Administrador (id_rol === 1) tiene acceso total a todas las funciones
    if (dbUser.id_rol === 1) {
      return true;
    }

    const rolFunciones = await this.prisma.rol_funcion.findMany({
      where: { id_rol: dbUser.id_rol },
      include: { funcion: true },
    });

    const normalize = (str?: string | null) =>
      str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : '';

    const reqModuloNorm = normalize(requiredFunc.modulo);
    const reqPermisoNorm = normalize(requiredFunc.permiso);

    const hasAccess = rolFunciones.some((rf) => {
      const funcNombreNorm = normalize(rf.funcion?.nombre);
      const nivelNorm = normalize(rf.descripcion || 'Lectura');

      if (funcNombreNorm !== reqModuloNorm) {
        return false;
      }

      if (reqPermisoNorm === 'lectura') {
        return nivelNorm === 'lectura' || nivelNorm === 'edicion';
      }

      if (reqPermisoNorm === 'edicion') {
        return nivelNorm === 'edicion';
      }

      return false;
    });

    if (!hasAccess) {
      throw new ForbiddenException(`No tiene permisos de ${requiredFunc.permiso} para ${requiredFunc.modulo}`);
    }

    return true;
  }
}

