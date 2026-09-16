import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';

function formatTimeToHHmm(date?: Date | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

@Injectable()
export class BranchesPublicService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene todas las sucursales activas con su ciudad asociada.
   * Filtra estrictamente sucursales inactivas.
   * Permite filtrado opcional por id_ciudad o búsqueda por texto (nombre, ciudad, dirección).
   */
  async getActiveBranches(query?: { id_ciudad?: number; search?: string }) {
    const where: any = {
      estado: 'activo',
    };

    if (query?.id_ciudad) {
      where.id_ciudad = Number(query.id_ciudad);
    }

    if (query?.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { nombre: { contains: term, mode: 'insensitive' } },
        { direccion: { contains: term, mode: 'insensitive' } },
        { ciudad: { nombre: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const branches = await this.prisma.sucursal.findMany({
      where,
      orderBy: [
        { ciudad: { nombre: 'asc' } },
        { nombre: 'asc' },
      ],
      select: {
        id_sucursal: true,
        nombre: true,
        direccion: true,
        telefono: true,
        hora_apertura: true,
        hora_cierre: true,
        estado: true,
        id_ciudad: true,
        ciudad: {
          select: {
            id_ciudad: true,
            nombre: true,
            pais: true,
          },
        },
      },
    });

    return branches.map((b) => ({
      id_sucursal: b.id_sucursal,
      nombre: b.nombre,
      direccion: b.direccion,
      telefono: b.telefono,
      hora_apertura: formatTimeToHHmm(b.hora_apertura),
      hora_cierre: formatTimeToHHmm(b.hora_cierre),
      estado: b.estado,
      id_ciudad: b.id_ciudad,
      ciudad: b.ciudad,
    }));
  }

  /**
   * Obtiene el detalle público de una sucursal activa específica.
   */
  async getActiveBranchById(id: number) {
    const branch = await this.prisma.sucursal.findFirst({
      where: {
        id_sucursal: id,
        estado: 'activo',
      },
      select: {
        id_sucursal: true,
        nombre: true,
        direccion: true,
        telefono: true,
        hora_apertura: true,
        hora_cierre: true,
        estado: true,
        id_ciudad: true,
        ciudad: {
          select: {
            id_ciudad: true,
            nombre: true,
            pais: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Sucursal no encontrada o inactiva.');
    }

    return {
      id_sucursal: branch.id_sucursal,
      nombre: branch.nombre,
      direccion: branch.direccion,
      telefono: branch.telefono,
      hora_apertura: formatTimeToHHmm(branch.hora_apertura),
      hora_cierre: formatTimeToHHmm(branch.hora_cierre),
      estado: branch.estado,
      id_ciudad: branch.id_ciudad,
      ciudad: branch.ciudad,
    };
  }

  /**
   * Obtiene la lista de ciudades que cuentan con al menos una sucursal activa.
   */
  async getActiveCities() {
    const cities = await this.prisma.ciudad.findMany({
      where: {
        sucursal: {
          some: {
            estado: 'activo',
          },
        },
      },
      orderBy: { nombre: 'asc' },
      select: {
        id_ciudad: true,
        nombre: true,
        pais: true,
        sucursal: {
          where: { estado: 'activo' },
          select: { id_sucursal: true },
        },
      },
    });

    return cities.map((c) => ({
      id_ciudad: c.id_ciudad,
      nombre: c.nombre,
      pais: c.pais,
      total_sucursales: c.sucursal.length,
    }));
  }

}
