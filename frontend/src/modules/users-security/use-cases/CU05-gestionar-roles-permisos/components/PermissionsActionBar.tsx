/**
 * @caso-de-uso CU05 — Gestionar roles y permisos
 * @subsistema Usuarios y Seguridad
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Administrador -> vista de roles -> controlador de autorización -> servicio de roles -> Rol/Función/Acción/Permisos.
 */
import React from 'react';
import { CheckCircle2, AlertCircle, RotateCcw, Save, RefreshCw } from 'lucide-react';

interface PermissionsActionBarProps {
  hasChanges: boolean;
  saving: boolean;
  onReset: () => void;
  onSave: () => void;
}

export const PermissionsActionBar: React.FC<PermissionsActionBarProps> = ({
  hasChanges,
  saving,
  onReset,
  onSave,
}) => {
  return (
    <div className={`roles-action-bar ${hasChanges ? 'has-changes' : ''}`}>
      <div className="action-bar-status">
        {hasChanges ? (
          <span className="unsaved-warning">
            <AlertCircle size={16} />
            Hay modificaciones pendientes de guardar en este rol.
          </span>
        ) : (
          <span className="saved-status">
            <CheckCircle2 size={16} />
            Todos los permisos están sincronizados.
          </span>
        )}
      </div>

      <div className="action-bar-buttons">
        <button
          type="button"
          className="btn-roles-secondary"
          onClick={onReset}
          disabled={!hasChanges || saving}
        >
          <RotateCcw size={16} />
          <span>Deshacer</span>
        </button>

        <button
          type="button"
          className="btn-roles-primary"
          onClick={onSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <>
              <RefreshCw size={16} className="spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Guardar Cambios</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
