/**
 * @servicio ReportExporterService
 * @subsistema Reportes y Analítica
 * @capa Infraestructura de exportación y presentación — Backend
 * @responsabilidad Genera archivos binarios y tabulares para reportes ejecutivos en formatos CSV, Excel (.xlsx) y PDF.
 */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export interface ReportColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'currency' | 'date';
  width?: number;
}

export interface ReportIndicator {
  label: string;
  value: string | number;
  suffix?: string;
  description?: string;
}

export interface ReportPayload {
  title: string;
  code: string;
  periodo: string;
  sucursalNombre: string;
  generatedBy: string;
  generatedAt: string;
  indicators: ReportIndicator[];
  chartData?: any;
  chartSpec?: any;
  chartType?: string;
  chartImage?: string;
  aiInsight?: string;
  columns: ReportColumn[];
  rows: Record<string, any>[];
  summaryNotes?: string[];
}

@Injectable()
export class ReportExporterService {
  /**
   * Genera archivo CSV con BOM UTF-8 para apertura correcta en Microsoft Excel y sistemas externos.
   */
  async exportToCsv(report: ReportPayload): Promise<Buffer> {
    try {
      const bom = '\uFEFF';
      const lines: string[] = [];

      // Encabezado de metadatos en CSV
      lines.push(`"FASHIONSTORE - REPORTE DE ${report.title.toUpperCase()}"`);
      lines.push(`"Período: ${report.periodo}","Alcance: ${report.sucursalNombre}"`);
      lines.push(`"Generado por: ${report.generatedBy}","Fecha emisión: ${report.generatedAt}"`);
      lines.push('');

      // Indicadores clave
      if (report.indicators && report.indicators.length > 0) {
        lines.push('"--- RESUMEN DE INDICADORES ---"');
        for (const ind of report.indicators) {
          lines.push(`"${ind.label}","${ind.value}${ind.suffix ? ' ' + ind.suffix : ''}"`);
        }
        lines.push('');
      }

      // Columnas del listado
      const headerLine = report.columns
        .map((col) => `"${col.label.replace(/"/g, '""')}"`)
        .join(',');
      lines.push(headerLine);

      // Filas de datos
      for (const row of report.rows) {
        const rowLine = report.columns
          .map((col) => {
            const val = row[col.key];
            if (val === null || val === undefined) return '""';
            if (typeof val === 'number') return `${val}`;
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(',');
        lines.push(rowLine);
      }

      const csvContent = bom + lines.join('\r\n');
      return Buffer.from(csvContent, 'utf-8');
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Error al generar archivo CSV: ${error?.message || error}`,
      );
    }
  }

  /**
   * Genera libro Excel (.xlsx) con 2 hojas:
   * Hoja 1: Resumen con metadata institucional e indicadores clave.
   * Hoja 2: Listado detallado formateado con estilos y anchos automáticos.
   */
  async exportToExcel(report: ReportPayload): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'FashionStore / Dressly System';
      workbook.created = new Date();

      // ==========================================
      // HOJA 1: RESUMEN EJECUTIVO
      // ==========================================
      const summarySheet = workbook.addWorksheet('Resumen', {
        views: [{ showGridLines: true }],
      });

      // Estilos institucionales
      const brandDarkFill: ExcelJS.Fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1C1510' },
      };

      const goldFill: ExcelJS.Fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'D4AF37' },
      };

      const lightCardFill: ExcelJS.Fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F8F5F0' },
      };

      // Título
      summarySheet.mergeCells('A1:E1');
      const titleCell = summarySheet.getCell('A1');
      titleCell.value = `FASHIONSTORE — ${report.title.toUpperCase()}`;
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
      titleCell.fill = brandDarkFill;
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      summarySheet.getRow(1).height = 40;

      // Metadatos
      summarySheet.getCell('A3').value = 'Metadatos del Reporte';
      summarySheet.getCell('A3').font = { bold: true, size: 12, color: { argb: '8C5E35' } };

      const meta = [
        ['Código de Reporte:', report.code],
        ['Período de Análisis:', report.periodo],
        ['Alcance / Sucursal:', report.sucursalNombre],
        ['Generado Por:', report.generatedBy],
        ['Fecha y Hora de Emisión:', report.generatedAt],
        ['Total de Registros Detallados:', report.rows.length],
      ];

      let currentRow = 4;
      meta.forEach(([k, v]) => {
        summarySheet.getCell(`A${currentRow}`).value = k;
        summarySheet.getCell(`A${currentRow}`).font = { bold: true };
        summarySheet.getCell(`B${currentRow}`).value = v;
        currentRow++;
      });

      // Indicadores Clave
      currentRow += 2;
      summarySheet.getCell(`A${currentRow}`).value = 'Indicadores y Métricas Clave';
      summarySheet.getCell(`A${currentRow}`).font = { bold: true, size: 12, color: { argb: '8C5E35' } };
      currentRow++;

      // Cabecera indicadores
      summarySheet.getCell(`A${currentRow}`).value = 'Indicador';
      summarySheet.getCell(`B${currentRow}`).value = 'Valor Calculado';
      summarySheet.getCell(`C${currentRow}`).value = 'Detalle / Descripción';
      ['A', 'B', 'C'].forEach((col) => {
        const c = summarySheet.getCell(`${col}${currentRow}`);
        c.fill = goldFill;
        c.font = { bold: true, color: { argb: '1C1510' } };
      });
      currentRow++;

      for (const ind of report.indicators) {
        summarySheet.getCell(`A${currentRow}`).value = ind.label;
        summarySheet.getCell(`A${currentRow}`).font = { bold: true };
        summarySheet.getCell(`B${currentRow}`).value =
          typeof ind.value === 'number'
            ? ind.value
            : `${ind.value}${ind.suffix ? ' ' + ind.suffix : ''}`;
        if (typeof ind.value === 'number') {
          summarySheet.getCell(`B${currentRow}`).numFmt = '#,##0.00';
        }
        summarySheet.getCell(`C${currentRow}`).value = ind.description || '-';

        ['A', 'B', 'C'].forEach((col) => {
          summarySheet.getCell(`${col}${currentRow}`).fill = lightCardFill;
        });
        currentRow++;
      }

      // Bloque de Diagnóstico Ejecutivo IA en Excel
      if (report.aiInsight) {
        currentRow += 2;
        summarySheet.mergeCells(`A${currentRow}:C${currentRow}`);
        const aiHeaderCell = summarySheet.getCell(`A${currentRow}`);
        aiHeaderCell.value = 'DIAGNÓSTICO E INSIGHTS ANALÍTICOS (IA)';
        aiHeaderCell.fill = brandDarkFill;
        aiHeaderCell.font = { bold: true, color: { argb: 'D4AF37' }, size: 11 };
        currentRow++;

        summarySheet.mergeCells(`A${currentRow}:C${currentRow + 1}`);
        const aiTextCell = summarySheet.getCell(`A${currentRow}`);
        aiTextCell.value = report.aiInsight;
        aiTextCell.alignment = { wrapText: true, vertical: 'top' };
        aiTextCell.fill = lightCardFill;
        aiTextCell.font = { italic: true, size: 10, color: { argb: '2E221A' } };
        currentRow += 2;
      }

      // Bloque de Distribución Comparativa (ChartData) en Excel
      if (Array.isArray(report.chartData) && report.chartData.length > 0) {
        currentRow += 2;
        summarySheet.mergeCells(`A${currentRow}:C${currentRow}`);
        const compHeaderCell = summarySheet.getCell(`A${currentRow}`);
        compHeaderCell.value = 'DISTRIBUCIÓN Y COMPARATIVA DE SEGMENTOS';
        compHeaderCell.fill = brandDarkFill;
        compHeaderCell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
        currentRow++;

        summarySheet.getCell(`A${currentRow}`).value = 'Segmento / Categoría';
        summarySheet.getCell(`B${currentRow}`).value = 'Total Acumulado';
        summarySheet.getCell(`C${currentRow}`).value = 'Participación (%)';
        ['A', 'B', 'C'].forEach((col) => {
          const c = summarySheet.getCell(`${col}${currentRow}`);
          c.fill = goldFill;
          c.font = { bold: true, color: { argb: '1C1510' } };
        });
        currentRow++;

        const totalSum = report.chartData.reduce((acc: number, curr: any) => acc + (Number(curr.total) || 0), 0) || 1;
        report.chartData.slice(0, 15).forEach((item: any) => {
          const val = Number(item.total) || 0;
          const pct = item.percentage ?? Math.round((val / totalSum) * 100);
          summarySheet.getCell(`A${currentRow}`).value = item.name || 'Segmento';
          summarySheet.getCell(`B${currentRow}`).value = val;
          summarySheet.getCell(`B${currentRow}`).numFmt = '#,##0.00';
          summarySheet.getCell(`C${currentRow}`).value = `${pct}%`;
          ['A', 'B', 'C'].forEach((col) => {
            summarySheet.getCell(`${col}${currentRow}`).fill = lightCardFill;
          });
          currentRow++;
        });
      }

      summarySheet.getColumn('A').width = 30;
      summarySheet.getColumn('B').width = 32;
      summarySheet.getColumn('C').width = 44;

      // ==========================================
      // HOJA 2: LISTADO DETALLADO COMPLETO
      // ==========================================
      const dataSheet = workbook.addWorksheet('Detalle de Datos', {
        views: [{ showGridLines: true }],
      });

      // Cabecera del listado
      const headerRow = dataSheet.getRow(1);
      headerRow.height = 28;

      report.columns.forEach((col, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = col.label;
        cell.fill = brandDarkFill;
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
        cell.alignment = {
          vertical: 'middle',
          horizontal: col.type === 'number' || col.type === 'currency' ? 'right' : 'left',
        };
      });

      // Filas de datos
      report.rows.forEach((row, rIdx) => {
        const rowObj = dataSheet.getRow(rIdx + 2);
        rowObj.height = 20;

        report.columns.forEach((col, cIdx) => {
          const cell = rowObj.getCell(cIdx + 1);
          let val = row[col.key];

          if (col.type === 'currency' || col.type === 'number') {
            const num = Number(val);
            if (!isNaN(num)) {
              cell.value = num;
              cell.numFmt = col.type === 'currency' ? '"Bs." #,##0.00' : '#,##0';
              cell.alignment = { horizontal: 'right' };
            } else {
              cell.value = val ?? '-';
            }
          } else {
            cell.value = val ?? '-';
            cell.alignment = { horizontal: 'left' };
          }

          // Bordes tenues
          cell.border = {
            bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
            right: { style: 'thin', color: { argb: 'F3F4F6' } },
          };
        });
      });

      // Autoajuste de columnas
      report.columns.forEach((col, idx) => {
        let maxLen = col.label.length;
        report.rows.forEach((row) => {
          const len = String(row[col.key] || '').length;
          if (len > maxLen) maxLen = len;
        });
        dataSheet.getColumn(idx + 1).width = Math.min(Math.max(maxLen + 4, 12), 55);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Error al generar archivo Excel: ${error?.message || error}`,
      );
    }
  }

  /**
   * Genera documento PDF con presentación ejecutiva institucional,
   * bloque comparativo con gráfico visual, paginación multipágina y autoajuste inteligente.
   */
  async exportToPdf(report: ReportPayload): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const isWide = report.columns.length > 5;
        const doc = new PDFDocument({
          size: 'A4',
          layout: isWide ? 'landscape' : 'portrait',
          margin: 36,
          bufferPages: true,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));

        const pageWidth = isWide ? 841.89 : 595.28;
        const pageHeight = isWide ? 595.28 : 841.89;
        const margin = 36;
        const contentWidth = pageWidth - margin * 2;

        // --- 1. ENCABEZADO CORPORATIVO DE PRIMERA PÁGINA ---
        doc.rect(margin, margin, contentWidth, 52).fill('#1C1510');

        doc
          .fillColor('#D4AF37')
          .fontSize(15)
          .font('Helvetica-Bold')
          .text('DRESSLY BOUTIQUE', margin + 14, margin + 11);

        doc
          .fillColor('#FFFFFF')
          .fontSize(10.5)
          .font('Helvetica')
          .text(report.title.toUpperCase(), margin + 14, margin + 30);

        doc
          .fillColor('#E5E7EB')
          .fontSize(8)
          .text(`Período: ${report.periodo}`, margin, margin + 11, {
            align: 'right',
            width: contentWidth - 14,
          })
          .text(`Alcance: ${report.sucursalNombre}`, margin, margin + 23, {
            align: 'right',
            width: contentWidth - 14,
          })
          .text(`Emisión: ${report.generatedAt}`, margin, margin + 35, {
            align: 'right',
            width: contentWidth - 14,
          });

        let yPos = margin + 62;

        // --- 2. RESUMEN DE INDICADORES (TARJETAS KPI) ---
        if (report.indicators && report.indicators.length > 0) {
          const maxKpis = Math.min(report.indicators.length, 4);
          const kpiWidth = (contentWidth - (maxKpis - 1) * 8) / maxKpis;

          for (let i = 0; i < maxKpis; i++) {
            const ind = report.indicators[i];
            const kpiX = margin + i * (kpiWidth + 8);

            doc
              .roundedRect(kpiX, yPos, kpiWidth, 42, 4)
              .fillAndStroke('#F8F5F0', '#E5E0D8');

            doc
              .fillColor('#736B63')
              .fontSize(7)
              .font('Helvetica-Bold')
              .text(ind.label.toUpperCase(), kpiX + 6, yPos + 6, {
                width: kpiWidth - 12,
                ellipsis: true,
              });

            const valStr =
              typeof ind.value === 'number'
                ? ind.value.toLocaleString('es-BO', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })
                : String(ind.value);

            doc
              .fillColor('#1C1510')
              .fontSize(11.5)
              .font('Helvetica-Bold')
              .text(`${valStr}${ind.suffix ? ' ' + ind.suffix : ''}`, kpiX + 6, yPos + 20, {
                width: kpiWidth - 12,
                ellipsis: true,
              });
          }

          yPos += 50;
        }

