import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Tag,
  ShoppingBag,
  CreditCard,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Store,
} from 'lucide-react';
import type { DashboardMetrics } from '../types/reports.types';

interface DashboardMetricsGridProps {
  metrics: DashboardMetrics;
}

const kpiCardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '1.25rem',
  border: '1px solid #EAE6DF',
  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};

export const DashboardMetricsGrid: React.FC<DashboardMetricsGridProps> = ({ metrics }) => {
  const { kpis } = metrics;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}
    >
      {/* 1. Total Ventas */}
      <div style={kpiCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#736B63' }}>Total Ventas</span>
          <div style={{ backgroundColor: '#F4ECE1', padding: '0.4rem', borderRadius: '8px', color: '#8C5E35' }}>
            <TrendingUp size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1C1510', letterSpacing: '-0.02em' }}>
          {kpis.totalVentas.toLocaleString()}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#8C5E35', marginTop: '0.35rem', fontWeight: 500 }}>
          Comprobantes emitidos
        </div>
      </div>

      {/* 2. Total Facturado */}
      <div style={kpiCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#736B63' }}>Ingresos Brutos</span>
          <div style={{ backgroundColor: '#DCFCE7', padding: '0.4rem', borderRadius: '8px', color: '#15803D' }}>
            <DollarSign size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#15803D', letterSpacing: '-0.02em' }}>
          Bs. {kpis.totalIngresos.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#736B63', marginTop: '0.35rem' }}>
          Total neto registrado
        </div>
      </div>

      {/* 3. Descuentos Otorgados */}
      <div style={kpiCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#736B63' }}>Descuentos</span>
          <div style={{ backgroundColor: '#FEE2E2', padding: '0.4rem', borderRadius: '8px', color: '#B91C1C' }}>
            <Tag size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#B91C1C', letterSpacing: '-0.02em' }}>
          Bs. {kpis.totalDescuentos.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#736B63', marginTop: '0.35rem' }}>
          Promociones y rebajas
        </div>
      </div>

      {/* 4. Unidades Vendidas */}
      <div style={kpiCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#736B63' }}>Prendas Vendidas</span>
          <div style={{ backgroundColor: '#E0E7FF', padding: '0.4rem', borderRadius: '8px', color: '#4338CA' }}>
            <ShoppingBag size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1C1510', letterSpacing: '-0.02em' }}>
          {kpis.totalUnidadesVendidas.toLocaleString()}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#736B63', marginTop: '0.35rem' }}>
          Unidades entregadas
        </div>
      </div>

      {/* 5. Ticket Promedio */}
      <div style={kpiCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#736B63' }}>Ticket Promedio</span>
          <div style={{ backgroundColor: '#FEF3C7', padding: '0.4rem', borderRadius: '8px', color: '#B45309' }}>
            <CreditCard size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1C1510', letterSpacing: '-0.02em' }}>
          Bs. {kpis.ticketPromedio.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#736B63', marginTop: '0.35rem' }}>
          Ingreso promedio por venta
        </div>
      </div>

      {/* 6. Reservas de Sucursal */}
      <div style={kpiCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#736B63' }}>Reservas en Sucursal</span>
          <div style={{ backgroundColor: '#EDE9FE', padding: '0.4rem', borderRadius: '8px', color: '#6D28D9' }}>
            <Calendar size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1C1510', letterSpacing: '-0.02em' }}>
          {kpis.totalReservas}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#6D28D9', marginTop: '0.35rem', fontWeight: 600 }}>
          {kpis.reservasPendientes} pendientes de retiro
        </div>
      </div>

      {/* 7. Alertas de Inventario Crítico */}
      <div style={kpiCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#736B63' }}>Alertas de Stock</span>
          <div style={{ backgroundColor: '#FEE2E2', padding: '0.4rem', borderRadius: '8px', color: '#DC2626' }}>
            <AlertTriangle size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#DC2626', letterSpacing: '-0.02em' }}>
          {kpis.productosBajoStock + kpis.productosAgotados}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#736B63', marginTop: '0.35rem' }}>
          {kpis.productosAgotados} agotados, {kpis.productosBajoStock} bajo mínimo
        </div>
      </div>

      {/* 8. Devoluciones */}
      <div style={kpiCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#736B63' }}>Devoluciones</span>
          <div style={{ backgroundColor: '#F3F4F6', padding: '0.4rem', borderRadius: '8px', color: '#4B5563' }}>
            <RotateCcw size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1C1510', letterSpacing: '-0.02em' }}>
          {kpis.totalDevoluciones}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#736B63', marginTop: '0.35rem' }}>
          Garantías e incidencias
        </div>
      </div>

      {/* 9. Sucursales Activas */}
      <div style={kpiCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#736B63' }}>Sucursales Activas</span>
          <div style={{ backgroundColor: '#E0F2FE', padding: '0.4rem', borderRadius: '8px', color: '#0369A1' }}>
            <Store size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1C1510', letterSpacing: '-0.02em' }}>
          {kpis.sucursalesActivas}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#736B63', marginTop: '0.35rem' }}>
          Puntos de venta en red
        </div>
      </div>
    </div>
  );
};
