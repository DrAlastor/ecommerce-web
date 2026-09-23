/**
 * @caso-de-uso CU27 — Consultar dashboard y reportes
 * @subsistema Reportes y Dashboard
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Administrador o Encargado -> dashboard -> controlador de reportes -> servicio de agregación/exportación -> Ventas/Pagos/Inventario/Reservas/Compras.
 */
import React from 'react';
import { Search, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import type { ReportData } from '../types/reports.types';

interface ReportPreviewTableProps {
  reportData: ReportData;
  tableSearch: string;
  setTableSearch: (val: string) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  setPageSize: (size: number) => void;
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.75rem 1rem',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#4B433B',
  borderBottom: '2px solid #EAE6DF',
};

const tdStyle: React.CSSProperties = {
  padding: '0.85rem 1rem',
  fontSize: '0.85rem',
  color: '#1C1510',
  borderBottom: '1px solid #F4ECE1',
};

export const ReportPreviewTable: React.FC<ReportPreviewTableProps> = ({
  reportData,
  tableSearch,
  setTableSearch,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
}) => {
  // Filtrar filas por búsqueda en cualquier columna
  const filteredRows = React.useMemo(() => {
    if (!tableSearch.trim()) return reportData.rows;
    const q = tableSearch.toLowerCase();
    return reportData.rows.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(q)),
    );
  }, [reportData.rows, tableSearch]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #EAE6DF',
        padding: '1.75rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
    >
      {/* Encabezado del Reporte */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
          borderBottom: '1px solid #EAE6DF',
          paddingBottom: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                backgroundColor: '#1E293B',
                color: '#FFFFFF',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
              }}
            >
              {reportData.code}
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: '#1C1510' }}>
              {reportData.title}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.82rem', color: '#736B63', flexWrap: 'wrap' }}>
            <span>
              <strong>Período:</strong> {reportData.periodo}
            </span>
            <span>
              <strong>Sucursal:</strong> {reportData.sucursalNombre}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#736B63' }}>
          <div>Generado por: {reportData.generatedBy}</div>
          <div>Fecha de emisión: {reportData.generatedAt}</div>
        </div>
      </div>

      {/* Tarjetas de Indicadores */}
      {reportData.indicators && reportData.indicators.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {reportData.indicators.map((ind, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: '#FAF8F5',
                borderRadius: '10px',
                padding: '1rem',
                border: '1px solid #EAE6DF',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#736B63', marginBottom: '0.25rem' }}>
                {ind.label}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1C1510' }}>
                {typeof ind.value === 'number'
                  ? ind.value.toLocaleString('es-BO', { minimumFractionDigits: ind.suffix === 'Bs.' ? 2 : 0 })
                  : ind.value}{' '}
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#8C5E35' }}>{ind.suffix}</span>
              </div>
              {ind.description && (
                <div style={{ fontSize: '0.72rem', color: '#736B63', marginTop: '0.25rem' }}>{ind.description}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Barra de Búsqueda y Paginación Superior */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search
            size={16}
            color="#736B63"
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Buscar en el reporte..."
            value={tableSearch}
            onChange={(e) => {
              setTableSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem 0.45rem 2.2rem',
              borderRadius: '8px',
              border: '1px solid #D1C9BE',
              fontSize: '0.85rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#736B63' }}>
          <span>Mostrar:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{
              padding: '0.3rem 0.5rem',
              borderRadius: '6px',
              border: '1px solid #D1C9BE',
              fontSize: '0.82rem',
            }}
          >
            <option value={10}>10 filas</option>
            <option value={25}>25 filas</option>
            <option value={50}>50 filas</option>
            <option value={100}>100 filas</option>
          </select>
          <span>de {filteredRows.length} registros</span>
        </div>
      </div>

      {/* Tabla de Datos */}
      <div style={{ overflowX: 'auto', border: '1px solid #EAE6DF', borderRadius: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#FFFFFF' }}>
          <thead style={{ backgroundColor: '#FAF8F5' }}>
            <tr>
              {reportData.columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    ...thStyle,
                    textAlign: col.type === 'currency' || col.type === 'number' ? 'right' : 'left',
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={reportData.columns.length}
                  style={{ padding: '3rem', textAlign: 'center', color: '#8C5E35', fontSize: '0.9rem' }}
                >
                  <FileText size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
                  <div>No se encontraron registros que coincidan con los filtros aplicados.</div>
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, rIdx) => (
                <tr key={rIdx} style={{ backgroundColor: rIdx % 2 === 0 ? '#FFFFFF' : '#FCFBF9' }}>
                  {reportData.columns.map((col) => {
                    const rawVal = row[col.key];
                    let formattedVal = rawVal;
                    if (col.type === 'currency' && typeof rawVal === 'number') {
                      formattedVal = `Bs. ${rawVal.toFixed(2)}`;
                    } else if (col.type === 'date' && rawVal) {
                      formattedVal = new Date(rawVal).toLocaleDateString('es-BO');
                    }
                    return (
                      <td
                        key={col.key}
                        style={{
                          ...tdStyle,
                          textAlign: col.type === 'currency' || col.type === 'number' ? 'right' : 'left',
                          fontWeight: col.key.includes('total') || col.key.includes('monto') ? 600 : 'normal',
                        }}
                      >
                        {formattedVal !== null && formattedVal !== undefined ? String(formattedVal) : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación Inferior */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1.25rem',
          fontSize: '0.85rem',
          color: '#736B63',
        }}
      >
        <div>
          Página {currentPage} de {totalPages}
        </div>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              border: '1px solid #D1C9BE',
              backgroundColor: '#FFFFFF',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1,
            }}
          >
            <ChevronLeft size={16} />
            Anterior
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              border: '1px solid #D1C9BE',
              backgroundColor: '#FFFFFF',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1,
            }}
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
