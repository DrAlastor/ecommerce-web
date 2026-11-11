import api from '../../../../../services/api/api';
import React, { useEffect, useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileBarChart2,
  RefreshCw,
  Store,
  CheckCircle2,
  AlertTriangle,
  TableProperties,
  Mic,
  Sparkles,
  Brain,
} from 'lucide-react';
import { useReportsDashboard } from '../hooks/useReportsDashboard';
import { DashboardMetricsGrid } from '../components/DashboardMetricsGrid';
import { DashboardCharts } from '../components/DashboardCharts';
import { DashboardQuickTables } from '../components/DashboardQuickTables';
import { ReportSelectorGrid } from '../components/ReportSelectorGrid';
import { ReportFiltersBar } from '../components/ReportFiltersBar';
import { ReportPreviewTable } from '../components/ReportPreviewTable';
import { QbeTab } from '../components/QbeTab';
import { VoiceReportsTab } from '../components/VoiceReportsTab';
import { NeuralAnalyticsTab } from '../components/NeuralAnalyticsTab';
import type { TabType } from '../types/reports.types';

interface ReportsDashboardPageProps {
  defaultTab?: TabType;
}

const TAB_ROUTES: Record<TabType, string> = {
  dashboard: '/admin/dashboard',
  reports: '/admin/reportes-predefinidos',
  qbe: '/admin/reportes-qbe',
  voz: '/admin/reportes-voz',
  ml: '/admin/decisiones-ml',
};

export const ReportsDashboardPage: React.FC<ReportsDashboardPageProps> = ({ defaultTab }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const rawTenant = localStorage.getItem('tenantKey') || 'dressly';
  const tenantKey = rawTenant === 'subversive-urban' || rawTenant === 'subversive'
    ? 'urbanly'
    : (rawTenant === 'aura' ? 'aura-sport' : (rawTenant === 'fashionstore' ? 'dressly' : rawTenant));

  const [currentPlanId, setCurrentPlanId] = useState('PRUEBA');
  useEffect(() => {
    let active = true;
    api.get('/users-security/company/public/' + encodeURIComponent(tenantKey)).then(res => {
      if (active) setCurrentPlanId(res.data.plan_id || 'PRUEBA');
    }).catch(() => {});
    return () => { active = false; };
  }, [tenantKey]);

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
  } = useReportsDashboard(defaultTab);

  // Manejo de cambio de pestaña con sincronización de ruta y sidebar
  const handleTabClick = useCallback(
    (tab: TabType) => {
      setActiveTab(tab);
      const targetRoute = TAB_ROUTES[tab];
      if (targetRoute && location.pathname !== targetRoute) {
        navigate(targetRoute);
      }
    },
    [navigate, location.pathname, setActiveTab],
  );

  // Sincronizar tab según la ruta actual del navegador
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('reportes-ml') || path.includes('decisiones-ml')) {
      setActiveTab('ml');
    } else if (path.includes('reportes-voz')) {
      setActiveTab('voz');
    } else if (path.includes('reportes-qbe')) {
      setActiveTab('qbe');
    } else if (path.includes('reportes-predefinidos') || path.includes('/admin/reportes')) {
      setActiveTab('reports');
    } else if (path.includes('dashboard') || path.includes('consultar-dashboard')) {
      setActiveTab('dashboard');
    } else if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [location.pathname, defaultTab, setActiveTab]);

  return (
    <div style={{ padding: '0.25rem 0.5rem 1.5rem', maxWidth: '1440px', margin: '0 auto', color: '#1C1510' }}>
      {/* Barra de Navegación Compacta: Botón IA al Principio + Pestañas de Reportes */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.65rem',
          marginBottom: '1rem',
          paddingBottom: '0.65rem',
          borderBottom: '1px solid #ECE7E1',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Botón IA al Principio */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('dressly:open-ai-chat'))}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.38rem 0.85rem',
              backgroundColor: '#1C1510',
              color: '#FFFFFF',
              border: '1px solid #C4956A',
              borderRadius: '7px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.12)',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
            title="Abrir Asistente IA para reportes y consultas del sistema"
          >
            <Sparkles size={14} style={{ color: '#E5A96A' }} />
            <span>Asistente IA</span>
          </button>

          {/* Switch de Pestañas Compacto */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: '#EFEBE4',
              borderRadius: '8px',
              padding: '3px',
              gap: '2px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => handleTabClick('dashboard')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'dashboard' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'dashboard' ? '#1C1510' : '#736B63',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'dashboard' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <LayoutDashboard size={13} />
              Dashboard General
            </button>

            <button
              onClick={() => handleTabClick('reports')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === 'reports' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'reports' ? '#1C1510' : '#736B63',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'reports' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <FileBarChart2 size={13} />
              Reportes Predefinidos
            </button>

            {/* Pestañas condicionadas por Plan de Suscripción */}
            {currentPlanId !== 'plan-starter' && currentPlanId !== 'BASICO' && currentPlanId !== 'plan-trial' && currentPlanId !== 'PRUEBA' && (
              <>
                <button
                  onClick={() => handleTabClick('qbe')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: activeTab === 'qbe' ? '#FFFFFF' : 'transparent',
                    color: activeTab === 'qbe' ? '#1C1510' : '#736B63',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'qbe' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <TableProperties size={13} />
                  Reportes QBE
                </button>

                <button
                  onClick={() => handleTabClick('voz')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: activeTab === 'voz' ? '#FFFFFF' : 'transparent',
                    color: activeTab === 'voz' ? '#1C1510' : '#736B63',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'voz' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Mic size={13} />
                  Reportes por Voz
                </button>

                <button
                  onClick={() => handleTabClick('ml')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: activeTab === 'ml' ? '#FFFFFF' : 'transparent',
                    color: activeTab === 'ml' ? '#8B5E34' : '#736B63',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'ml' ? '0 1px 3px rgba(139,94,52,0.12)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Brain size={13} style={{ color: activeTab === 'ml' ? '#8B5E34' : undefined }} />
                  Decisiones & ML
                </button>
              </>
            )}
          </div>
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
      {/* VISTA 3: CONSULTAS DINÁMICAS QBE (CU32) */}
      {/* ========================================================================= */}
      {activeTab === 'qbe' && <QbeTab />}

      {/* ========================================================================= */}
      {/* VISTA 4: REPORTES POR VOZ CON IA (CU33) */}
      {/* ========================================================================= */}
      {activeTab === 'voz' && <VoiceReportsTab />}

      {/* ========================================================================= */}
      {/* VISTA 5: DECISIONES & MACHINE LEARNING (CU29) */}
      {/* ========================================================================= */}
      {activeTab === 'ml' && <NeuralAnalyticsTab branches={branches} />}
    </div>
  );
};

export default ReportsDashboardPage;
