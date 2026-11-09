import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Sparkles,
  Ticket,
  MapPin,
  QrCode,
  Truck,
  ArrowRight,
} from 'lucide-react';
import type { RoleDashboardData } from '../types/reports.types';

interface CustomerDashboardViewProps {
  data: RoleDashboardData;
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  padding: '1.25rem',
  border: '1px solid #EAE6DF',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};

const formatBs = (val: number): string =>
  `Bs. ${Number(val || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const CustomerDashboardView: React.FC<CustomerDashboardViewProps> = ({ data }) => {
  const customer = data.customer;
  const navigate = useNavigate();

  if (!customer) return null;

  const { kpis, tables } = customer;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: '#1C1510' }}>
      {/* 1. FILA DE 4 TARJETAS DE ESTADO PERSONAL */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* KPI 1: Pedidos Activos */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#736B63' }}>Pedidos Activos</span>
            <div style={{ backgroundColor: '#DCFCE7', padding: '0.4rem', borderRadius: '8px', color: '#15803D' }}>
              <Truck size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#15803D', letterSpacing: '-0.02em' }}>
            {kpis.pedidosActivos}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#736B63', marginTop: '0.35rem' }}>
            En preparación o despacho
          </div>
        </div>

        {/* KPI 2: Reservas en Tienda */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#736B63' }}>Reservas en Tienda</span>
            <div style={{ backgroundColor: '#F4ECE1', padding: '0.4rem', borderRadius: '8px', color: '#8C5E35' }}>
              <ShoppingBag size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#8C5E35', letterSpacing: '-0.02em' }}>
            {kpis.reservasListasRetiro}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#736B63', marginTop: '0.35rem' }}>
            Listas para probar y recoger
          </div>
        </div>

        {/* KPI 3: Puntos de Fidelidad */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#736B63' }}>Puntos Dressly Club</span>
            <div style={{ backgroundColor: '#FEF3C7', padding: '0.4rem', borderRadius: '8px', color: '#B45309' }}>
              <Sparkles size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#B45309', letterSpacing: '-0.02em' }}>
            {kpis.puntosFidelidad} pts
          </div>
          <div style={{ fontSize: '0.76rem', color: '#736B63', marginTop: '0.35rem' }}>
            Canjeables por descuentos en caja
          </div>
        </div>

        {/* KPI 4: Cupones Disponibles */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#736B63' }}>Cupones Activos</span>
            <div style={{ backgroundColor: '#E0E7FF', padding: '0.4rem', borderRadius: '8px', color: '#4338CA' }}>
              <Ticket size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#1C1510', letterSpacing: '-0.02em' }}>
            {kpis.cuponesDisponibles}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#736B63', marginTop: '0.35rem' }}>
            Promociones aplicables a tu bolsa
          </div>
        </div>
      </div>

      {/* 2. RASTREADOR DE PEDIDOS RECIENTES */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #EAE6DF',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: '#1C1510' }}>
              Mis Compras y Envíos en Curso
            </h3>
            <p style={{ fontSize: '0.76rem', color: '#736B63', margin: '0.15rem 0 0 0' }}>
              Seguimiento de pedidos para entrega a domicilio
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/mis-compras')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'none',
              border: 'none',
              color: '#8C5E35',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>Ver historial</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {tables.misPedidosRecientes.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#736B63', fontSize: '0.82rem' }}>
            Aún no tienes compras registradas. Explora nuestro catálogo de temporada.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tables.misPedidosRecientes.map((p) => {
              const steps = ['Confirmado', 'Preparando', 'En Camino', 'Entregado'];
              return (
                <div
                  key={p.id_venta}
                  style={{
                    backgroundColor: '#FAF8F5',
                    borderRadius: '10px',
                    padding: '1rem 1.25rem',
                    border: '1px solid #EAE6DF',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: '#1C1510', fontSize: '0.88rem' }}>{p.codigo}</span>
                      <span style={{ color: '#736B63', fontSize: '0.76rem', marginLeft: '0.5rem' }}>
                        {new Date(p.fecha).toLocaleDateString('es-BO')}
                      </span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#15803D', fontSize: '0.9rem' }}>
                      {formatBs(p.total)}
                    </span>
                  </div>

                  {/* Barra de progreso de envío */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {steps.map((st, sIdx) => {
                      const isComplete = sIdx + 1 <= p.trackingStep;
                      return (
                        <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div
                            style={{
                              height: '5px',
                              borderRadius: '3px',
                              backgroundColor: isComplete ? '#15803D' : '#E5E0D8',
                            }}
                          />
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: isComplete ? 600 : 400,
                              color: isComplete ? '#15803D' : '#736B63',
                            }}
                          >
                            {st}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. RESERVAS ACTIVAS Y CUPONES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '1.25rem' }}>
        {/* Reservas con Pase de Retiro */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #EAE6DF',
            padding: '1.25rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#1C1510' }}>
              Pase de Retiro en Tienda
            </h4>
            <span style={{ fontSize: '0.74rem', color: '#736B63' }}>Presenta este código en caja</span>
          </div>

          {tables.misReservasActivas.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#736B63', fontSize: '0.8rem' }}>
              No tienes reservas pendientes en sucursal.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tables.misReservasActivas.map((r) => (
                <div
                  key={r.id_reserva}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#FAF8F5',
                    borderRadius: '8px',
                    border: '1px solid #EAE6DF',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#1C1510', fontSize: '0.82rem' }}>{r.codigo}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#736B63', fontSize: '0.74rem', marginTop: '0.2rem' }}>
                      <MapPin size={12} color="#8C5E35" />
                      <span>{r.sucursal}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#8C5E35', fontSize: '0.85rem' }}>{formatBs(r.total)}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#15803D', fontWeight: 600 }}>
                      <QrCode size={12} />
                      <span>Retiro activo</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cupones y Promociones Activas */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #EAE6DF',
            padding: '1.25rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#1C1510' }}>
              Cupones y Descuentos Exclusivos
            </h4>
            <span style={{ fontSize: '0.74rem', color: '#736B63' }}>Aplica al comprar</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {tables.cupones.map((c) => (
              <div
                key={c.id_promocion}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#FAF6F0',
                  border: '1px dashed #C4956A',
                  borderRadius: '8px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#1C1510', fontSize: '0.82rem' }}>{c.nombre}</div>
                  <div style={{ fontSize: '0.72rem', color: '#736B63' }}>Descuento aplicable en caja y tienda web</div>
                </div>
                <span
                  style={{
                    backgroundColor: '#8C5E35',
                    color: '#FFFFFF',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                  }}
                >
                  {c.descuento}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