        // --- 3. BLOQUE DE ANÁLISIS COMPARATIVO Y VISUALIZACIÓN GRÁFICA ---
        const hasChartData = Array.isArray(report.chartData) && report.chartData.length > 0;
        if (report.aiInsight || hasChartData) {
          doc
            .fillColor('#1C1510')
            .fontSize(9.5)
            .font('Helvetica-Bold')
            .text('Análisis Ejecutivo y Visualización Gráfica', margin, yPos);
          yPos += 14;

          if (report.aiInsight) {
            doc.fontSize(8);
            const insightBoxHeight = Math.max(28, doc.heightOfString(report.aiInsight, { width: contentWidth - 24 }) + 14);
            doc
              .roundedRect(margin, yPos, contentWidth, insightBoxHeight, 4)
              .fillAndStroke('#FAF8F5', '#C4956A');

            doc
              .fillColor('#8C5E35')
              .fontSize(7.5)
              .font('Helvetica-Bold')
              .text('DIAGNÓSTICO E INSIGHT IA:', margin + 10, yPos + 6);

            doc
              .fillColor('#2E221A')
              .fontSize(8)
              .font('Helvetica-Oblique')
              .text(report.aiInsight, margin + 10, yPos + 18, { width: contentWidth - 20 });

            yPos += insightBoxHeight + 10;
          }

          if (hasChartData) {
            const totalSum = report.chartData.reduce((acc: number, curr: any) => acc + (Number(curr.total) || 0), 0) || 1;

            if (report.chartImage && typeof report.chartImage === 'string' && report.chartImage.startsWith('data:image/')) {
              try {
                const base64Data = report.chartImage.replace(/^data:image\/\w+;base64,/, '');
                const imgBuffer = Buffer.from(base64Data, 'base64');
                const chartCardHeight = 175;
                doc
                  .roundedRect(margin, yPos, contentWidth, chartCardHeight, 6)
                  .fillAndStroke('#FFFFFF', '#EAE6DF');
                doc.image(imgBuffer, margin + 6, yPos + 6, {
                  fit: [contentWidth - 12, chartCardHeight - 12],
                  align: 'center',
                  valign: 'center',
                });
                yPos += chartCardHeight + 14;
              } catch {
                drawNativeVectorChart();
              }
            } else {
              drawNativeVectorChart();
            }

            function drawNativeVectorChart() {
              const chartCardHeight = 165;
              doc
                .roundedRect(margin, yPos, contentWidth, chartCardHeight, 6)
                .fillAndStroke('#FFFFFF', '#EAE6DF');

              const cTitle = report.chartSpec?.title || `Visualización de ${report.title}`;
              const cSub =
                report.chartSpec?.subtitle ||
                `${report.chartData.length} segmentos procesados • Total: ${totalSum.toLocaleString('es-BO')}`;

              doc
                .fillColor('#1C1510')
                .fontSize(8.5)
                .font('Helvetica-Bold')
                .text(cTitle, margin + 12, yPos + 8, { width: contentWidth - 24, ellipsis: true });

              doc
                .fillColor('#736B63')
                .fontSize(6.8)
                .font('Helvetica')
                .text(cSub, margin + 12, yPos + 20, { width: contentWidth - 24, ellipsis: true });

              const rawType = String(report.chartType || report.chartSpec?.chartType || 'bar_vertical').toLowerCase();
              const palette = ['#8C5E35', '#C4956A', '#3D5A80', '#059669', '#D97706', '#293241', '#7C3AED', '#DC2626'];

              if (rawType.includes('horizontal')) {
                // Gráfico de barras horizontales (Ranking)
                const topItems = report.chartData.slice(0, 6);
                const maxVal = Math.max(...topItems.map((d: any) => Number(d.total) || 0), 1);
                const rowH = 19;
                const startY = yPos + 34;
                const labelWidth = 150;
                const maxBarWidth = contentWidth - labelWidth - 95;

                topItems.forEach((item: any, idx: number) => {
                  const curY = startY + idx * rowH;
                  const val = Number(item.total) || 0;
                  const pct = Math.round((val / totalSum) * 100);
                  const barW = Math.max(3, (val / maxVal) * maxBarWidth);
                  const col = palette[idx % palette.length];

                  doc
                    .fillColor('#2E221A')
                    .fontSize(6.8)
                    .font('Helvetica-Bold')
                    .text(String(item.name || 'Segmento'), margin + 12, curY + 2, {
                      width: labelWidth - 10,
                      ellipsis: true,
                    });

                  doc.roundedRect(margin + labelWidth, curY, maxBarWidth, 10, 2).fill('#F2EFEA');
                  doc.roundedRect(margin + labelWidth, curY, barW, 10, 2).fill(col);

                  const valFormatted = item.formattedTotal || val.toLocaleString('es-BO');
                  doc
                    .fillColor('#1C1510')
                    .fontSize(6.8)
                    .font('Helvetica-Bold')
                    .text(`${valFormatted} (${pct}%)`, margin + labelWidth + maxBarWidth + 8, curY + 2, {
                      width: 75,
                      align: 'left',
                    });
                });
              } else if (rawType.includes('pie') || rawType.includes('donut') || rawType.includes('circular')) {
                // Gráfico circular / donut con distribución porcentual
                const topItems = report.chartData.slice(0, 6);
                const cx = margin + 70;
                const cy = yPos + 98;
                const outerR = 44;
                const innerR = 24;

                let currentAngle = -Math.PI / 2;
                topItems.forEach((item: any, idx: number) => {
                  const val = Number(item.total) || 0;
                  const sliceAngle = (val / totalSum) * 2 * Math.PI;
                  const endAngle = currentAngle + sliceAngle;
                  const col = palette[idx % palette.length];

                  doc.save();
                  doc.fillColor(col);
                  doc
                    .path(`
                      M ${cx + outerR * Math.cos(currentAngle)} ${cy + outerR * Math.sin(currentAngle)}
                      A ${outerR} ${outerR} 0 ${sliceAngle > Math.PI ? 1 : 0} 1 ${cx + outerR * Math.cos(endAngle)} ${cy + outerR * Math.sin(endAngle)}
                      L ${cx + innerR * Math.cos(endAngle)} ${cy + innerR * Math.sin(endAngle)}
                      A ${innerR} ${innerR} 0 ${sliceAngle > Math.PI ? 1 : 0} 0 ${cx + innerR * Math.cos(currentAngle)} ${cy + innerR * Math.sin(currentAngle)}
                      Z
                    `)
                    .fill();
                  doc.restore();

                  currentAngle = endAngle;
                });

                doc
                  .fillColor('#736B63')
                  .fontSize(6)
                  .font('Helvetica-Bold')
                  .text('TOTAL', cx - 22, cy - 8, { width: 44, align: 'center' });
                doc
                  .fillColor('#1C1510')
                  .fontSize(8)
                  .font('Helvetica-Bold')
                  .text(totalSum.toLocaleString('es-BO'), cx - 24, cy + 1, { width: 48, align: 'center' });

                // Leyenda estructurada a la derecha
                const legX = margin + 140;
                const legW = contentWidth - 155;
                const rowH = 19;
                topItems.forEach((item: any, idx: number) => {
                  const curY = yPos + 34 + idx * rowH;
                  const val = Number(item.total) || 0;
                  const pct = Math.round((val / totalSum) * 100);
                  const col = palette[idx % palette.length];

                  doc.rect(legX, curY + 2, 7, 7).fill(col);
                  doc
                    .fillColor('#2E221A')
                    .fontSize(6.8)
                    .font('Helvetica-Bold')
                    .text(String(item.name || 'Segmento'), legX + 12, curY + 1, {
                      width: legW - 85,
                      ellipsis: true,
                    });

                  const valFormatted = item.formattedTotal || val.toLocaleString('es-BO');
                  doc
                    .fillColor('#1C1510')
                    .fontSize(6.8)
                    .font('Helvetica-Bold')
                    .text(`${valFormatted} (${pct}%)`, legX + legW - 75, curY + 1, { width: 75, align: 'right' });

                  doc.rect(legX + 12, curY + 11, legW - 12, 2.5).fill('#F2EFEA');
                  doc.rect(legX + 12, curY + 11, Math.max(2, (legW - 12) * (pct / 100)), 2.5).fill(col);
                });
              } else if (rawType.includes('peak') || rawType.includes('area') || rawType.includes('line')) {
                // Gráfico de Picos / Área
                const topItems = report.chartData.slice(0, 10);
                const maxVal = Math.max(...topItems.map((d: any) => Number(d.total) || 0), 1);
                const startX = margin + 45;
                const plotW = contentWidth - 65;
                const baselineY = yPos + 138;
                const plotH = 92;

                [0, 0.5, 1].forEach((ratio) => {
                  const gy = baselineY - ratio * plotH;
                  doc.strokeColor('#EAE6DF').lineWidth(0.5).moveTo(startX, gy).lineTo(startX + plotW, gy).stroke();
                  const valLabel = Math.round(maxVal * ratio).toLocaleString('es-BO');
                  doc
                    .fillColor('#8C827A')
                    .fontSize(5.8)
                    .font('Helvetica')
                    .text(valLabel, margin + 8, gy - 3, { width: 32, align: 'right' });
                });

                const stepX = topItems.length > 1 ? plotW / (topItems.length - 1) : plotW;
                const points = topItems.map((item: any, idx: number) => {
                  const val = Number(item.total) || 0;
                  const px = startX + idx * stepX;
                  const py = baselineY - (val / maxVal) * plotH;
                  return { x: px, y: py, val, name: item.name };
                });

                if (points.length > 1) {
                  doc.save();
                  let pathStr = `M ${points[0].x} ${baselineY} L ${points[0].x} ${points[0].y}`;
                  for (let i = 1; i < points.length; i++) {
                    pathStr += ` L ${points[i].x} ${points[i].y}`;
                  }
                  pathStr += ` L ${points[points.length - 1].x} ${baselineY} Z`;
                  doc.path(pathStr).fill('#FAF2EB');
                  doc.restore();

                  doc.strokeColor('#8C5E35').lineWidth(2);
                  doc.moveTo(points[0].x, points[0].y);
                  for (let i = 1; i < points.length; i++) {
                    doc.lineTo(points[i].x, points[i].y);
                  }
                  doc.stroke();
                }

                points.forEach((pt: any) => {
                  doc.circle(pt.x, pt.y, 3).fill('#8C5E35');
                  doc.circle(pt.x, pt.y, 1.5).fill('#FFFFFF');
                  doc
                    .fillColor('#1C1510')
                    .fontSize(6)
                    .font('Helvetica-Bold')
                    .text(pt.val.toLocaleString('es-BO'), pt.x - 18, pt.y - 9, { width: 36, align: 'center' });
                  doc
                    .fillColor('#5E564D')
                    .fontSize(5.8)
                    .font('Helvetica')
                    .text(String(pt.name || ''), pt.x - 20, baselineY + 4, {
                      width: 40,
                      align: 'center',
                      ellipsis: true,
                    });
                });
              } else {
                // Gráfico de Barras Verticales por defecto
                const topItems = report.chartData.slice(0, 8);
                const maxVal = Math.max(...topItems.map((d: any) => Number(d.total) || 0), 1);
                const startX = margin + 45;
                const plotW = contentWidth - 65;
                const baselineY = yPos + 138;
                const plotH = 92;

                [0, 0.5, 1].forEach((ratio) => {
                  const gy = baselineY - ratio * plotH;
                  doc.strokeColor('#EAE6DF').lineWidth(0.5).moveTo(startX, gy).lineTo(startX + plotW, gy).stroke();
                  const valLabel = Math.round(maxVal * ratio).toLocaleString('es-BO');
                  doc
                    .fillColor('#8C827A')
                    .fontSize(5.8)
                    .font('Helvetica')
                    .text(valLabel, margin + 8, gy - 3, { width: 32, align: 'right' });
                });

                const slotW = plotW / topItems.length;
                const barW = Math.min(30, slotW * 0.65);

                topItems.forEach((item: any, idx: number) => {
                  const val = Number(item.total) || 0;
                  const barH = Math.max(3, (val / maxVal) * plotH);
                  const bx = startX + idx * slotW + (slotW - barW) / 2;
                  const by = baselineY - barH;
                  const col = palette[idx % palette.length];

                  doc.roundedRect(bx, by, barW, barH, 2).fill(col);
                  doc
                    .fillColor('#1C1510')
                    .fontSize(6.2)
                    .font('Helvetica-Bold')
                    .text(val.toLocaleString('es-BO'), bx - 6, by - 9, { width: barW + 12, align: 'center' });
                  doc
                    .fillColor('#5E564D')
                    .fontSize(5.8)
                    .font('Helvetica')
                    .text(String(item.name || ''), bx - 8, baselineY + 4, {
                      width: barW + 16,
                      align: 'center',
                      ellipsis: true,
                    });
                });
              }

              yPos += chartCardHeight + 14;
            }
          }
        }

