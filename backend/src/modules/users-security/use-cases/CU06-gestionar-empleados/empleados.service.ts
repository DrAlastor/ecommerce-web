import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { BitacoraService } from '../../shared/services/bitacora.service.js';
import { ActiveSessionService } from '../../shared/services/active-session.service.js';
import {
  QueryEmployeesDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  UpdateEmployeeStatusDto,
} from './dto/empleados.dto.js';

@Injectable()
export class EmpleadosService {
  private readonly logger = new Logger(EmpleadosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
    private readonly activeSessionService: ActiveSessionService,
  ) {}

  /**
   * Listar empleados con búsqueda y filtros dinámicos (Rol, Sucursal, Estado)
   */
  async findAll(query: QueryEmployeesDto) {
    const { search, rol, sucursal, estado, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (estado) {
      where.estado = estado;
    }

    if (rol) {
      where.usuario = {
        id_rol: rol,
      };
    }

    if (sucursal) {
      where.empleado_sucursal = {
        some: {
          id_sucursal: sucursal,
        },
      };
    }

    if (search && search.trim() !== '') {
      const term = search.trim();
      where.OR = [
        { nombre: { contains: term, mode: 'insensitive' } },
        { apellido: { contains: term, mode: 'insensitive' } },
        { codigo_empleado: { contains: term, mode: 'insensitive' } },
        { ci: { contains: term, mode: 'insensitive' } },
        {
          usuario: {
            email: { contains: term, mode: 'insensitive' },
          },
        },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.empleado.count({ where }),
      this.prisma.empleado.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id_empleado: 'asc' },
        include: {
          usuario: {
            select: {
              id_usuario: true,
              email: true,
              estado: true,
              id_rol: true,
              rol: {
                select: {
                  id_rol: true,
                  nombre: true,
                },
              },
            },
          },
          empleado_sucursal: {
            include: {
              sucursal: {
                select: {
                  id_sucursal: true,
                  nombre: true,
                  direccion: true,
                  ciudad: {
                    select: {
                      id_ciudad: true,
                      nombre: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const formatted = items.map((e) => ({
      id_empleado: e.id_empleado,
      codigo_empleado: e.codigo_empleado,
      ci: e.ci,
      nombre: e.nombre,
      apellido: e.apellido,
      nombre_completo: `${e.nombre} ${e.apellido}`,
      telefono: e.telefono,
      fecha_contratacion: e.fecha_contratacion,
      estado: e.estado,
      conectado: this.activeSessionService.isConnected(e.id_empleado),
      email: e.usuario?.email,
      id_rol: e.usuario?.id_rol,
      rol: e.usuario?.rol?.nombre,
      sucursales: e.empleado_sucursal.map((es) => ({
        id_sucursal: es.sucursal.id_sucursal,
        nombre: es.sucursal.nombre,
        direccion: es.sucursal.direccion,
        ciudad: es.sucursal.ciudad?.nombre,
      })),
    }));

    return {
      data: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Obtener detalle completo de un empleado
   */
  async findOne(id: number) {
    const e = await this.prisma.empleado.findUnique({
      where: { id_empleado: id },
      include: {
        usuario: {
          select: {
            id_usuario: true,
            email: true,
            estado: true,
            id_rol: true,
            rol: {
              select: {
                id_rol: true,
                nombre: true,
                permiso: true,
              },
            },
          },
        },
        empleado_sucursal: {
          include: {
            sucursal: {
              select: {
                id_sucursal: true,
                nombre: true,
                direccion: true,
                telefono: true,
                ciudad: {
                  select: {
                    id_ciudad: true,
                    nombre: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!e) {
      throw new NotFoundException(`Empleado con ID ${id} no encontrado`);
    }

    return {
      id_empleado: e.id_empleado,
      codigo_empleado: e.codigo_empleado,
      ci: e.ci,
      nombre: e.nombre,
      apellido: e.apellido,
      nombre_completo: `${e.nombre} ${e.apellido}`,
      telefono: e.telefono,
      fecha_contratacion: e.fecha_contratacion,
      estado: e.estado,
      conectado: this.activeSessionService.isConnected(e.id_empleado),
      email: e.usuario?.email,
      id_rol: e.usuario?.id_rol,
      rol: e.usuario?.rol?.nombre,
      sucursales: e.empleado_sucursal.map((es) => ({
        id_sucursal: es.sucursal.id_sucursal,
        nombre: es.sucursal.nombre,
        direccion: es.sucursal.direccion,
        telefono: es.sucursal.telefono,
        ciudad: es.sucursal.ciudad?.nombre,
      })),
    };
  }

  /**
   * Listar todas las sucursales disponibles para asignación
   */
  async getBranches() {
    const sucursales = await this.prisma.sucursal.findMany({
      include: {
        ciudad: {
          select: {
            id_ciudad: true,
            nombre: true,
          },
        },
      },
      orderBy: { id_sucursal: 'asc' },
    });

    return sucursales.map((s) => ({
      id_sucursal: s.id_sucursal,
      nombre: s.nombre,
      direccion: s.direccion,
      ciudad: s.ciudad?.nombre,
      estado: s.estado,
    }));
  }

  /**
   * Listar roles válidos para empleados (excluyendo Cliente)
   */
  async getEmployeeRoles() {
    return this.prisma.rol.findMany({
      where: {
        nombre: {
          not: 'Cliente',
        },
      },
      select: {
        id_rol: true,
        nombre: true,
        permiso: true,
      },
      orderBy: { id_rol: 'asc' },
    });
  }

  /**
   * Creación transaccional: USUARIO + EMPLEADO + EMPLEADO_SUCURSAL
   */
  async create(dto: CreateEmployeeDto, userId: number, ip?: string) {
    const cleanEmail = dto.email.trim().toLowerCase();
    const cleanCode = dto.codigo_empleado.trim().toUpperCase();
    const cleanCi = dto.ci.trim();

    // 1. Validar duplicados
    const existingEmail = await this.prisma.usuario.findUnique({
      where: { email: cleanEmail },
    });
    if (existingEmail) {
      throw new BadRequestException('El correo electrónico ya se encuentra registrado.');
    }

    const existingCode = await this.prisma.empleado.findUnique({
      where: { codigo_empleado: cleanCode },
    });
    if (existingCode) {
      throw new BadRequestException(`El código de empleado "${cleanCode}" ya está en uso.`);
    }

    const existingCi = await this.prisma.empleado.findUnique({
      where: { ci: cleanCi },
    });
    if (existingCi) {
      throw new BadRequestException(`El número de CI "${cleanCi}" ya está registrado para otro empleado.`);
    }

    // 2. Validar rol válido
    const rol = await this.prisma.rol.findUnique({
      where: { id_rol: dto.id_rol },
    });
    if (!rol) {
      throw new BadRequestException('El rol especificado no existe.');
    }
    if (rol.nombre.toLowerCase() === 'cliente') {
      throw new BadRequestException('No se puede asignar el rol de Cliente a un empleado.');
    }

    // 3. Validar sucursales
    if (dto.sucursales && dto.sucursales.length > 0) {
      const validBranches = await this.prisma.sucursal.findMany({
        where: { id_sucursal: { in: dto.sucursales } },
        select: { id_sucursal: true },
      });
      if (validBranches.length !== dto.sucursales.length) {
        throw new BadRequestException('Una o más sucursales seleccionadas no existen.');
      }
    }

    // 4. Obtener siguiente id_usuario
    const maxUser = await this.prisma.usuario.aggregate({
      _max: { id_usuario: true },
    });
    const nextId = (maxUser._max.id_usuario || 0) + 1;

    // 5. Preparar contraseña
    const rawPassword = dto.password || 'Password123!';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    // 6. Transacción atómica
    const newEmployee = await this.prisma.$transaction(async (tx) => {
      // a) Crear cuenta USUARIO
      await tx.usuario.create({
        data: {
          id_usuario: nextId,
          email: cleanEmail,
          password_hash: passwordHash,
          id_rol: dto.id_rol,
          estado: dto.estado || 'activo',
        },
      });

      // b) Crear ficha EMPLEADO con el mismo identificador
      const emp = await tx.empleado.create({
        data: {
          id_empleado: nextId,
          codigo_empleado: cleanCode,
          ci: cleanCi,
          nombre: dto.nombre.trim(),
          apellido: dto.apellido.trim(),
          telefono: dto.telefono ? dto.telefono.trim() : null,
          fecha_contratacion: new Date(dto.fecha_contratacion),
          estado: dto.estado || 'activo',
        },
      });

      // c) Crear relaciones EMPLEADO_SUCURSAL
      if (dto.sucursales && dto.sucursales.length > 0) {
        const uniqueBranches = Array.from(new Set(dto.sucursales));
        await tx.empleado_sucursal.createMany({
          data: uniqueBranches.map((branchId) => ({
            id_empleado: nextId,
            id_sucursal: branchId,
          })),
        });
      }

      return emp;
    });

    // 7. Registro en bitácora
    await this.bitacora.logAction(
      `Creó empleado ${dto.nombre.trim()} ${dto.apellido.trim()} (${cleanCode})`,
      'EMPLEADO',
      userId,
      ip,
    );

    return this.findOne(newEmployee.id_empleado);
  }

  /**
   * Modificación de información laboral, rol y sucursales
   */
  async update(id: number, dto: UpdateEmployeeDto, userId: number, ip?: string) {
    const employee = await this.prisma.empleado.findUnique({
      where: { id_empleado: id },
      include: { usuario: true },
    });

    if (!employee) {
      throw new NotFoundException(`Empleado con ID ${id} no encontrado.`);
    }

    // Validar CI único si se modifica
    if (dto.ci && dto.ci.trim() !== employee.ci) {
      const cleanCi = dto.ci.trim();
      const existingCi = await this.prisma.empleado.findUnique({
        where: { ci: cleanCi },
      });
      if (existingCi) {
        throw new BadRequestException(`El número de CI "${cleanCi}" ya está registrado.`);
      }
    }

    // Validar email único si se modifica
    if (dto.email && dto.email.trim().toLowerCase() !== employee.usuario.email.toLowerCase()) {
      const cleanEmail = dto.email.trim().toLowerCase();
      const existingEmail = await this.prisma.usuario.findUnique({
        where: { email: cleanEmail },
      });
      if (existingEmail) {
        throw new BadRequestException('El correo electrónico ya se encuentra registrado.');
      }
    }

    // Validar rol si se modifica
    if (dto.id_rol) {
      const rol = await this.prisma.rol.findUnique({
        where: { id_rol: dto.id_rol },
      });
      if (!rol) {
        throw new BadRequestException('El rol especificado no existe.');
      }
      if (rol.nombre.toLowerCase() === 'cliente') {
        throw new BadRequestException('No se puede asignar el rol de Cliente a un empleado.');
      }
    }

    // Validar sucursales si se modifican
    if (dto.sucursales && dto.sucursales.length > 0) {
      const validBranches = await this.prisma.sucursal.findMany({
        where: { id_sucursal: { in: dto.sucursales } },
        select: { id_sucursal: true },
      });
      if (validBranches.length !== dto.sucursales.length) {
        throw new BadRequestException('Una o más sucursales seleccionadas no existen.');
      }
    }

    // Actualización transaccional
    await this.prisma.$transaction(async (tx) => {
      // 1. Actualizar EMPLEADO
      await tx.empleado.update({
        where: { id_empleado: id },
        data: {
          ...(dto.nombre && { nombre: dto.nombre.trim() }),
          ...(dto.apellido && { apellido: dto.apellido.trim() }),
          ...(dto.ci && { ci: dto.ci.trim() }),
          ...(dto.telefono !== undefined && { telefono: dto.telefono ? dto.telefono.trim() : null }),
          ...(dto.fecha_contratacion && { fecha_contratacion: new Date(dto.fecha_contratacion) }),
          ...(dto.estado && { estado: dto.estado }),
        },
      });

      // 2. Actualizar USUARIO
      const userUpdates: any = {};
      if (dto.email) userUpdates.email = dto.email.trim().toLowerCase();
      if (dto.id_rol) userUpdates.id_rol = dto.id_rol;
      if (dto.estado) userUpdates.estado = dto.estado;
      if (dto.password) {
        userUpdates.password_hash = await bcrypt.hash(dto.password, 10);
      }

      if (Object.keys(userUpdates).length > 0) {
        await tx.usuario.update({
          where: { id_usuario: id },
          data: userUpdates,
        });
      }

      // 3. Actualizar EMPLEADO_SUCURSAL si se especificaron
      if (dto.sucursales !== undefined) {
        await tx.empleado_sucursal.deleteMany({
          where: { id_empleado: id },
        });

        if (dto.sucursales.length > 0) {
          const uniqueBranches = Array.from(new Set(dto.sucursales));
          await tx.empleado_sucursal.createMany({
            data: uniqueBranches.map((branchId) => ({
              id_empleado: id,
              id_sucursal: branchId,
            })),
          });
        }
      }
    });

    // Auditoría en bitácora
    const updatedName = dto.nombre ? dto.nombre.trim() : employee.nombre;
    const updatedApellido = dto.apellido ? dto.apellido.trim() : employee.apellido;
    await this.bitacora.logAction(
      `Modificó empleado ${updatedName} ${updatedApellido}`,
      'EMPLEADO',
      userId,
      ip,
    );

    return this.findOne(id);
  }

  /**
   * Cambiar estado (activo/inactivo) en empleado y cuenta de usuario
   */
  async updateStatus(id: number, dto: UpdateEmployeeStatusDto, userId: number, ip?: string) {
    const employee = await this.prisma.empleado.findUnique({
      where: { id_empleado: id },
    });

    if (!employee) {
      throw new NotFoundException(`Empleado con ID ${id} no encontrado.`);
    }

    await this.prisma.$transaction([
      this.prisma.empleado.update({
        where: { id_empleado: id },
        data: { estado: dto.estado },
      }),
      this.prisma.usuario.update({
        where: { id_usuario: id },
        data: { estado: dto.estado },
      }),
    ]);

    await this.bitacora.logAction(
      `Modificó estado del empleado ${employee.codigo_empleado} a ${dto.estado}`,
      'EMPLEADO',
      userId,
      ip,
    );

    return this.findOne(id);
  }
}
