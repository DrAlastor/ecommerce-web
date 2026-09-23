/**
 * @caso-de-uso CU27 — Consultar dashboard y reportes
 * @subsistema Reportes y Dashboard
 * @capa Boundary — Frontend web
 * @responsabilidad Representa la pantalla principal de Frontend web; compone la interfaz e inicia las acciones del caso de uso.
 * @secuencia Administrador o Encargado -> dashboard -> controlador de reportes -> servicio de agregación/exportación -> Ventas/Pagos/Inventario/Reservas/Compras.
 */
import React from 'react';
import {
  LayoutDashboard,
  FileBarChart2,
  RefreshCw,
  Store,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useReportsDashboard } from '../hooks/useReportsDashboard';
import { DashboardMetricsGrid } from '../components/DashboardMetricsGrid';
import { DashboardCharts } from '../components/DashboardCharts';
import { DashboardQuickTables } from '../components/DashboardQuickTables';
import { ReportSelectorGrid } from '../components/ReportSelectorGrid';
import { ReportFiltersBar } from '../components/ReportFiltersBar';
import { ReportPreviewTable } from '../components/ReportPreviewTable';

export const ReportsDashboardPage: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    dashboardData,
    loadingDashboard,
    dashBranch,
    dashDatePreset,
    loadDashboard,
    handlePresetChange,
    handleBranchChange,
    branches,
    categories,
    isAdmin,
    reportCategory,
    setReportCategory,
    selectedReportId,
    handleSelectReport,
    reportDatePreset,
    setReportDatePreset,
    reportFilters,
    setReportFilters,
    reportData,
    loadingReport,
    handleGenerateReport,
    handleExport,
    exportingFormat,
    tableSearch,
    setTableSearch,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    feedbackMsg,
    setFeedbackMsg,
  } = useReportsDashboard();

  return (
    <div style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto', color: '#1C1510' }}>
      {/* Cabecera Principal */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              margin: 0,
              fontFamily: 'var(--font-display, Georgia, serif)',
              letterSpacing: '-0.02em',
            }}
          >
            Reportes y Dashboard de Negocio
          </h1>
          <p style={{ color: '#736B63', fontSize: '0.95rem', margin: '0.25rem 0 0 0' }}>
            {isAdmin
              ? 'Panel ejecutivo con visibilidad global consolidada y métricas de todas las sucursales.'
              : 'Panel operativo restringido exclusivamente a tus sucursales autorizadas.'}
          </p>
        </div>

        {/* Switch de Pestañas Principales */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#EFEBE4',
            borderRadius: '12px',
            padding: '4px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)',
          }}
        >
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: activeTab === 'dashboard' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'dashboard' ? '#1C1510' : '#736B63',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'dashboard' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <LayoutDashboard size={16} />
            Dashboard General
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: activeTab === 'reports' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'reports' ? '#1C1510' : '#736B63',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'reports' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <FileBarChart2 size={16} />
            Centro de Reportes
          </button>
        </div>
      </div>

      {/* Notificación de feedback */}
      {feedbackMsg && (
        <div
          style={{
            backgroundColor: feedbackMsg.type === 'success' ? '#DCFCE7' : '#FEE2E2',
            border: `1px solid ${feedbackMsg.type === 'success' ? '#86EFAC' : '#FCA5A5'}`,
            color: feedbackMsg.type === 'success' ? '#166534' : '#991B1B',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 1: DASHBOARD GENERAL */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div>
          {/* Barra de Filtros Rápidos del Dashboard */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #EAE6DF',
              padding: '1.25rem 1.5rem',
              marginBottom: '1.75rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            {/* Presets de Fecha */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#736B63', marginRight: '0.25rem' }}>
                Período:
              </span>
              {[
                { id: 'today', label: 'Hoy' },
                { id: '7d', label: '7 Días' },
                { id: '30d', label: '30 Días' },
                { id: 'this_month', label: 'Este Mes' },
                { id: 'this_year', label: 'Año Actual' },
                { id: 'all', label: 'Histórico' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetChange(p.id)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    border: dashDatePreset === p.id ? '1px solid #C4956A' : '1px solid #E5E0D8',
                    backgroundColor: dashDatePreset === p.id ? '#F4ECE1' : '#FFFFFF',
                    color: dashDatePreset === p.id ? '#8C5E35' : '#4B433B',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Selector de Sucursal y Recargar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Store size={18} color="#8C5E35" />
                <select
                  value={dashBranch}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #D1C9BE',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#2E2722',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {isAdmin && <option value="">Consolidado Nacional (Todas)</option>}
                  {branches.map((b) => (
                    <option key={b.id_sucursal} value={b.id_sucursal}>
                      {b.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => loadDashboard(true)}
                disabled={loadingDashboard}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #D1C9BE',
                  backgroundColor: '#FAF8F5',
                  color: '#4B433B',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={14} className={loadingDashboard ? 'spin' : ''} />
                Actualizar
              </button>
            </div>
          </div>

          {loadingDashboard && !dashboardData ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#8C5E35' }}>
              <RefreshCw size={36} className="spin" style={{ margin: '0 auto 1rem auto' }} />
              <p style={{ fontWeight: 600 }}>Consultando indicadores en tiempo real desde la base de datos...</p>
            </div>
          ) : dashboardData ? (
            <>
              {/* Tarjetas de Indicadores Principales */}
              <DashboardMetricsGrid metrics={dashboardData} />

              {/* Gráficos Estadísticos */}
              <DashboardCharts metrics={dashboardData} />

              {/* Tablas de Stock Crítico y Actividad Reciente */}
              <DashboardQuickTables metrics={dashboardData} />
            </>
          ) : null}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: CENTRO DE REPORTES */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div>
          {/* Selector de Reporte por Categoría */}
          <ReportSelectorGrid
            selectedReportId={selectedReportId}
            onSelectReport={handleSelectReport}
            reportCategory={reportCategory}
            onSelectCategory={setReportCategory}
          />

          {/* Barra de Filtros y Parámetros */}
          <ReportFiltersBar
            reportFilters={reportFilters}
            setReportFilters={setReportFilters}
            reportDatePreset={reportDatePreset}
            setReportDatePreset={setReportDatePreset}
            branches={branches}
            categories={categories}
            isAdmin={isAdmin}
            onGenerateReport={handleGenerateReport}
            loadingReport={loadingReport}
            onExportReport={handleExport}
            exportingFormat={exportingFormat}
          />

          {/* Previsualización del Reporte */}
          {loadingReport ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#8C5E35' }}>
              <RefreshCw size={36} className="spin" style={{ margin: '0 auto 1rem auto' }} />
              <p style={{ fontWeight: 600 }}>Generando reporte y consolidando información contable...</p>
            </div>
          ) : reportData ? (
            <ReportPreviewTable
              reportData={reportData}
              tableSearch={tableSearch}
              setTableSearch={setTableSearch}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              pageSize={pageSize}
              setPageSize={setPageSize}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};