        // --- 4. CÁLCULO INTELIGENTE DE ANCHOS PROPORCIONALES DE COLUMNAS ---
        const weights: Record<string, number> = {};
        report.columns.forEach((col) => {
          const key = col.key.toLowerCase();
          if (col.type === 'number' || key.includes('id') || key.includes('codigo')) {
            weights[col.key] = 1.0;
          } else if (col.type === 'currency' || key.includes('total') || key.includes('precio') || key.includes('subtotal')) {
            weights[col.key] = 1.35;
          } else if (col.type === 'date' || key.includes('fecha')) {
            weights[col.key] = 1.25;
          } else if (key.includes('producto') || key.includes('nombre') || key.includes('descripcion') || key.includes('motivo') || key.includes('cliente')) {
            weights[col.key] = 2.4;
          } else {
            weights[col.key] = 1.4;
          }
        });

        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
        const colWidths: Record<string, number> = {};
        report.columns.forEach((col) => {
          colWidths[col.key] = Math.floor(contentWidth * (weights[col.key] / totalWeight));
        });

        // Asegurar que sumen exactamente contentWidth
        const sumW = Object.values(colWidths).reduce((a, b) => a + b, 0);
        const lastCol = report.columns[report.columns.length - 1];
        if (lastCol) {
          colWidths[lastCol.key] += contentWidth - sumW;
        }

