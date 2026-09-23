/**
 * @caso-de-uso CU06 — Gestionar empleados
 * @subsistema Usuarios y Seguridad
 * @capa Control (presentación) — Frontend web
 * @responsabilidad Coordina estado, validaciones y acciones de la interfaz antes de delegar la operación al servicio o API.
 * @secuencia Administrador -> formulario de empleados -> controlador de empleados -> servicio de empleados -> Usuario/Empleado/Rol/Sucursal.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  empleadosService,
  type EmployeeItem,
  type BranchItem,
  type EmployeeRoleItem,
  type QueryEmployeesParams,
} from '../services/empleados.service';
import { useConfirm } from '../../../../../shared/components/ConfirmModal';

export function useEmployees() {
  const { confirm } = useConfirm();
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [roles, setRoles] = useState<EmployeeRoleItem[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<number | ''>('');
  const [selectedBranch, setSelectedBranch] = useState<number | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<'activo' | 'inactivo' | ''>('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<EmployeeItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [employeeToView, setEmployeeToView] = useState<EmployeeItem | null>(null);

  // Cargar sucursales y roles una sola vez al inicio
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [branchesData, rolesData] = await Promise.all([
          empleadosService.getBranches(),
          empleadosService.getEmployeeRoles(),
        ]);
        setBranches(branchesData);
        setRoles(rolesData);
      } catch (err) {
        console.error('Error al cargar catálogos de empleados:', err);
      }
    };
    loadCatalogs();
  }, []);

  // Cargar empleados
  const fetchEmployees = useCallback(
    async (pageToLoad = meta.page) => {
      setLoading(true);
      try {
        const params: QueryEmployeesParams = {
          page: pageToLoad,
          limit: meta.limit,
          search: searchTerm.trim() || undefined,
          rol: selectedRole !== '' ? Number(selectedRole) : undefined,
          sucursal: selectedBranch !== '' ? Number(selectedBranch) : undefined,
          estado: selectedStatus !== '' ? selectedStatus : undefined,
        };

        const res = await empleadosService.getEmployees(params);
        setEmployees(res.data);
        setMeta(res.meta);
      } catch (err: any) {
        console.error('Error al consultar empleados:', err);
        setFeedback({
          type: 'error',
          message: 'No se pudo cargar la lista de empleados.',
        });
      } finally {
        setLoading(false);
      }
    },
    [meta.page, meta.limit, searchTerm, selectedRole, selectedBranch, selectedStatus],
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedRole, selectedBranch, selectedStatus]);

  // Cambiar estado rápido
  const handleToggleStatus = async (employee: EmployeeItem) => {
    const newStatus = employee.estado === 'activo' ? 'inactivo' : 'activo';
    const actionText = newStatus === 'activo' ? 'activar' : 'desactivar';

    const ok = await confirm({
      title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Empleado`,
      message: `¿Estás seguro de que deseas ${actionText} la cuenta del empleado "${employee.nombre_completo}"?`,
      confirmText: `Sí, ${actionText}`,
      cancelText: 'Cancelar',
      type: newStatus === 'inactivo' ? 'danger' : 'warning',
    });

    if (!ok) {
      return;
    }

    try {
      await empleadosService.updateEmployeeStatus(employee.id_empleado, newStatus);
      setFeedback({
        type: 'success',
        message: `Estado del empleado "${employee.nombre_completo}" cambiado a ${newStatus}.`,
      });
      setTimeout(() => setFeedback(null), 3000);
      fetchEmployees();
    } catch (err: any) {
      console.error('Error al cambiar estado:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Error al actualizar estado del empleado.',
      });
    }
  };

  const handleOpenCreate = () => {
    setEmployeeToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (emp: EmployeeItem) => {
    setEmployeeToEdit(emp);
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (emp: EmployeeItem) => {
    setEmployeeToView(emp);
    setIsDetailModalOpen(true);
  };

  const handleFormSuccess = () => {
    setFeedback({
      type: 'success',
      message: employeeToEdit
        ? '¡Empleado actualizado correctamente!'
        : '¡Nuevo empleado registrado exitosamente!',
    });
    setTimeout(() => setFeedback(null), 4000);
    fetchEmployees();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedRole('');
    setSelectedBranch('');
    setSelectedStatus('');
  };

  // Resumen métrico
  const metrics = useMemo(() => {
    const total = meta.total;
    const activos = employees.filter((e) => e.estado === 'activo').length;
    const conectados = employees.filter((e) => e.conectado).length;
    const administradores = employees.filter((e) => e.id_rol === 1).length;
    const encargados = employees.filter((e) => e.id_rol === 3).length;
    const cajeros = employees.filter((e) => e.id_rol === 4).length;
    return { total, activos, conectados, administradores, encargados, cajeros };
  }, [meta.total, employees]);

  return {
    employees,
    branches,
    roles,
    meta,
    searchTerm,
    setSearchTerm,
    selectedRole,
    setSelectedRole,
    selectedBranch,
    setSelectedBranch,
    selectedStatus,
    setSelectedStatus,
    loading,
    feedback,
    setFeedback,
    isFormModalOpen,
    setIsFormModalOpen,
    employeeToEdit,
    isDetailModalOpen,
    setIsDetailModalOpen,
    employeeToView,
    metrics,
    fetchEmployees,
    handleToggleStatus,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleFormSuccess,
    handleClearFilters,
  };
}
