/**
 * @caso-de-uso CU05 — Gestionar roles y permisos
 * @subsistema Usuarios y Seguridad
 * @capa Control (presentación) — Frontend web
 * @responsabilidad Coordina estado, validaciones y acciones de la interfaz antes de delegar la operación al servicio o API.
 * @secuencia Administrador -> vista de roles -> controlador de autorización -> servicio de roles -> Rol/Función/Acción/Permisos.
 */
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  rolesService,
  type RoleItem,
  type ModuleTreeItem,
  type RoleDetail,
} from '../services/roles.service';
import { useConfirm } from '../../../../../shared/components/ConfirmModal';

export interface LocalPermission {
  id_funcion: number;
  enabled: boolean;
  nivel_acceso: 'Lectura' | 'Edicion';
}

export function useRolePermissions() {
  const { confirm } = useConfirm();
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
  const handleSelectRole = async (roleId: number) => {
    if (hasChanges) {
      const confirmLeave = await confirm({
        title: 'Descartar Cambios',
        message: 'Tienes cambios sin guardar en los permisos de este rol. ¿Deseas descartarlos y cambiar de rol?',
        confirmText: 'Sí, descartar',
        cancelText: 'Continuar editando',
        type: 'warning',
      });
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
        next.delete(functionId);
      } else {
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

      setRoles((prev) =>
        prev.map((r) =>
          r.id_rol === selectedRoleId
            ? { ...r, total_funciones: updated.total_funciones }
            : r,
        ),
      );

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

  return {
    roles,
    modulesTree,
    selectedRoleId,
    roleDetail,
    permissionsState,
    loadingRoles,
    loadingDetail,
    saving,
    feedback,
    collapsedModules,
    hasChanges,
    currentMetrics,
    isSuperAdmin: selectedRoleId === 1,
    loadInitialData,
    loadRoleDetail,
    handleSelectRole,
    toggleFunctionEnabled,
    setAccessLevel,
    handleBatchModule,
    handleReset,
    handleSave,
    toggleCollapseModule,
  };
}