        // Función para dibujar encabezado de tabla repetible en cada página
        const drawTableHeader = (y: number) => {
          doc.rect(margin, y, contentWidth, 19).fill('#2E221A');
          doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold');
          let currentX = margin;
          report.columns.forEach((col) => {
            const w = colWidths[col.key] || 50;
            doc.text(col.label, currentX + 4, y + 5, {
              width: w - 8,
              align: col.type === 'number' || col.type === 'currency' ? 'right' : 'left',
              ellipsis: true,
            });
            currentX += w;
          });
        };

        const drawSubsequentPageHeader = (pageNumber: number) => {
          doc.rect(margin, margin, contentWidth, 20).fill('#1C1510');
          doc
            .fillColor('#D4AF37')
            .fontSize(8.5)
            .font('Helvetica-Bold')
            .text('DRESSLY BOUTIQUE', margin + 8, margin + 6);
          doc
            .fillColor('#FFFFFF')
            .fontSize(8)
            .font('Helvetica')
            .text(`— ${report.title.toUpperCase()} (Pág. ${pageNumber})`, margin + 115, margin + 6);
          doc
            .fillColor('#E5E7EB')
            .fontSize(7.5)
            .text(`Alcance: ${report.sucursalNombre}`, margin, margin + 6, {
              align: 'right',
              width: contentWidth - 8,
            });
          doc.rect(margin, margin + 20, contentWidth, 1).fill('#D4AF37');
        };

