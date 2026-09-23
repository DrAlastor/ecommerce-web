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

      summarySheet.getColumn('A').width = 28;
      summarySheet.getColumn('B').width = 32;
      summarySheet.getColumn('C').width = 40;

      // ==========================================
      // HOJA 2: LISTADO DETALLADO
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
        dataSheet.getColumn(idx + 1).width = Math.min(Math.max(maxLen + 4, 12), 50);
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
   * Genera documento PDF con presentación ejecutiva, membrete corporativo,
   * bloques de indicadores y tabla con soporte multipágina.
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

        // --- ENCABEZADO CORPORATIVO ---
        doc
          .rect(margin, margin, contentWidth, 54)
          .fill('#1C1510');

        doc
          .fillColor('#D4AF37')
          .fontSize(16)
          .font('Helvetica-Bold')
          .text('FASHIONSTORE', margin + 16, margin + 12);

        doc
          .fillColor('#FFFFFF')
          .fontSize(11)
          .font('Helvetica')
          .text(report.title.toUpperCase(), margin + 16, margin + 32);

        doc
          .fillColor('#E5E7EB')
          .fontSize(8.5)
          .text(`Período: ${report.periodo}`, margin, margin + 14, {
            align: 'right',
            width: contentWidth - 16,
          })
          .text(`Alcance: ${report.sucursalNombre}`, margin, margin + 27, {
            align: 'right',
            width: contentWidth - 16,
          })
          .text(`Emisión: ${report.generatedAt}`, margin, margin + 40, {
            align: 'right',
            width: contentWidth - 16,
          });

        doc.moveDown(2);
        let yPos = margin + 68;

        // --- RESUMEN DE INDICADORES (TARJETAS) ---
        if (report.indicators && report.indicators.length > 0) {
          const maxKpis = Math.min(report.indicators.length, 4);
          const kpiWidth = (contentWidth - (maxKpis - 1) * 8) / maxKpis;

          for (let i = 0; i < maxKpis; i++) {
            const ind = report.indicators[i];
            const kpiX = margin + i * (kpiWidth + 8);

            doc
              .roundedRect(kpiX, yPos, kpiWidth, 44, 4)
              .fillAndStroke('#F8F5F0', '#E5E0D8');

            doc
              .fillColor('#736B63')
              .fontSize(7.5)
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
              .fontSize(12)
              .font('Helvetica-Bold')
              .text(`${valStr}${ind.suffix ? ' ' + ind.suffix : ''}`, kpiX + 6, yPos + 22, {
                width: kpiWidth - 12,
                ellipsis: true,
              });
          }

          yPos += 54;
        }

        // --- TABLA DE DATOS ---
        doc
          .fillColor('#1C1510')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Detalle Registrado', margin, yPos);

        yPos += 16;

        // Anchos proporcionales de columnas
        const colWidth = contentWidth / report.columns.length;

        const drawTableHeader = (y: number) => {
          doc.rect(margin, y, contentWidth, 20).fill('#2E221A');
          doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
          report.columns.forEach((col, idx) => {
            doc.text(col.label, margin + idx * colWidth + 4, y + 5, {
              width: colWidth - 8,
              align: col.type === 'number' || col.type === 'currency' ? 'right' : 'left',
              ellipsis: true,
            });
          });
        };

        drawTableHeader(yPos);
        yPos += 20;

        // Filas de datos
        doc.font('Helvetica').fontSize(7.5);

        report.rows.forEach((row, rIndex) => {
          // Si nos acercamos al final de la página, añadir página
          if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = margin;
            drawTableHeader(yPos);
            yPos += 20;
            doc.font('Helvetica').fontSize(7.5);
          }

          const rowBg = rIndex % 2 === 0 ? '#FFFFFF' : '#FAF8F5';
          doc.rect(margin, yPos, contentWidth, 16).fill(rowBg);

          doc.fillColor('#1F2937');
          report.columns.forEach((col, idx) => {
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

            doc.text(String(displayVal), margin + idx * colWidth + 4, yPos + 4, {
              width: colWidth - 8,
              align: col.type === 'number' || col.type === 'currency' ? 'right' : 'left',
              ellipsis: true,
            });
          });

          yPos += 16;
        });

        // --- PIE DE PÁGINA CON NÚMEROS DE PÁGINA ---
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i);
          doc
            .fillColor('#8C827A')
            .fontSize(7.5)
            .text(
              `FashionStore — Página ${i + 1} de ${range.count} | Generado por: ${report.generatedBy}`,
              margin,
              pageHeight - 24,
              { align: 'center', width: contentWidth },
            );
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
