import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saasService } from '../../../services/saas.service';
import type { SaasDashboardMetricsResponse } from '../../../types/saas.types';
import { PowerBiMetricsCards } from '../components/PowerBiMetricsCards';
import { MachineLearningForecastChart } from '../components/MachineLearningForecastChart';
import { PlanDistributionChart } from '../components/PlanDistributionChart';
import { TenantClusteringGrid } from '../components/TenantClusteringGrid';
import { PowerBiFiltersBar } from '../components/PowerBiFiltersBar';
import {
  Brain,
  MapPin,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import './SaasDashboard.css';

export const SaasDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<SaasDashboardMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros de segmentador estilo Power BI
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '12m' | 'all'>('30d');
  const [selectedPlan, setSelectedPlan] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboard = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const res = await saasService.getSuperAdminDashboard({
        timeRange,
        plan: selectedPlan !== 'ALL' ? selectedPlan : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Error al cargar Dashboard SaaS.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [timeRange, selectedPlan, selectedStatus]);

  const handleAuditTenant = (tenantKey: string) => {
    navigate(`/saas-admin/monitoring?tenant=${tenantKey}`);
  };

  const handleExportReport = () => {
    if (!data) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Inquilino,Plan,Estado,Facturacion_BOB,Ordenes,Prendas,ChurnRisk_Pct,Cluster\n' +
      data.tenantsRanking
        .map(
          (t) =>
            `"${t.companyName}","${t.planName}","${t.status}",${t.totalRevenue},${t.totalOrders},${t.productCount},${t.churnRiskScore},"${t.cluster}"`,
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reporte_Ejecutivo_SaaS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) {
    return (
      <div className="saas-loading-state">
        <div className="saas-spinner" />
        <div className="loading-text">
          <Brain size={24} className="pulse-icon text-indigo" />
          <span>Calculando modelos predictivos de Machine Learning y agregando métricas multi-tenant...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="saas-error-state">
        <AlertCircle size={40} className="text-rose" />
        <h3>Error al consultar Dashboard SaaS</h3>
        <p>{error || 'No se pudieron consolidar las métricas de los inquilinos.'}</p>
        <button type="button" className="btn-retry" onClick={() => fetchDashboard()}>
          Reintentar Consulta
        </button>
      </div>
    );
  }

  return (
    <div className="saas-dashboard-container">
      {/* Encabezado Ejecutivo */}
      <div className="saas-page-header">
        <div className="header-left">
          <div className="saas-platform-pill">
            <span className="dot online" />
            <span>PLATAFORMA SAAS FASHIONSTORE · GESTIÓN MULTI-TENANT</span>
          </div>
          <h1 className="saas-page-title">Dashboard Analítico Super Admin</h1>
          <p className="saas-page-subtitle">
            Consolidación ejecutiva en tiempo real con Inteligencia de Negocios, modelos predictivos de Machine Learning y segmentación de clientes.
          </p>
        </div>

        <div className="header-right-nav">
          <button
            type="button"
            className="btn-nav-monitoring"
            onClick={() => navigate('/saas-admin/monitoring')}
          >
            <span>Ver Monitoreo de Infraestructura</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Segmentadores tipo Power BI */}
      <PowerBiFiltersBar
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        selectedPlan={selectedPlan}
        setSelectedPlan={setSelectedPlan}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        onRefresh={() => fetchDashboard(true)}
        isRefreshing={isRefreshing}
        onExportReport={handleExportReport}
        lastUpdated={data.lastUpdated}
      />

      {/* Tarjetas KPI Ejecutivas estilo Power BI Tiles */}
      <PowerBiMetricsCards summary={data.summary} />

      {/* Gráfico Nuclear de Machine Learning: Proyección de Ingresos y Tendencia */}
      <div className="saas-section-row">
        <MachineLearningForecastChart
          mlModel={data.mlModel}
          timeSeries={data.timeSeries}
        />
      </div>

      {/* Fila Dividida: Distribución por Planes y Distribución Geográfica */}
      <div className="saas-two-columns-row">
        {/* Distribución por Planes */}
        <PlanDistributionChart plans={data.plansDistribution} />

        {/* Distribución Geográfica */}
        <div className="saas-card-half">
          <div className="saas-card-header">
            <div className="saas-header-with-icon">
              <MapPin size={20} className="text-amber" />
              <h3 className="saas-card-title">Distribución Geográfica de Inquilinos</h3>
            </div>
            <span className="saas-card-tag">Bolivia & Cono Sur</span>
          </div>

          <div className="saas-geo-list">
            {data.geographicDistribution.map((geo, idx) => (
              <div key={idx} className="saas-geo-item">
                <div className="geo-flag-wrap">
                  <span className="geo-city">{geo.region}</span>
                  <span className="geo-country">{geo.country}</span>
                </div>
                <div className="geo-stats-wrap">
                  <span className="geo-tenants-pill">
                    {geo.tenantCount} {geo.tenantCount === 1 ? 'tienda' : 'tiendas'}
                  </span>
                  <span className="geo-revenue">
                    Bs. {geo.totalRevenue.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="saas-geo-footer">
            <span className="geo-footnote">
              Arquitectura multi-base de datos activa en Datacenter Azure Chile Central (latencia ultra baja).
            </span>
          </div>
        </div>
      </div>

      {/* Segmentación de Inquilinos por Clusters de Machine Learning & Churn Risk */}
      <div className="saas-section-row">
        <TenantClusteringGrid
          clusters={data.clusters}
          ranking={data.tenantsRanking}
          onSelectTenantForAudit={handleAuditTenant}
        />
      </div>
    </div>
  );
};

