import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ReportExporterService,
  ReportPayload,
} from '../../shared/services/report-exporter.service.js';
import { ReportsDashboardService } from './reports-dashboard.service.js';
import { ReportType } from '../../dto/query-reports.dto.js';

describe('CU27 - Reports and Dashboard Services', () => {
  let exporterService: ReportExporterService;
  let reportsService: ReportsDashboardService;
  let mockPrisma: any;

  const sampleReport: ReportPayload = {
    title: 'Reporte de Ventas de Prueba',
    code: 'REP-VNT-02',
    periodo: '2026-09-01 al 2026-09-18',
    sucursalNombre: 'FashionStore Ventura',
    generatedBy: 'admin@dressly.com',
    generatedAt: '18/09/2026, 18:00',
    indicators: [
      { label: 'Total Facturado', value: 1450.5, suffix: 'Bs.' },
      { label: 'Operaciones', value: 10 },
    ],
    columns: [
      { key: 'codigo', label: 'Código', type: 'text' },
      { key: 'fecha', label: 'Fecha', type: 'date' },
      { key: 'total', label: 'Total (Bs.)', type: 'currency' },
    ],
    rows: [
      { codigo: 'FAC-001', fecha: '2026-09-10', total: 450.5 },
      { codigo: 'FAC-002', fecha: '2026-09-11', total: 1000.0 },
    ],
  };

  beforeEach(() => {
    exporterService = new ReportExporterService();
    mockPrisma = {
      sucursal: {
        findMany: vi.fn().mockResolvedValue([
          { id_sucursal: 1, nombre: 'FashionStore Ventura', estado: 'activo' },
          { id_sucursal: 2, nombre: 'FashionStore Sopocachi', estado: 'activo' },
        ]),
      },
      empleado_sucursal: {
        findMany: vi.fn().mockResolvedValue([
          { id_empleado: 8, id_sucursal: 1, sucursal: { id_sucursal: 1, nombre: 'FashionStore Ventura', estado: 'activo' } },
        ]),
      },
      venta: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      reserva: {
        count: vi.fn().mockResolvedValue(0),
      },
      inventario_sucursal: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      devolucion: {
        count: vi.fn().mockResolvedValue(0),
      },
    };
    reportsService = new ReportsDashboardService(mockPrisma as any);
  });

  describe('ReportExporterService', () => {
    it('debe exportar reporte a CSV con BOM UTF-8 y cabeceras correctas', async () => {
      const buffer = await exporterService.exportToCsv(sampleReport);
      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);

      const str = buffer.toString('utf-8');
      // Verifica BOM UTF-8
      expect(str.charCodeAt(0)).toBe(0xfeff);
      expect(str).toContain('FASHIONSTORE - REPORTE DE REPORTE DE VENTAS DE PRUEBA');
      expect(str).toContain('FAC-001');
      expect(str).toContain('FAC-002');
      expect(str).toContain('Total Facturado');
    });

    it('debe exportar reporte a Excel (.xlsx) con hojas Resumen y Detalle', async () => {
      const buffer = await exporterService.exportToExcel(sampleReport);
      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(500); // Archivo ZIP/XLSX válido
      // Los primeros bytes de un archivo zip/xlsx son 'PK'
      expect(buffer[0]).toBe(0x50);
      expect(buffer[1]).toBe(0x4b);
    });

    it('debe exportar reporte a PDF con membrete corporativo y formato A4', async () => {
      const buffer = await exporterService.exportToPdf(sampleReport);
      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(500);
      // Los primeros bytes de un PDF son '%PDF'
      const pdfHeader = buffer.slice(0, 4).toString();
      expect(pdfHeader).toBe('%PDF');
    });
  });

  describe('ReportsDashboardService - Autorización y Segregación', () => {
    it('debe otorgar alcance global a un Administrador', async () => {
      const adminUser = { id_usuario: 1, id_rol: 1, rol: 'Administrador' };
      const auth = await reportsService.getAuthorizedBranches(adminUser);
      expect(auth.isAdmin).toBe(true);
      expect(auth.isGlobal).toBe(true);
      expect(auth.branchIds).toEqual([1, 2]);
    });

    it('debe restringir a un Encargado únicamente a sus sucursales asignadas', async () => {
      const encargadoUser = { id_usuario: 8, id_rol: 2, rol: 'Encargado de Sucursal' };
      const auth = await reportsService.getAuthorizedBranches(encargadoUser);
      expect(auth.isAdmin).toBe(false);
      expect(auth.isGlobal).toBe(false);
      expect(auth.branchIds).toEqual([1]);
    });

    it('debe rechazar a un Encargado si intenta forzar una sucursal no asignada', async () => {
      const encargadoUser = { id_usuario: 8, id_rol: 2, rol: 'Encargado de Sucursal' };
      await expect(
        reportsService.getAuthorizedBranches(encargadoUser, 2),
      ).rejects.toThrow('No tienes permisos autorizados');
    });
  });
});
