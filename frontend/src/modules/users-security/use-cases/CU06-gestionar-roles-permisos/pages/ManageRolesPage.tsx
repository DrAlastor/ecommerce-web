import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  rolesService,
  type RoleItem,
  type ModuleTreeItem,
  type RoleDetail,
} from '../services/roles.service';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Layers,
  ChevronDown,
  ChevronRight,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  Edit3,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import './ManageRolesPage.css';

interface LocalPermission {
  id_funcion: number;
  enabled: boolean;
  nivel_acceso: 'Lectura' | 'Edicion';
}

export const ManageRolesPage: React.FC = () => {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [modulesTree, setModulesTree] = useState<ModuleTreeItem[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [roleDetail, setRoleDetail] = useState<RoleDetail | null>(null);

  // Local state for editing permissions: map id_funcion -> { enabled, nivel_acceso }
  const [permissionsState, setPermissionsState] = useState<Map<number, LocalPermission>>(new Map());
  const [initialPermissionsState, setInitialPermissionsState] = useState<Map<number, LocalPermission>>(new Map());

  // UI state
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [collapsedModules, setCollapsedModules] = useState<Record<number, boolean>>({});

  // Carga inicial de roles y del árbol de módulos
  const loadInitialData = useCallback(async () => {
    setLoadingRoles(true);
    try {
      const [rolesData, treeData] = await Promise.all([
        rolesService.getRoles(),
        rolesService.getModulesTree(),
      ]);
      setRoles(rolesData);
      setModulesTree(treeData);

      // Por defecto seleccionar el primer rol si no hay uno seleccionado
      if (rolesData.length > 0 && selectedRoleId === null) {
        setSelectedRoleId(rolesData[0].id_rol);
      }
    } catch (err: any) {
      console.error('Error al cargar datos iniciales de roles:', err);
      setFeedback({
        type: 'error',
        message: 'No se pudieron cargar los roles y módulos del sistema.',
      });
    } finally {
      setLoadingRoles(false);
    }
  }, [selectedRoleId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Cargar detalle del rol seleccionado
  const loadRoleDetail = useCallback(async (roleId: number) => {
    setLoadingDetail(true);
    setFeedback(null);
    try {
      const detail = await rolesService.getRoleById(roleId);
      setRoleDetail(detail);

      // Construir mapa de permisos
      const stateMap = new Map<number, LocalPermission>();
      detail.funciones.forEach((f) => {
        const normNivel =
          (f.nivel_acceso || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'edicion'
            ? 'Edicion'
            : 'Lectura';

        stateMap.set(f.id_funcion, {
          id_funcion: f.id_funcion,
          enabled: true,
          nivel_acceso: normNivel,
        });
      });

      setPermissionsState(new Map(stateMap));
      setInitialPermissionsState(new Map(stateMap));
    } catch (err: any) {
      console.error('Error al cargar detalle del rol:', err);
      setFeedback({
        type: 'error',
        message: 'No se pudo obtener la configuración de permisos del rol.',
      });
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRoleId !== null) {
      loadRoleDetail(selectedRoleId);
    }
  }, [selectedRoleId, loadRoleDetail]);

  // Verificar si hay cambios sin guardar
  const hasChanges = useMemo(() => {
    if (permissionsState.size !== initialPermissionsState.size) return true;
    for (const [id, current] of permissionsState.entries()) {
      const initial = initialPermissionsState.get(id);
      if (!initial) return true;
      if (current.enabled !== initial.enabled || current.nivel_acceso !== initial.nivel_acceso) {
        return true;
      }
    }
    for (const [id] of initialPermissionsState.entries()) {
      if (!permissionsState.has(id)) return true;
    }
    return false;
  }, [permissionsState, initialPermissionsState]);

  // Manejar cambio de selección de rol
  const handleSelectRole = (roleId: number) => {
    if (hasChanges) {
      const confirmLeave = window.confirm(
        'Tienes cambios sin guardar en este rol. ¿Deseas descartarlos y cambiar de rol?',
      );
      if (!confirmLeave) return;
    }
    setSelectedRoleId(roleId);
  };

  // Toggle de habilitación de una función
  const toggleFunctionEnabled = (functionId: number) => {
    // Si es Administrador y es Gestionar roles (id 2), proteger
    if (selectedRoleId === 1 && functionId === 2) {
      alert('La función "Gestionar roles" es obligatoria e inmutable para el rol Administrador.');
      return;
    }

    setPermissionsState((prev) => {
      const next = new Map(prev);
      const current = next.get(functionId);
      if (current && current.enabled) {
        // Deshabilitar (eliminar de la lista de asignadas)
        next.delete(functionId);
      } else {
        // Habilitar con nivel por defecto Lectura
        next.set(functionId, {
          id_funcion: functionId,
          enabled: true,
          nivel_acceso: 'Lectura',
        });
      }
      return next;
    });
  };

  // Cambiar nivel de acceso (Lectura / Edición)
  const setAccessLevel = (functionId: number, level: 'Lectura' | 'Edicion') => {
    // Si es Administrador y es Gestionar roles, no permitir degradar a Lectura
    if (selectedRoleId === 1 && functionId === 2 && level === 'Lectura') {
      alert('El Administrador debe conservar el nivel de Edición en "Gestionar roles".');
      return;
    }

    setPermissionsState((prev) => {
      const next = new Map(prev);
      const current = next.get(functionId);
      if (current) {
        next.set(functionId, {
          ...current,
          nivel_acceso: level,
        });
      } else {
        // Si no estaba habilitada, la habilitamos con el nivel seleccionado
        next.set(functionId, {
          id_funcion: functionId,
          enabled: true,
          nivel_acceso: level,
        });
      }
      return next;
    });
  };

  // Acciones en lote por módulo
  const handleBatchModule = (
    moduleFunctions: { id_funcion: number }[],
    action: 'lectura' | 'edicion' | 'desmarcar',
  ) => {
    setPermissionsState((prev) => {
      const next = new Map(prev);
      moduleFunctions.forEach((f) => {
        // Proteger Gestionar roles en Administrador
        if (selectedRoleId === 1 && f.id_funcion === 2) {
          next.set(f.id_funcion, {
            id_funcion: f.id_funcion,
            enabled: true,
            nivel_acceso: 'Edicion',
          });
          return;
        }

        if (action === 'desmarcar') {
          next.delete(f.id_funcion);
        } else {
          next.set(f.id_funcion, {
            id_funcion: f.id_funcion,
            enabled: true,
            nivel_acceso: action === 'edicion' ? 'Edicion' : 'Lectura',
          });
        }
      });
      return next;
    });
  };

  // Deshacer cambios
  const handleReset = () => {
    setPermissionsState(new Map(initialPermissionsState));
    setFeedback({
      type: 'success',
      message: 'Cambios restablecidos al estado guardado.',
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Guardar cambios
  const handleSave = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    setFeedback(null);

    const payload = Array.from(permissionsState.values())
      .filter((p) => p.enabled)
      .map((p) => ({
        id_funcion: p.id_funcion,
        nivel_acceso: p.nivel_acceso,
      }));

    try {
      const updated = await rolesService.updateRolePermissions(selectedRoleId, payload);
      setRoleDetail(updated);

      // Actualizar roles en la lista lateral
      setRoles((prev) =>
        prev.map((r) =>
          r.id_rol === selectedRoleId
            ? { ...r, total_funciones: updated.total_funciones }
            : r,
        ),
      );

      // Sincronizar estado local
      const stateMap = new Map<number, LocalPermission>();
      updated.funciones.forEach((f) => {
        const normNivel =
          (f.nivel_acceso || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'edicion'
            ? 'Edicion'
            : 'Lectura';
        stateMap.set(f.id_funcion, {
          id_funcion: f.id_funcion,
          enabled: true,
          nivel_acceso: normNivel,
        });
      });
      setPermissionsState(new Map(stateMap));
      setInitialPermissionsState(new Map(stateMap));

      setFeedback({
        type: 'success',
        message: `¡Permisos del rol "${updated.nombre}" actualizados correctamente y auditados en bitácora!`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.error('Error al guardar permisos:', err);
      const errMsg =
        err.response?.data?.message || 'Error al guardar la configuración de permisos.';
      setFeedback({
        type: 'error',
        message: Array.isArray(errMsg) ? errMsg.join(', ') : errMsg,
      });
    } finally {
      setSaving(false);
    }
  };

  // Toggle colapsar módulo
  const toggleCollapseModule = (moduleId: number) => {
    setCollapsedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  // Métricas calculadas en tiempo real
  const currentMetrics = useMemo(() => {
    const totalEnabled = Array.from(permissionsState.values()).filter((p) => p.enabled).length;
    const lecturaCount = Array.from(permissionsState.values()).filter(
      (p) => p.enabled && p.nivel_acceso === 'Lectura',
    ).length;
    const edicionCount = Array.from(permissionsState.values()).filter(
      (p) => p.enabled && p.nivel_acceso === 'Edicion',
    ).length;

    const totalSystemFunctions = modulesTree.reduce((acc, m) => acc + m.funciones.length, 0);

    return {
      totalEnabled,
      lecturaCount,
      edicionCount,
      totalSystemFunctions,
    };
  }, [permissionsState, modulesTree]);

  const isSuperAdmin = selectedRoleId === 1;

  return (
    <div className="roles-page">
      {/* Encabezado principal */}
      <div className="roles-header">
        <div className="roles-header-title">
          <div className="roles-badge-header">
            <Shield size={16} />
            <span>Seguridad & Control de Acceso</span>
          </div>
          <h1>Gestión de Roles y Permisos</h1>
          <p>
            Administra los roles del sistema y determina con precisión las funciones y niveles de
            acceso (Lectura / Edición) correspondientes a cada perfil.
          </p>
        </div>
        <button
          className="btn-refresh"
          onClick={() => {
            loadInitialData();
            if (selectedRoleId) loadRoleDetail(selectedRoleId);
          }}
          disabled={loadingRoles || loadingDetail}
          title="Actualizar datos"
        >
          <RefreshCw size={16} className={loadingRoles || loadingDetail ? 'spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Alertas y notificaciones */}
      {feedback && (
        <div className={`roles-feedback-alert ${feedback.type}`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Disposición en 2 columnas */}
      <div className="roles-layout-grid">
        {/* COLUMNA IZQUIERDA: Lista de Roles */}
        <aside className="roles-sidebar-panel">
          <div className="roles-sidebar-header">
            <h3>Roles del Sistema</h3>
            <span className="roles-count-tag">{roles.length} roles</span>
          </div>

          <div className="roles-list-cards">
            {loadingRoles ? (
              <div className="roles-loading-skeleton">
                <div className="skeleton-card" />
                <div className="skeleton-card" />
                <div className="skeleton-card" />
              </div>
            ) : (
              roles.map((r) => {
                const isSelected = r.id_rol === selectedRoleId;
                return (
                  <div
                    key={r.id_rol}
                    className={`role-item-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectRole(r.id_rol)}
                  >
                    <div className="role-card-top">
                      <div className="role-card-icon">
                        {r.id_rol === 1 ? (
                          <ShieldCheck size={20} />
                        ) : r.nombre.toLowerCase().includes('cliente') ? (
                          <Users size={20} />
                        ) : (
                          <Shield size={20} />
                        )}
                      </div>
                      <span className="role-card-id">Rol #{r.id_rol}</span>
                    </div>

                    <h4 className="role-card-name">{r.nombre}</h4>
                    <p className="role-card-desc">
                      {r.permiso || 'Permisos configurados por función y módulo'}
                    </p>

                    <div className="role-card-footer">
                      <span className="role-metric-item">
                        <Users size={14} />
                        {r.total_usuarios} {r.total_usuarios === 1 ? 'usuario' : 'usuarios'}
                      </span>
                      <span className="role-metric-item">
                        <Sliders size={14} />
                        {r.total_funciones} funciones
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* COLUMNA DERECHA: Matriz de Permisos */}
        <main className="roles-content-panel">
          {loadingDetail || !roleDetail ? (
            <div className="roles-detail-loading">
              <RefreshCw size={32} className="spin" />
              <p>Cargando configuración de permisos del rol...</p>
            </div>
          ) : (
            <>
              {/* Tarjeta de Resumen del Rol Seleccionado */}
              <div className="role-overview-card">
                <div className="role-overview-header">
                  <div>
                    <div className="role-badge-chip">
                      <Shield size={14} />
                      <span>Configurando permisos</span>
                    </div>
                    <h2>{roleDetail.nombre}</h2>
                  </div>
                  {isSuperAdmin && (
                    <div className="admin-protected-badge">
                      <Lock size={15} />
                      <span>Rol del Sistema Protegido</span>
                    </div>
                  )}
                </div>

                {/* Banner de protección del administrador */}
                {isSuperAdmin && (
                  <div className="admin-security-callout">
                    <ShieldAlert size={18} />
                    <div>
                      <strong>Aviso de Seguridad de Acceso:</strong> El rol de Administrador
                      conserva privilegios de administración críticos obligatorios. La función
                      "Gestionar roles" no puede ser deshabilitada ni degradada para prevenir bloqueos.
                    </div>
                  </div>
                )}

                {/* Tarjetas de Métricas de Permisos */}
                <div className="role-metrics-row">
                  <div className="metric-box total">
                    <span className="metric-label">Funciones Activas</span>
                    <span className="metric-number">
                      {currentMetrics.totalEnabled}{' '}
                      <small>/ {currentMetrics.totalSystemFunctions}</small>
                    </span>
                  </div>
                  <div className="metric-box edit">
                    <span className="metric-label">
                      <Edit3 size={14} /> Nivel Edición
                    </span>
                    <span className="metric-number">{currentMetrics.edicionCount}</span>
                  </div>
                  <div className="metric-box read">
                    <span className="metric-label">
                      <Eye size={14} /> Nivel Lectura
                    </span>
                    <span className="metric-number">{currentMetrics.lecturaCount}</span>
                  </div>
                </div>
              </div>

              {/* Módulos y Funciones */}
              <div className="modules-permissions-container">
                {modulesTree.map((modulo) => {
                  const isCollapsed = collapsedModules[modulo.id_modulo] ?? false;
                  const moduleFunctions = modulo.funciones;

                  // Contar funciones habilitadas en este módulo
                  const enabledCountInModule = moduleFunctions.filter((f) =>
                    permissionsState.get(f.id_funcion)?.enabled,
                  ).length;

                  return (
                    <div
                      key={modulo.id_modulo}
                      className={`module-accordion-card ${isCollapsed ? 'collapsed' : ''}`}
                    >
                      {/* Cabecera del Módulo */}
                      <div
                        className="module-accordion-header"
                        onClick={() => toggleCollapseModule(modulo.id_modulo)}
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
                            onClick={() => handleBatchModule(moduleFunctions, 'lectura')}
                            title="Habilitar todas en nivel Lectura"
                          >
                            Todas Lectura
                          </button>
                          <button
                            type="button"
                            className="btn-quick-action"
                            onClick={() => handleBatchModule(moduleFunctions, 'edicion')}
                            title="Habilitar todas en nivel Edición"
                          >
                            Todas Edición
                          </button>
                          <button
                            type="button"
                            className="btn-quick-action desmarcar"
                            onClick={() => handleBatchModule(moduleFunctions, 'desmarcar')}
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
                                          onChange={() => toggleFunctionEnabled(fn.id_funcion)}
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
                                          onClick={() => setAccessLevel(fn.id_funcion, 'Lectura')}
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
                                          onClick={() => setAccessLevel(fn.id_funcion, 'Edicion')}
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
                })}
              </div>

              {/* Barra de Guardado Flotante / Sticky */}
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
                    onClick={handleReset}
                    disabled={!hasChanges || saving}
                  >
                    <RotateCcw size={16} />
                    <span>Deshacer</span>
                  </button>

                  <button
                    type="button"
                    className="btn-roles-primary"
                    onClick={handleSave}
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
            </>
          )}
        </main>
      </div>
    </div>
  );
};
export default ManageRolesPage;
