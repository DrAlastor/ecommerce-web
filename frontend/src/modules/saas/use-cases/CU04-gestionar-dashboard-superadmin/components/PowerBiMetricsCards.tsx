import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Building2,
  DollarSign,
  Calendar,
  ShoppingBag,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import type { ExecutiveKpiCard } from '../../../types/saas.types';

interface PowerBiMetricsCardsProps {
  summary: {
    totalTenants: ExecutiveKpiCard;
    mrr: ExecutiveKpiCard;
    arr: ExecutiveKpiCard;
    gmvConsolidated: ExecutiveKpiCard;
    retentionRate: ExecutiveKpiCard;
    churnRate: ExecutiveKpiCard;
  };
}

export const PowerBiMetricsCards: React.FC<PowerBiMetricsCardsProps> = ({ summary }) => {
  const cardsConfig = [
    {
      kpi: summary.totalTenants,
      icon: <Building2 size={24} className="saas-kpi-icon blue" />,
      accentColor: '#3B82F6',
    },
    {
      kpi: summary.mrr,
      icon: <DollarSign size={24} className="saas-kpi-icon emerald" />,
      accentColor: '#10B981',
    },
    {
      kpi: summary.arr,
      icon: <Calendar size={24} className="saas-kpi-icon indigo" />,
      accentColor: '#6366F1',
    },
    {
      kpi: summary.gmvConsolidated,
      icon: <ShoppingBag size={24} className="saas-kpi-icon amber" />,
      accentColor: '#F59E0B',
    },
    {
      kpi: summary.retentionRate,
      icon: <ShieldCheck size={24} className="saas-kpi-icon teal" />,
      accentColor: '#0D9488',
    },
    {
      kpi: summary.churnRate,
      icon: <AlertTriangle size={24} className="saas-kpi-icon rose" />,
      accentColor: '#F43F5E',
    },
  ];

  return (
    <div className="saas-powerbi-cards-grid">
      {cardsConfig.map(({ kpi, icon, accentColor }, idx) => {
        const isUp = kpi.trendDirection === 'up';
        const isGood = (kpi.title.includes('Churn') || kpi.title.includes('Abandono')) ? !isUp : isUp;

        return (
          <div
            key={idx}
            className="saas-kpi-tile"
            style={{ borderTop: `4px solid ${accentColor}` }}
          >
            <div className="saas-kpi-header">
              <span className="saas-kpi-title">{kpi.title}</span>
              <div className="saas-kpi-icon-wrapper">{icon}</div>
            </div>

            <div className="saas-kpi-value-row">
              <span className="saas-kpi-value">{kpi.value}</span>
              {kpi.badge && (
                <span className={`saas-kpi-badge ${isGood ? 'positive' : 'negative'}`}>
                  {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {Math.abs(kpi.trendPercentage)}%
                </span>
              )}
            </div>

            <div className="saas-kpi-footer">
              <span className="saas-kpi-subtitle">{kpi.subtitle}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

