/**
 * Utilidad Oficial para Imprimir Comprobantes / Facturas Fiscales
 * Genera un documento aislado e impecable en un iframe invisible para garantizar
 * que el PDF / impresora renderice el 100% del contenido sin páginas en blanco.
 */

export interface PrintableReceiptItem {
  nombre_producto: string;
  sku?: string;
  color?: string;
  talla?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface PrintableReceiptData {
  codigo_factura: string;
  fecha_venta: string;
  cliente: {
    nombre_completo?: string;
    ci?: string | null;
  };
  tipo_venta?: string;
  estado?: string;
  items: PrintableReceiptItem[];
  subtotal: number;
  descuento?: number;
  total: number;
  pago?: {
    metodo_pago?: string;
    transaccion_externa?: string | null;
  } | null;
  envio?: {
    direccion?: string;
    ciudad?: string;
  } | null;
  sucursal_nombre?: string;
}

export function printReceipt(data: PrintableReceiptData): void {
  // 1. Formatear datos
  const fechaStr = new Date(data.fecha_venta).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const clienteNombre = data.cliente?.nombre_completo || 'Cliente General';
  const clienteCi = data.cliente?.ci || '0';
  const metodoPago =
    data.pago?.metodo_pago === 'stripe'
      ? 'Tarjeta de Crédito / Débito (Stripe)'
      : data.pago?.metodo_pago === 'qr'
      ? 'Pago QR Simple'
      : data.pago?.metodo_pago === 'efectivo'
      ? 'Efectivo en Mostrador'
      : 'Transferencia Bancaria';

  // 2. Construir filas de la tabla
  const itemsHtml = data.items
    .map(
      (it) => `
      <tr>
        <td style="text-align: center; padding: 8px 6px; border-bottom: 1px solid #E5E7EB; font-weight: 600;">${it.cantidad}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #E5E7EB;">
          <div style="font-weight: 700; color: #111827; font-size: 13px;">${it.nombre_producto}</div>
          <div style="font-size: 11px; color: #6B7280; margin-top: 2px;">
            ${it.talla ? `Talla: <strong>${it.talla}</strong> ` : ''}
            ${it.color ? `| Color: <strong>${it.color}</strong> ` : ''}
            ${it.sku ? `| SKU: ${it.sku}` : ''}
          </div>
        </td>
        <td style="text-align: right; padding: 8px 10px; border-bottom: 1px solid #E5E7EB; font-size: 13px;">
          ${Number(it.precio_unitario).toFixed(2)} Bs
        </td>
        <td style="text-align: right; padding: 8px 10px; border-bottom: 1px solid #E5E7EB; font-weight: 700; font-size: 13px; color: #111827;">
          ${Number(it.subtotal).toFixed(2)} Bs
        </td>
      </tr>
    `,
    )
    .join('');

  // 3. Documento HTML completo para impresión
  const printHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>Comprobante Fiscal - ${data.codigo_factura}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm 15mm 15mm 15mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #111827;
          background: #FFFFFF;
          margin: 0;
          padding: 10px;
          font-size: 12px;
          line-height: 1.4;
        }
        .receipt-container {
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          padding: 24px 28px;
          background: #FFFFFF;
        }
        .header-grid {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #111827;
          padding-bottom: 16px;
          margin-bottom: 18px;
        }
        .brand-title {
          font-size: 20px;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.02em;
          margin: 0 0 4px 0;
          text-transform: uppercase;
        }
        .brand-sub {
          font-size: 11px;
          color: #4B5563;
          margin: 0 0 2px 0;
        }
        .invoice-box {
          border: 2px solid #8C5E35;
          background: #FAF7F2;
          border-radius: 8px;
          padding: 10px 16px;
          text-align: right;
          min-width: 220px;
        }
        .invoice-box-tag {
          font-size: 10px;
          font-weight: 800;
          color: #8C5E35;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .invoice-box-num {
          font-size: 16px;
          font-weight: 800;
          color: #111827;
          margin: 4px 0;
        }
        .invoice-box-date {
          font-size: 11px;
          color: #6B7280;
        }
        .client-info-box {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 6px;
          padding: 12px 16px;
          margin-bottom: 18px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px 20px;
        }
        .info-item-label {
          font-size: 10px;
          text-transform: uppercase;
          font-weight: 700;
          color: #6B7280;
          margin-bottom: 2px;
        }
        .info-item-value {
          font-size: 13px;
          font-weight: 700;
          color: #111827;
        }
        table.items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 18px;
        }
        table.items-table th {
          background: #111827;
          color: #FFFFFF;
          padding: 9px 10px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 20px;
        }
        .totals-table {
          width: 320px;
          border-collapse: collapse;
        }
        .totals-table td {
          padding: 6px 10px;
          font-size: 12px;
        }
        .totals-table tr.total-row td {
          border-top: 2px solid #111827;
          font-size: 16px;
          font-weight: 800;
          color: #8C5E35;
          padding-top: 8px;
        }
        .fiscal-footer {
          border-top: 1px dashed #9CA3AF;
          padding-top: 14px;
          margin-top: 16px;
          text-align: center;
          font-size: 10px;
          color: #4B5563;
          line-height: 1.5;
        }
        .fiscal-legend {
          font-weight: 800;
          text-transform: uppercase;
          color: #111827;
          font-size: 10px;
          margin-bottom: 4px;
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <!-- Header -->
        <div class="header-grid">
          <div>
            <div class="brand-title">Dressly Fashion Store</div>
            <p class="brand-sub">Casa Matriz: Av. San Martín #450 • Equipetrol, Santa Cruz</p>
            <p class="brand-sub">NIT: 1029384019 • Autorización N°: 290400192831</p>
            <p class="brand-sub">Teléfono: (+591) 3 345-6789 • Web: www.dressly.fashion</p>
          </div>
          <div class="invoice-box">
            <div class="invoice-box-tag">Factura Comercial</div>
            <div class="invoice-box-num">${data.codigo_factura}</div>
            <div class="invoice-box-date">${fechaStr}</div>
          </div>
        </div>

        <!-- Client & Sale Info -->
        <div class="client-info-box">
          <div>
            <div class="info-item-label">Señor(es) / Razón Social:</div>
            <div class="info-item-value">${clienteNombre}</div>
          </div>
          <div>
            <div class="info-item-label">NIT / CI / Documento:</div>
            <div class="info-item-value">${clienteCi}</div>
          </div>
          <div>
            <div class="info-item-label">Modalidad de Venta:</div>
            <div class="info-item-value">${data.tipo_venta === 'digital' ? 'Tienda Online (E-Commerce)' : 'Punto de Venta Mostrador'}</div>
          </div>
          <div>
            <div class="info-item-label">Método de Pago:</div>
            <div class="info-item-value">${metodoPago}</div>
          </div>
        </div>

        <!-- Table of Items -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 50px; text-align: center;">Cant.</th>
              <th style="text-align: left;">Descripción de la Prenda</th>
              <th style="width: 100px; text-align: right;">P. Unit.</th>
              <th style="width: 110px; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
          <table class="totals-table">
            <tr>
              <td style="color: #6B7280;">Subtotal Artículos:</td>
              <td style="text-align: right; font-weight: 600;">${Number(data.subtotal).toFixed(2)} Bs</td>
            </tr>
            ${
              (data.descuento || 0) > 0
                ? `
            <tr>
              <td style="color: #059669;">Descuento Aplicado:</td>
              <td style="text-align: right; color: #059669; font-weight: 600;">-${Number(data.descuento).toFixed(2)} Bs</td>
            </tr>
            `
                : ''
            }
            <tr>
              <td style="color: #6B7280;">Costo de Envío:</td>
              <td style="text-align: right; font-weight: 600;">0.00 Bs</td>
            </tr>
            <tr class="total-row">
              <td>TOTAL PAGADO:</td>
              <td style="text-align: right;">${Number(data.total).toFixed(2)} Bs</td>
            </tr>
          </table>
        </div>

        <!-- Fiscal Legend Footer -->
        <div class="fiscal-footer">
          <div class="fiscal-legend">
            "ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS, EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE ACUERDO A LEY"
          </div>
          <div>Ley N° 453: El proveedor deberá suministrar el bien o servicio en las condiciones ofertadas y convenidas.</div>
          <div style="margin-top: 4px; font-family: monospace; font-size: 9px; color: #9CA3AF;">
            Código Control: A8-4F-3B-9C-1E • Fecha Límite Emisión: 31/12/2026
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // 4. Crear un iframe invisible para la impresión
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    // Fallback: abrir en ventana emergente
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(printHtml);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
        win.close();
      }, 350);
    }
    return;
  }

  doc.open();
  doc.write(printHtml);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Error al imprimir iframe:', e);
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  }, 400);
}
