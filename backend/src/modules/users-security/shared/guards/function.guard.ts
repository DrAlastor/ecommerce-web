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
    const aliases: Record<string, string[]> = {
      'consultar bitacora': ['consultar bitacora', 'cu07 — consultar bitacora'],
      'gestionar usuarios': ['gestionar usuarios', 'cu04 — gestionar usuarios'],
      'gestionar roles': ['gestionar roles', 'gestionar roles y permisos', 'cu05 — gestionar roles y permisos'],
      'gestionar roles y permisos': ['gestionar roles y permisos', 'gestionar roles', 'cu05 — gestionar roles y permisos'],
      'gestionar empleados': ['gestionar empleados', 'cu06 — gestionar empleados'],
      'consultar catalogo': ['consultar catalogo', 'consultar catalogo de productos', 'cu08 — consultar catalogo de productos'],
      'consultar catalogo de productos': ['consultar catalogo de productos', 'consultar catalogo', 'cu08 — consultar catalogo de productos'],
      'consultar detalle y disponibilidad de producto': ['consultar detalle y disponibilidad de producto', 'cu09 — consultar detalle y disponibilidad de producto'],
      'gestionar productos': ['gestionar productos', 'gestionar catalogo de productos', 'cu10 — gestionar catalogo de productos'],
      'gestionar categorias': ['gestionar categorias', 'gestionar catalogo de productos', 'cu10 — gestionar catalogo de productos'],
      'gestionar variantes': ['gestionar variantes', 'gestionar catalogo de productos', 'cu10 — gestionar catalogo de productos'],
      'gestionar catalogo de productos': ['gestionar catalogo de productos', 'gestionar productos', 'gestionar categorias', 'gestionar variantes', 'cu10 — gestionar catalogo de productos'],
      'gestionar proveedores': ['gestionar proveedores', 'cu11 — gestionar proveedores'],
      'obtener recomendaciones de prendas mediante ia': ['obtener recomendaciones de prendas mediante ia', 'cu12 — obtener recomendaciones de prendas mediante ia'],
      'gestionar sucursales': ['gestionar sucursales', 'gestionar ciudades y sucursales', 'cu13 — gestionar ciudades y sucursales'],
      'gestionar ciudades y sucursales': ['gestionar ciudades y sucursales', 'gestionar sucursales', 'cu13 — gestionar ciudades y sucursales'],
      'consultar sucursales': ['consultar sucursales', 'cu14 — consultar sucursales'],
      'gestionar inventario': ['gestionar inventario', 'consultar inventario', 'cu15 — consultar inventario'],
      'consultar inventario': ['consultar inventario', 'gestionar inventario', 'cu15 — consultar inventario'],
      'registrar movimientos': ['registrar movimientos', 'gestionar movimientos de inventario', 'cu16 — gestionar movimientos de inventario'],
      'gestionar movimientos de inventario': ['gestionar movimientos de inventario', 'registrar movimientos', 'cu16 — gestionar movimientos de inventario'],
      'gestionar reservas': ['gestionar reservas', 'gestionar reserva en sucursal', 'cu19 — gestionar reserva en sucursal'],
      'gestionar reserva en sucursal': ['gestionar reserva en sucursal', 'gestionar reservas', 'cu19 — gestionar reserva en sucursal'],
      'registrar venta': ['registrar venta', 'registrar venta presencial', 'cu24 — registrar venta presencial'],
      'registrar venta presencial': ['registrar venta presencial', 'registrar venta', 'cu24 — registrar venta presencial'],
      'procesar pago': ['procesar pago', 'procesar pago electronico', 'cu23 — procesar pago electronico', 'cu24 — registrar venta presencial', 'registrar venta presencial'],
      'procesar pago electronico': ['procesar pago electronico', 'procesar pago', 'cu23 — procesar pago electronico'],
      'consultar dashboard y reportes': ['consultar dashboard y reportes', 'consultar dashboard', 'generar reportes', 'reportes', 'dashboard'],
      'consultar dashboard': ['consultar dashboard y reportes', 'consultar dashboard'],
      'generar reportes': ['consultar dashboard y reportes', 'generar reportes', 'reportes'],
    };
    const acceptedFunctionNames = new Set([reqModuloNorm, ...(aliases[reqModuloNorm] ?? [])]);

    const hasAccess = rolFunciones.some((rf) => {
      const funcNombreNorm = normalize(rf.funcion?.nombre);
      const nivelNorm = normalize(rf.descripcion || 'Lectura');

      if (!acceptedFunctionNames.has(funcNombreNorm)) {
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
