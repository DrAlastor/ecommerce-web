import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { TenantCluster, TenantPerformancePoint } from '../../../types/saas.types';
import { SaasPagination } from '../../../components/SaasPagination';

interface TenantClusteringGridProps {
  clusters: TenantCluster[];
  ranking: TenantPerformancePoint[];
  onSelectTenantForAudit?: (tenantKey: string) => void;
}

const RANKING_PAGE_SIZE = 10;

export const TenantClusteringGrid: React.FC<TenantClusteringGridProps> = ({
  clusters,
  ranking,
  onSelectTenantForAudit,
}) => {
  const [activeTab, setActiveTab] = useState<'clusters' | 'ranking'>('clusters');
  const [rankingPage, setRankingPage] = useState(1);

  return (
    <div className="saas-card-full">
      <div className="saas-card-header">
        <div className="saas-header-with-icon">
          <div className="saas-ai-badge">
            <Brain size={16} />
            <span>AI SEGMENTATION & CHURN ENGINE</span>
          </div>
          <h3 className="saas-card-title">Segmentación de Inquilinos & Predicción de Churn</h3>
        </div>

        <div className="saas-pill-switch">
          <button
            type="button"
            className={`pill-switch-btn ${activeTab === 'clusters' ? 'active' : ''}`}
            onClick={() => setActiveTab('clusters')}
          >
            Clusters de Machine Learning ({clusters.length})
          </button>
          <button
            type="button"
            className={`pill-switch-btn ${activeTab === 'ranking' ? 'active' : ''}`}
            onClick={() => setActiveTab('ranking')}
          >
            Ranking Consolidado ({ranking.length})
          </button>
        </div>
      </div>

      {activeTab === 'clusters' ? (
        <div className="saas-clusters-grid">
          {clusters.map((cluster) => (
            <div
              key={cluster.clusterId}
              className="saas-cluster-card"
              style={{ borderTop: `4px solid ${cluster.badgeColor}` }}
            >
              <div className="cluster-card-header">
                <div className="cluster-title-wrap">
                  <h4 className="cluster-name">{cluster.clusterName}</h4>
                  <span
                    className="cluster-badge"
                    style={{ backgroundColor: `${cluster.badgeColor}18`, color: cluster.badgeColor }}
                  >
                    {cluster.tenantCount} {cluster.tenantCount === 1 ? 'Inquilino' : 'Inquilinos'}
                  </span>
                </div>
                <p className="cluster-desc">{cluster.description}</p>
                <div className="cluster-mrr-stat">
                  <span>MRR Promedio: </span>
                  <strong>${cluster.averageMrr.toFixed(2)} USD</strong>
                </div>
              </div>

              <div className="cluster-tenants-list">
                {cluster.tenants.length === 0 ? (
                  <div className="empty-cluster-text">Sin inquilinos en este segmento actualmente.</div>
                ) : (
                  cluster.tenants.map((t) => (
                    <div key={t.tenantKey} className="cluster-tenant-item">
                      <div className="tenant-item-main">
                        <div className="tenant-name-col">
                          <span className="tenant-company-name">{t.companyName}</span>
                          <span className="tenant-plan-tag">{t.planName}</span>
                        </div>
                        <div className="tenant-mrr-col">
                          <span className="tenant-mrr">${t.mrr}/mes</span>
                          <span className="tenant-orders">{t.orders} ventas</span>
                        </div>
                      </div>

                      {/* Barra de Riesgo de Churn */}
                      <div className="churn-risk-container">
                        <div className="churn-risk-label">
                          <span>Riesgo de Abandono (Churn Risk):</span>
                          <span
                            className={`risk-pill ${
                              t.churnRiskLevel === 'Bajo'
                                ? 'risk-low'
                                : t.churnRiskLevel === 'Moderado'
                                ? 'risk-med'
                                : 'risk-high'
                            }`}
                          >
                            {t.churnRiskScore}% · {t.churnRiskLevel}
                          </span>
                        </div>
                        <div className="churn-progress-bar">
                          <div
                            className={`churn-progress-fill ${
                              t.churnRiskLevel === 'Bajo'
                                ? 'fill-green'
                                : t.churnRiskLevel === 'Moderado'
                                ? 'fill-yellow'
                                : 'fill-red'
                            }`}
                            style={{ width: `${t.churnRiskScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Recomendación Accionable de Inteligencia de Negocios */}
                      <div className="cluster-action-box">
                        <Sparkles size={14} className="action-icon" />
                        <span className="action-text">{t.recommendedAction}</span>
                      </div>

                      {onSelectTenantForAudit && (
                        <button
                          type="button"
                          className="audit-tenant-btn"
                          onClick={() => onSelectTenantForAudit(t.tenantKey)}
                        >
                          <span>Auditar Salud Técnica</span>
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="saas-ranking-table-container">
          <table className="saas-table">
            <thead>
              <tr>
                <th>Inquilino / Empresa</th>
                <th>Plan de Suscripción</th>
                <th>Estado</th>
                <th>Cluster IA</th>
                <th>Facturación (GMV)</th>
                <th>Órdenes</th>
                <th>Catálogo</th>
                <th>Churn Risk</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {ranking
                .slice((rankingPage - 1) * RANKING_PAGE_SIZE, rankingPage * RANKING_PAGE_SIZE)
                .map((t) => (
                <tr key={t.tenantKey}>
                  <td>
                    <div className="tenant-td-company">
                      <span className="company-bold">{t.companyName}</span>
                      <span className="tenant-slug">/{t.tenantKey}</span>
                    </div>
                  </td>
                  <td>
                    <span className="saas-plan-chip">{t.planName}</span>
                  </td>
                  <td>
                    <span
                      className={`status-chip ${
                        t.status === 'ACTIVO' ? 'chip-active' : t.status === 'PRUEBA' ? 'chip-trial' : 'chip-paused'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <span className="cluster-chip">{t.cluster}</span>
                  </td>
                  <td className="text-right">
                    <strong>Bs. {t.totalRevenue.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</strong>
                  </td>
                  <td className="text-center">{t.totalOrders}</td>
                  <td className="text-center">{t.productCount} prendas</td>
                  <td>
                    <span
                      className={`risk-badge-compact ${
                        t.churnRiskLevel === 'Bajo'
                          ? 'low'
                          : t.churnRiskLevel === 'Moderado'
                          ? 'med'
                          : 'high'
                      }`}
                    >
                      {t.churnRiskScore}%
                    </span>
                  </td>
                  <td>
                    {onSelectTenantForAudit && (
                      <button
                        type="button"
                        className="btn-table-action"
                        onClick={() => onSelectTenantForAudit(t.tenantKey)}
                      >
                        Monitorear
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <SaasPagination
            currentPage={rankingPage}
            totalItems={ranking.length}
            pageSize={RANKING_PAGE_SIZE}
            onPageChange={(page) => setRankingPage(page)}
            itemLabel="inquilinos en ranking"
          />
        </div>
      )}
    </div>
  );
};

