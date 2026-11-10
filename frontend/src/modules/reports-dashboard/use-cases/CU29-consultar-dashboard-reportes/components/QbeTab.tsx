import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  Send,
  Play,
  CheckCircle2,
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Plus,
  Trash2,
  AlertCircle,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  Check,
} from 'lucide-react';
import { reportsService } from '../services/reports.service';
import type {
  QbeMetadata,
  QbeEntityMeta,
  QbeFilter,
  QbeAggregation,
  QbeQueryResult,
  QbeQueryPayload,
  InterpretedQbeResponse,
  AiReportAnalysis,
} from '../types/reports.types';

const PALETTE = [
  '#8C5E35',
  '#C4956A',
  '#3D5A80',
  '#293241',
  '#059669',
  '#D97706',
  '#DC2626',
  '#7C3AED',
  '#6B705C',
  '#A98467',
];

interface EntityPreset {
  id: string;
  label: string;
  description: string;
  payload: Partial<QbeQueryPayload>;
}

const ENTITY_PRESETS: Record<string, EntityPreset[]> = {
  venta: [
    {
      id: 'todas',
      label: 'Todas las ventas',
      description: 'Listado cronologico de todas las ventas con totales',
      payload: { orderBy: { field: 'fecha_venta', direction: 'desc' } },
    },
    {
      id: 'ultimos_30',
      label: 'Ultimos 30 dias',
      description: 'Ventas registradas en los ultimos 30 dias',
      payload: {
        filters: [
          {
            field: 'fecha_venta',
            operator: 'gte',
            value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          },
        ],
        orderBy: { field: 'fecha_venta', direction: 'desc' },
      },
    },
    {
      id: 'por_sucursal',
      label: 'Ventas por Sucursal',
      description: 'Total acumulado agrupado por tienda fisica',
      payload: {
        groupBy: ['sucursal'],
        aggregations: [{ field: 'total', func: 'SUM', alias: 'Total Vendido (Bs.)' }],
        chartType: 'bar',
      },
    },
    {
      id: 'ticket_alto',
      label: 'Ticket Alto (> Bs. 500)',
      description: 'Ventas de alto valor unitario',
      payload: {
        filters: [{ field: 'total', operator: 'gte', value: 500 }],
        orderBy: { field: 'total', direction: 'desc' },
      },
    },
    {
      id: 'por_metodo',
      label: 'Por Metodo de Pago',
      description: 'Distribucion de ingresos por metodo de pago',
      payload: {
        groupBy: ['metodo_pago'],
        aggregations: [
          { field: 'total', func: 'SUM', alias: 'Total Recaudado (Bs.)' },
          { field: 'id_venta', func: 'COUNT', alias: 'Transacciones' },
        ],
        chartType: 'pie',
      },
    },
  ],
  producto: [
    {
      id: 'todos',
      label: 'Todas las prendas',
      description: 'Catalogo completo de prendas con precios y categorias',
      payload: {},
    },
    {
      id: 'top_caras',
      label: 'Prendas mas caras',
      description: 'Top de prendas ordenadas de mayor a menor precio',
      payload: {
        orderBy: { field: 'precio_base', direction: 'desc' },
        limit: 20,
      },
    },
    {
      id: 'por_categoria',
      label: 'Prendas por Categoria',
      description: 'Cantidad de prendas registradas por categoria',
      payload: {
        groupBy: ['categoria'],
        aggregations: [{ field: 'id_producto', func: 'COUNT', alias: 'Total Prendas' }],
        chartType: 'bar',
      },
    },
    {
      id: 'activas',
      label: 'Solo Activas',
      description: 'Prendas habilitadas para venta comercial',
      payload: {
        filters: [{ field: 'estado', operator: 'eq', value: 'activo' }],
      },
    },
  ],
  inventario_sucursal: [
    {
      id: 'todos',
      label: 'Todo el inventario',
      description: 'Existencias fisicas en todas las sucursales',
      payload: {},
    },
    {
      id: 'critico',
      label: 'Stock Critico (<= 5 unid.)',
      description: 'Prendas con inventario bajo riesgo de quiebre',
      payload: {
        filters: [{ field: 'stock_disponible', operator: 'lte', value: 5 }],
        orderBy: { field: 'stock_disponible', direction: 'asc' },
      },
    },
    {
      id: 'reorden',
      label: 'Alerta de Reorden (<= 10)',
      description: 'Prendas bajo nivel minimo de seguridad',
      payload: {
        filters: [{ field: 'stock_disponible', operator: 'lte', value: 10 }],
        orderBy: { field: 'stock_disponible', direction: 'asc' },
      },
    },
    {
      id: 'por_sucursal',
      label: 'Stock por Sucursal',
      description: 'Total de unidades disponibles agrupadas por tienda',
      payload: {
        groupBy: ['sucursal'],
        aggregations: [{ field: 'stock_disponible', func: 'SUM', alias: 'Total Unidades en Tienda' }],
        chartType: 'bar',
      },
    },
  ],
  cliente: [
    {
      id: 'todos',
      label: 'Todos los clientes',
      description: 'Directorio completo de clientes registrados',
      payload: {},
    },
    {
      id: 'fidelidad_vip',
      label: 'Clientes VIP (+150 pts)',
      description: 'Clientes con mayor puntaje de fidelidad acumulado',
      payload: {
        filters: [{ field: 'puntos_fidelidad', operator: 'gte', value: 150 }],
        orderBy: { field: 'puntos_fidelidad', direction: 'desc' },
      },
    },
    {
      id: 'por_sexo',
      label: 'Distribucion por Sexo',
      description: 'Segmentacion de clientes por genero',
      payload: {
        groupBy: ['sexo'],
        aggregations: [{ field: 'id_cliente', func: 'COUNT', alias: 'Cantidad Clientes' }],
        chartType: 'pie',
      },
    },
  ],
  reserva: [
    {
      id: 'todas',
      label: 'Todas las reservas',
      description: 'Historial completo de reservas en boutique',
      payload: { orderBy: { field: 'fecha_reserva', direction: 'desc' } },
    },
    {
      id: 'pendientes',
      label: 'Solo Pendientes',
      description: 'Reservas activas en espera de retiro en boutique',
      payload: {
        filters: [{ field: 'estado', operator: 'eq', value: 'pendiente' }],
        orderBy: { field: 'fecha_reserva', direction: 'asc' },
      },
    },
    {
      id: 'por_sucursal',
      label: 'Reservas por Tienda',
      description: 'Volumen de reservas acumuladas por sucursal',
      payload: {
        groupBy: ['sucursal'],
        aggregations: [{ field: 'id_reserva', func: 'COUNT', alias: 'Total Reservas' }],
        chartType: 'bar',
      },
    },
  ],
  movimiento_inventario: [
    {
      id: 'todos',
      label: 'Todos los movimientos',
      description: 'Kardex cronologico de entradas y salidas',
      payload: { orderBy: { field: 'fecha', direction: 'desc' } },
    },
    {
      id: 'entradas',
      label: 'Solo Entradas de Lote',
      description: 'Recepciones de lotes de reposicion',
      payload: {
        filters: [{ field: 'tipo_movimiento', operator: 'contains', value: 'Entrada' }],
        orderBy: { field: 'fecha', direction: 'desc' },
      },
    },
    {
      id: 'salidas',
      label: 'Solo Salidas',
      description: 'Salidas por venta en mostrador o mermas',
      payload: {
        filters: [{ field: 'tipo_movimiento', operator: 'contains', value: 'Salida' }],
        orderBy: { field: 'fecha', direction: 'desc' },
      },
    },
  ],
};

