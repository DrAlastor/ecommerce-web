import React from 'react';
import {
  Calendar,
  Store,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
} from 'lucide-react';
import type { ReportFilters } from '../types/reports.types';

interface ReportFiltersBarProps {
  reportFilters: ReportFilters;
  setReportFilters: React.Dispatch<React.SetStateAction<ReportFilters>>;
  reportDatePreset: string;
  setReportDatePreset: (preset: string) => void;
  branches: { id_sucursal: number; nombre: string }[];
  categories: { id_categoria: number; nombre: string }[];
  isAdmin: boolean;
  onGenerateReport: () => void;
  loadingReport: boolean;
  onExportReport: (format: 'csv' | 'excel' | 'pdf') => void;
  exportingFormat: string | null;
}

export const ReportFiltersBar: React.FC<ReportFiltersBarProps> = ({
  reportFilters,
  setReportFilters,
  reportDatePreset,
  setReportDatePreset,
  branches,
  categories,
  isAdmin,
  onGenerateReport,
  loadingReport,
  onExportReport,
  exportingFormat,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #EAE6DF',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Filter size={18} color="#8C5E35" />
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#1C1510' }}>
          Parámetros y Filtros del Reporte
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {/* Presets de Período */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#736B63', marginBottom: '0.35rem' }}>
            Rango de Fechas
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={16} color="#8C5E35" />
            <select
              value={reportDatePreset}
              onChange={(e) => setReportDatePreset(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid #D1C9BE',
                fontSize: '0.85rem',
                color: '#1C1510',
                backgroundColor: '#FFFFFF',
              }}
            >
              <option value="today">Hoy</option>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="this_month">Este mes</option>
              <option value="this_year">Año actual</option>
              <option value="all">Histórico completo</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
        </div>

        {/* Sucursal */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#736B63', marginBottom: '0.35rem' }}>
            Sucursal
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Store size={16} color="#8C5E35" />
            <select
              value={reportFilters.id_sucursal || ''}
              onChange={(e) => setReportFilters((prev) => ({ ...prev, id_sucursal: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid #D1C9BE',
                fontSize: '0.85rem',
                color: '#1C1510',
                backgroundColor: '#FFFFFF',
              }}
            >
              {isAdmin && <option value="">Todas las sucursales (Consolidado)</option>}
              {branches.map((b) => (
                <option key={b.id_sucursal} value={b.id_sucursal}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Categoría */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#736B63', marginBottom: '0.35rem' }}>
            Categoría de Prenda
          </label>
          <select
            value={reportFilters.categoria_id || ''}
            onChange={(e) => setReportFilters((prev) => ({ ...prev, categoria_id: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.45rem 0.65rem',
              borderRadius: '8px',
              border: '1px solid #D1C9BE',
              fontSize: '0.85rem',
              color: '#1C1510',
              backgroundColor: '#FFFFFF',
            }}
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id_categoria} value={c.id_categoria}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de Canal */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#736B63', marginBottom: '0.35rem' }}>
            Canal de Operación
          </label>
          <select
            value={reportFilters.tipo_venta || ''}
            onChange={(e) => setReportFilters((prev) => ({ ...prev, tipo_venta: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.45rem 0.65rem',
              borderRadius: '8px',
              border: '1px solid #D1C9BE',
              fontSize: '0.85rem',
              color: '#1C1510',
              backgroundColor: '#FFFFFF',
            }}
          >
            <option value="">Todos los canales</option>
            <option value="presencial">Presencial (Sucursal física)</option>
            <option value="digital">Digital (Tienda online)</option>
          </select>
        </div>
      </div>

      {/* Fechas personalizadas si aplica */}
      {reportDatePreset === 'custom' && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#736B63', marginBottom: '0.25rem' }}>
              Desde
            </label>
            <input
              type="date"
              value={reportFilters.fecha_inicio || ''}
              onChange={(e) => setReportFilters((prev) => ({ ...prev, fecha_inicio: e.target.value }))}
              style={{
                padding: '0.4rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid #D1C9BE',
                fontSize: '0.85rem',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#736B63', marginBottom: '0.25rem' }}>
              Hasta
            </label>
            <input
              type="date"
              value={reportFilters.fecha_fin || ''}
              onChange={(e) => setReportFilters((prev) => ({ ...prev, fecha_fin: e.target.value }))}
              style={{
                padding: '0.4rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid #D1C9BE',
                fontSize: '0.85rem',
              }}
            />
          </div>
        </div>
      )}

      {/* Botones de Acción: Generar y Exportar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderTop: '1px solid #EAE6DF', paddingTop: '1.25rem' }}>
        <button
          onClick={onGenerateReport}
          disabled={loadingReport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#8C5E35',
            color: '#FFFFFF',
            padding: '0.65rem 1.35rem',
            borderRadius: '9px',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(140,94,53,0.25)',
          }}
        >
          <RefreshCw size={16} className={loadingReport ? 'spin' : ''} />
          {loadingReport ? 'Generando Reporte...' : 'Generar Vista Previa'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#736B63', marginRight: '0.25rem' }}>
            Descargar archivo:
          </span>

          <button
            onClick={() => onExportReport('csv')}
            disabled={exportingFormat !== null}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#FFFFFF',
              border: '1px solid #D1C9BE',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#4B433B',
              cursor: 'pointer',
            }}
          >
            {exportingFormat === 'csv' ? <RefreshCw size={14} className="spin" /> : <Download size={14} />}
            CSV
          </button>

          <button
            onClick={() => onExportReport('excel')}
            disabled={exportingFormat !== null}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#047857',
              cursor: 'pointer',
            }}
          >
            {exportingFormat === 'excel' ? <RefreshCw size={14} className="spin" /> : <FileSpreadsheet size={14} />}
            Excel (.xlsx)
          </button>

          <button
            onClick={() => onExportReport('pdf')}
            disabled={exportingFormat !== null}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#B91C1C',
              cursor: 'pointer',
            }}
          >
            {exportingFormat === 'pdf' ? <RefreshCw size={14} className="spin" /> : <FileText size={14} />}
            PDF
          </button>
        </div>
      </div>
    </div>
  );
};
