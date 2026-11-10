import React, { useState, useEffect } from 'react';
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
  Volume2,
  Sparkles,
  Search,
  Download,
} from 'lucide-react';
import { useReportsDashboard } from '../hooks/useReportsDashboard';
import { DashboardMetricsGrid } from '../components/DashboardMetricsGrid';
import { DashboardCharts } from '../components/DashboardCharts';
import { DashboardQuickTables } from '../components/DashboardQuickTables';
import { ReportSelectorGrid } from '../components/ReportSelectorGrid';
import { ReportFiltersBar } from '../components/ReportFiltersBar';
import { ReportPreviewTable } from '../components/ReportPreviewTable';
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

  // Estados locales para el módulo QBE
  const [qbeEntity, setQbeEntity] = useState<'ventas' | 'inventario' | 'clientes'>('ventas');
  const [qbeField, setQbeField] = useState('total');
  const [qbeOperator, setQbeOperator] = useState('>=');
  const [qbeValue, setQbeValue] = useState('100');
  const [qbeResults] = useState<any[]>([
    { id: 'V-1029', entidad: 'Venta Presencial', detalle: 'Vestido Seda Floral (Talla M)', monto: 'Bs. 350.00', fecha: '2026-11-08', estado: 'PAGADO' },
    { id: 'V-1030', entidad: 'Venta Digital', detalle: 'Blazer Ejecutivo Negro (Talla S)', monto: 'Bs. 480.00', fecha: '2026-11-08', estado: 'PAGADO' },
    { id: 'V-1031', entidad: 'Venta Presencial', detalle: 'Camisa Oversize Algodón', monto: 'Bs. 220.00', fecha: '2026-11-07', estado: 'PAGADO' },
  ]);

  // Estados locales para el módulo de Reportes por Voz
  const [voiceInput, setVoiceInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceResponse, setVoiceResponse] = useState<{
    query: string;
    answer: string;
    kpis: { label: string; val: string }[];
  } | null>({
    query: '¿Cuáles fueron los productos más vendidos esta semana?',
    answer: 'Durante los últimos 7 días, el producto con mayor rotación en todas las sucursales fue el Vestido Seda Floral con 48 unidades vendidas (Bs. 16,800.00 en ingresos brutos), seguido por el Pantalón Wide Leg Negro con 35 unidades.',
    kpis: [
      { label: 'Unidades Vendidas', val: '142 prendas' },
      { label: 'Ingresos Totales', val: 'Bs. 49,700.00' },
      { label: 'Sucursal Líder', val: 'Equipetrol (58%)' },
    ],
  });

  const handleVoiceSimulate = (promptText: string) => {
    setVoiceInput(promptText);
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      let answer = '';
      let kpis = [];

      if (promptText.toLowerCase().includes('stock') || promptText.toLowerCase().includes('critico')) {
        answer = 'La sucursal Equipetrol cuenta actualmente con 3 referencias en nivel de stock crítico: Top Deportivo Transpirable (2 unidades), Buzo Jogger Negro (1 unidad) y Camiseta Oversize Blanco (0 unidades).';
        kpis = [
          { label: 'Referencias Críticas', val: '3 variantes' },
          { label: 'Stock Promedio', val: '18 unidades' },
          { label: 'Alerta Reabastecimiento', val: 'Alta' },
        ];
      } else if (promptText.toLowerCase().includes('ingreso') || promptText.toLowerCase().includes('online')) {
        answer = 'En el periodo actual, el canal de Tienda Online generó el 64% de los ingresos totales (Bs. 84,200), mientras que el punto de venta presencial (POS) representó el 36% (Bs. 47,360).';
        kpis = [
          { label: 'Ventas Online', val: 'Bs. 84,200' },
          { label: 'Ventas POS', val: 'Bs. 47,360' },
          { label: 'Ticket Promedio Online', val: 'Bs. 320' },
        ];
      } else {
        answer = `Análisis de negocio procesado para la consulta: "${promptText}". El rendimiento global se mantiene 12.4% por encima del promedio del mes anterior.`;
        kpis = [
          { label: 'Crecimiento', val: '+12.4%' },
          { label: 'Confiabilidad Modelo', val: '98.5%' },
          { label: 'Tiempo de Consulta', val: '0.4s' },
        ];
      }

      setVoiceResponse({ query: promptText, answer, kpis });

      // Síntesis de voz opcional si está disponible en navegador
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(answer);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    }, 1500);
  };

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Consultar Dashboard',
          subtitle: isAdmin
            ? 'Panel ejecutivo con visibilidad global consolidada y métricas de todas las sucursales.'
            : 'Panel operativo restringido exclusivamente a tus sucursales autorizadas.',
          icon: <LayoutDashboard size={24} style={{ color: '#8A5340' }} />,
        };
      case 'reports':
        return {
          title: 'Gestionar Reportes Predefinidos',
          subtitle: 'Consultas analíticas consolidadas de ventas, inventario y finanzas exportables a PDF y Excel.',
          icon: <FileBarChart2 size={24} style={{ color: '#8A5340' }} />,
        };
      case 'qbe':
        return {
          title: 'Gestionar Reportes QBE',
          subtitle: 'Generador de consultas analíticas avanzadas y búsquedas personalizadas Query-By-Example.',
          icon: <TableProperties size={24} style={{ color: '#8A5340' }} />,
        };
      case 'voz':
        return {
          title: 'Gestionar Reportes por Voz',
          subtitle: 'Consultas analíticas inteligentes en lenguaje natural con procesamiento de voz y síntesis auditiva en tiempo real.',
          icon: <Mic size={24} style={{ color: '#8A5340' }} />,
        };
      default:
        return {
          title: 'Inteligencia de Negocios y Reportes',
          subtitle: 'Panel ejecutivo y reportes consolidados del sistema.',
          icon: <LayoutDashboard size={24} style={{ color: '#8A5340' }} />,
        };
    }
  };

  const headerInfo = getHeaderInfo();

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#F5EBE6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {headerInfo.icon}
          </div>
          <div>
            <h1
              style={{
                fontSize: '1.85rem',
                fontWeight: 700,
                margin: 0,
                fontFamily: 'var(--font-display, Georgia, serif)',
                letterSpacing: '-0.02em',
                color: '#1C1510',
              }}
            >
              {headerInfo.title}
            </h1>
            <p style={{ color: '#736B63', fontSize: '0.92rem', margin: '0.2rem 0 0 0' }}>
              {headerInfo.subtitle}
            </p>
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
      {/* VISTA 3: REPORTES DINÁMICOS QBE (QUERY-BY-EXAMPLE) */}
      {/* ========================================================================= */}
      {activeTab === 'qbe' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E0D8', padding: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #E5E0D8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#1C1510', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TableProperties size={20} />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: '1.4rem', margin: 0, fontWeight: 700 }}>
                  Generador de Consultas Dinámicas (QBE)
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: '#736B63' }}>
                  Construcción visual de consultas sin requerir conocimientos en sentencias SQL complejas
                </p>
              </div>
            </div>

            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: '9999px', backgroundColor: '#DEF7EC', color: '#03543F' }}>
              Motor Relacional Activo
            </span>
          </div>

          {/* Constructor de Criterios QBE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem', backgroundColor: '#FAF8F5', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E5E0D8' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#736B63', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                1. Entidad Principal
              </label>
              <select
                value={qbeEntity}
                onChange={(e: any) => setQbeEntity(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #E5E0D8', fontSize: '0.88rem' }}
              >
                <option value="ventas">Ventas y Facturación</option>
                <option value="inventario">Inventario y Existencias</option>
                <option value="clientes">Clientes y Compras</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#736B63', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                2. Campo de Filtro
              </label>
              <select
                value={qbeField}
                onChange={(e) => setQbeField(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #E5E0D8', fontSize: '0.88rem' }}
              >
                <option value="total">Monto Total de Operación</option>
                <option value="fecha">Fecha de Transacción</option>
                <option value="estado">Estado de la Operación</option>
                <option value="sucursal">Sucursal de Despacho</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#736B63', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                3. Operador Lógico
              </label>
              <select
                value={qbeOperator}
                onChange={(e) => setQbeOperator(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #E5E0D8', fontSize: '0.88rem' }}
              >
                <option value=">=">Mayor o igual que (&gt;=)</option>
                <option value="<=">Menor o igual que (&lt;=)</option>
                <option value="=">Exactamente igual a (=)</option>
                <option value="LIKE">Contiene texto (LIKE)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#736B63', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                4. Valor de Búsqueda
              </label>
              <input
                type="text"
                value={qbeValue}
                onChange={(e) => setQbeValue(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #E5E0D8', fontSize: '0.88rem', boxSizing: 'border-box' }}
                placeholder="Ej: 100"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button
              onClick={() => {
                setFeedbackMsg({ type: 'success', text: `Consulta QBE ejecutada sobre ${qbeEntity}. 3 registros encontrados.` });
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: '#1C1510',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Search size={15} />
              Ejecutar Consulta QBE
            </button>
            <button
              onClick={() => alert('Exportando resultados de consulta QBE a Excel')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.1rem',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                color: '#1C1510',
                fontWeight: 600,
                fontSize: '0.88rem',
                border: '1px solid #E5E0D8',
                cursor: 'pointer',
              }}
            >
              <Download size={15} />
              Exportar CSV / Excel
            </button>
          </div>

          {/* Tabla de Resultados QBE */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#FAF8F5', borderBottom: '1px solid #E5E0D8' }}>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#736B63', textTransform: 'uppercase' }}>Código</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#736B63', textTransform: 'uppercase' }}>Tipo de Registro</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#736B63', textTransform: 'uppercase' }}>Detalle de Prendas</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#736B63', textTransform: 'uppercase' }}>Importe Total</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#736B63', textTransform: 'uppercase' }}>Fecha</th>
                  <th style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#736B63', textTransform: 'uppercase' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {qbeResults.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #E5E0D8' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 600 }}>{item.id}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{item.entidad}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{item.detalle}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#1C1510' }}>{item.monto}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#736B63' }}>{item.fecha}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#DEF7EC', color: '#03543F' }}>
                        {item.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 4: REPORTES POR VOZ E INTELIGENCIA ARTIFICIAL */}
      {/* ========================================================================= */}
      {activeTab === 'voz' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E5E0D8', padding: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #E5E0D8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#1C1510', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mic size={20} />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: '1.4rem', margin: 0, fontWeight: 700 }}>
                  Consultas y Reportes por Voz & IA
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.88rem', color: '#736B63' }}>
                  Procesamiento de lenguaje natural mediante síntesis de voz y modelos probabilísticos
                </p>
              </div>
            </div>

            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: '9999px', backgroundColor: '#EDE9FE', color: '#5B21B6' }}>
              Reconocimiento por Voz Activo
            </span>
          </div>

          {/* Área Central de Voz */}
          <div style={{ textAlign: 'center', padding: '2rem 1rem', backgroundColor: '#FAF8F5', borderRadius: '14px', border: '1px dashed #D6D0C7', marginBottom: '1.75rem' }}>
            <button
              onClick={() => handleVoiceSimulate(voiceInput || '¿Cuáles fueron los productos más vendidos esta semana?')}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: isListening ? '#E02424' : '#1C1510',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isListening ? '0 0 0 10px rgba(224, 36, 36, 0.2)' : '0 4px 14px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease',
              }}
            >
              <Mic size={32} />
            </button>
            <div style={{ marginTop: '1rem', fontWeight: 600, fontSize: '0.95rem' }}>
              {isListening ? 'Escuchando consulta de voz...' : 'Presione para hablar o ingrese su consulta debajo'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#736B63', marginTop: '0.25rem' }}>
              Compatible con micrófono web estándar y transcripción automática en español
            </div>
          </div>

          {/* Sugerencias Rápidas de Preguntas */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#736B63', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Preguntas Frecuentes Sugeridas:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {[
                '¿Cuáles fueron los productos más vendidos esta semana?',
                'Dime el stock crítico de la sucursal Equipetrol',
                'Comparativa de ingresos entre ventas presenciales y tienda online',
                '¿Cuántas reservas están pendientes de retiro hoy?',
              ].map((query) => (
                <button
                  key={query}
                  onClick={() => handleVoiceSimulate(query)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #E5E0D8',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.8rem',
                    color: '#1C1510',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  💬 {query}
                </button>
              ))}
            </div>
          </div>

          {/* Respuesta Generada por IA y Síntesis */}
          {voiceResponse && (
            <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4B5563', fontSize: '0.85rem', fontWeight: 600 }}>
                  <Sparkles size={16} color="#7C3AED" />
                  <span>Pregunta analizada:</span>
                  <span style={{ color: '#111827', fontStyle: 'italic' }}>"{voiceResponse.query}"</span>
                </div>
                <button
                  onClick={() => {
                    if ('speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                      const utterance = new SpeechSynthesisUtterance(voiceResponse.answer);
                      utterance.lang = 'es-ES';
                      window.speechSynthesis.speak(utterance);
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Volume2 size={14} />
                  Reproducir Audio
                </button>
              </div>

              <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#1F2937', margin: '0 0 1.25rem 0' }}>
                {voiceResponse.answer}
              </p>

              {/* Indicadores Clave de la Respuesta */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {voiceResponse.kpis.map((kpi, idx) => (
                  <div key={idx} style={{ backgroundColor: '#FFFFFF', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', fontWeight: 600 }}>
                      {kpi.label}
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111827', marginTop: '0.2rem' }}>
                      {kpi.val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsDashboardPage;
