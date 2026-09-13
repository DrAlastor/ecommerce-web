import React from 'react';
import { useAuth } from '../../modules/users-security/shared/components/AuthContext';
import { Package, Users, Activity, ShoppingBag } from 'lucide-react';

export default function DashboardIndex() {
  const { user, rol } = useAuth();

  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>
        Hola, {user?.empleado?.nombre || user?.email} 👋
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Estás conectado como <strong>{rol?.nombre}</strong>. Aquí tienes un resumen de la actividad reciente.
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Tarjetas de ejemplo */}
        <div style={cardStyle}>
          <div style={iconWrapperStyle('#E0F2FE', '#0284C7')}><ShoppingBag size={24} color="#0284C7" /></div>
          <div>
            <h3 style={cardTitle}>Ventas de Hoy</h3>
            <p style={cardValue}>Bs. 1,240.00</p>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={iconWrapperStyle('#FEF08A', '#A16207')}><Package size={24} color="#A16207" /></div>
          <div>
            <h3 style={cardTitle}>Pedidos Pendientes</h3>
            <p style={cardValue}>14</p>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={iconWrapperStyle('#DCFCE7', '#16A34A')}><Users size={24} color="#16A34A" /></div>
          <div>
            <h3 style={cardTitle}>Nuevos Clientes</h3>
            <p style={cardValue}>+8</p>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={iconWrapperStyle('#F3E8FF', '#9333EA')}><Activity size={24} color="#9333EA" /></div>
          <div>
            <h3 style={cardTitle}>Visitas a la App</h3>
            <p style={cardValue}>842</p>
          </div>
        </div>
      </div>
      
      <div style={{ 
        backgroundColor: '#FFFFFF', 
        padding: '2rem', 
        borderRadius: '12px', 
        border: '1px solid #EAEAEA' 
      }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Bienvenido al Panel Administrativo</h2>
        <p style={{ color: '#666', lineHeight: 1.6 }}>
          Selecciona una opción del menú lateral para comenzar a gestionar los recursos de Dressly Fashion Store. 
          Este panel te proporciona acceso directo a los módulos a los que tienes permiso.
        </p>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  padding: '1.5rem',
  borderRadius: '12px',
  border: '1px solid #EAEAEA',
  display: 'flex',
  alignItems: 'center',
  gap: '1rem'
};

const iconWrapperStyle = (bgColor: string, color: string): React.CSSProperties => ({
  backgroundColor: bgColor,
  color: color,
  padding: '0.75rem',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

const cardTitle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: '#666',
  marginBottom: '0.25rem',
  fontWeight: 500
};

const cardValue: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#1A1A1A'
};