export const QbeTab: React.FC = () => {
  const [metadata, setMetadata] = useState<QbeMetadata | null>(null);
  const [loadingMeta, setLoadingMeta] = useState<boolean>(true);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('venta');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<QbeFilter[]>([]);
  const [groupByField, setGroupByField] = useState<string>('');
  const [aggregations, setAggregations] = useState<QbeAggregation[]>([]);
  const [orderByField, setOrderByField] = useState<string>('');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');
  const [limit, setLimit] = useState<number>(100);

  // Pildora de consulta rapida activa
  const [activePresetId, setActivePresetId] = useState<string>('todas');

  // Filtros interactivos por ejemplo en cabecera de tabla (Verdadero QBE)
  const [columnExamples, setColumnExamples] = useState<Record<string, string>>({});

  // Resultados
  const [results, setResults] = useState<QbeQueryResult | null>(null);
  const [loadingQuery, setLoadingQuery] = useState<boolean>(false);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tabla local
  const [tableSearch, setTableSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [chartMode, setChartMode] = useState<'bar' | 'donut'>('bar');

  // Estado de Lenguaje Natural y Asistente
  const [nlPrompt, setNlPrompt] = useState<string>('');
  const [interpreting, setInterpreting] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interpretationResult, setInterpretationResult] = useState<InterpretedQbeResponse | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Diagnostico e Insights con IA
  const [aiAnalysis, setAiAnalysis] = useState<AiReportAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState<boolean>(false);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup error
        }
      }
    };
  }, []);

  // Ejecutar payload especifico
  const executePayload = async (payload: QbeQueryPayload) => {
    setLoadingQuery(true);
    setErrorMsg(null);
    try {
      const res = await reportsService.executeQbeQuery(payload);
      setResults(res);
      setCurrentPage(1);
      setTableSearch('');
      if (res.chartSuggestion) {
        setChartMode(res.chartSuggestion === 'pie' ? 'donut' : 'bar');
      }
      // Generar diagnostico de IA si hay datos
      if (res && res.rows && res.rows.length > 0) {
        handleGenerateAiAnalysis(res);
      }
    } catch (err: any) {
      console.error('Error al ejecutar QBE:', err);
      setErrorMsg(err.response?.data?.message || 'Error al ejecutar la consulta dinamica.');
    } finally {
      setLoadingQuery(false);
    }
  };

  // Cargar metadatos iniciales Y EJECUTAR AUTO-QUERY DE INMEDIATO
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingMeta(true);
        const meta = await reportsService.getQbeMetadata();
        if (mounted) {
          setMetadata(meta);
          if (meta.entities.length > 0) {
            const first = meta.entities[0];
            setSelectedEntityId(first.id);
            const defaultFields = first.fields.slice(0, 6).map((f) => f.id);
            setSelectedFields(defaultFields);
            setActivePresetId('todas');

            // AUTO-QUERY INICIAL: Cargar datos reales sin forzar ningun filtro
            executePayload({
              entity: first.id,
              fields: defaultFields,
              limit: 100,
              page: 1,
              orderBy: { field: 'fecha_venta', direction: 'desc' },
            });
          }
        }
      } catch (err: any) {
        console.error('Error al cargar metadatos QBE:', err);
        if (mounted) setErrorMsg('No se pudieron cargar los metadatos de las entidades QBE.');
      } finally {
        if (mounted) setLoadingMeta(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Entidad activa
  const activeEntity = useMemo<QbeEntityMeta | undefined>(() => {
    return metadata?.entities.find((e) => e.id === selectedEntityId);
  }, [metadata, selectedEntityId]);

  // Cambiar de entidad CON AUTO-QUERY INMEDIATO (cero pantallas en blanco)
  const handleSelectEntity = (entityId: string, customPreset?: Partial<QbeQueryPayload>) => {
    setSelectedEntityId(entityId);
    const ent = metadata?.entities.find((e) => e.id === entityId);
    const defaultFields = ent ? ent.fields.slice(0, 6).map((f) => f.id) : [];
    setSelectedFields(defaultFields);
    setFilters([]);
    setGroupByField('');
    setAggregations([]);
    setOrderByField('');
    setCurrentPage(1);
    setTableSearch('');
    setColumnExamples({});
    setErrorMsg(null);
    setInterpretationResult(null);

    const presetsForEntity = ENTITY_PRESETS[entityId] || [];
    const firstPreset = presetsForEntity[0];
    const targetPresetId = customPreset ? (presetsForEntity.find((p) => p.payload === customPreset)?.id || '') : (firstPreset?.id || 'todos');
    setActivePresetId(targetPresetId);

    const mergedPayload: QbeQueryPayload = {
      entity: entityId,
      fields: defaultFields,
      limit,
      page: 1,
      ...(firstPreset?.payload || {}),
      ...(customPreset || {}),
    };

    executePayload(mergedPayload);
  };

  // Aplicar una pildora de consulta rapida (one-click preset)
  const handleApplyPreset = (preset: EntityPreset) => {
    setActivePresetId(preset.id);
    setColumnExamples({});
    setCurrentPage(1);
    setTableSearch('');

    const ent = metadata?.entities.find((e) => e.id === selectedEntityId);
    const defaultFields = ent ? ent.fields.slice(0, 6).map((f) => f.id) : [];

    // Actualizar controles si el preset incluye filtros o agrupaciones
    if (preset.payload.filters) setFilters(preset.payload.filters);
    else setFilters([]);

    if (preset.payload.groupBy && preset.payload.groupBy.length > 0) {
      setGroupByField(preset.payload.groupBy[0]);
    } else {
      setGroupByField('');
    }

    if (preset.payload.aggregations) setAggregations(preset.payload.aggregations);
    else setAggregations([]);

    if (preset.payload.orderBy) {
      setOrderByField(preset.payload.orderBy.field);
      setOrderDirection(preset.payload.orderBy.direction);
    }

    const payload: QbeQueryPayload = {
      entity: selectedEntityId,
      fields: preset.payload.groupBy ? [preset.payload.groupBy[0]] : defaultFields,
      limit,
      page: 1,
      ...preset.payload,
    };

    executePayload(payload);
  };

  // Toggle de columnas
  const toggleField = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId],
    );
  };

  const selectAllFields = () => {
    if (!activeEntity) return;
    setSelectedFields(activeEntity.fields.map((f) => f.id));
  };

  const clearAllFields = () => {
    if (!activeEntity) return;
    setSelectedFields([activeEntity.fields[0].id]);
  };

  // Agregar Filtro
  const addFilter = () => {
    if (!activeEntity || activeEntity.fields.length === 0) return;
    const defaultField = activeEntity.fields[0];
    const defaultOp = defaultField.type === 'string' ? 'contains' : 'eq';
    setFilters((prev) => [
      ...prev,
      {
        field: defaultField.id,
        operator: defaultOp,
        value: '',
      },
    ]);
  };

  const updateFilter = (index: number, updates: Partial<QbeFilter>) => {
    setFilters((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const removeFilter = (index: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  };

  // Agregar Agregacion
  const addAggregation = () => {
    if (!activeEntity) return;
    const numField = activeEntity.fields.find(
      (f) => f.type === 'number' || f.type === 'currency' || f.aggregatable,
    );
    const target = numField || activeEntity.fields[0];
    setAggregations((prev) => [
      ...prev,
      {
        field: target.id,
        func: 'SUM',
        alias: `Total de ${target.label}`,
      },
    ]);
  };

  const updateAggregation = (index: number, updates: Partial<QbeAggregation>) => {
    setAggregations((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const removeAggregation = (index: number) => {
    setAggregations((prev) => prev.filter((_, i) => i !== index));
  };

  // Generar Diagnostico e Insights con IA
  const handleGenerateAiAnalysis = async (customResults?: QbeQueryResult) => {
    const data = customResults || results;
    if (!data || !data.rows || data.rows.length === 0) return;
    setLoadingAnalysis(true);
    try {
      const analysis = await reportsService.generateAiAnalysis({
        entity: data.entity,
        rows: data.rows,
        totalRows: data.totalCount,
        userPrompt: nlPrompt || undefined,
      });
      setAiAnalysis(analysis);
    } catch (err: any) {
      console.error('Error al generar analisis con IA:', err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Ejecutar Consulta QBE manual desde controles avanzados
  const handleExecute = async () => {
    if (selectedFields.length === 0 && !groupByField) {
      setErrorMsg('Debes seleccionar al menos una columna para visualizar.');
      return;
    }

    setActivePresetId('');

    const payload: QbeQueryPayload = {
      entity: selectedEntityId,
      fields: selectedFields,
      filters: filters.filter((f) => f.value !== '' && f.value !== undefined),
      groupBy: groupByField ? [groupByField] : undefined,
      aggregations: groupByField && aggregations.length > 0 ? aggregations : undefined,
      orderBy: orderByField ? { field: orderByField, direction: orderDirection } : undefined,
      limit,
      page: 1,
    };

    await executePayload(payload);
  };

  // Aplica los parametros interpretados por NLP a los controles
  const applyPayloadToControls = (payload: QbeQueryPayload) => {
    if (payload.entity) setSelectedEntityId(payload.entity);
    if (payload.fields && payload.fields.length > 0) setSelectedFields(payload.fields);
    if (payload.filters && payload.filters.length > 0) setFilters(payload.filters);
    else setFilters([]);
    if (payload.groupBy && payload.groupBy.length > 0) setGroupByField(payload.groupBy[0]);
    else setGroupByField('');
    if (payload.aggregations && payload.aggregations.length > 0) setAggregations(payload.aggregations);
    else setAggregations([]);
    if (payload.orderBy) {
      setOrderByField(payload.orderBy.field);
      setOrderDirection(payload.orderBy.direction);
    }
    if (payload.limit) setLimit(payload.limit);
  };

  // Escuchar eventos de ejecucion externa desde el Asistente IA
  useEffect(() => {
    const handleQbeEvent = (e: any) => {
      const payload: QbeQueryPayload = e.detail;
      if (payload && payload.entity) {
        applyPayloadToControls(payload);
        executePayload(payload);
      }
    };

    window.addEventListener('dressly:execute-qbe', handleQbeEvent);

    const pending = sessionStorage.getItem('dressly_pending_qbe');
    if (pending) {
      sessionStorage.removeItem('dressly_pending_qbe');
      try {
        const payload: QbeQueryPayload = JSON.parse(pending);
        if (payload && payload.entity) {
          applyPayloadToControls(payload);
          executePayload(payload);
        }
      } catch (err) {
        console.error('Error al parsear dressly_pending_qbe:', err);
      }
    }

    return () => {
      window.removeEventListener('dressly:execute-qbe', handleQbeEvent);
    };
  }, []);

  // Interpreta la consulta en lenguaje natural y la ejecuta de inmediato
  const handleInterpretQuery = async (overridePrompt?: string) => {
    const textToInterpret = (overridePrompt ?? nlPrompt).trim();
    if (!textToInterpret) return;

    setInterpreting(true);
    setErrorMsg(null);
    setActivePresetId('');
    try {
      const res = await reportsService.interpretNaturalQuery(textToInterpret);
      setInterpretationResult(res);
      applyPayloadToControls(res.suggestedPayload);
      await executePayload(res.suggestedPayload);
    } catch (err: any) {
      console.error('Error al interpretar consulta en lenguaje natural:', err);
      setErrorMsg('No se pudo interpretar la consulta en lenguaje natural.');
    } finally {
      setInterpreting(false);
    }
  };

  // Reconocimiento de voz nativo (CU33 - Web Speech API)
  const handleToggleVoice = () => {
    setVoiceError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(
        'Tu navegador actual no soporta Web Speech API. Te recomendamos Google Chrome o Microsoft Edge.',
      );
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore stop error
        }
      }
      setIsListening(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore abort error
        }
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      const userLang = navigator.language || 'es-419';
      recognition.lang = userLang.startsWith('es') ? userLang : 'es-419';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let accumulatedTranscript = '';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            accumulatedTranscript += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }
        const currentText = (accumulatedTranscript + ' ' + interim).trim();
        if (currentText) {
          setNlPrompt(currentText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        setIsListening(false);
        const errType = event.error;

        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          setVoiceError('Permiso de microfono bloqueado en el navegador.');
        } else if (errType === 'network') {
          setVoiceError('Error de conexion con el servicio de voz.');
        } else if (errType === 'no-speech') {
          setVoiceError('No se detecto sonido o voz. Intenta hablar mas cerca del microfono.');
        } else if (errType !== 'aborted') {
          setVoiceError(`Aviso de voz: ${errType}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (accumulatedTranscript.trim()) {
          handleInterpretQuery(accumulatedTranscript.trim());
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Error al iniciar reconocimiento de voz:', err);
      setIsListening(false);
      setVoiceError('No se pudo activar el microfono.');
    }
  };

  // Plantillas de sugerencia rapida
  const promptSuggestions = [
    {
      label: 'Ventas por sucursal',
      prompt: 'Ventas de este mes por sucursal con el total vendido',
    },
    {
      label: 'Prendas con stock bajo',
      prompt: 'Productos con stock menor a 15 por sucursal ordenados por menor stock',
    },
    {
      label: 'Clientes VIP (+150 pts)',
      prompt: 'Clientes con mas de 150 puntos ordenados por mayores puntos',
    },
    {
      label: 'Prendas de mayor precio',
      prompt: 'Top 10 prendas mas caras de catalogo',
    },
    {
      label: 'Reservas pendientes',
      prompt: 'Reservas pendientes ordenadas por fecha',
    },
  ];

  // Exportar Consulta QBE
  const handleExport = async (format: 'csv' | 'pdf' | 'excel') => {
    if (!results) return;
    setExportingFormat(format);
    try {
      const payload: QbeQueryPayload = {
        entity: selectedEntityId,
        fields: selectedFields,
        filters: filters.filter((f) => f.value !== '' && f.value !== undefined),
        groupBy: groupByField ? [groupByField] : undefined,
        aggregations: groupByField && aggregations.length > 0 ? aggregations : undefined,
        orderBy: orderByField ? { field: orderByField, direction: orderDirection } : undefined,
      };
      await reportsService.exportQbeQuery(payload, format);
    } catch (err: any) {
      console.error('Error al exportar QBE:', err);
      setErrorMsg('Ocurrio un error al exportar la consulta.');
    } finally {
      setExportingFormat(null);
    }
  };

  // Filtrado local e interactivo por ejemplo en cabecera de tabla (Verdadero QBE)
  const filteredRows = useMemo(() => {
    if (!results || !results.rows) return [];
    let rows = results.rows;

    // 1. Busqueda rapida general
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      rows = rows.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(q)),
      );
    }

    // 2. Filtros por ejemplo de cada columna (QBE Directo)
    const activeColFilters = Object.entries(columnExamples).filter(
      ([_, ex]) => ex && ex.trim() !== '',
    );

    if (activeColFilters.length > 0) {
      rows = rows.filter((row) => {
        return activeColFilters.every(([colKey, exampleRaw]) => {
          const cellVal = row[colKey];
          if (cellVal === undefined || cellVal === null) return false;
          const ex = exampleRaw.trim();

          // Comparadores numericos: > X, >= X, < X, <= X, = X
          const numMatch = ex.match(/^([><]=?|=)\s*([0-9]+(?:\.[0-9]+)?)$/);
          if (numMatch) {
            const op = numMatch[1];
            const targetNum = parseFloat(numMatch[2]);
            const cellNum =
              typeof cellVal === 'number'
                ? cellVal
                : parseFloat(String(cellVal).replace(/[^0-9.-]/g, ''));
            if (isNaN(cellNum)) return false;

            if (op === '>') return cellNum > targetNum;
            if (op === '>=') return cellNum >= targetNum;
            if (op === '<') return cellNum < targetNum;
            if (op === '<=') return cellNum <= targetNum;
            if (op === '=') return cellNum === targetNum;
          }

          // Rango numerico: X..Y
          const rangeMatch = ex.match(/^([0-9]+(?:\.[0-9]+)?)\s*\.\.\s*([0-9]+(?:\.[0-9]+)?)$/);
          if (rangeMatch) {
            const min = parseFloat(rangeMatch[1]);
            const max = parseFloat(rangeMatch[2]);
            const cellNum =
              typeof cellVal === 'number'
                ? cellVal
                : parseFloat(String(cellVal).replace(/[^0-9.-]/g, ''));
            if (isNaN(cellNum)) return false;
            return cellNum >= min && cellNum <= max;
          }

          // Coincidencia de texto (contains)
          return String(cellVal).toLowerCase().includes(ex.toLowerCase());
        });
      });
    }

    return rows;
  }, [results, tableSearch, columnExamples]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Cantidad de columnas con ejemplo activo
  const activeExamplesCount = useMemo(() => {
    return Object.values(columnExamples).filter((ex) => ex && ex.trim() !== '').length;
  }, [columnExamples]);

  const presetsForCurrentEntity = ENTITY_PRESETS[selectedEntityId] || [];

  if (loadingMeta) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#736B63' }}>
        <p style={{ fontWeight: 600 }}>Cargando catalogo analitico de entidades...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', color: '#1C1510' }}>
      {/* ========================================================================= */}
      {/* 1. HERO EJECUTIVO: BARRA DE CONSULTA CON LENGUAJE NATURAL Y VOZ */}
      {/* ========================================================================= */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #EAE6DF',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                backgroundColor: '#F4ECE1',
                color: '#8C5E35',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '5px',
                letterSpacing: '0.04em',
              }}
            >
              QUERY BY EXAMPLE
            </span>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#1C1510' }}>
              Consultas Analiticas sin Filtros Obligatorios
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#736B63' }}>
            Explora cualquier entidad al instante. Puedes cambiar de coleccion, hacer clic en una pildora de ejemplo o dictar lo que necesitas.
          </p>
        </div>

        {/* Input Inteligente de Lenguaje Natural */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            backgroundColor: '#FAF8F5',
            border: isListening ? '2px solid #DC2626' : '1px solid #D1C9BE',
            borderRadius: '10px',
            padding: '0.45rem 0.65rem 0.45rem 1rem',
            boxShadow: isListening ? '0 0 0 3px rgba(220, 38, 38, 0.15)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Sparkles size={18} color="#8C5E35" style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={nlPrompt}
            onChange={(e) => setNlPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleInterpretQuery();
              }
            }}
            placeholder={
              isListening
                ? 'Escuchando tu voz... Habla con naturalidad...'
                : 'Escribe tu consulta (ej: Ventas de este mes por sucursal con total)...'
            }
            disabled={interpreting || loadingQuery}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '0.9rem',
              color: '#1C1510',
              backgroundColor: 'transparent',
            }}
          />

          {/* Microfono nativo */}
          <button
            type="button"
            onClick={handleToggleVoice}
            title={isListening ? 'Detener dictado' : 'Dictar consulta por voz (CU33)'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '7px',
              border: 'none',
              backgroundColor: isListening ? '#FEE2E2' : '#FFFFFF',
              color: isListening ? '#DC2626' : '#8C5E35',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          {/* Boton Consultar */}
          <button
            type="button"
            onClick={() => handleInterpretQuery()}
            disabled={interpreting || loadingQuery || !nlPrompt.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: nlPrompt.trim() ? '#1C1510' : '#D1C9BE',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.55rem 1.15rem',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: nlPrompt.trim() && !interpreting && !loadingQuery ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease',
            }}
          >
            <Send size={14} />
            <span>{interpreting || loadingQuery ? 'Consultando...' : 'Consultar'}</span>
          </button>
        </div>

        {/* Notificacion de Voz si ocurre algun bloqueo */}
        {voiceError && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.65rem 0.85rem',
              backgroundColor: '#FEF2F2',
              borderRadius: '8px',
              border: '1px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              fontSize: '0.82rem',
              color: '#991B1B',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{voiceError}</span>
            </div>
            <button
              type="button"
              onClick={() => setVoiceError(null)}
              style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer' }}
              aria-label="Cerrar notificacion de voz"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Sugerencias de Consultas Rapidas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#8C5E35', marginRight: '0.2rem' }}>
            Consultas guiadas:
          </span>
          {promptSuggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setNlPrompt(item.prompt);
                handleInterpretQuery(item.prompt);
              }}
              disabled={interpreting || loadingQuery}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E0D8',
                borderRadius: '6px',
                padding: '0.25rem 0.6rem',
                fontSize: '0.76rem',
                color: '#4B433B',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* BARRA DE ENTIDADES Y PILDORAS DE CONSULTA DIRECTA (ONE-CLICK PRESETS) */}
        {/* ========================================================================= */}
        <div
          style={{
            marginTop: '1rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid #F0ECE4',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
          }}
        >
          {/* Fila 1: Selector de Entidad + Opciones Avanzadas + Limite */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Layers size={15} color="#8C5E35" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4B433B' }}>Entidad:</span>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {metadata?.entities.map((e) => {
                  const isCurrent = e.id === selectedEntityId;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => handleSelectEntity(e.id)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '7px',
                        border: isCurrent ? '1px solid #1C1510' : '1px solid #D1C9BE',
                        backgroundColor: isCurrent ? '#1C1510' : '#FFFFFF',
                        color: isCurrent ? '#FFFFFF' : '#4B433B',
                        fontSize: '0.8rem',
                        fontWeight: isCurrent ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {e.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '7px',
                  border: showAdvanced ? '1px solid #8C5E35' : '1px solid #D1C9BE',
                  backgroundColor: showAdvanced ? '#F4ECE1' : '#FFFFFF',
                  color: showAdvanced ? '#8C5E35' : '#4B433B',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <SlidersHorizontal size={13} />
                <span>{showAdvanced ? 'Ocultar Proyeccion' : 'Personalizar Columnas (Opcional)'}</span>
                {(filters.length > 0 || groupByField) && (
                  <span
                    style={{
                      backgroundColor: '#8C5E35',
                      color: '#FFFFFF',
                      fontSize: '0.68rem',
                      padding: '0.05rem 0.4rem',
                      borderRadius: '8px',
                    }}
                  >
                    {filters.length + (groupByField ? 1 : 0)}
                  </span>
                )}
              </button>

              <select
                value={limit}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setLimit(val);
                  if (results) {
                    executePayload({
                      entity: selectedEntityId,
                      fields: selectedFields,
                      filters: filters.filter((f) => f.value !== '' && f.value !== undefined),
                      groupBy: groupByField ? [groupByField] : undefined,
                      aggregations: groupByField && aggregations.length > 0 ? aggregations : undefined,
                      orderBy: orderByField ? { field: orderByField, direction: orderDirection } : undefined,
                      limit: val,
                    });
                  }
                }}
                style={{
                  padding: '0.35rem 0.5rem',
                  borderRadius: '7px',
                  border: '1px solid #D1C9BE',
                  fontSize: '0.78rem',
                  color: '#4B433B',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                <option value={50}>50 registros</option>
                <option value={100}>100 registros</option>
                <option value={250}>250 registros</option>
                <option value={500}>500 registros</option>
              </select>

              <button
                type="button"
                onClick={() => handleSelectEntity(selectedEntityId)}
                title="Restablecer vista inicial"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '7px',
                  border: '1px solid #D1C9BE',
                  backgroundColor: '#FAF8F5',
                  color: '#736B63',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={13} />
                <span>Reiniciar</span>
              </button>
            </div>
          </div>

          {/* Fila 2: Pildoras contextuales de consulta directa (One-Click Chips) */}
          {presetsForCurrentEntity.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#736B63' }}>
                Ejemplos directos:
              </span>
              {presetsForCurrentEntity.map((preset) => {
                const isActive = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    disabled={loadingQuery}
                    title={preset.description}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      border: isActive ? '1px solid #8C5E35' : '1px solid #E5E0D8',
                      backgroundColor: isActive ? '#FAF6F0' : '#FFFFFF',
                      color: isActive ? '#8C5E35' : '#4B433B',
                      fontSize: '0.76rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isActive && <Check size={12} color="#8C5E35" />}
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Feedback visual de interpretacion en lenguaje natural */}
        {interpretationResult && (
          <div
            style={{
              marginTop: '0.85rem',
              padding: '0.6rem 0.85rem',
              backgroundColor: '#F0FDF4',
              borderRadius: '8px',
              border: '1px solid #BBF7D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              color: '#166534',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle2 size={15} />
              <span>{interpretationResult.explanation}</span>
            </div>
            <button
              type="button"
              onClick={() => setInterpretationResult(null)}
              style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer' }}
              aria-label="Cerrar explicacion"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Notificacion de Error */}
      {errorMsg && (
        <div
          style={{
            backgroundColor: '#FEE2E2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            padding: '0.75rem 1rem',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
          }}
        >
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PANEL OPCIONAL DE PROYECCION AVANZADA (COLAPSADO POR DEFECTO) */}
      {/* ========================================================================= */}
      {showAdvanced && activeEntity && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #EAE6DF',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1C1510' }}>
                Personalizar Proyeccion de Columnas y Reglas Avanzadas
              </h4>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.76rem', color: '#736B63' }}>
                Estas configuraciones son 100% opcionales. Puedes ajustar que columnas visualizar o forzar agrupaciones manuales.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExecute}
              disabled={loadingQuery}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: '#1C1510',
                color: '#FFFFFF',
                padding: '0.4rem 0.9rem',
                borderRadius: '7px',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: loadingQuery ? 'not-allowed' : 'pointer',
              }}
            >
              <Play size={12} fill="#FFFFFF" />
              <span>Aplicar Proyeccion</span>
            </button>
          </div>

          {/* Columnas a Visualizar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1C1510' }}>
                Columnas a Visualizar:
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={selectAllFields}
                  style={{ background: 'none', border: 'none', color: '#8C5E35', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Seleccionar todas
                </button>
                <span style={{ color: '#D1C9BE' }}>|</span>
                <button
                  type="button"
                  onClick={clearAllFields}
                  style={{ background: 'none', border: 'none', color: '#736B63', fontSize: '0.76rem', cursor: 'pointer' }}
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {activeEntity.fields.map((f) => {
                const isSelected = selectedFields.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleField(f.id)}
                    style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: '6px',
                      border: isSelected ? '1px solid #8C5E35' : '1px solid #E5E0D8',
                      backgroundColor: isSelected ? '#FAF6F0' : '#FFFFFF',
                      color: isSelected ? '#8C5E35' : '#4B433B',
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtros Manuales Opcionales */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1C1510' }}>
                Condiciones de Fondo (Opcional):
              </span>
              <button
                type="button"
                onClick={addFilter}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: 'none',
                  border: 'none',
                  color: '#8C5E35',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={13} /> Anadir Regla Manual
              </button>
            </div>

            {filters.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#8A8279' }}>
                Sin reglas manuales adicionales. La consulta trae todos los registros con su limite respectivo.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filters.map((filter, idx) => {
                  const fieldMeta = activeEntity.fields.find((f) => f.id === filter.field);
                  const opList = metadata?.operators[fieldMeta?.type || 'string'] || [];

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '180px 150px 1fr 34px',
                        gap: '0.5rem',
                        alignItems: 'center',
                        backgroundColor: '#FAF8F5',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '7px',
                        border: '1px solid #EAE6DF',
                      }}
                    >
                      <select
                        value={filter.field}
                        onChange={(e) => {
                          const newField = e.target.value;
                          const fm = activeEntity.fields.find((f) => f.id === newField);
                          const ops = metadata?.operators[fm?.type || 'string'] || [];
                          updateFilter(idx, {
                            field: newField,
                            operator: ops[0]?.id || 'eq',
                            value: '',
                          });
                        }}
                        style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid #D1C9BE', fontSize: '0.8rem' }}
                      >
                        {activeEntity.fields.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={filter.operator}
                        onChange={(e) => updateFilter(idx, { operator: e.target.value })}
                        style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid #D1C9BE', fontSize: '0.8rem' }}
                      >
                        {opList.map((op) => (
                          <option key={op.id} value={op.id}>
                            {op.label}
                          </option>
                        ))}
                      </select>

                      <input
                        type={fieldMeta?.type === 'number' || fieldMeta?.type === 'currency' ? 'number' : fieldMeta?.type === 'date' ? 'date' : 'text'}
                        placeholder="Valor de busqueda..."
                        value={filter.value}
                        onChange={(e) => updateFilter(idx, { value: e.target.value })}
                        style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid #D1C9BE', fontSize: '0.8rem' }}
                      />

                      <button
                        type="button"
                        onClick={() => removeFilter(idx)}
                        style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Agrupacion Manual */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #F0ECE4' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#736B63', marginBottom: '0.3rem' }}>
                Agrupar por (GROUP BY):
              </label>
              <select
                value={groupByField}
                onChange={(e) => {
                  const val = e.target.value;
                  setGroupByField(val);
                  if (val && aggregations.length === 0) {
                    addAggregation();
                  }
                }}
                style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #D1C9BE', fontSize: '0.82rem' }}
              >
                <option value="">-- Sin agrupacion (Vista Plana) --</option>
                {activeEntity.fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#736B63', marginBottom: '0.3rem' }}>
                Ordenar por:
              </label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <select
                  value={orderByField}
                  onChange={(e) => setOrderByField(e.target.value)}
                  style={{ flex: 1, padding: '0.4rem', borderRadius: '6px', border: '1px solid #D1C9BE', fontSize: '0.82rem' }}
                >
                  <option value="">-- Orden predeterminado --</option>
                  {activeEntity.fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <select
                  value={orderDirection}
                  onChange={(e) => setOrderDirection(e.target.value as 'asc' | 'desc')}
                  style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #D1C9BE', fontSize: '0.82rem' }}
                >
                  <option value="desc">DESC</option>
                  <option value="asc">ASC</option>
                </select>
              </div>
            </div>
          </div>

          {/* Editor de Agregaciones y Metricas si hay Agrupacion */}
          {groupByField && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #F0ECE4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1C1510' }}>
                  Metricas y Agregaciones (SUM, COUNT, AVG, MIN, MAX):
                </span>
                <button
                  type="button"
                  onClick={addAggregation}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: 'none',
                    border: 'none',
                    color: '#8C5E35',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={13} /> Anadir Metrica
                </button>
              </div>
              {aggregations.map((agg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '180px 140px 1fr 34px',
                    gap: '0.5rem',
                    alignItems: 'center',
                    backgroundColor: '#FAF8F5',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '7px',
                    border: '1px solid #EAE6DF',
                    marginBottom: '0.4rem',
                  }}
                >
                  <select
                    value={agg.field}
                    onChange={(e) => updateAggregation(idx, { field: e.target.value })}
                    style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid #D1C9BE', fontSize: '0.8rem' }}
                  >
                    {activeEntity.fields.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={agg.func}
                    onChange={(e) => updateAggregation(idx, { func: e.target.value as any })}
                    style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid #D1C9BE', fontSize: '0.8rem' }}
                  >
                    <option value="SUM">SUM (Suma)</option>
                    <option value="COUNT">COUNT (Cantidad)</option>
                    <option value="AVG">AVG (Promedio)</option>
                    <option value="MIN">MIN (Minimo)</option>
                    <option value="MAX">MAX (Maximo)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Etiqueta / Alias..."
                    value={agg.alias || ''}
                    onChange={(e) => updateAggregation(idx, { alias: e.target.value })}
                    style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid #D1C9BE', fontSize: '0.8rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeAggregation(idx)}
                    style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. RESULTADOS DE LA CONSULTA QBE (ESQUELETO Y TABLA INTERACTIVA) */}
      {/* ========================================================================= */}
      {loadingQuery && !results && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #EAE6DF',
            padding: '3rem 2rem',
            textAlign: 'center',
            color: '#736B63',
          }}
        >
          <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid #EAE6DF', borderTopColor: '#8C5E35', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '0.75rem' }} />
          <p style={{ fontWeight: 600, margin: 0, fontSize: '0.88rem' }}>Cargando registros de la entidad...</p>
        </div>
      )}

      {results && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            border: '1px solid #EAE6DF',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          {/* Cabecera de resultados y exportacion */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #EAE6DF',
              paddingBottom: '1rem',
              marginBottom: '1.25rem',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <span
                  style={{
                    backgroundColor: '#1E293B',
                    color: '#FFFFFF',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                  }}
                >
                  RESULTADO
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#1C1510' }}>
                  {results.title}
                </h3>
              </div>
              <span style={{ fontSize: '0.76rem', color: '#736B63' }}>
                {filteredRows.length} registros visibles (de {results.totalCount} en base de datos) • {results.generatedAt}
              </span>
            </div>

            {/* Botones de Descarga y Analisis IA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleExport('csv')}
                disabled={!!exportingFormat}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '7px',
                  border: '1px solid #D1C9BE',
                  backgroundColor: '#FFFFFF',
                  color: '#4B433B',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: exportingFormat ? 'not-allowed' : 'pointer',
                }}
              >
                <Download size={14} /> CSV
              </button>
              <button
                type="button"
                onClick={() => handleExport('excel')}
                disabled={!!exportingFormat}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '7px',
                  border: '1px solid #D1C9BE',
                  backgroundColor: '#FFFFFF',
                  color: '#15803D',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: exportingFormat ? 'not-allowed' : 'pointer',
                }}
              >
                <FileSpreadsheet size={14} /> Excel
              </button>
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                disabled={!!exportingFormat}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '7px',
                  border: '1px solid #D1C9BE',
                  backgroundColor: '#FFFFFF',
                  color: '#B91C1C',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: exportingFormat ? 'not-allowed' : 'pointer',
                }}
              >
                <FileText size={14} /> PDF
              </button>

              <button
                type="button"
                onClick={() => handleGenerateAiAnalysis()}
                disabled={loadingAnalysis}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '7px',
                  border: '1px solid #8C5E35',
                  backgroundColor: '#FAF6F0',
                  color: '#8C5E35',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: loadingAnalysis ? 'not-allowed' : 'pointer',
                }}
              >
                <Sparkles size={14} />
                <span>{loadingAnalysis ? 'Analizando...' : 'Diagnostico IA'}</span>
              </button>
            </div>
          </div>

          {/* Tarjeta de Diagnostico e Insights con IA (Gemini) */}
          {aiAnalysis && (
            <div
              style={{
                backgroundColor: '#FAF8F5',
                borderRadius: '12px',
                border: '1px solid #E5DFD5',
                padding: '1.25rem 1.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Sparkles size={18} color="#8C5E35" />
                  <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#1C1510' }}>
                    Diagnostico e Insights con Inteligencia Artificial
                  </h4>
                  <span
                    style={{
                      backgroundColor: aiAnalysis.engine === 'gemini-3.5-flash' ? '#E8F5E9' : '#F4ECE1',
                      color: aiAnalysis.engine === 'gemini-3.5-flash' ? '#2E7D32' : '#8C5E35',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '5px',
                    }}
                  >
                    {aiAnalysis.engine === 'gemini-3.5-flash' ? 'Google Gemini 3.5 Flash' : 'Motor Analitico Dressly'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAiAnalysis(null)}
                  style={{ background: 'none', border: 'none', color: '#736B63', cursor: 'pointer' }}
                  aria-label="Cerrar analisis"
                >
                  <X size={15} />
                </button>
              </div>

              <div
                style={{
                  fontSize: '0.86rem',
                  color: '#2B231D',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-line',
                  backgroundColor: '#FFFFFF',
                  padding: '1rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid #EAE6DF',
                }}
              >
                {aiAnalysis.executiveSummary}
              </div>

              {aiAnalysis.keyInsights && aiAnalysis.keyInsights.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1C1510' }}>
                    Hallazgos analiticos clave:
                  </span>
                  <ul style={{ margin: '0.35rem 0 0 0', paddingLeft: '1.25rem', fontSize: '0.82rem', color: '#4B433B' }}>
                    {aiAnalysis.keyInsights.map((insight, iIdx) => (
                      <li key={iIdx} style={{ marginBottom: '0.25rem' }}>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8C5E35' }}>
                    Recomendaciones prescriptivas:
                  </span>
                  <ul style={{ margin: '0.35rem 0 0 0', paddingLeft: '1.25rem', fontSize: '0.82rem', color: '#4B433B' }}>
                    {aiAnalysis.recommendations.map((rec, rIdx) => (
                      <li key={rIdx} style={{ marginBottom: '0.25rem' }}>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Tarjetas de Indicadores Clave (KPIs) */}
          {results.indicators && results.indicators.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.25rem',
              }}
            >
              {results.indicators.map((kpi, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#FAF8F5',
                    padding: '0.85rem 1rem',
                    borderRadius: '9px',
                    border: '1px solid #EAE6DF',
                  }}
                >
                  <span style={{ fontSize: '0.76rem', color: '#736B63', fontWeight: 600, display: 'block' }}>
                    {kpi.label}
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1C1510', marginTop: '0.2rem', display: 'block' }}>
                    {typeof kpi.value === 'number' ? kpi.value.toLocaleString('es-BO') : kpi.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Visualizacion Grafica si hay agrupaciones o sugerencia */}
          {results.chartData && results.chartData.length > 0 && (
            <div
              style={{
                backgroundColor: '#FAF8F5',
                borderRadius: '10px',
                border: '1px solid #EAE6DF',
                padding: '1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <TrendingUp size={16} color="#8C5E35" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1C1510' }}>
                    Distribucion Visual de Resultados
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => setChartMode('bar')}
                    style={{
                      padding: '0.25rem 0.55rem',
                      borderRadius: '5px',
                      border: chartMode === 'bar' ? '1px solid #8C5E35' : '1px solid #D1C9BE',
                      backgroundColor: chartMode === 'bar' ? '#8C5E35' : '#FFFFFF',
                      color: chartMode === 'bar' ? '#FFFFFF' : '#4B433B',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Barras
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode('donut')}
                    style={{
                      padding: '0.25rem 0.55rem',
                      borderRadius: '5px',
                      border: chartMode === 'donut' ? '1px solid #8C5E35' : '1px solid #D1C9BE',
                      backgroundColor: chartMode === 'donut' ? '#8C5E35' : '#FFFFFF',
                      color: chartMode === 'donut' ? '#FFFFFF' : '#4B433B',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Circular
                  </button>
                </div>
              </div>

              {chartMode === 'bar' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {(() => {
                    const maxVal = Math.max(...results.chartData.map((d) => Number(d.total) || 0), 1);
                    return results.chartData.slice(0, 10).map((item, idx) => {
                      const val = Number(item.total) || 0;
                      const pct = Math.max(5, Math.round((val / maxVal) * 100));
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span
                            style={{
                              width: '160px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              color: '#4B433B',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              textAlign: 'right',
                            }}
                          >
                            {item.name}
                          </span>
                          <div style={{ flex: 1, backgroundColor: '#EAE6DF', height: '18px', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${pct}%`,
                                height: '100%',
                                backgroundColor: PALETTE[idx % PALETTE.length],
                                transition: 'width 0.4s ease',
                              }}
                            />
                          </div>
                          <span style={{ width: '85px', fontSize: '0.78rem', fontWeight: 700, color: '#1C1510' }}>
                            {val.toLocaleString('es-BO')}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', padding: '1rem 0' }}>
                  <svg width="140" height="140" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    {(() => {
                      const totalSum = results.chartData.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0) || 1;
                      let accumulatedPct = 0;
                      return results.chartData.slice(0, 7).map((item, idx) => {
                        const val = Number(item.total) || 0;
                        const pct = (val / totalSum) * 100;
                        const strokeDasharray = `${pct} ${100 - pct}`;
                        const strokeDashoffset = -accumulatedPct;
                        accumulatedPct += pct;
                        return (
                          <circle
                            key={idx}
                            cx="50"
                            cy="50"
                            r="36"
                            fill="transparent"
                            stroke={PALETTE[idx % PALETTE.length]}
                            strokeWidth="18"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            pathLength="100"
                          />
                        );
                      });
                    })()}
                    <circle cx="50" cy="50" r="22" fill="#FAF8F5" />
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxWidth: '280px' }}>
                    {results.chartData.slice(0, 7).map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.76rem' }}>
                        <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: PALETTE[idx % PALETTE.length], flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, color: '#4B433B' }}>
                          {item.name}
                        </span>
                        <span style={{ fontWeight: 700, color: '#1C1510' }}>
                          {Number(item.total).toLocaleString('es-BO')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* BARRA DE HERRAMIENTAS Y AVISO DE FILTRADO POR EJEMPLO */}
          {/* ========================================================================= */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#FAF8F5', border: '1px solid #D1C9BE', borderRadius: '7px', padding: '0.35rem 0.65rem', width: '280px' }}>
                <Search size={14} color="#736B63" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Busqueda general en filas..."
                  style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '0.8rem', color: '#1C1510', width: '100%' }}
                />
              </div>

              {activeExamplesCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#FAF6F0', border: '1px solid #8C5E35', borderRadius: '6px', padding: '0.25rem 0.55rem', fontSize: '0.76rem', color: '#8C5E35', fontWeight: 600 }}>
                  <span>{activeExamplesCount} {activeExamplesCount === 1 ? 'filtro por ejemplo activo' : 'filtros por ejemplo activos'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setColumnExamples({});
                      setCurrentPage(1);
                    }}
                    title="Limpiar filtros de columna"
                    style={{ background: 'none', border: 'none', color: '#8C5E35', cursor: 'pointer', padding: '1px' }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#736B63' }}>
              <span>Mostrar</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{ padding: '0.2rem 0.4rem', borderRadius: '5px', border: '1px solid #D1C9BE', fontSize: '0.78rem', backgroundColor: '#FFFFFF' }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>filas por pagina</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TABLA DE RESULTADOS CON FILTRADO POR EJEMPLO EN CABECERA (VERDADERO QBE) */}
          {/* ========================================================================= */}
          <div style={{ overflowX: 'auto', border: '1px solid #EAE6DF', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                {/* Fila 1: Nombre de la Columna */}
                <tr style={{ backgroundColor: '#F8F6F2', borderBottom: '1px solid #EAE6DF' }}>
                  {results.columns.map((col) => (
                    <th key={col.key} style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#4B433B', whiteSpace: 'nowrap' }}>
                      {col.label}
                    </th>
                  ))}
                </tr>

                {/* Fila 2: Celdas de Ejemplo QBE (filtro directo en tabla) */}
                <tr style={{ backgroundColor: '#FAF9F6', borderBottom: '2px solid #EAE6DF' }}>
                  {results.columns.map((col) => {
                    const isFiltered = !!columnExamples[col.key];
                    const isNum = col.type === 'currency' || col.type === 'number';
                    const placeholder = isNum ? 'Ej: > 200' : 'Ej: Texto...';

                    return (
                      <th key={`example-${col.key}`} style={{ padding: '0.3rem 0.5rem' }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={columnExamples[col.key] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setColumnExamples((prev) => ({
                                ...prev,
                                [col.key]: val,
                              }));
                              setCurrentPage(1);
                            }}
                            placeholder={placeholder}
                            title={`Escribe un ejemplo para filtrar ${col.label}. Numeros admiten: > X, < X, o rango X..Y`}
                            style={{
                              width: '100%',
                              minWidth: '95px',
                              padding: '0.25rem 0.45rem',
                              fontSize: '0.74rem',
                              border: isFiltered ? '1px solid #8C5E35' : '1px solid #D1C9BE',
                              borderRadius: '5px',
                              backgroundColor: isFiltered ? '#FDFBF7' : '#FFFFFF',
                              color: '#1C1510',
                              outline: 'none',
                            }}
                          />
                          {isFiltered && (
                            <button
                              type="button"
                              onClick={() => {
                                setColumnExamples((prev) => {
                                  const next = { ...prev };
                                  delete next[col.key];
                                  return next;
                                });
                                setCurrentPage(1);
                              }}
                              style={{
                                position: 'absolute',
                                right: '4px',
                                background: 'none',
                                border: 'none',
                                color: '#8C5E35',
                                cursor: 'pointer',
                                padding: '1px',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <X size={11} />
                            </button>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={results.columns.length} style={{ padding: '2.5rem', textAlign: 'center', color: '#736B63' }}>
                      No se encontraron registros que coincidan con los criterios de ejemplo.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      style={{
                        borderBottom: '1px solid #F0ECE4',
                        backgroundColor: rIdx % 2 === 0 ? '#FFFFFF' : '#FAF9F6',
                      }}
                    >
                      {results.columns.map((col) => {
                        const val = row[col.key];
                        let rendered = val ?? '-';
                        if (typeof val === 'number') {
                          rendered = val.toLocaleString('es-BO');
                        }
                        return (
                          <td key={col.key} style={{ padding: '0.65rem 0.85rem', color: '#2B231D', whiteSpace: 'nowrap' }}>
                            {rendered}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginacion */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', fontSize: '0.78rem', color: '#736B63' }}>
            <span>
              Mostrando {Math.min(filteredRows.length, (currentPage - 1) * pageSize + 1)} - {Math.min(filteredRows.length, currentPage * pageSize)} de {filteredRows.length} filas filtradas
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  border: '1px solid #D1C9BE',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '5px',
                  padding: '0.2rem 0.45rem',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                }}
              >
                <ChevronLeft size={15} />
              </button>
              <span>
                Pag. {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  border: '1px solid #D1C9BE',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '5px',
                  padding: '0.2rem 0.45rem',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
