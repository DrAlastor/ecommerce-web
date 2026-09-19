import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import type { DashboardMetrics } from '../types/reports.types';

interface DashboardQuickTablesProps {
  metrics: DashboardMetrics;
}

const sectionCardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '14px',
  padding: '1.5rem',
  border: '1px solid #EAE6DF',
  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  marginBottom: '2rem',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.65rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#736B63',
  textTransform: 'uppercase',
  borderBottom: '1px solid #EAE6DF',
};

const tdStyle: React.CSSProperties = {
  padding: '0.75rem',
  fontSize: '0.82rem',
  color: '#1C1510',
  borderBottom: '1px solid #F4ECE1',
};

export const DashboardQuickTables: React.FC<DashboardQuickTablesProps> = ({ metrics }) => {
  const { criticalInventory, recentActivity } = metrics;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
      {/* Alertas de Stock Crítico */}
      <div style={sectionCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ backgroundColor: '#FEE2E2', padding: '0.35rem', borderRadius: '6px', color: '#DC2626' }}>
              <AlertTriangle size={16} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#1C1510' }}>
              Alertas de Stock Crítico y Agotados
            </h3>
          </div>
        </div>

        {criticalInventory.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#15803D', fontSize: '0.88rem', fontWeight: 600 }}>
            ✓ Todos los productos se encuentran con stock saludable.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Prenda</th>
                  <th style={thStyle}>Sucursal</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Disponible</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Mínimo</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {criticalInventory.map((item, idx) => (
                  <tr key={idx}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>{item.producto}</div>
                      <div style={{ fontSize: '0.72rem', color: '#736B63' }}>{item.variante}</div>
                    </td>
                    <td style={tdStyle}>{item.sucursal}</td>
                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: item.stock_disponible === 0 ? '#DC2626' : '#D97706' }}>
                      {item.stock_disponible}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center', color: '#736B63' }}>
                      {item.stock_minimo}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <span
                        style={{
                          backgroundColor: item.estado === 'Agotado' ? '#FEE2E2' : '#FEF3C7',
                          color: item.estado === 'Agotado' ? '#991B1B' : '#92400E',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        {item.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actividad Reciente */}
      <div style={sectionCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ backgroundColor: '#E0F2FE', padding: '0.35rem', borderRadius: '6px', color: '#0369A1' }}>
              <Clock size={16} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#1C1510' }}>
              Últimas Ventas Emitidas
            </h3>
          </div>
        </div>

        {recentActivity.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#736B63', fontSize: '0.88rem' }}>
            No hay transacciones recientes registradas.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Comprobante</th>
                  <th style={thStyle}>Fecha</th>
                  <th style={thStyle}>Canal</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((v, idx) => (
                  <tr key={idx}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{v.codigo}</td>
                    <td style={{ ...tdStyle, color: '#736B63', fontSize: '0.78rem' }}>
                      {new Date(v.fecha).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          backgroundColor: v.tipo?.toLowerCase().includes('digital') ? '#EDE9FE' : '#F4ECE1',
                          color: v.tipo?.toLowerCase().includes('digital') ? '#6D28D9' : '#8C5E35',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                        }}
                      >
                        {v.tipo}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#15803D' }}>
                      Bs. {v.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
