/**
 * @file branches-public.service.ts
 * @caso-de-uso CU14 — Consultar sucursales
 * @subsistema Sucursales e Inventario
 * @capa Lógica de Negocio y Persistencia — Backend
 * @responsabilidad Recupera información pública de tiendas físicas activas para clientes:
 * - Filtra de forma estricta las sucursales inactivas o clausuradas.
 * - Formatea las horas de apertura y cierre a formato "HH:mm".
 * - Proporciona las ciudades activas con tiendas en funcionamiento.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';

/**
 * Convierte un objeto Date representativo de hora a una cadena "HH:mm" en formato UTC.
 */
function formatTimeToHHmm(date?: Date | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Servicio encargado de la consulta pública de tiendas físicas y ciudades habilitadas.
 */
@Injectable()
export class BranchesPublicService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene todas las sucursales activas en la base de datos junto con su ciudad asociada.
   * Aplica filtros opcionales por identificador de ciudad o término de búsqueda textual.
   *
   * @param {Object} [query] - Parámetros de consulta opcionales.
   * @param {number} [query.id_ciudad] - ID numérico de la ciudad.
   * @param {string} [query.search] - Texto a buscar en nombre, dirección o ciudad.
   * @returns {Promise<Array>} Lista de sucursales activas con horas formateadas.
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
   * Obtiene la información pública de una tienda física por su identificador único.
   *
   * @param {number} id - ID de la sucursal.
   * @returns {Promise<Object>} Datos informativos de la sucursal y ciudad.
   * @throws {NotFoundException} Si la tienda no existe o se encuentra inactiva.
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
   * Obtiene las ciudades que poseen al menos una sucursal en estado activo.
   *
   * @returns {Promise<Array>} Lista de ciudades con conteo de tiendas activas.
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
