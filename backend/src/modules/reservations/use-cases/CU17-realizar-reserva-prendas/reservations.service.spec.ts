import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReservationsService } from './reservations.service.js';

describe('ReservationsService (CU17 — Realizar Reserva de Prendas)', () => {
  let service: ReservationsService;
  let mockPrisma: any;
  let mockBitacora: any;

  beforeEach(() => {
    mockPrisma = {
      cliente: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      usuario: {
        findUnique: vi.fn(),
      },
      sucursal: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      producto_variante: {
        findUnique: vi.fn(),
      },
      inventario_sucursal: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      reserva: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        aggregate: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      detalle_reserva: {
        aggregate: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
      },
      empleado_sucursal: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    mockBitacora = {
      logAction: vi.fn(),
    };

    service = new ReservationsService(mockPrisma, mockBitacora);
  });

  it('debe rechazar la reserva si la sucursal no existe', async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue({ id_cliente: 2 });
    mockPrisma.sucursal.findUnique.mockResolvedValue(null);

    await expect(
      service.createReservation(
        { id_usuario: 2 },
        { id_sucursal: 999, id_producto_variante: 1, cantidad: 1 },
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('debe rechazar la reserva si la sucursal está inactiva', async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue({ id_cliente: 2 });
    mockPrisma.sucursal.findUnique.mockResolvedValue({
      id_sucursal: 1,
      nombre: 'Sucursal Test',
      estado: 'inactivo',
    });

    await expect(
      service.createReservation(
        { id_usuario: 2 },
        { id_sucursal: 1, id_producto_variante: 1, cantidad: 1 },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe rechazar la reserva si el stock disponible es insuficiente', async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue({ id_cliente: 2 });
    mockPrisma.sucursal.findUnique.mockResolvedValue({
      id_sucursal: 1,
      nombre: 'FashionStore Ventura',
      estado: 'activo',
    });

    mockPrisma.producto_variante.findUnique.mockResolvedValue({
      id_producto_variante: 10,
      estado: 'activo',
      producto: { nombre: 'Vestido Floral Primavera', estado: 'activo' },
      talla: { codigo: 'M' },
      color: { nombre: 'Azul' },
    });

    mockPrisma.inventario_sucursal.findUnique.mockResolvedValue({
      stock_disponible: 1, // Solo 1 disponible
      stock_reservado: 0,
    });

    await expect(
      service.createReservation(
        { id_usuario: 2 },
        { id_sucursal: 1, id_producto_variante: 10, cantidad: 3 }, // Solicita 3
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe crear exitosamente la reserva y calcular el comprobante', async () => {
    mockPrisma.cliente.findUnique.mockResolvedValue({ id_cliente: 2 });
    mockPrisma.sucursal.findUnique.mockResolvedValue({
      id_sucursal: 1,
      nombre: 'FashionStore Ventura',
      direccion: 'Av. San Martin 1700',
      telefono: '33610001',
      hora_apertura: '10:00',
      hora_cierre: '22:00',
      estado: 'activo',
      ciudad: { nombre: 'Santa Cruz de la Sierra' },
    });

    mockPrisma.producto_variante.findUnique.mockResolvedValue({
      id_producto_variante: 10,
      sku: 'VEST-FLO-M-AZU',
      precio_adicional: 0,
      estado: 'activo',
      producto: {
        id_producto: 5,
        nombre: 'Vestido Floral Primavera',
        precio_base: 249.9,
        estado: 'activo',
      },
      talla: { codigo: 'M' },
      color: { nombre: 'Azul', codigo_hex: '#1E3A8A' },
    });

    mockPrisma.inventario_sucursal.findUnique.mockResolvedValue({
      id_inventario_sucursal: 1,
      stock_disponible: 10,
      stock_reservado: 0,
    });

    const mockFecha = new Date();
    const mockFechaLimite = new Date(mockFecha.getTime() + 48 * 60 * 60 * 1000);

    mockPrisma.$transaction.mockImplementation(async (cb: any) => {
      const tx = {
        reserva: {
          findUnique: vi.fn().mockResolvedValue(null),
          aggregate: vi.fn().mockResolvedValue({ _max: { id_reserva: 5 } }),
          create: vi.fn().mockResolvedValue({
            id_reserva: 6,
            codigo: 'RES-20260916-1234',
            fecha_reserva: mockFecha,
            horario_estimado: new Date(mockFecha.getTime() + 24 * 60 * 60 * 1000),
            estado: 'Pendiente',
            observaciones: 'Prueba de vestido',
            id_cliente: 2,
            id_sucursal: 1,
          }),
        },
        detalle_reserva: {
          aggregate: vi.fn().mockResolvedValue({ _max: { id_detalle_reserva: 8 } }),
          create: vi.fn().mockResolvedValue({
            id_detalle_reserva: 9,
            id_reserva: 6,
            id_producto_variante: 10,
            cantidad: 2,
            estado: 'Pendiente',
            producto_variante: {
              sku: 'VEST-FLO-M-AZU',
              precio_adicional: 0,
              producto: {
                id_producto: 5,
                nombre: 'Vestido Floral Primavera',
                precio_base: 249.9,
              },
              talla: { codigo: 'M' },
              color: { nombre: 'Azul', codigo_hex: '#1E3A8A' },
            },
          }),
        },
        inventario_sucursal: {
          update: vi.fn().mockResolvedValue({}),
        },
      };

      return cb(tx);
    });

    const res = await service.createReservation(
      { id_usuario: 2 },
      {
        id_sucursal: 1,
        id_producto_variante: 10,
        cantidad: 2,
        observaciones: 'Prueba de vestido',
      },
    );

    expect(res).toBeDefined();
    expect(res.comprobante.codigo).toBe('RES-20260916-1234');
    expect(res.comprobante.estado).toBe('Pendiente');
    expect(res.sucursal.nombre).toBe('FashionStore Ventura');
    expect(res.resumen.total_prendas).toBe(2);
    expect(res.items[0].producto_nombre).toBe('Vestido Floral Primavera');
    expect(res.items[0].talla).toBe('M');
    expect(res.items[0].color_nombre).toBe('Azul');
    expect(mockBitacora.logAction).toHaveBeenCalled();
  });

  describe('CU18 — Consultar y Cancelar Reserva', () => {
    it('debe obtener las reservas del cliente filtradas por tipo activas', async () => {
      mockPrisma.cliente.findUnique.mockResolvedValue({ id_cliente: 2 });
      mockPrisma.reserva.findMany.mockResolvedValue([
        {
          id_reserva: 10,
          codigo: 'RES-20260916-5555',
          estado: 'Pendiente',
          fecha_reserva: new Date(),
          horario_estimado: new Date(),
          observaciones: null,
          sucursal: {
            id_sucursal: 1,
            nombre: 'FashionStore Ventura',
            direccion: 'Av. San Martin 1700',
            telefono: '33610001',
            hora_apertura: '10:00',
            hora_cierre: '22:00',
            ciudad: { nombre: 'Santa Cruz' },
          },
          detalle_reserva: [
            {
              id_detalle_reserva: 1,
              id_producto_variante: 10,
              cantidad: 1,
              estado: 'Pendiente',
              producto_variante: {
                sku: 'VEST-FLO-M-AZU',
                precio_adicional: 0,
                producto: {
                  nombre: 'Vestido Floral Primavera',
                  precio_base: 249.9,
                  imagen_producto: [{ url: 'https://example.com/img.jpg' }],
                },
                talla: { codigo: 'M' },
                color: { nombre: 'Azul', codigo_hex: '#1E3A8A' },
              },
            },
          ],
        },
      ]);

      const reservas = await service.getMyReservations({ id_usuario: 2 }, { tipo: 'activas' });

      expect(reservas).toHaveLength(1);
      expect(reservas[0].codigo).toBe('RES-20260916-5555');
      expect(reservas[0].es_cancelable).toBe(true);
      expect(reservas[0].items[0].producto_nombre).toBe('Vestido Floral Primavera');
    });

    it('debe rechazar la cancelación si la reserva ya está cancelada o completada', async () => {
      mockPrisma.cliente.findUnique.mockResolvedValue({ id_cliente: 2 });
      mockPrisma.reserva.findUnique.mockResolvedValue({
        id_reserva: 20,
        codigo: 'RES-20260916-8888',
        estado: 'Cancelada',
        id_cliente: 2,
        detalle_reserva: [],
        sucursal: { nombre: 'FashionStore Ventura' },
      });

      await expect(
        service.cancelMyReservation({ id_usuario: 2 }, 20, 'Ya no la necesito'),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe cancelar exitosamente la reserva y restituir existencias en inventario_sucursal', async () => {
      mockPrisma.cliente.findUnique.mockResolvedValue({ id_cliente: 2 });
      mockPrisma.reserva.findUnique.mockResolvedValue({
        id_reserva: 30,
        codigo: 'RES-20260916-9999',
        estado: 'Pendiente',
        id_cliente: 2,
        id_sucursal: 1,
        observaciones: 'Prueba',
        sucursal: { nombre: 'FashionStore Ventura' },
        detalle_reserva: [
          {
            id_detalle_reserva: 101,
            id_producto_variante: 15,
            cantidad: 2,
            estado: 'Pendiente',
          },
        ],
      });

      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          reserva: {
            update: vi.fn().mockResolvedValue({
              id_reserva: 30,
              codigo: 'RES-20260916-9999',
              estado: 'Cancelada',
            }),
          },
          detalle_reserva: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
          inventario_sucursal: {
            findUnique: vi.fn().mockResolvedValue({
              id_inventario_sucursal: 50,
              stock_disponible: 8,
              stock_reservado: 2,
            }),
            update: vi.fn().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });

      const res = await service.cancelMyReservation(
        { id_usuario: 2 },
        30,
        'No podré asistir a la tienda',
      );

      expect(res.success).toBe(true);
      expect(res.estado).toBe('Cancelada');
      expect(res.prendas_liberadas).toBe(2);
      expect(mockBitacora.logAction).toHaveBeenCalled();
    });
  });

  describe('CU19 — Gestionar Reserva en Sucursal', () => {
    it('debe retornar las sucursales asignadas al empleado', async () => {
      mockPrisma.empleado_sucursal.findMany.mockResolvedValue([
        {
          id_sucursal: 1,
          sucursal: { id_sucursal: 1, nombre: 'FashionStore Ventura', ciudad: { nombre: 'Santa Cruz' } },
        },
      ]);

      const branches = await service.getBranchStaffBranches({ id_usuario: 7, id_rol: 3 });
      expect(branches).toHaveLength(1);
      expect(branches[0].nombre).toBe('FashionStore Ventura');
    });

    it('debe rechazar la consulta de reservas si el empleado no tiene acceso a la sucursal', async () => {
      mockPrisma.empleado_sucursal.findMany.mockResolvedValue([
        { id_sucursal: 1 },
      ]);

      await expect(
        service.getBranchReservations({ id_usuario: 7, id_rol: 3 }, { sucursalId: 2 }),
      ).rejects.toThrow();
    });

    it('debe actualizar el estado a "Preparada" cuando el personal prepara las prendas', async () => {
      mockPrisma.reserva.findUnique.mockResolvedValue({
        id_reserva: 50,
        codigo: 'RES-20260916-5555',
        estado: 'Pendiente',
        id_sucursal: 1,
        observaciones: null,
        sucursal: { nombre: 'FashionStore Ventura' },
        detalle_reserva: [],
      });

      mockPrisma.empleado_sucursal.findUnique.mockResolvedValue({
        id_empleado: 7,
        id_sucursal: 1,
      });

      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          reserva: {
            update: vi.fn().mockResolvedValue({
              id_reserva: 50,
              codigo: 'RES-20260916-5555',
              estado: 'Preparada',
            }),
          },
        };
        return cb(tx);
      });

      const res = await service.updateBranchReservationStatus(
        { id_usuario: 7, id_rol: 3 },
        50,
        { nuevo_estado: 'Preparada' as any },
      );

      expect(res.success).toBe(true);
      expect(res.estado).toBe('Preparada');
      expect(mockBitacora.logAction).toHaveBeenCalled();
    });

    it('debe completar la venta y descontar stock_reservado cuando el cliente compra', async () => {
      mockPrisma.reserva.findUnique.mockResolvedValue({
        id_reserva: 51,
        codigo: 'RES-20260916-7777',
        estado: 'Atendida',
        id_sucursal: 1,
        observaciones: null,
        sucursal: { nombre: 'FashionStore Ventura' },
        detalle_reserva: [
          {
            id_detalle_reserva: 201,
            id_producto_variante: 12,
            cantidad: 1,
          },
        ],
      });

      mockPrisma.empleado_sucursal.findUnique.mockResolvedValue({
        id_empleado: 8,
        id_sucursal: 1,
      });

      const mockInvUpdate = vi.fn().mockResolvedValue({});
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          inventario_sucursal: {
            findUnique: vi.fn().mockResolvedValue({
              id_inventario_sucursal: 88,
              stock_disponible: 5,
              stock_reservado: 2,
            }),
            update: mockInvUpdate,
          },
          reserva: {
            update: vi.fn().mockResolvedValue({
              id_reserva: 51,
              codigo: 'RES-20260916-7777',
              estado: 'Completada',
            }),
          },
          detalle_reserva: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return cb(tx);
      });

      const res = await service.updateBranchReservationStatus(
        { id_usuario: 8, id_rol: 4 },
        51,
        { nuevo_estado: 'Completada' as any },
      );

      expect(res.success).toBe(true);
      expect(res.estado).toBe('Completada');
      expect(mockInvUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stock_reservado: 1, // 2 - 1
          }),
        }),
      );
    });

    it('debe cancelar y restituir existencias cuando el cliente no compra o desiste en sucursal', async () => {
      mockPrisma.reserva.findUnique.mockResolvedValue({
        id_reserva: 52,
        codigo: 'RES-20260916-8888',
        estado: 'Atendida',
        id_sucursal: 1,
        observaciones: null,
        sucursal: { nombre: 'FashionStore Ventura' },
        detalle_reserva: [
          {
            id_detalle_reserva: 202,
            id_producto_variante: 14,
            cantidad: 2,
          },
        ],
      });

      mockPrisma.empleado_sucursal.findUnique.mockResolvedValue({
        id_empleado: 7,
        id_sucursal: 1,
      });

      const mockInvUpdate = vi.fn().mockResolvedValue({});
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          inventario_sucursal: {
            findUnique: vi.fn().mockResolvedValue({
              id_inventario_sucursal: 90,
              stock_disponible: 3,
              stock_reservado: 2,
            }),
            update: mockInvUpdate,
          },
          reserva: {
            update: vi.fn().mockResolvedValue({
              id_reserva: 52,
              codigo: 'RES-20260916-8888',
              estado: 'Cancelada',
            }),
          },
          detalle_reserva: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return cb(tx);
      });

      const res = await service.updateBranchReservationStatus(
        { id_usuario: 7, id_rol: 3 },
        52,
        { nuevo_estado: 'Cancelada' as any, motivo: 'No le quedó la talla' },
      );

      expect(res.success).toBe(true);
      expect(res.estado).toBe('Cancelada');
      expect(mockInvUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stock_disponible: 5, // 3 + 2
            stock_reservado: 0,  // 2 - 2
          }),
        }),
      );
    });
  });
});
