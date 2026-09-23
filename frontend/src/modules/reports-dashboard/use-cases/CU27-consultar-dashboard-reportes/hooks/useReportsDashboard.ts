/**
 * @caso-de-uso CU27 — Consultar dashboard y reportes
 * @subsistema Reportes y Dashboard
 * @capa Control (presentación) — Frontend web
 * @responsabilidad Coordina estado, validaciones y acciones de la interfaz antes de delegar la operación al servicio o API.
 * @secuencia Administrador o Encargado -> dashboard -> controlador de reportes -> servicio de agregación/exportación -> Ventas/Pagos/Inventario/Reservas/Compras.
 */
import { useState, useEffect, useCallback } from 'react';
import { reportsService } from '../services/reports.service';
import type {
  TabType,
  DashboardMetrics,
  ReportFilters,
  ReportData,
} from '../types/reports.types';

export const useReportsDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Estado del Dashboard
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(false);
  const [dashBranch, setDashBranch] = useState<string>('');
  const [dashDatePreset, setDashDatePreset] = useState<string>('30d');
  const [dashFechaInicio] = useState<string>('');
  const [dashFechaFin] = useState<string>('');

  // Estado de Sucursales y Categorías
  const [branches, setBranches] = useState<{ id_sucursal: number; nombre: string }[]>([]);
  const [categories, setCategories] = useState<{ id_categoria: number; nombre: string }[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Estado del Generador de Reportes
  const [reportCategory, setReportCategory] = useState<string>('comercial');
  const [selectedReportId, setSelectedReportId] = useState<string>('ventas');
  const [reportDatePreset, setReportDatePreset] = useState<string>('30d');
  const [reportFilters, setReportFilters] = useState<ReportFilters>({
    tipo_reporte: 'ventas',
    fecha_inicio: '',
    fecha_fin: '',
    id_sucursal: '',
    categoria_id: '',
    tipo_venta: '',
    estado: '',
  });

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cargar metadatos iniciales (sucursales y categorías)
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [branchRes, catRes] = await Promise.all([
          reportsService.getAuthorizedBranches(),
          reportsService.getCategories(),
        ]);
        setBranches(branchRes.branches);
        setIsAdmin(branchRes.isAdmin);
        setCategories(catRes);

        // Si es encargado y tiene una sola sucursal, seleccionarla por defecto
        if (!branchRes.isAdmin && branchRes.branches.length > 0) {
          const defaultBranchId = String(branchRes.branches[0].id_sucursal);
          setDashBranch(defaultBranchId);
          setReportFilters((prev: ReportFilters) => ({ ...prev, id_sucursal: defaultBranchId }));
        }
      } catch (err: any) {
        console.error('Error al cargar metadatos de reportes:', err);
      }
    };
    loadMetadata();
  }, []);

  // Función para calcular rango según presets
  const calculatePresetRange = useCallback((preset: string) => {
    const today = new Date();
    const endStr = today.toISOString().split('T')[0];
    let startStr = '';

    if (preset === 'today') {
      startStr = endStr;
    } else if (preset === '7d') {
      const d = new Date();
      d.setDate(today.getDate() - 7);
      startStr = d.toISOString().split('T')[0];
    } else if (preset === '30d') {
      const d = new Date();
      d.setDate(today.getDate() - 30);
      startStr = d.toISOString().split('T')[0];
    } else if (preset === 'this_month') {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      startStr = d.toISOString().split('T')[0];
    } else if (preset === 'this_year') {
      const d = new Date(today.getFullYear(), 0, 1);
      startStr = d.toISOString().split('T')[0];
    } else if (preset === 'all') {
      startStr = '';
    }

    return { startStr, endStr: preset === 'all' ? '' : endStr };
  }, []);

  // Cargar Dashboard
  const loadDashboard = useCallback(async (forceRefresh = false) => {
    let fi = dashFechaInicio;
    let ff = dashFechaFin;
    if (dashDatePreset !== 'custom') {
      const { startStr, endStr } = calculatePresetRange(dashDatePreset);
      fi = startStr;
      ff = endStr;
    }

    const params = {
      fecha_inicio: fi || undefined,
      fecha_fin: ff || undefined,
      id_sucursal: dashBranch ? Number(dashBranch) : undefined,
    };

    // Actualización instantánea síncrona si ya está en caché
    const cached = reportsService.getCachedDashboard(params);
    if (cached && !forceRefresh) {
      setDashboardData(cached);
      return;
    }

    setLoadingDashboard(true);
    try {
      const data = await reportsService.getDashboard(params, forceRefresh);
      setDashboardData(data);
    } catch (err: any) {
      console.error('Error al cargar dashboard:', err);
      setFeedbackMsg({
        type: 'error',
        text: 'Error al cargar métricas del dashboard.',
      });
    } finally {
      setLoadingDashboard(false);
    }
  }, [dashBranch, dashDatePreset, dashFechaInicio, dashFechaFin, calculatePresetRange]);

  // Cambio de preset ultra-rápido: aplica caché síncrono al instante y sincroniza
  const handlePresetChange = (presetId: string) => {
    setDashDatePreset(presetId);
    const { startStr, endStr } = calculatePresetRange(presetId);
    const instantData = reportsService.getCachedDashboard({
      fecha_inicio: startStr || undefined,
      fecha_fin: endStr || undefined,
      id_sucursal: dashBranch ? Number(dashBranch) : undefined,
    });
    if (instantData) {
      setDashboardData(instantData);
    }
  };

  // Cambio de sucursal ultra-rápido: aplica caché síncrono al instante y sincroniza
  const handleBranchChange = (branchId: string) => {
    setDashBranch(branchId);
    let fi = dashFechaInicio;
    let ff = dashFechaFin;
    if (dashDatePreset !== 'custom') {
      const { startStr, endStr } = calculatePresetRange(dashDatePreset);
      fi = startStr;
      ff = endStr;
    }
    const instantData = reportsService.getCachedDashboard({
      fecha_inicio: fi || undefined,
      fecha_fin: ff || undefined,
      id_sucursal: branchId ? Number(branchId) : undefined,
    });
    if (instantData) {
      setDashboardData(instantData);
    }
  };

  // Precarga inteligente en segundo plano de períodos comunes para que cualquier clic sea instantáneo
  useEffect(() => {
    if (activeTab === 'dashboard' && dashboardData) {
      const presetsToPrefetch = ['today', '7d', 'this_month', 'this_year', 'all'];
      const timer = setTimeout(() => {
        presetsToPrefetch.forEach(async (p) => {
          if (p !== dashDatePreset) {
            const { startStr, endStr } = calculatePresetRange(p);
            try {
              await reportsService.getDashboard({
                fecha_inicio: startStr || undefined,
                fecha_fin: endStr || undefined,
                id_sucursal: dashBranch ? Number(dashBranch) : undefined,
              });
            } catch {
              // Silencioso
            }
          }
        });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [activeTab, dashBranch, !!dashboardData, dashDatePreset, calculatePresetRange]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboard();
    }
  }, [activeTab, dashBranch, dashDatePreset, loadDashboard]);

  // Manejar cambio de tipo de reporte
  const handleSelectReport = (reportId: string) => {
    setSelectedReportId(reportId);
    setReportFilters((prev: ReportFilters) => ({
      ...prev,
      tipo_reporte: reportId,
    }));
    setReportData(null);
    setCurrentPage(1);
    setTableSearch('');
  };

  // Generar Reporte
  const handleGenerateReport = async () => {
    setLoadingReport(true);
    setFeedbackMsg(null);
    try {
      let fi = reportFilters.fecha_inicio;
      let ff = reportFilters.fecha_fin;

      if (reportDatePreset !== 'custom') {
        const { startStr, endStr } = calculatePresetRange(reportDatePreset);
        fi = startStr;
        ff = endStr;
      }

      const activeFilters: ReportFilters = {
        ...reportFilters,
        tipo_reporte: selectedReportId,
        fecha_inicio: fi || undefined,
        fecha_fin: ff || undefined,
        id_sucursal: reportFilters.id_sucursal || undefined,
        categoria_id: reportFilters.categoria_id || undefined,
        tipo_venta: reportFilters.tipo_venta || undefined,
      };

      const data = await reportsService.generateReport(activeFilters);
      setReportData(data);
      setCurrentPage(1);
    } catch (err: any) {
      console.error('Error al generar reporte:', err);
      setFeedbackMsg({
        type: 'error',
        text: 'Ocurrió un error al generar la vista previa del reporte.',
      });
    } finally {
      setLoadingReport(false);
    }
  };

  // Exportar Reporte en CSV, Excel o PDF
  const handleExport = async (formato: 'csv' | 'excel' | 'pdf') => {
    setExportingFormat(formato);
    try {
      let fi = reportFilters.fecha_inicio;
      let ff = reportFilters.fecha_fin;

      if (reportDatePreset !== 'custom') {
        const { startStr, endStr } = calculatePresetRange(reportDatePreset);
        fi = startStr;
        ff = endStr;
      }

      const activeFilters: ReportFilters = {
        ...reportFilters,
        tipo_reporte: selectedReportId,
        fecha_inicio: fi || undefined,
        fecha_fin: ff || undefined,
        id_sucursal: reportFilters.id_sucursal || undefined,
        categoria_id: reportFilters.categoria_id || undefined,
        tipo_venta: reportFilters.tipo_venta || undefined,
      };

      await reportsService.exportReport(activeFilters, formato);
      setFeedbackMsg({
        type: 'success',
        text: `Reporte exportado exitosamente en formato ${formato.toUpperCase()}.`,
      });
    } catch (err: any) {
      console.error('Error al exportar reporte:', err);
      setFeedbackMsg({
        type: 'error',
        text: `Error al exportar el reporte en formato ${formato.toUpperCase()}.`,
      });
    } finally {
      setExportingFormat(null);
    }
  };

  return {
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
  };
};
