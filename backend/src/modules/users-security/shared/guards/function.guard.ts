import { planAllowsFunction, tenantCapabilities } from '../../../../common/tenant/plan-access.js';
/**
 * @file function.guard.ts
 * @description Guardián de autorización granular basado en funciones y permisos del sistema (RBAC dinámico).
 * Verifica si el rol asignado al usuario autenticado posee los privilegios requeridos
 * (Lectura o Edición) sobre la función o módulo especificado en el decorador `@FunctionRequired()`.
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../../prisma/prisma.service.js';

@Injectable()
export class FunctionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  /**
   * Evalúa si la petición HTTP actual cumple con las políticas de permisos requeridos.
   * Flujo:
   * 1. Extrae los metadatos de 'function_required' del controlador o endpoint.
   * 2. Si no hay requisitos de función, concede acceso libre.
   * 3. Obtiene el usuario autenticado desde el objeto request (provisto por JwtAuthGuard).
   * 4. Si el usuario pertenece al Rol Super Administrador (id_rol === 1), concede acceso total inmediato.
   * 5. Consulta en la base de datos las funciones autorizadas para el rol del usuario en la tabla `rol_funcion`.
   * 6. Normaliza cadenas (remueve tildes, diacríticos y mayúsculas) y evalúa alias de casos de uso.
   * 7. Valida que el nivel de acceso (Lectura o Edición) sea suficiente para la operación.
   *
   * @param {ExecutionContext} context - Contexto de ejecución de NestJS.
   * @returns {Promise<boolean>} True si el usuario tiene permiso suficiente.
   * @throws {ForbiddenException} Si la sesión es inválida, el usuario no existe o carece de permisos.
   */
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

    const route = request.url || '';
    const caps = tenantCapabilities();
    if (!planAllowsFunction(requiredFunc.modulo) || (/\/reports\/ai\/(predictions|rfm-clusters|scenarios)/.test(route) && !caps.ml) || (/\/reports\/(qbe|ai\/(chat|analyze|tts|transcribe))/.test(route) && !caps.ia)) {
      throw new ForbiddenException('Esta funci?n no est? incluida en el plan de la empresa.');
    }
    const dbUser = await this.prisma.usuario.findUnique({
      where: { id_usuario: user.id_usuario },
      select: { id_rol: true }
    });

    if (!dbUser) {
      throw new ForbiddenException('Usuario no encontrado');
    }

    // Administrador (id_rol === 1) tiene acceso total inmediato a todas las funciones
    if (dbUser.id_rol === 1 || user.id_rol === 1 || user.rol === 'Administrador') {
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
      'gestionar carrito de compras': ['gestionar carrito de compras', 'gestionar carrito', 'carrito de compras', 'cesta de compras', 'cu23 — gestionar carrito de compras', 'cu20 — gestionar carrito de compras'],
      'realizar compra digital': ['realizar compra digital', 'compra digital', 'realizar compra', 'checkout digital', 'cu24 — realizar compra digital', 'cu21 — realizar compra digital'],
      'consultar bitacora': ['consultar bitacora', 'cu10 — consultar bitacora', 'cu07 — consultar bitacora'],
      'gestionar usuarios': ['gestionar usuarios', 'cu04 — gestionar usuarios'],
      'gestionar roles': ['gestionar roles', 'gestionar roles y permisos', 'cu05 — gestionar roles y permisos'],
      'gestionar roles y permisos': ['gestionar roles y permisos', 'gestionar roles', 'cu05 — gestionar roles y permisos'],
      'gestionar empleados': ['gestionar empleados', 'cu06 — gestionar empleados'],
      'gestionar empresas': ['gestionar empresas', 'cu07 — gestionar empresas', 'configuracion empresa'],
      'personalizar apariencia': ['personalizar apariencia', 'cu08 — personalizar apariencia', 'tema tienda'],
      'gestionar backups y restore': ['gestionar backups y restore', 'gestionar backups', 'cu09 — gestionar backups y restore', 'backups'],
      'consultar catalogo': ['consultar catalogo', 'consultar catalogo de productos', 'cu11 — consultar catalogo de productos', 'cu08 — consultar catalogo de productos'],
      'consultar catalogo de productos': ['consultar catalogo de productos', 'consultar catalogo', 'cu11 — consultar catalogo de productos', 'cu08 — consultar catalogo de productos'],
      'consultar detalle y disponibilidad de producto': ['consultar detalle y disponibilidad de producto', 'cu12 — consultar detalle y disponibilidad de producto', 'cu09 — consultar detalle y disponibilidad de producto'],
      'gestionar productos': ['gestionar productos', 'gestionar catalogo de productos', 'cu13 — gestionar catalogo de productos', 'cu10 — gestionar catalogo de productos'],
      'gestionar categorias': ['gestionar categorias', 'gestionar catalogo de productos', 'cu13 — gestionar catalogo de productos', 'cu10 — gestionar catalogo de productos'],
      'gestionar variantes': ['gestionar variantes', 'gestionar catalogo de productos', 'cu13 — gestionar catalogo de productos', 'cu10 — gestionar catalogo de productos'],
      'gestionar catalogo de productos': ['gestionar catalogo de productos', 'gestionar productos', 'gestionar categorias', 'gestionar variantes', 'cu13 — gestionar catalogo de productos', 'cu10 — gestionar catalogo de productos'],
      'gestionar proveedores': ['gestionar proveedores', 'cu14 — gestionar proveedores', 'cu11 — gestionar proveedores'],
      'obtener recomendaciones de prendas mediante ia': ['obtener recomendaciones de prendas mediante ia', 'cu15 — obtener recomendaciones de prendas mediante ia', 'cu12 — obtener recomendaciones de prendas mediante ia'],
      'gestionar sucursales': ['gestionar sucursales', 'gestionar ciudades y sucursales', 'cu16 — gestionar ciudades y sucursales', 'cu13 — gestionar ciudades y sucursales'],
      'gestionar ciudades y sucursales': ['gestionar ciudades y sucursales', 'gestionar sucursales', 'cu16 — gestionar ciudades y sucursales', 'cu13 — gestionar ciudades y sucursales'],
      'consultar sucursales': ['consultar sucursales', 'cu17 — consultar sucursales', 'cu14 — consultar sucursales'],
      'gestionar inventario': ['gestionar inventario', 'consultar inventario', 'cu18 — consultar inventario', 'cu15 — consultar inventario'],
      'consultar inventario': ['consultar inventario', 'gestionar inventario', 'cu18 — consultar inventario', 'cu15 — consultar inventario'],
      'registrar movimientos': ['registrar movimientos', 'gestionar movimientos de inventario', 'cu19 — gestionar movimientos de inventario', 'cu16 — gestionar movimientos de inventario'],
      'gestionar movimientos de inventario': ['gestionar movimientos de inventario', 'registrar movimientos', 'cu19 — gestionar movimientos de inventario', 'cu16 — gestionar movimientos de inventario'],
      'realizar reserva de prendas': ['realizar reserva de prendas', 'realizar reserva', 'reservar prendas', 'reservar prenda', 'cu20 — realizar reserva de prendas', 'cu17 — realizar reserva de prendas'],
      'realizar reserva': ['realizar reserva de prendas', 'realizar reserva', 'reservar prendas', 'reservar prenda', 'cu20 — realizar reserva de prendas', 'cu17 — realizar reserva de prendas'],
      'consultar y cancelar reserva': ['consultar y cancelar reserva', 'consultar reserva', 'cancelar reserva', 'cu21 — consultar y cancelar reserva', 'cu18 — consultar y cancelar reserva'],
      'gestionar reservas': ['gestionar reservas', 'gestionar reserva en sucursal', 'cu22 — gestionar reserva en sucursal', 'cu19 — gestionar reserva en sucursal'],
      'gestionar reserva en sucursal': ['gestionar reserva en sucursal', 'gestionar reservas', 'cu22 — gestionar reserva en sucursal', 'cu19 — gestionar reserva en sucursal'],
      'registrar venta': ['registrar venta', 'registrar venta presencial', 'cu27 — registrar venta presencial', 'cu24 — registrar venta presencial'],
      'registrar venta presencial': ['registrar venta presencial', 'registrar venta', 'cu27 — registrar venta presencial', 'cu24 — registrar venta presencial'],
      'procesar pago': ['procesar pago', 'procesar pago electronico', 'cu26 — procesar pago electronico', 'cu23 — procesar pago electronico', 'cu27 — registrar venta presencial', 'registrar venta presencial'],
      'procesar pago electronico': ['procesar pago electronico', 'procesar pago', 'cu26 — procesar pago electronico', 'cu23 — procesar pago electronico'],
      'devolucion de productos': ['devolucion de productos', 'gestionar devoluciones', 'cu28 — devolucion de productos', 'cu26 — gestionar devoluciones'],
      'gestionar devoluciones': ['gestionar devoluciones', 'devolucion de productos', 'cu28 — devolucion de productos', 'cu26 — gestionar devoluciones'],
      'consultar dashboard y reportes': ['consultar dashboard y reportes', 'consultar dashboard', 'generar reportes', 'reportes', 'dashboard', 'cu29 — consultar dashboard', 'cu27 — consultar dashboard-reportes'],
      'consultar dashboard': ['consultar dashboard y reportes', 'consultar dashboard', 'cu29 — consultar dashboard'],
      'generar reportes': ['consultar dashboard y reportes', 'generar reportes', 'reportes', 'cu30 — gestionar reportes predefinidos'],
      'gestionar reportes predefinidos': ['gestionar reportes predefinidos', 'consultar dashboard y reportes', 'reportes predefinidos', 'cu30 — gestionar reportes predefinidos'],
      'gestionar reportes qbe': ['gestionar reportes qbe', 'reportes qbe', 'qbe', 'consultar dashboard y reportes', 'cu31 — gestionar reportes qbe'],
      'gestionar reportes por voz': ['gestionar reportes por voz', 'reportes por voz', 'consultar dashboard y reportes', 'cu32 — gestionar reportes por voz'],
    };
    const acceptedFunctionNames = new Set([reqModuloNorm, ...(aliases[reqModuloNorm] ?? [])]);

    const hasAccess = rolFunciones.some((rf) => {
      const funcNombreNorm = normalize(rf.funcion?.nombre);
      const nivelNorm = normalize(rf.descripcion || 'Lectura');

      if (!acceptedFunctionNames.has(funcNombreNorm)) {
        return false;
      }

      // Si el rol tiene asignada la función y no está explícitamente restringido a 'lectura', se permite
      if (reqPermisoNorm === 'lectura') {
        return true;
      }

      if (reqPermisoNorm === 'edicion') {
        return nivelNorm !== 'lectura';
      }

      return true;
    });

    if (!hasAccess) {
      throw new ForbiddenException(`No tiene permisos de ${requiredFunc.permiso} para ${requiredFunc.modulo}`);
    }

    return true;
  }
}
