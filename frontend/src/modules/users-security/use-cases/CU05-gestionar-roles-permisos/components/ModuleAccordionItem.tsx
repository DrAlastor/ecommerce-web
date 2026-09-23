/**
 * @caso-de-uso CU05 — Gestionar roles y permisos
 * @subsistema Usuarios y Seguridad
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Administrador -> vista de roles -> controlador de autorización -> servicio de roles -> Rol/Función/Acción/Permisos.
 */
import React from 'react';
import type { ModuleTreeItem } from '../services/roles.service';
import type { LocalPermission } from '../hooks/useRolePermissions';
import { Layers, ChevronDown, ChevronRight, Lock, Eye, Edit3 } from 'lucide-react';

interface ModuleAccordionItemProps {
  modulo: ModuleTreeItem;
  isCollapsed: boolean;
  isSuperAdmin: boolean;
  permissionsState: Map<number, LocalPermission>;
  onToggleCollapse: (id_modulo: number) => void;
  onBatchModule: (
    moduleFunctions: { id_funcion: number }[],
    action: 'lectura' | 'edicion' | 'desmarcar',
  ) => void;
  onToggleFunction: (id_funcion: number) => void;
  onSetAccessLevel: (id_funcion: number, level: 'Lectura' | 'Edicion') => void;
}

export const ModuleAccordionItem: React.FC<ModuleAccordionItemProps> = ({
  modulo,
  isCollapsed,
  isSuperAdmin,
  permissionsState,
  onToggleCollapse,
  onBatchModule,
  onToggleFunction,
  onSetAccessLevel,
}) => {
  const moduleFunctions = modulo.funciones;
  const enabledCountInModule = moduleFunctions.filter((f) =>
    permissionsState.get(f.id_funcion)?.enabled,
  ).length;

  return (
    <div className={`module-accordion-card ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Cabecera del Módulo */}
      <div
        className="module-accordion-header"
        onClick={() => onToggleCollapse(modulo.id_modulo)}
      >
        <div className="module-title-wrap">
          <div className="module-icon-box">
            <Layers size={18} />
          </div>
          <div>
            <div className="module-title-line">
              <h3>{modulo.nombre}</h3>
              <span className="module-functions-counter">
                {enabledCountInModule} de {moduleFunctions.length} asignadas
              </span>
            </div>
            <p className="module-desc-text">
              {modulo.descripcion || 'Operaciones asociadas a este módulo'}
            </p>
          </div>
        </div>

        {/* Botones de acción rápida por módulo */}
        <div
          className="module-quick-actions"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="btn-quick-action"
            onClick={() => onBatchModule(moduleFunctions, 'lectura')}
            title="Habilitar todas en nivel Lectura"
          >
            Todas Lectura
          </button>
          <button
            type="button"
            className="btn-quick-action"
            onClick={() => onBatchModule(moduleFunctions, 'edicion')}
            title="Habilitar todas en nivel Edición"
          >
            Todas Edición
          </button>
          <button
            type="button"
            className="btn-quick-action desmarcar"
            onClick={() => onBatchModule(moduleFunctions, 'desmarcar')}
            title="Desmarcar todas las funciones de este módulo"
          >
            Desmarcar
          </button>
          <button
            type="button"
            className="btn-collapse-toggle"
            aria-label="Colapsar o expandir"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Cuerpo: Lista de Funciones */}
      {!isCollapsed && (
        <div className="module-functions-body">
          <table className="functions-table">
            <thead>
              <tr>
                <th style={{ width: '45%' }}>Función / Caso de Uso</th>
                <th style={{ width: '20%', textAlign: 'center' }}>Asignación</th>
                <th style={{ width: '35%', textAlign: 'right' }}>Nivel de Acceso</th>
              </tr>
            </thead>
            <tbody>
              {moduleFunctions.map((fn) => {
                const perm = permissionsState.get(fn.id_funcion);
                const isEnabled = perm?.enabled ?? false;
                const accessLevel = perm?.nivel_acceso ?? 'Lectura';
                const isCriticalAdminFunc = isSuperAdmin && fn.id_funcion === 2;

                return (
                  <tr
                    key={fn.id_funcion}
                    className={`function-row ${isEnabled ? 'row-enabled' : 'row-disabled'}`}
                  >
                    <td>
                      <div className="function-name-cell">
                        <span className="function-name-text">
                          {fn.nombre}
                          {isCriticalAdminFunc && (
                            <span className="lock-pill" title="Permiso obligatorio inmutable">
                              <Lock size={12} /> Obligatorio
                            </span>
                          )}
                        </span>
                        <span className="function-desc-text">
                          {fn.descripcion || 'Sin descripción detallada'}
                        </span>
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <label className="toggle-switch-label">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          disabled={isCriticalAdminFunc}
                          onChange={() => onToggleFunction(fn.id_funcion)}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </td>

                    <td>
                      <div className="level-pills-selector">
                        <button
                          type="button"
                          className={`level-pill lectura ${
                            isEnabled && accessLevel === 'Lectura' ? 'active' : ''
                          }`}
                          disabled={!isEnabled || isCriticalAdminFunc}
                          onClick={() => onSetAccessLevel(fn.id_funcion, 'Lectura')}
                        >
                          <Eye size={13} />
                          <span>Lectura</span>
                        </button>
                        <button
                          type="button"
                          className={`level-pill edicion ${
                            isEnabled && accessLevel === 'Edicion' ? 'active' : ''
                          }`}
                          disabled={!isEnabled}
                          onClick={() => onSetAccessLevel(fn.id_funcion, 'Edicion')}
                        >
                          <Edit3 size={13} />
                          <span>Edición</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
