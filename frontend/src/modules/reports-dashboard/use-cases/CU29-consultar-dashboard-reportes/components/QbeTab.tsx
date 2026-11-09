import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  Send,
  Filter,
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

  // Diagnóstico e Insights con IA
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

  // Cargar metadatos iniciales
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
            setSelectedFields(first.fields.slice(0, 6).map((f) => f.id));
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

  // Cambiar de entidad
  const handleSelectEntity = (entityId: string) => {
    setSelectedEntityId(entityId);
    const ent = metadata?.entities.find((e) => e.id === entityId);
    if (ent) {
      setSelectedFields(ent.fields.slice(0, 6).map((f) => f.id));
    }
    setFilters([]);
    setGroupByField('');
    setAggregations([]);
    setOrderByField('');
    setResults(null);
    setCurrentPage(1);
    setTableSearch('');
    setErrorMsg(null);
    setInterpretationResult(null);
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

  // Agregar Agregación
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

  // Generar Diagnóstico e Insights con IA
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
      console.error('Error al generar análisis con IA:', err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Ejecutar payload específico
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
      // Generar diagnóstico de IA si hay datos
      if (res && res.rows && res.rows.length > 0) {
        handleGenerateAiAnalysis(res);
      }
    } catch (err: any) {
      console.error('Error al ejecutar QBE:', err);
      setErrorMsg(err.response?.data?.message || 'Error al ejecutar la consulta dinámica.');
    } finally {
      setLoadingQuery(false);
    }
  };

  // Ejecutar Consulta QBE manual
  const handleExecute = async () => {
    if (selectedFields.length === 0 && !groupByField) {
      setErrorMsg('Debes seleccionar al menos una columna para visualizar.');
      return;
    }

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

  // Aplica los parámetros interpretados por NLP a los controles
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

  // Escuchar eventos de ejecución externa desde el Asistente IA (drawer o botón flotante)
  useEffect(() => {
    const handleQbeEvent = (e: any) => {
      const payload: QbeQueryPayload = e.detail;
      if (payload && payload.entity) {
        applyPayloadToControls(payload);
        executePayload(payload);
      }
    };

    window.addEventListener('dressly:execute-qbe', handleQbeEvent);

    // Revisar si hay una consulta pendiente guardada en sessionStorage
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
        'Tu navegador actual no soporta Web Speech API. Te recomendamos utilizar Google Chrome, Microsoft Edge o habilitar los servicios de voz si usas Brave.',
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

      // Idioma regional con fallback a español latinoamericano
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
          setVoiceError(
            'Permiso de micrófono bloqueado. Haz clic en el ícono de candado o configuración junto a la barra de direcciones de tu navegador y cambia el micrófono a "Permitir".',
          );
        } else if (errType === 'network') {
          setVoiceError(
            'Error de conexión con el servicio de voz. En Brave Browser ve a brave://settings y activa "Usar los servicios de Google para el reconocimiento de voz", o abre la aplicación en Google Chrome.',
          );
        } else if (errType === 'no-speech') {
          setVoiceError('No se detectó sonido o voz. Haz clic en el micrófono de nuevo y habla con claridad.');
        } else if (errType === 'audio-capture') {
          setVoiceError('No se encontró ningún micrófono físico conectado o el canal de audio del sistema está ocupado.');
        } else if (errType !== 'aborted') {
          setVoiceError(`No se pudo completar el reconocimiento (${errType}). Puedes ingresar tu consulta por texto.`);
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
      setVoiceError(
        'No se pudo activar el micrófono en este momento. Puedes escribir la consulta directamente en el recuadro.',
      );
    }
  };

  // Plantillas de sugerencia rápida limpias (sin emojis)
  const promptSuggestions = [
    {
      label: 'Bajo stock por tienda',
      prompt: 'Productos con stock menor a 15 por sucursal ordenados por menor stock',
    },
    {
      label: 'Ventas del mes por sucursal',
      prompt: 'Ventas de este mes por sucursal con el total vendido',
    },
    {
      label: 'Clientes destacados (+100 pts)',
      prompt: 'Clientes con mas de 100 puntos ordenados por mayores puntos',
    },
    {
      label: 'Prendas con mayor precio',
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
      setErrorMsg('Ocurrió un error al exportar la consulta.');
    } finally {
      setExportingFormat(null);
    }
  };

  // Filtrado local en tabla de resultados
  const filteredRows = useMemo(() => {
    if (!results) return [];
    if (!tableSearch.trim()) return results.rows;
    const q = tableSearch.toLowerCase();
    return results.rows.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(q)),
    );
  }, [results, tableSearch]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  if (loadingMeta) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#736B63' }}>
        <p style={{ fontWeight: 600 }}>Cargando catálogo de entidades...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', color: '#1C1510' }}>
      {/* ========================================================================= */}
      {/* 1. HERO MINIMALISTA: BARRA DE BÚSQUEDA Y LENGUAJE NATURAL */}
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
        {/* Input Bar con Voz y Enviar */}
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
                ? 'Escuchando tu voz... Habla ahora...'
                : 'Escribe tu consulta en lenguaje natural (ej: Ventas de este mes por sucursal con el total)...'
            }
            disabled={interpreting || loadingQuery}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '0.92rem',
              color: '#1C1510',
              backgroundColor: 'transparent',
            }}
          />

          {/* Botón de Micrófono (CU33) */}
          <button
            type="button"
            onClick={handleToggleVoice}
            title={isListening ? 'Detener dictado por voz' : 'Dictar consulta por voz (CU33)'}
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

          {/* Botón Consultar */}
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
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: nlPrompt.trim() && !interpreting && !loadingQuery ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease',
            }}
          >
            <Send size={14} />
            <span>{interpreting || loadingQuery ? 'Consultando...' : 'Consultar'}</span>
          </button>
        </div>

        {/* Notificación de Error en Reconocimiento de Voz */}
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
              aria-label="Cerrar notificación de voz"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Sugerencias Rápidas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#8C5E35', marginRight: '0.2rem' }}>
            Sugerencias:
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

        {/* Barra Compacta de Controles Rápidos */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            marginTop: '0.85rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #F0ECE4',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#736B63' }}>Entidad:</span>
              <select
                value={selectedEntityId}
                onChange={(e) => handleSelectEntity(e.target.value)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '7px',
                  border: '1px solid #D1C9BE',
                  backgroundColor: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#1C1510',
                  cursor: 'pointer',
                }}
              >
                {metadata?.entities.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

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
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Filter size={13} />
              <span>{showAdvanced ? 'Ocultar Opciones' : 'Filtros y Columnas'}</span>
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
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              style={{
                padding: '0.35rem 0.5rem',
                borderRadius: '7px',
                border: '1px solid #D1C9BE',
                fontSize: '0.8rem',
                color: '#4B433B',
              }}
            >
              <option value={50}>50 reg</option>
              <option value={100}>100 reg</option>
              <option value={250}>250 reg</option>
              <option value={500}>500 reg</option>
            </select>

            <button
              type="button"
              onClick={() => {
                handleSelectEntity(selectedEntityId);
              }}
              title="Reiniciar consulta"
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '7px',
                border: '1px solid #D1C9BE',
                backgroundColor: '#FAF8F5',
                color: '#736B63',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={14} />
            </button>

            <button
              type="button"
              onClick={handleExecute}
              disabled={loadingQuery}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.95rem',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: '#1C1510',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: loadingQuery ? 'not-allowed' : 'pointer',
              }}
            >
              <Play size={13} fill="#FFFFFF" />
              <span>Ejecutar</span>
            </button>
          </div>
        </div>

        {/* Feedback de Interpretación */}
        {interpretationResult && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.6rem 0.85rem',
              backgroundColor: '#F0FDF4',
              borderRadius: '7px',
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
              aria-label="Cerrar"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Notificación de Error */}
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
      {/* 2. PANEL COMPACTO DE FILTROS Y COLUMNAS (DESPLEGABLE / MANUAL) */}
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
          {/* Columnas a Visualizar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1C1510' }}>
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

          {/* Filtros Dinámicos */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1C1510' }}>
                Filtros y Condiciones:
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
                <Plus size={13} /> Añadir Filtro
              </button>
            </div>

            {filters.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#8A8279' }}>
                No hay filtros activos. Se consultarán todos los registros de la entidad.
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

                      {filter.operator === 'between' ? (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <input
                            type="text"
                            placeholder="Mínimo"
                            value={filter.value}
                            onChange={(e) => updateFilter(idx, { value: e.target.value })}
                            style={{ width: '50%', padding: '0.35rem', borderRadius: '6px', border: '1px solid #D1C9BE', fontSize: '0.8rem' }}
                          />
                          <input
                            type="text"
                            placeholder="Máximo"
                            value={filter.value2 || ''}
                            onChange={(e) => updateFilter(idx, { value2: e.target.value })}
                            style={{ width: '50%', padding: '0.35rem', borderRadius: '6px', border: '1px solid #D1C9BE', fontSize: '0.8rem' }}
                          />
                        </div>
                      ) : fieldMeta?.type === 'enum' && fieldMeta.options ? (
                        <select
                          value={filter.value}
                          onChange={(e) => updateFilter(idx, { value: e.target.value })}
                          style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid #D1C9BE', fontSize: '0.8rem' }}
                        >
                          <option value="">-- Seleccionar opción --</option>
                          {fieldMeta.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={fieldMeta?.type === 'number' || fieldMeta?.type === 'currency' ? 'number' : fieldMeta?.type === 'date' ? 'date' : 'text'}
                          placeholder="Valor de búsqueda..."
                          value={filter.value}
                          onChange={(e) => updateFilter(idx, { value: e.target.value })}
                          style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid #D1C9BE', fontSize: '0.8rem' }}
                        />
                      )}

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

          {/* Agrupación y Orden */}
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
                <option value="">-- Sin agrupación (detalle plano) --</option>
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
                  style={{ width: '65%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #D1C9BE', fontSize: '0.82rem' }}
                >
                  <option value="">-- Por defecto --</option>
                  {activeEntity.fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <select
                  value={orderDirection}
                  onChange={(e) => setOrderDirection(e.target.value as 'asc' | 'desc')}
                  style={{ width: '35%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #D1C9BE', fontSize: '0.82rem' }}
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>
          </div>

          {/* Agregaciones si hay Group By */}
          {groupByField && (
            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #F0ECE4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#736B63' }}>
                  Funciones de Cálculo Agregado:
                </span>
                <button
                  type="button"
                  onClick={addAggregation}
                  style={{ background: 'none', border: 'none', color: '#8C5E35', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Añadir Función
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {aggregations.map((agg, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '130px 180px 1fr 34px',
                      gap: '0.5rem',
                      alignItems: 'center',
                      backgroundColor: '#FAF8F5',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '6px',
                      border: '1px solid #EAE6DF',
                    }}
                  >
                    <select
                      value={agg.func}
                      onChange={(e) => updateAggregation(idx, { func: e.target.value as any })}
                      style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid #D1C9BE', fontSize: '0.8rem' }}
                    >
                      {metadata?.aggregationFunctions.map((fn) => (
                        <option key={fn.id} value={fn.id}>
                          {fn.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={agg.field}
                      onChange={(e) => {
                        const newField = e.target.value;
                        const fm = activeEntity.fields.find((f) => f.id === newField);
                        updateAggregation(idx, {
                          field: newField,
                          alias: `${agg.func} de ${fm?.label || newField}`,
                        });
                      }}
                      style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid #D1C9BE', fontSize: '0.8rem' }}
                    >
                      {activeEntity.fields
                        .filter((f) => f.type === 'number' || f.type === 'currency' || f.aggregatable)
                        .map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label}
                          </option>
                        ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Alias..."
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
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. RESULTADOS DE LA CONSULTA QBE */}
      {/* ========================================================================= */}
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
          {/* Cabecera de resultados y exportación */}
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
                {results.totalCount} registros encontrados • {results.generatedAt}
              </span>
            </div>

            {/* Botones de Descarga */}
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
                <span>{loadingAnalysis ? 'Analizando...' : 'Análisis IA'}</span>
              </button>
            </div>
          </div>

          {/* Tarjeta de Diagnóstico e Insights Ejecutivos con IA (Gemini) */}
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
                    Diagnóstico e Insights con Inteligencia Artificial
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
                    {aiAnalysis.engine === 'gemini-3.5-flash' ? 'Google Gemini 3.5 Flash' : 'Motor Analítico Dressly'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAiAnalysis(null)}
                  style={{ background: 'none', border: 'none', color: '#736B63', cursor: 'pointer' }}
                  aria-label="Cerrar diagnóstico"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Resumen Ejecutivo */}
              <p
                style={{
                  fontSize: '0.88rem',
                  color: '#2E2722',
                  lineHeight: '1.5',
                  margin: '0 0 1rem 0',
                  fontWeight: 500,
                }}
              >
                {aiAnalysis.executiveSummary}
              </p>

              {/* Grid de 3 Columnas: Hallazgos, Alertas, Recomendaciones */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '1rem',
                }}
              >
                {/* Hallazgos */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #EAE6DF',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#8C5E35',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Hallazgos Clave
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: '1.1rem',
                      fontSize: '0.8rem',
                      color: '#4B433B',
                      lineHeight: '1.45',
                    }}
                  >
                    {aiAnalysis.keyInsights.map((insight, idx) => (
                      <li key={idx} style={{ marginBottom: '0.35rem' }}>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Alertas */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #EAE6DF',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#B91C1C',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Alertas y Desviaciones
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: '1.1rem',
                      fontSize: '0.8rem',
                      color: '#4B433B',
                      lineHeight: '1.45',
                    }}
                  >
                    {aiAnalysis.alerts.map((alert, idx) => (
                      <li key={idx} style={{ marginBottom: '0.35rem' }}>
                        {alert}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recomendaciones */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #EAE6DF',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#15803D',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Recomendaciones Estratégicas
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: '1.1rem',
                      fontSize: '0.8rem',
                      color: '#4B433B',
                      lineHeight: '1.45',
                    }}
                  >
                    {aiAnalysis.recommendations.map((rec, idx) => (
                      <li key={idx} style={{ marginBottom: '0.35rem' }}>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Gráfico Analítico (si hay chartData) */}
          {results.chartData && results.chartData.length > 0 && (
            <div
              style={{
                backgroundColor: '#FAF8F5',
                borderRadius: '12px',
                border: '1px solid #EAE6DF',
                padding: '1.25rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <TrendingUp size={16} color="#8C5E35" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1C1510' }}>
                    Visualización Gráfica
                  </span>
                </div>
                <div style={{ display: 'flex', backgroundColor: '#EFEBE4', borderRadius: '6px', padding: '2px', gap: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setChartMode('bar')}
                    style={{
                      border: 'none',
                      backgroundColor: chartMode === 'bar' ? '#FFFFFF' : 'transparent',
                      color: chartMode === 'bar' ? '#1C1510' : '#736B63',
                      borderRadius: '5px',
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.75rem',
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
                      border: 'none',
                      backgroundColor: chartMode === 'donut' ? '#FFFFFF' : 'transparent',
                      color: chartMode === 'donut' ? '#1C1510' : '#736B63',
                      borderRadius: '5px',
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Dona
                  </button>
                </div>
              </div>

              {/* Render del Gráfico */}
              {chartMode === 'bar' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {results.chartData.slice(0, 8).map((item, idx) => {
                    const maxVal = Math.max(...results.chartData.map((d) => d.total || 0), 1);
                    const pct = Math.min(100, Math.round(((item.total || 0) / maxVal) * 100));
                    const color = PALETTE[idx % PALETTE.length];

                    return (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '170px 1fr 100px', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.78rem', color: '#4B433B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </span>
                        <div style={{ backgroundColor: '#EFEBE4', borderRadius: '5px', height: '14px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              backgroundColor: color,
                              height: '100%',
                              borderRadius: '5px',
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1C1510', textAlign: 'right' }}>
                          {Number(item.total).toLocaleString('es-BO')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '0.5rem 0' }}>
                  <svg width="150" height="150" viewBox="0 0 100 100">
                    {(() => {
                      const totalSum = results.chartData.reduce((acc, d) => acc + (d.total || 0), 0) || 1;
                      let accumulatedAngle = 0;
                      return results.chartData.slice(0, 7).map((item, idx) => {
                        const sliceAngle = ((item.total || 0) / totalSum) * 360;
                        const startAngle = accumulatedAngle;
                        accumulatedAngle += sliceAngle;
                        const startRad = ((startAngle - 90) * Math.PI) / 180;
                        const endRad = ((accumulatedAngle - 90) * Math.PI) / 180;
                        const x1 = 50 + 40 * Math.cos(startRad);
                        const y1 = 50 + 40 * Math.sin(startRad);
                        const x2 = 50 + 40 * Math.cos(endRad);
                        const y2 = 50 + 40 * Math.sin(endRad);
                        const largeArc = sliceAngle > 180 ? 1 : 0;
                        const d = sliceAngle >= 359.9
                          ? 'M 50 10 A 40 40 0 1 0 50 90 A 40 40 0 1 0 50 10'
                          : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

                        return <path key={idx} d={d} fill={PALETTE[idx % PALETTE.length]} stroke="#FAF8F5" strokeWidth="2" />;
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

          {/* Barra de Búsqueda sobre Resultados */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', backgroundColor: '#FAF8F5', border: '1px solid #D1C9BE', borderRadius: '7px', padding: '0.35rem 0.65rem', width: '280px' }}>
              <Search size={14} color="#736B63" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Filtrar en esta tabla..."
                style={{ border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '0.8rem', color: '#1C1510', width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#736B63' }}>
              <span>Mostrar</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{ padding: '0.2rem 0.4rem', borderRadius: '5px', border: '1px solid #D1C9BE', fontSize: '0.78rem' }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>filas por pág.</span>
            </div>
          </div>

          {/* Tabla de Resultados */}
          <div style={{ overflowX: 'auto', border: '1px solid #EAE6DF', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8F6F2', borderBottom: '1px solid #EAE6DF' }}>
                  {results.columns.map((col) => (
                    <th key={col.key} style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#4B433B', whiteSpace: 'nowrap' }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={results.columns.length} style={{ padding: '2rem', textAlign: 'center', color: '#736B63' }}>
                      No se encontraron filas que coincidan con la búsqueda.
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

          {/* Paginación */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', fontSize: '0.78rem', color: '#736B63' }}>
            <span>
              Mostrando {Math.min(filteredRows.length, (currentPage - 1) * pageSize + 1)} - {Math.min(filteredRows.length, currentPage * pageSize)} de {filteredRows.length} filas
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
                Pág. {currentPage} de {totalPages}
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
