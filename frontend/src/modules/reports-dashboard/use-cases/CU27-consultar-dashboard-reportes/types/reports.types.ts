import React from 'react';

export type TabType = 'dashboard' | 'reports';

export interface DashboardMetrics {
  periodo: string;
  sucursalNombre: string;
  kpis: {
    totalVentas: number;
    totalIngresos: number;
    totalDescuentos: number;
    totalUnidadesVendidas: number;
    ticketPromedio: number;
    totalReservas: number;
    reservasPendientes: number;
    productosBajoStock: number;
    productosAgotados: number;
    totalDevoluciones: number;
    sucursalesActivas: number;
  };
  charts: {
    ventasPorPeriodo: { fecha: string; total: number; ventas: number }[];
    ventasPorCanal: { canal: string; total: number; cantidad: number }[];
    ventasPorSucursal: { sucursal: string; total: number; cantidad: number }[];
    productosMasVendidos: { nombre: string; unidades: number; total: number }[];
  };
  criticalInventory: {
    id_inventario: number;
    producto: string;
    sku: string;
    variante: string;
    sucursal: string;
    stock_disponible: number;
    stock_minimo: number;
    estado: string;
  }[];
  recentActivity: {
    id_venta: number;
    codigo: string;
    fecha: string;
    tipo: string;
    total: number;
    estado: string;
  }[];
  authorizedBranches: {
    id_sucursal: number;
    nombre: string;
    ciudad?: { nombre: string };
  }[];
  isAdmin: boolean;
}

export interface ReportColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'currency' | 'date';
}

export interface ReportIndicator {
  label: string;
  value: string | number;
  suffix?: string;
  description?: string;
}

export interface ReportData {
  title: string;
  code: string;
  periodo: string;
  sucursalNombre: string;
  generatedBy: string;
  generatedAt: string;
  indicators: ReportIndicator[];
  columns: ReportColumn[];
  rows: Record<string, any>[];
  chartData?: any;
}

export interface ReportFilters {
  tipo_reporte: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  id_sucursal?: number | string;
  categoria_id?: number | string;
  tipo_venta?: string;
  estado?: string;
}

export interface ReportMeta {
  id: string;
  name: string;
  category: 'financiero' | 'comercial' | 'inventario' | 'clientes';
  description: string;
  icon: React.ReactNode;
  code?: string;
}
