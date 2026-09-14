import React from 'react';
import type { Branch } from '../types/branch.types';
import { Store, MapPin, Phone } from 'lucide-react';

interface BranchCardProps {
  branch: Branch;
}

export const BranchCard: React.FC<BranchCardProps> = ({ branch }) => {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '10px',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Store size={18} color="#1A1A1A" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#111827', margin: 0 }}>
            {branch.nombre}
          </h3>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            backgroundColor: branch.activo ? '#DEF7EC' : '#FDE8E8',
            color: branch.activo ? '#03543F' : '#9B1C1C',
          }}
        >
          {branch.activo ? 'Abierta' : 'Cerrada'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', color: '#4B5563', fontSize: '0.875rem' }}>
        <MapPin size={15} style={{ marginTop: '0.15rem', flexShrink: 0 }} />
        <span>{branch.direccion} {branch.ciudad ? `(${branch.ciudad})` : ''}</span>
      </div>

      {branch.telefono && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#4B5563', fontSize: '0.875rem' }}>
          <Phone size={14} />
          <span>{branch.telefono}</span>
        </div>
      )}
    </div>
  );
};