        // --- 5. DETALLE REGISTRADO (TABLA MULTIPÁGINA COMPLETA) ---
        if (yPos > pageHeight - 110) {
          doc.addPage();
          drawSubsequentPageHeader(doc.bufferedPageRange().count);
          yPos = margin + 28;
        } else {
          doc
            .fillColor('#1C1510')
            .fontSize(9.5)
            .font('Helvetica-Bold')
            .text(`Detalle Registrado (${report.rows.length} registros)`, margin, yPos);
          yPos += 14;
        }

        drawTableHeader(yPos);
        yPos += 19;

        // Filas de datos con cálculo de altura dinámico para evitar solapamientos
        doc.font('Helvetica').fontSize(7.5);

        report.rows.forEach((row, rIndex) => {
          // Calcular altura dinámica de la fila según el contenido de las columnas
          let maxCellHeight = 16;
          report.columns.forEach((col) => {
            const rawVal = row[col.key];
            const textVal = String(rawVal ?? '-');
            const w = colWidths[col.key] || 50;
            doc.fontSize(7.5);
            const h = doc.heightOfString(textVal, { width: w - 8 });
            if (h + 6 > maxCellHeight) {
              maxCellHeight = Math.min(h + 6, 40); // Límite de seguridad
            }
          });

          // Si la fila no cabe en la página actual, abrir nueva página
          if (yPos + maxCellHeight > pageHeight - 42) {
            doc.addPage();
            drawSubsequentPageHeader(doc.bufferedPageRange().count);
            yPos = margin + 28;
            drawTableHeader(yPos);
            yPos += 19;
            doc.font('Helvetica').fontSize(7.5);
          }

          const rowBg = rIndex % 2 === 0 ? '#FFFFFF' : '#FAF8F5';
          doc.rect(margin, yPos, contentWidth, maxCellHeight).fill(rowBg);

          doc.fillColor('#1F2937');
          let currentX = margin;
          report.columns.forEach((col) => {
            const rawVal = row[col.key];
            let displayVal = rawVal ?? '-';
            if (col.type === 'currency' && typeof rawVal === 'number') {
              displayVal = `Bs. ${rawVal.toLocaleString('es-BO', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`;
            } else if (col.type === 'number' && typeof rawVal === 'number') {
              displayVal = rawVal.toLocaleString('es-BO');
            }

            const w = colWidths[col.key] || 50;
            doc.text(String(displayVal), currentX + 4, yPos + 4, {
              width: w - 8,
              align: col.type === 'number' || col.type === 'currency' ? 'right' : 'left',
              ellipsis: true,
            });
            currentX += w;
          });

          yPos += maxCellHeight;
        });

        // --- 6. PIE DE PÁGINA PAGINADO OFICIAL EN TODAS LAS HOJAS ---
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);
          doc.rect(margin, pageHeight - 26, contentWidth, 0.5).fill('#D1C9BE');
          doc
            .fillColor('#8C827A')
            .fontSize(7.2)
            .text(
              'Dressly Boutique — Sistema Omnicanal de Retail y Reportes',
              margin,
              pageHeight - 20,
              { align: 'left', width: contentWidth / 2 },
            );
          doc
            .fillColor('#1C1510')
            .fontSize(7.5)
            .font('Helvetica-Bold')
            .text(
              `Página ${i + 1} de ${range.count}`,
              margin,
              pageHeight - 20,
              { align: 'center', width: contentWidth },
            );
          doc
            .fillColor('#8C827A')
            .fontSize(7.2)
            .font('Helvetica')
            .text(
              `Generado: ${report.generatedBy} | ${report.generatedAt}`,
              margin + contentWidth / 2,
              pageHeight - 20,
              { align: 'right', width: contentWidth / 2 },
            );
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
