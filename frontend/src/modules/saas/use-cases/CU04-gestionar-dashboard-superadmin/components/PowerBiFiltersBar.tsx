import React from 'react';
import { RefreshCw, Download, Calendar, Layers, ShieldCheck } from 'lucide-react';

interface PowerBiFiltersBarProps {
  timeRange: string;
  setTimeRange: (val: '30d' | '90d' | '12m' | 'all') => void;
  selectedPlan: string;
  setSelectedPlan: (val: string) => void;
  selectedStatus: string;
  setSelectedStatus: (val: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onExportReport: () => void;
  lastUpdated?: string;
}

export const PowerBiFiltersBar: React.FC<PowerBiFiltersBarProps> = ({
  timeRange,
  setTimeRange,
  selectedPlan,
  setSelectedPlan,
  selectedStatus,
  setSelectedStatus,
  onRefresh,
  isRefreshing,
  onExportReport,
  lastUpdated,
}) => {
  return (
    <div className="saas-powerbi-slicers-bar">
      <div className="slicers-left-group">
        {/* Slicer 1: Rango Temporal */}
        <div className="slicer-item">
          <div className="slicer-label">
            <Calendar size={14} />
            <span>VENTANA TEMPORAL</span>
          </div>
          <div className="slicer-buttons-group">
            <button
              type="button"
              className={`slicer-btn ${timeRange === '30d' ? 'active' : ''}`}
              onClick={() => setTimeRange('30d')}
            >
              30 Días
            </button>
            <button
              type="button"
              className={`slicer-btn ${timeRange === '90d' ? 'active' : ''}`}
              onClick={() => setTimeRange('90d')}
            >
              90 Días
            </button>
            <button
              type="button"
              className={`slicer-btn ${timeRange === '12m' ? 'active' : ''}`}
              onClick={() => setTimeRange('12m')}
            >
              12 Meses
            </button>
            <button
              type="button"
              className={`slicer-btn ${timeRange === 'all' ? 'active' : ''}`}
              onClick={() => setTimeRange('all')}
            >
              Histórico
            </button>
          </div>
        </div>

        {/* Slicer 2: Plan de Suscripción */}
        <div className="slicer-item">
          <div className="slicer-label">
            <Layers size={14} />
            <span>PLAN DE SUSCRIPCIÓN</span>
          </div>
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="slicer-select"
          >
            <option value="ALL">Todos los Planes</option>
            <option value="PRUEBA">Plan Prueba</option>
            <option value="BASICO">Plan Básico</option>
            <option value="PREMIUM">Plan Premium</option>
            <option value="CORPORATIVO">Plan Corporativo</option>
            <option value="EMPRESARIAL">Plan Empresarial</option>
          </select>
        </div>

        {/* Slicer 3: Estado de Tenant */}
        <div className="slicer-item">
          <div className="slicer-label">
            <ShieldCheck size={14} />
            <span>ESTADO</span>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="slicer-select"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="ACTIVO">Solo Activos</option>
            <option value="PRUEBA">En Período de Prueba</option>
            <option value="SUSPENDIDO">Suspendidos / Pausa</option>
          </select>
        </div>
      </div>

      <div className="slicers-right-group">
        {lastUpdated && (
          <span className="last-sync-time">
            Actualizado: {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}

        <button
          type="button"
          className="btn-slicer-action"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Recalcular métricas de telemetría y algoritmos de ML"
        >
          <RefreshCw size={15} className={isRefreshing ? 'spin' : ''} />
          <span>{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
        </button>

        <button
          type="button"
          className="btn-slicer-action primary"
          onClick={onExportReport}
          title="Exportar reporte analítico consolidado"
        >
          <Download size={15} />
          <span>Exportar Informe</span>
        </button>
      </div>
    </div>
  );
};

