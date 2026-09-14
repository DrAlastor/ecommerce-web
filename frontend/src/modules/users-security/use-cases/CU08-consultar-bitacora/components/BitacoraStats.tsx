import React from 'react';

interface BitacoraStatsProps {
  total: number;
  count: number;
  page: number;
  totalPages: number;
}

export const BitacoraStats: React.FC<BitacoraStatsProps> = ({
  total,
  count,
  page,
  totalPages,
}) => {
  return (
    <div className="bitacora-stats">
      <div className="stat-card">
        <span className="stat-label">Total Registros</span>
        <span className="stat-value">{total}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Eventos en Página</span>
        <span className="stat-value">{count}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Página Actual</span>
        <span className="stat-value">{page} / {totalPages}</span>
      </div>
    </div>
  );
};
