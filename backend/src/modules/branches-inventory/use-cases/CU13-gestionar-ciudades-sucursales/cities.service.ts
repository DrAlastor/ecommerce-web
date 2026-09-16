import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { BitacoraService } from '../../../users-security/shared/services/bitacora.service.js';
import { CreateCityDto, QueryCitiesDto, UpdateCityDto } from './dto/cities.dto.js';

@Injectable()
export class CitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacora: BitacoraService,
  ) {}

  async findAll(query: QueryCitiesDto) {
    const { search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search?.trim()) {
      const term = search.trim();
      where.OR = [
        { nombre: { contains: term, mode: 'insensitive' } },
        { pais: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, cities] = await Promise.all([
      this.prisma.ciudad.count({ where }),
      this.prisma.ciudad.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nombre: 'asc' },
        include: {
          _count: {
            select: {
              sucursal: true,
              direccion: true,
            },
          },
        },
      }),
    ]);

    return {
      data: cities.map((c) => ({
        id_ciudad: c.id_ciudad,
        nombre: c.nombre,
        pais: c.pais,
        total_sucursales: c._count.sucursal,
        total_direcciones: c._count.direccion,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findAllSimple() {
    return this.prisma.ciudad.findMany({
      orderBy: { nombre: 'asc' },
      select: {
        id_ciudad: true,
        nombre: true,
        pais: true,
      },
    });
  }

  async findById(id: number) {
    const city = await this.prisma.ciudad.findUnique({
      where: { id_ciudad: id },
      include: {
        sucursal: {
          select: {
            id_sucursal: true,
            nombre: true,
            direccion: true,
            telefono: true,
            estado: true,
          },
          orderBy: { nombre: 'asc' },
        },
        _count: {
          select: {
            sucursal: true,
            direccion: true,
          },
        },
      },
    });

    if (!city) {
      throw new NotFoundException(`La ciudad con ID ${id} no existe.`);
    }

    return {
      id_ciudad: city.id_ciudad,
      nombre: city.nombre,
      pais: city.pais,
      total_sucursales: city._count.sucursal,
      total_direcciones: city._count.direccion,
      sucursales: city.sucursal,
    };
  }

  async create(dto: CreateCityDto, idUsuario: number, ip?: string) {
    const nombre = dto.nombre.trim();
    const pais = dto.pais.trim();

    const conflict = await this.prisma.ciudad.findFirst({
      where: {
        nombre: { equals: nombre, mode: 'insensitive' },
        pais: { equals: pais, mode: 'insensitive' },
      },
    });

    if (conflict) {
      throw new ConflictException(
        `Ya existe la ciudad "${nombre}" registrada en "${pais}".`,
      );
    }

    const max = await this.prisma.ciudad.aggregate({ _max: { id_ciudad: true } });
    const nextId = (max._max.id_ciudad || 0) + 1;

    const created = await this.prisma.ciudad.create({
      data: {
        id_ciudad: nextId,
        nombre,
        pais,
      },
    });

    await this.bitacora.logCreacion(
      'Ciudad',
      `Registró la ciudad ${nombre} (${pais}) con ID #${nextId}`,
      idUsuario,
      ip,
    );

    return {
      message: 'Ciudad creada exitosamente.',
      data: created,
    };
  }

  async update(id: number, dto: UpdateCityDto, idUsuario: number, ip?: string) {
    const existing = await this.prisma.ciudad.findUnique({
      where: { id_ciudad: id },
    });

    if (!existing) {
      throw new NotFoundException(`La ciudad con ID ${id} no existe.`);
    }

    const nombre = dto.nombre !== undefined ? dto.nombre.trim() : existing.nombre;
    const pais = dto.pais !== undefined ? dto.pais.trim() : existing.pais;

    if (
      nombre.toLowerCase() !== existing.nombre.toLowerCase() ||
      pais.toLowerCase() !== existing.pais.toLowerCase()
    ) {
      const conflict = await this.prisma.ciudad.findFirst({
        where: {
          nombre: { equals: nombre, mode: 'insensitive' },
          pais: { equals: pais, mode: 'insensitive' },
          NOT: { id_ciudad: id },
        },
      });

      if (conflict) {
        throw new ConflictException(
          `Ya existe otra ciudad registrada con nombre "${nombre}" en "${pais}".`,
        );
      }
    }

    const updated = await this.prisma.ciudad.update({
      where: { id_ciudad: id },
      data: {
        nombre,
        pais,
      },
    });

    await this.bitacora.logModificacion(
      'Ciudad',
      `Actualizó los datos de la ciudad #${id}: ${nombre} (${pais})`,
      idUsuario,
      ip,
    );

    return {
      message: 'Ciudad actualizada exitosamente.',
      data: updated,
    };
  }

  async delete(id: number, idUsuario: number, ip?: string) {
    const existing = await this.prisma.ciudad.findUnique({
      where: { id_ciudad: id },
      include: {
        _count: {
          select: {
            sucursal: true,
            direccion: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`La ciudad con ID ${id} no existe.`);
    }

    if (existing._count.sucursal > 0 || existing._count.direccion > 0) {
      throw new BadRequestException(
        `No se puede eliminar la ciudad "${existing.nombre}" porque tiene ${existing._count.sucursal} sucursal(es) y ${existing._count.direccion} dirección(es) vinculadas.`,
      );
    }

    await this.prisma.ciudad.delete({
      where: { id_ciudad: id },
    });

    await this.bitacora.logEliminacion(
      'Ciudad',
      `Eliminó la ciudad #${id}: ${existing.nombre} (${existing.pais})`,
      idUsuario,
      ip,
    );

    return {
      message: `Ciudad "${existing.nombre}" eliminada exitosamente.`,
    };
  }
}
