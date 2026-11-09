import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileBarChart2,
  RefreshCw,
  Store,
  CheckCircle2,
  AlertTriangle,
  TableProperties,
  Mic,
} from 'lucide-react';
import { useReportsDashboard } from '../hooks/useReportsDashboard';
import { DashboardMetricsGrid } from '../components/DashboardMetricsGrid';
import { DashboardCharts } from '../components/DashboardCharts';
import { DashboardQuickTables } from '../components/DashboardQuickTables';
import { ReportSelectorGrid } from '../components/ReportSelectorGrid';
import { ReportFiltersBar } from '../components/ReportFiltersBar';
import { ReportPreviewTable } from '../components/ReportPreviewTable';
import { QbeTab } from '../components/QbeTab';
import type { TabType } from '../types/reports.types';

interface ReportsDashboardPageProps {
  defaultTab?: TabType;
}

export const ReportsDashboardPage: React.FC<ReportsDashboardPageProps> = ({ defaultTab }) => {
  const location = useLocation();
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

  // Sincronizar tab según la prop o la ruta actual
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    } else if (location.pathname.includes('reportes-voz')) {
      setActiveTab('voz');
    } else if (location.pathname.includes('reportes-qbe')) {
      setActiveTab('qbe');
    } else if (location.pathname.includes('reportes-predefinidos')) {
      setActiveTab('reports');
    } else if (location.pathname.includes('dashboard')) {
      setActiveTab('dashboard');
    }
  }, [defaultTab, location.pathname, setActiveTab]);

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
            Inteligencia de Negocios y Reportes
          </h1>
          <p style={{ color: '#736B63', fontSize: '0.95rem', margin: '0.25rem 0 0 0' }}>
            {isAdmin
              ? 'Panel ejecutivo con visibilidad global consolidada y métricas de todas las sucursales.'
              : 'Panel operativo restringido exclusivamente a tus sucursales autorizadas.'}
          </p>
        </div>

        {/* Switch de Pestañas Principales (Los 4 Casos de Uso del Módulo) */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#EFEBE4',
            borderRadius: '12px',
            padding: '4px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)',
            flexWrap: 'wrap',
            gap: '2px',
          }}
        >
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.1rem',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: activeTab === 'dashboard' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'dashboard' ? '#1C1510' : '#736B63',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'dashboard' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <LayoutDashboard size={15} />
            Dashboard General
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.1rem',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: activeTab === 'reports' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'reports' ? '#1C1510' : '#736B63',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'reports' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <FileBarChart2 size={15} />
            Reportes Predefinidos
          </button>

          <button
            onClick={() => setActiveTab('qbe')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.1rem',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: activeTab === 'qbe' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'qbe' ? '#1C1510' : '#736B63',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'qbe' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <TableProperties size={15} />
            Reportes QBE
          </button>

          <button
            onClick={() => setActiveTab('voz')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.1rem',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: activeTab === 'voz' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'voz' ? '#1C1510' : '#736B63',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'voz' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Mic size={15} />
            Reportes por Voz
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
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              backgroundColor: '#FFFFFF',
              padding: '1rem 1.5rem',
              borderRadius: '14px',
              border: '1px solid #E5E0D8',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#736B63', textTransform: 'uppercase' }}>
                Filtros:
              </span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {[
                  { id: 'today', label: 'Hoy' },
                  { id: '7d', label: '7 días' },
                  { id: '30d', label: '30 días' },
                  { id: 'month', label: 'Este mes' },
                  { id: 'year', label: 'Este año' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetChange(preset.id)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: dashDatePreset === preset.id ? '#1C1510' : '#E5E0D8',
                      backgroundColor: dashDatePreset === preset.id ? '#1C1510' : '#FAF8F5',
                      color: dashDatePreset === preset.id ? '#FFFFFF' : '#554E48',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {isAdmin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
                  <Store size={16} color="#736B63" />
                  <select
                    value={dashBranch}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #E5E0D8',
                      backgroundColor: '#FAF8F5',
                      fontSize: '0.82rem',
                      color: '#1C1510',
                      outline: 'none',
                    }}
                  >
                    <option value="">Todas las Sucursales (Global)</option>
                    {branches.map((b) => (
                      <option key={b.id_sucursal} value={b.id_sucursal}>
                        {b.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button
              onClick={() => { loadDashboard(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                border: '1px solid #E5E0D8',
                backgroundColor: '#FFFFFF',
                color: '#554E48',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} className={loadingDashboard ? 'spin' : ''} />
              Actualizar
            </button>
          </div>

          {loadingDashboard ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#736B63' }}>
              <RefreshCw size={36} className="spin" style={{ margin: '0 auto 1rem auto' }} />
              <p style={{ fontWeight: 600 }}>Cargando indicadores analíticos en tiempo real...</p>
            </div>
          ) : dashboardData ? (
            <>
              <DashboardMetricsGrid metrics={dashboardData} />
              <DashboardCharts metrics={dashboardData} />
              <DashboardQuickTables metrics={dashboardData} />
            </>
          ) : null}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: REPORTES PREDEFINIDOS */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div>
          <ReportSelectorGrid
            selectedReportId={selectedReportId}
            onSelectReport={handleSelectReport}
            reportCategory={reportCategory}
            onSelectCategory={setReportCategory}
          />

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

      {/* ========================================================================= */}
      {/* VISTA 3: CONSULTAS DINÁMICAS QBE & REPORTES POR VOZ CON IA */}
      {/* ========================================================================= */}
      {(activeTab === 'qbe' || activeTab === 'voz') && <QbeTab />}
    </div>
  );
};

export default ReportsDashboardPage;
