/**
 * @caso-de-uso CU27 — Consultar dashboard y reportes
 * @subsistema Reportes y Dashboard
 * @capa Boundary — Frontend web
 * @responsabilidad Centro de Reportes analíticos y generador de consultas dinámicas QBE.
 * @secuencia Administrador o Encargado -> Centro de Reportes / QBE -> generador -> exportador CSV/Excel/PDF.
 */
import React from 'react';
import {
  FileBarChart2,
  SlidersHorizontal,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
} from 'lucide-react';
import { useReportsDashboard } from '../hooks/useReportsDashboard';
import { ReportSelectorGrid } from '../components/ReportSelectorGrid';
import { ReportFiltersBar } from '../components/ReportFiltersBar';
import { ReportPreviewTable } from '../components/ReportPreviewTable';
import { QbeTab } from '../components/QbeTab';

export const ReportsDashboardPage: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
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
            Centro de Reportes y Consultas Analíticas
          </h1>
          <p style={{ color: '#736B63', fontSize: '0.95rem', margin: '0.25rem 0 0 0' }}>
            Generación de reportes predeterminados con exportación a PDF/Excel y consultas dinámicas QBE.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Botón Asistente IA */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('dressly:open-ai-chat'))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#1C1510',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '11px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={16} color="#C4956A" />
            <span>Asistente IA (Voz / Chat)</span>
          </button>

          {/* Switch de 2 Pestañas Principales: Centro de Reportes y QBE */}
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
              type="button"
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
            <button
              type="button"
              onClick={() => setActiveTab('qbe')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: activeTab === 'qbe' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'qbe' ? '#1C1510' : '#736B63',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'qbe' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <SlidersHorizontal size={16} />
              Consultas Dinámicas (QBE)
            </button>
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
            type="button"
            onClick={() => setFeedbackMsg(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center' }}
            aria-label="Cerrar notificación"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 1: CENTRO DE REPORTES (PREDETERMINADOS / AVANZADOS) */}
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

      {/* ========================================================================= */}
      {/* VISTA 2: CONSULTAS DINÁMICAS QBE (LENGUAJE NATURAL Y MANUAL) */}
      {/* ========================================================================= */}
      {activeTab === 'qbe' && <QbeTab />}
    </div>
  );
};
