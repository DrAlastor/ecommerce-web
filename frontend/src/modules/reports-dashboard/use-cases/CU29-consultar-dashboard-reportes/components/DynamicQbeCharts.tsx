import React, { useState, useRef, useMemo } from 'react';
import {
  BarChart2,
  PieChart,
  Activity,
  AlignLeft,
  Download,
  FileText,
  FileSpreadsheet,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { QbeChartSpec, QbeChartType } from '../types/reports.types';

export interface DynamicChartItem {
  name: string;
  total: number;
  count?: number;
  percentage?: number;
  formattedTotal?: string;
  [key: string]: any;
}

interface DynamicQbeChartsProps {
  data: DynamicChartItem[];
  spec?: QbeChartSpec;
  entityName?: string;
  onExportPdf?: (chartType: QbeChartType, chartPngDataUrl?: string) => void;
  onExportExcel?: () => void;
  onChartTypeChange?: (chartType: QbeChartType) => void;
}

const PALETTE = [
  '#8C5E35', // Primario Marrón Boutique
  '#C4956A', // Acento Dorado/Camel
  '#3D5A80', // Azul Petróleo
  '#059669', // Verde Éxito
  '#D97706', // Ámbar/Ocre
  '#293241', // Grafito Oscuro
  '#7C3AED', // Violeta Real
  '#DC2626', // Rojo Rubí
  '#6B705C', // Verde Salvia
  '#A98467', // Café con Leche
];

export const DynamicQbeCharts: React.FC<DynamicQbeChartsProps> = ({
  data,
  spec,
  entityName = 'Consulta Dinámica',
  onExportPdf,
  onExportExcel,
  onChartTypeChange,
}) => {
  // Estado local para alternar modo de gráfica libremente
  const initialMode = useMemo<QbeChartType>(() => {
    if (spec?.chartType) {
      if (spec.chartType === 'donut_percentage' || spec.chartType === 'pie') return 'donut_percentage';
      if (spec.chartType === 'peak_area' || spec.chartType === 'line_temporal') return 'peak_area';
      if (spec.chartType === 'bar_horizontal') return 'bar_horizontal';
      return 'bar_vertical';
    }
    if (data.length <= 6 && data.length > 1) return 'donut_percentage';
    if (data.length > 8) return 'bar_horizontal';
    return 'bar_vertical';
  }, [spec, data.length]);

  const [activeChartType, setActiveChartType] = useState<QbeChartType>(initialMode);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    setActiveChartType(initialMode);
    onChartTypeChange?.(initialMode);
  }, [initialMode, onChartTypeChange]);

  const handleSelectType = (t: QbeChartType) => {
    setActiveChartType(t);
    onChartTypeChange?.(t);
  };

  const captureSvgAsPng = (): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (!svgRef.current) {
        resolve(undefined);
        return;
      }
      try {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgRef.current);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const URLObj = window.URL || window.webkitURL || window;
        const blobURL = URLObj.createObjectURL(svgBlob);
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = 2;
          const w = 860;
          const h = 340;
          canvas.width = w * scale;
          canvas.height = h * scale;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(undefined);
            return;
          }
          ctx.scale(scale, scale);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(image, 0, 0, w, h);
          const pngUrl = canvas.toDataURL('image/png');
          URLObj.revokeObjectURL(blobURL);
          resolve(pngUrl);
        };
        image.onerror = () => {
          URLObj.revokeObjectURL(blobURL);
          resolve(undefined);
        };
        image.src = blobURL;
      } catch {
        resolve(undefined);
      }
    });
  };

  // Totales y cálculos estadísticos
  const safeData = useMemo(() => {
    return (data || []).map((d) => ({
      ...d,
      total: Number(d.total) || 0,
      name: String(d.name || 'Sin nombre'),
    }));
  }, [data]);

  const totalSum = useMemo(() => {
    return safeData.reduce((acc, curr) => acc + curr.total, 0) || 1;
  }, [safeData]);

  const maxVal = useMemo(() => {
    return Math.max(...safeData.map((d) => d.total), 1);
  }, [safeData]);

  const minVal = useMemo(() => {
    return Math.min(...safeData.map((d) => d.total), 0);
  }, [safeData]);

  const isCurrency = useMemo(() => {
    if (spec?.unit) return spec.unit.toLowerCase().includes('bs');
    return true;
  }, [spec]);

  // Titulo y etiqueta
  const chartTitle = spec?.title || `Análisis Gráfico de ${entityName}`;
  const chartSubtitle =
    spec?.subtitle || `${safeData.length} registros clasificados • Total acumulado: ${totalSum.toLocaleString('es-BO')} ${spec?.unit || 'Bs.'}`;

  // =========================================================================
  // EXPORTACIÓN A SVG
  // =========================================================================
  const handleExportSvg = () => {
    if (!svgRef.current) return;
    try {
      setDownloadingFormat('svg');
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svgRef.current);

      // Agregar encabezado xml estándar
      if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `Grafico_QBE_${new Date().toISOString().split('T')[0]}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al exportar gráfico a SVG:', err);
    } finally {
      setTimeout(() => setDownloadingFormat(null), 600);
    }
  };

  // =========================================================================
  // EXPORTACIÓN A PNG (vía Canvas 2x Retina)
  // =========================================================================
  const handleExportPng = () => {
    if (!svgRef.current) return;
    try {
      setDownloadingFormat('png');
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgRef.current);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URLObj = window.URL || window.webkitURL || window;
      const blobURL = URLObj.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 2; // Alta resolución
        const width = 900;
        const height = 450;
        canvas.width = width * scale;
        canvas.height = height * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.scale(scale, scale);
        // Fondo blanco limpio
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(image, 0, 0, width, height);

        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `Grafico_QBE_${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URLObj.revokeObjectURL(blobURL);
        setDownloadingFormat(null);
      };
      image.src = blobURL;
    } catch (err) {
      console.error('Error al exportar gráfico a PNG:', err);
      setDownloadingFormat(null);
    }
  };

  if (safeData.length === 0) {
    return null;
  }

  // Dimensiones para SVG
  const width = 860;
  const height = 340;
  const padLeft = 85;
  const padRight = 35;
  const padTop = 35;
  const padBottom = 55;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: '#FAF8F5',
        borderRadius: '14px',
        border: '1px solid #EAE6DF',
        padding: '1.25rem',
        marginBottom: '1.5rem',
      }}
    >
      {/* =================================================================== */}
      {/* CABECERA: TÍTULO, SUBTÍTULO Y BARRA DE HERRAMIENTAS */}
      {/* =================================================================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="#8C5E35" />
            <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#1C1510' }}>
              {chartTitle}
            </h3>
          </div>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.76rem', color: '#6A6258' }}>
            {chartSubtitle}
          </p>
        </div>

        {/* SELECTOR DE MODO Y BOTONES DE EXPORTACIÓN */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {/* Conmutador de Tipo */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#EDE8E1',
              padding: '2px',
              borderRadius: '8px',
              border: '1px solid #DCD5CB',
            }}
          >
            <button
              type="button"
              onClick={() => handleSelectType('bar_vertical')}
              title="Barras Verticales"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.28rem 0.55rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeChartType === 'bar_vertical' ? '#FFFFFF' : 'transparent',
                color: activeChartType === 'bar_vertical' ? '#8C5E35' : '#5E564D',
                fontSize: '0.73rem',
                fontWeight: activeChartType === 'bar_vertical' ? 700 : 500,
                cursor: 'pointer',
                boxShadow: activeChartType === 'bar_vertical' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <BarChart2 size={13} />
              <span>Barras</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('peak_area')}
              title="Curva de Picos / Área"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.28rem 0.55rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeChartType === 'peak_area' ? '#FFFFFF' : 'transparent',
                color: activeChartType === 'peak_area' ? '#8C5E35' : '#5E564D',
                fontSize: '0.73rem',
                fontWeight: activeChartType === 'peak_area' ? 700 : 500,
                cursor: 'pointer',
                boxShadow: activeChartType === 'peak_area' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Activity size={13} />
              <span>Picos / Área</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('donut_percentage')}
              title="Gráfico Circular / Porcentajes"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.28rem 0.55rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeChartType === 'donut_percentage' ? '#FFFFFF' : 'transparent',
                color: activeChartType === 'donut_percentage' ? '#8C5E35' : '#5E564D',
                fontSize: '0.73rem',
                fontWeight: activeChartType === 'donut_percentage' ? 700 : 500,
                cursor: 'pointer',
                boxShadow: activeChartType === 'donut_percentage' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <PieChart size={13} />
              <span>Circular</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType('bar_horizontal')}
              title="Ranking Horizontal"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.28rem 0.55rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeChartType === 'bar_horizontal' ? '#FFFFFF' : 'transparent',
                color: activeChartType === 'bar_horizontal' ? '#8C5E35' : '#5E564D',
                fontSize: '0.73rem',
                fontWeight: activeChartType === 'bar_horizontal' ? 700 : 500,
                cursor: 'pointer',
                boxShadow: activeChartType === 'bar_horizontal' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <AlignLeft size={13} />
              <span>Ranking</span>
            </button>
          </div>

          {/* Menú de Descargas y Exportaciones */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <button
              type="button"
              onClick={handleExportSvg}
              disabled={downloadingFormat !== null}
              title="Descargar este gráfico en formato vectorial SVG"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.3rem 0.55rem',
                borderRadius: '6px',
                border: '1px solid #D1C9BE',
                backgroundColor: '#FFFFFF',
                color: '#4A423A',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Download size={12} color="#8C5E35" />
              <span>SVG</span>
            </button>

            <button
              type="button"
              onClick={handleExportPng}
              disabled={downloadingFormat !== null}
              title="Descargar imagen PNG en alta definición"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.3rem 0.55rem',
                borderRadius: '6px',
                border: '1px solid #D1C9BE',
                backgroundColor: '#FFFFFF',
                color: '#4A423A',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Download size={12} color="#8C5E35" />
              <span>PNG</span>
            </button>

            {onExportPdf && (
              <button
                type="button"
                onClick={async () => {
                  const png = await captureSvgAsPng();
                  onExportPdf(activeChartType, png);
                }}
                title="Exportar reporte completo con tabla a formato PDF"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.3rem 0.55rem',
                  borderRadius: '6px',
                  border: '1px solid #D1C9BE',
                  backgroundColor: '#FFFFFF',
                  color: '#DC2626',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <FileText size={12} />
                <span>PDF</span>
              </button>
            )}

            {onExportExcel && (
              <button
                type="button"
                onClick={onExportExcel}
                title="Exportar datos a Microsoft Excel"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.3rem 0.55rem',
                  borderRadius: '6px',
                  border: '1px solid #D1C9BE',
                  backgroundColor: '#FFFFFF',
                  color: '#059669',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <FileSpreadsheet size={12} />
                <span>Excel</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* INSIGHT ANALÍTICO GENERADO POR IA */}
      {/* =================================================================== */}
      {spec?.aiInsight && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            padding: '0.55rem 0.85rem',
            backgroundColor: '#F3EFEA',
            borderLeft: '3px solid #8C5E35',
            borderRadius: '6px',
            marginBottom: '1rem',
          }}
        >
          <Sparkles size={14} color="#8C5E35" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.77rem', color: '#3A322A', lineHeight: 1.4 }}>
            <strong style={{ color: '#8C5E35', fontWeight: 700 }}>Conclusión Analítica: </strong>
            {spec.aiInsight}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ÁREA DE VISUALIZACIÓN GRÁFICA */}
      {/* =================================================================== */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        {/* CASO 1: BARRAS VERTICALES */}
        {activeChartType === 'bar_vertical' && (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: '100%', minWidth: '650px', height: 'auto', display: 'block' }}
          >
            <defs>
              <linearGradient id="barGradientVertical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8C5E35" />
                <stop offset="100%" stopColor="#C4956A" />
              </linearGradient>
              <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A06A3B" />
                <stop offset="100%" stopColor="#D9A87D" />
              </linearGradient>
            </defs>

            {/* Guías horizontales de fondo */}
            {[0, 0.25, 0.5, 0.75, 1].map((step, i) => {
              const y = padTop + plotH * (1 - step);
              const valLabel = Math.round(minVal + (maxVal - minVal) * step);
              return (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    stroke="#EAE6DF"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#8A8279"
                    fontWeight="500"
                  >
                    {valLabel.toLocaleString('es-BO')}
                  </text>
                </g>
              );
            })}

            {/* Eje Y Label */}
            <text
              x={-(padTop + plotH / 2)}
              y={24}
              transform="rotate(-90)"
              textAnchor="middle"
              fontSize="10"
              fill="#6A6258"
              fontWeight="600"
            >
              {spec?.yAxisLabel || (isCurrency ? 'Monto Acumulado (Bs.)' : 'Cantidad')}
            </text>

            {/* Barras verticales */}
            {safeData.slice(0, 14).map((item, idx) => {
              const n = Math.min(safeData.length, 14);
              const colW = plotW / n;
              const barW = Math.max(Math.min(colW * 0.55, 48), 16);
              const xCenter = padLeft + colW * idx + colW / 2;
              const barX = xCenter - barW / 2;

              const barH = ((item.total - minVal) / (maxVal - minVal || 1)) * plotH;
              const barY = padTop + plotH - barH;
              const isHovered = hoveredIndex === idx;

              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Barra */}
                  <rect
                    x={barX}
                    y={barY}
                    width={barW}
                    height={Math.max(barH, 3)}
                    rx={5}
                    ry={5}
                    fill={isHovered ? 'url(#barGradientHover)' : 'url(#barGradientVertical)'}
                    filter={isHovered ? 'drop-shadow(0px 3px 6px rgba(140,94,53,0.35))' : 'none'}
                  />

                  {/* Valor en la cúspide */}
                  <text
                    x={xCenter}
                    y={barY - 7}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill={isHovered ? '#8C5E35' : '#4A423A'}
                  >
                    {item.total > 9999 ? `${(item.total / 1000).toFixed(1)}k` : item.total.toLocaleString('es-BO')}
                  </text>

                  {/* Etiqueta Eje X */}
                  <text
                    x={xCenter}
                    y={padTop + plotH + 18}
                    textAnchor="middle"
                    fontSize="10"
                    fill={isHovered ? '#8C5E35' : '#6A6258'}
                    fontWeight={isHovered ? '700' : '500'}
                  >
                    {item.name.length > 12 ? `${item.name.slice(0, 10)}...` : item.name}
                  </text>

                  {/* Porcentaje en segunda línea de etiqueta */}
                  <text
                    x={xCenter}
                    y={padTop + plotH + 30}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#9A9288"
                  >
                    {Math.round((item.total / totalSum) * 100)}%
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* CASO 2: CURVA DE PICOS Y ÁREA SOMBREADA */}
        {activeChartType === 'peak_area' && (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: '100%', minWidth: '650px', height: 'auto', display: 'block' }}
          >
            <defs>
              <linearGradient id="peakAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8C5E35" stopOpacity="0.45" />
                <stop offset="70%" stopColor="#C4956A" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Guías horizontales */}
            {[0, 0.25, 0.5, 0.75, 1].map((step, i) => {
              const y = padTop + plotH * (1 - step);
              const valLabel = Math.round(minVal + (maxVal - minVal) * step);
              return (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    stroke="#EAE6DF"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#8A8279"
                    fontWeight="500"
                  >
                    {valLabel.toLocaleString('es-BO')}
                  </text>
                </g>
              );
            })}

            {/* Calcular coordenadas de puntos */}
            {(() => {
              const points = safeData.slice(0, 16);
              const n = points.length;
              const coords = points.map((p, idx) => {
                const x = padLeft + (n > 1 ? (idx / (n - 1)) * plotW : plotW / 2);
                const y = padTop + plotH - ((p.total - minVal) / (maxVal - minVal || 1)) * plotH;
                return { x, y, name: p.name, val: p.total };
              });

              // Curva Bezier cúbica
              const linePath = coords.reduce((acc, pt, idx) => {
                if (idx === 0) return `M ${pt.x} ${pt.y}`;
                const prev = coords[idx - 1];
                const cx = (prev.x + pt.x) / 2;
                return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
              }, '');

              const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${padTop + plotH} L ${coords[0].x} ${padTop + plotH} Z`;

              return (
                <g>
                  {/* Área sombreada */}
                  <path d={areaPath} fill="url(#peakAreaGradient)" />

                  {/* Línea de contorno */}
                  <path d={linePath} fill="none" stroke="#8C5E35" strokeWidth="2.5" />

                  {/* Puntos de datos */}
                  {coords.map((pt, idx) => {
                    const isMax = pt.val === maxVal;
                    const isHovered = hoveredIndex === idx;
                    return (
                      <g
                        key={idx}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 6 : isMax ? 5 : 3.5}
                          fill={isMax ? '#D97706' : '#8C5E35'}
                          stroke="#FFFFFF"
                          strokeWidth="2"
                        />

                        {/* Etiqueta en x */}
                        <text
                          x={pt.x}
                          y={padTop + plotH + 18}
                          textAnchor="middle"
                          fontSize="9"
                          fill={isHovered ? '#8C5E35' : '#6A6258'}
                          fontWeight={isHovered ? '700' : '500'}
                        >
                          {pt.name.length > 9 ? `${pt.name.slice(0, 8)}.` : pt.name}
                        </text>

                        {/* Valor si está en hover o es pico máximo */}
                        {(isHovered || isMax) && (
                          <g>
                            <rect
                              x={pt.x - 30}
                              y={pt.y - 26}
                              width={60}
                              height={18}
                              rx={4}
                              fill="#1C1510"
                              opacity="0.9"
                            />
                            <text
                              x={pt.x}
                              y={pt.y - 14}
                              textAnchor="middle"
                              fontSize="9"
                              fill="#FFFFFF"
                              fontWeight="600"
                            >
                              {pt.val.toLocaleString('es-BO')}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })()}
          </svg>
        )}

        {/* CASO 3: GRÁFICO CIRCULAR / DONUT CON PORCENTAJES Y HUB CENTRAL */}
        {activeChartType === 'donut_percentage' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2.5rem',
              flexWrap: 'wrap',
              padding: '1rem 0',
            }}
          >
            {/* SVG Donut */}
            <div style={{ position: 'relative', width: '240px', height: '240px', flexShrink: 0 }}>
              <svg
                ref={svgRef}
                viewBox="0 0 200 200"
                style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
              >
                {(() => {
                  const radius = 70;
                  const strokeWidth = 28;
                  const circumference = 2 * Math.PI * radius;
                  let accumulatedOffset = 0;

                  return safeData.slice(0, 8).map((item, idx) => {
                    const ratio = item.total / totalSum;
                    const strokeDash = ratio * circumference;
                    const strokeGap = circumference - strokeDash;
                    const strokeOffset = -accumulatedOffset;
                    accumulatedOffset += strokeDash;

                    const color = PALETTE[idx % PALETTE.length];
                    const isHovered = hoveredIndex === idx;

                    return (
                      <circle
                        key={idx}
                        cx="100"
                        cy="100"
                        r={radius}
                        fill="transparent"
                        stroke={color}
                        strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                        strokeDasharray={`${strokeDash} ${strokeGap}`}
                        strokeDashoffset={strokeOffset}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        style={{
                          transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                          cursor: 'pointer',
                          opacity: hoveredIndex === null || isHovered ? 1 : 0.55,
                        }}
                      />
                    );
                  });
                })()}
              </svg>

              {/* Hub central con métrica consolidada */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#8A8279', textTransform: 'uppercase' }}>
                  Total
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1C1510' }}>
                  {totalSum > 999999 ? `${(totalSum / 1000000).toFixed(2)}M` : totalSum.toLocaleString('es-BO')}
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#8C5E35' }}>
                  {spec?.unit || 'Bs.'}
                </div>
              </div>
            </div>

            {/* Leyenda interactiva lateral */}
            <div style={{ flex: '1', minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {safeData.slice(0, 8).map((item, idx) => {
                const color = PALETTE[idx % PALETTE.length];
                const pct = Math.round((item.total / totalSum) * 100);
                const isHovered = hoveredIndex === idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.65rem',
                      borderRadius: '8px',
                      backgroundColor: isHovered ? '#FFFFFF' : 'transparent',
                      border: isHovered ? '1px solid #DCD5CB' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: color,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: '0.8rem', fontWeight: isHovered ? 700 : 500, color: '#2B231D' }}>
                        {item.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6A6258' }}>
                        {item.total.toLocaleString('es-BO')} {spec?.unit || 'Bs.'}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: color,
                          backgroundColor: `${color}18`,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '12px',
                          minWidth: '36px',
                          textAlign: 'center',
                        }}
                      >
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CASO 4: RANKING HORIZONTAL CON BARRAS DE PROGRESO */}
        {activeChartType === 'bar_horizontal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: '0.5rem 0' }}>
            {safeData.slice(0, 10).map((item, idx) => {
              const ratio = item.total / maxVal;
              const pct = Math.round((item.total / totalSum) * 100);
              const isHovered = hoveredIndex === idx;
              const color = PALETTE[idx % PALETTE.length];

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '8px',
                    backgroundColor: isHovered ? '#FFFFFF' : 'transparent',
                    border: isHovered ? '1px solid #DCD5CB' : '1px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: idx < 3 ? '#8C5E35' : '#8A8279',
                          width: '18px',
                        }}
                      >
                        #{idx + 1}
                      </span>
                      <span style={{ fontSize: '0.82rem', fontWeight: isHovered ? 700 : 600, color: '#1C1510' }}>
                        {item.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1C1510' }}>
                        {item.total.toLocaleString('es-BO')} {spec?.unit || 'Bs.'}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: '#8A8279' }}>
                        ({pct}%)
                      </span>
                    </div>
                  </div>

                  {/* Barra de progreso visual */}
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#EAE6DF',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(ratio * 100, 2)}%`,
                        height: '100%',
                        backgroundColor: color,
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
