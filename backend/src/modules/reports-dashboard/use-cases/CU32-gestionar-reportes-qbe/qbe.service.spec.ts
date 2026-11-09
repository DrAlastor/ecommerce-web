import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QbeService } from './qbe.service.js';
import { ReportExporterService } from '../../shared/services/report-exporter.service.js';
import { QbeNlpService } from './qbe-nlp.service.js';

describe('CU32 - QbeService (Query By Example)', () => {
  let qbeService: QbeService;
  let mockPrisma: any;
  let mockReportsService: any;
  let exporterService: ReportExporterService;
  let nlpService: QbeNlpService;

  beforeEach(() => {
    exporterService = new ReportExporterService();
    nlpService = new QbeNlpService();

    mockReportsService = {
      getAuthorizedBranches: vi.fn().mockResolvedValue({
        isAdmin: true,
        isGlobal: true,
        branchIds: [1, 2],
      }),
    };

    mockPrisma = {
      producto: {
        findMany: vi.fn().mockResolvedValue([
          {
            id_producto: 1,
            nombre: 'Blazer de Mezcla de Lino',
            precio_base: 320.0,
            genero: 'Femenino',
            estado: 'activo',
            categoria: { nombre: 'Blazers' },
            coleccion: { temporada: { nombre: 'Primavera 2026' } },
            producto_variante: [{ sku: 'BLZ-LIN-01' }],
          },
          {
            id_producto: 2,
            nombre: 'Top de Punto Rayado',
            precio_base: 140.0,
            genero: 'Femenino',
            estado: 'activo',
            categoria: { nombre: 'Tops' },
            coleccion: { temporada: { nombre: 'Verano 2026' } },
            producto_variante: [{ sku: 'TOP-RAY-02' }],
          },
        ]),
      },
      venta: {
        findMany: vi.fn().mockResolvedValue([
          {
            id_venta: 1,
            codigo_factura: 'FAC-1001',
            fecha_venta: new Date('2026-10-01'),
            tipo_venta: 'digital',
            subtotal: 500,
            descuento: 50,
            total: 450,
            estado: 'completada',
            empleado: null,
            cliente: { nombre: 'Ana', apellido: 'Rojas' },
            pago: [{ metodo_pago: 'Stripe' }],
          },
          {
            id_venta: 2,
            codigo_factura: 'FAC-1002',
            fecha_venta: new Date('2026-10-02'),
            tipo_venta: 'presencial',
            subtotal: 200,
            descuento: 0,
            total: 200,
            estado: 'completada',
            empleado: {
              empleado_sucursal: [{ sucursal: { nombre: 'FashionStore Ventura' } }],
            },
            cliente: { nombre: 'Carlos', apellido: 'Mendez' },
            pago: [{ metodo_pago: 'Efectivo' }],
          },
        ]),
      },
    };

    qbeService = new QbeService(mockPrisma, mockReportsService, exporterService, nlpService);
  });

  it('debe retornar el catálogo de metadatos de entidades y operadores', () => {
    const meta = qbeService.getMetadata();
    expect(meta.entities).toBeDefined();
    expect(meta.entities.length).toBe(6);
    expect(meta.entities.map((e) => e.id)).toContain('venta');
    expect(meta.entities.map((e) => e.id)).toContain('producto');
    expect(meta.operators).toHaveProperty('string');
    expect(meta.operators).toHaveProperty('number');
    expect(meta.aggregationFunctions.length).toBeGreaterThanOrEqual(4);
  });

  it('debe ejecutar una consulta QBE simple con proyección de campos', async () => {
    const result = await qbeService.executeQuery(
      {
        entity: 'producto',
        fields: ['nombre', 'precio_base', 'categoria'],
        filters: [],
        limit: 10,
      },
      { email: 'admin@dressly.com' },
    );

    expect(result.entity).toBe('producto');
    expect(result.totalCount).toBe(2);
    expect(result.columns.map((c) => c.key)).toEqual(['nombre', 'precio_base', 'categoria']);
    expect(result.rows[0].nombre).toBe('Blazer de Mezcla de Lino');
    expect(result.rows[0].precio_base).toBe(320);
  });

  it('debe filtrar correctamente los registros con operadores numéricos (gt)', async () => {
    const result = await qbeService.executeQuery(
      {
        entity: 'producto',
        fields: ['nombre', 'precio_base'],
        filters: [{ field: 'precio_base', operator: 'gt', value: 200 }],
      },
      { email: 'admin@dressly.com' },
    );

    expect(result.totalCount).toBe(1);
    expect(result.rows[0].nombre).toBe('Blazer de Mezcla de Lino');
  });

  it('debe aplicar agrupación y funciones agregadas (GROUP BY + SUM)', async () => {
    const result = await qbeService.executeQuery(
      {
        entity: 'venta',
        groupBy: ['tipo_venta'],
        aggregations: [{ field: 'total', func: 'SUM', alias: 'Total Facturado' }],
      },
      { email: 'admin@dressly.com' },
    );

    expect(result.rows.length).toBe(2);
    expect(result.columns.map((c) => c.key)).toContain('tipo_venta');
    expect(result.columns.map((c) => c.key)).toContain('sum_total');
    expect(result.chartData.length).toBe(2);
    expect(result.chartSuggestion).toBe('pie');
  });

  it('debe exportar la consulta QBE a formato CSV con metadatos válidos', async () => {
    const exported = await qbeService.exportQuery(
      {
        entity: 'producto',
        fields: ['nombre', 'precio_base'],
        format: 'csv' as any,
      },
      { email: 'admin@dressly.com' },
    );

    expect(exported.fileName).toContain('QBE_producto_');
    expect(exported.fileName).toContain('.csv');
    const content = exported.buffer.toString('utf-8');
    expect(content).toContain('FASHIONSTORE');
    expect(content).toContain('Blazer de Mezcla de Lino');
  });

  describe('Interpretación en Lenguaje Natural (NL-QBE)', () => {
    it('debe interpretar "Ventas de este mes por sucursal con el total vendido"', () => {
      const res = qbeService.interpretNaturalQuery(
        'Ventas de este mes por sucursal con el total vendido',
      );

      expect(res.interpreted).toBe(true);
      expect(res.suggestedPayload.entity).toBe('venta');
      expect(res.suggestedPayload.groupBy).toEqual(['sucursal']);
      expect(res.suggestedPayload.aggregations).toBeDefined();
      expect(res.suggestedPayload.aggregations![0].func).toBe('SUM');
      expect(res.suggestedPayload.aggregations![0].field).toBe('total');
      expect(res.explanation).toContain('Ventas');
      expect(res.explanation).toContain('Sucursal');
    });

    it('debe interpretar "Productos con stock menor a 15 en Cochabamba"', () => {
      const res = qbeService.interpretNaturalQuery(
        'Productos con stock menor a 15 en Cochabamba',
      );

      expect(res.interpreted).toBe(true);
      expect(res.suggestedPayload.entity).toBe('inventario_sucursal');
      const ltFilter = res.suggestedPayload.filters?.find(
        (f) => f.operator === 'lt' && f.value === 15,
      );
      expect(ltFilter).toBeDefined();
      const cityFilter = res.suggestedPayload.filters?.find(
        (f) => f.field === 'sucursal' && f.value === 'Cochabamba',
      );
      expect(cityFilter).toBeDefined();
    });

    it('debe interpretar "Clientes con mas de 100 puntos ordenados por mayores puntos"', () => {
      const res = qbeService.interpretNaturalQuery(
        'Clientes con mas de 100 puntos ordenados por mayores puntos',
      );

      expect(res.interpreted).toBe(true);
      expect(res.suggestedPayload.entity).toBe('cliente');
      const gtFilter = res.suggestedPayload.filters?.find(
        (f) => f.operator === 'gt' && f.value === 100,
      );
      expect(gtFilter).toBeDefined();
      expect(res.suggestedPayload.orderBy?.direction).toBe('desc');
    });

    it('debe interpretar límites como "Top 10 prendas mas caras"', () => {
      const res = qbeService.interpretNaturalQuery('Top 10 prendas mas caras');

      expect(res.interpreted).toBe(true);
      expect(res.suggestedPayload.entity).toBe('producto');
      expect(res.suggestedPayload.limit).toBe(10);
      expect(res.suggestedPayload.orderBy?.direction).toBe('desc');
    });
  });
});

