/**
 * @caso-de-uso CU07 — Consultar bitácora
 * @subsistema Usuarios y Seguridad
 * @capa Boundary — Frontend web
 * @responsabilidad Representa la pantalla principal de Frontend web; compone la interfaz e inicia las acciones del caso de uso.
 * @secuencia Administrador -> vista de bitácora -> controlador de auditoría -> servicio de bitácora -> Bitácora/Usuario.
 */
import React from 'react';
import { useBitacora } from '../hooks/useBitacora';
import { BitacoraStats } from '../components/BitacoraStats';
import { BitacoraTable } from '../components/BitacoraTable';
import { BitacoraPagination } from '../components/BitacoraPagination';
import { Search, RefreshCw } from 'lucide-react';
import './BitacoraPage.css';

export const BitacoraPage: React.FC = () => {
  const {
    logs,
    meta,
    loading,
    searchTerm,
    setSearchTerm,
    fetchLogs,
    handlePrevPage,
    handleNextPage,
  } = useBitacora();

  return (
    <div className="bitacora-page">
      <div className="bitacora-header">
        <div className="bitacora-header-title">
          <h1>Bitácora de Auditoría y Seguridad</h1>
          <p>Supervisa de manera centralizada todos los accesos, cambios de datos y eventos del sistema.</p>
        </div>
        <button 
          className="btn-refresh" 
          onClick={fetchLogs} 
          disabled={loading}
          title="Recargar eventos"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      <BitacoraStats
        total={meta.total}
        count={logs.length}
        page={meta.page}
        totalPages={meta.totalPages}
      />

      <div className="bitacora-toolbar">
        <div className="bitacora-search-box">
          <Search size={18} className="bitacora-search-icon" />
          <input
            type="text"
            className="bitacora-search-input"
            placeholder="Buscar por acción, usuario, entidad o IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <BitacoraTable logs={logs} loading={loading} />

      <BitacoraPagination
        currentCount={logs.length}
        total={meta.total}
        page={meta.page}
        totalPages={meta.totalPages}
        loading={loading}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
      />
    </div>
  );
};

export default BitacoraPage;
