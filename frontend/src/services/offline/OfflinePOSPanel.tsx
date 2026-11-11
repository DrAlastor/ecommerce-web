import { useCallback, useEffect, useRef, useState } from 'react';
import { administrativeTerminalBackup, closeOfflineCash, closeRecoveredOfflineCash, ensureOfflinePOS, offlineIncidents, offlinePending, prepareOfflinePOS, recoverOfflineOperation, resolveOfflineIncident, syncOfflinePOS } from './offlinePOS';
import type { AutomaticPOSState } from './offlinePOS';
import type { OfflineSale } from './offlineStorage';
import { saveOfflineCashCount } from './offlineStorage';
import { offlineContext } from './offlinePOS';
import { printReceipt } from '../../shared/utils/printReceipt';
import type { PaymentConfirmationResult } from '../../modules/sales-billing/types/payment-billing.types';

import './OfflinePOSPanel.css';

export function OfflinePOSPanel({
  branch,
  canResolve = false,
}: {
  branch: number | null;
  canResolve?: boolean;
}) {
  const [online, setOnline] = useState(navigator.onLine);
  const [sales, setSales] = useState<OfflineSale[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [initial, setInitial] = useState('0');
  const [counted, setCounted] = useState('0');
  const [incidents, setIncidents] = useState<
    { id: string; branch_id: number; response: { result?: { message?: string } } }[]
  >([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [recoveryNote, setRecoveryNote] = useState('');
  const [recoverySession, setRecoverySession] = useState('');
  const [verifiedRecovery, setVerifiedRecovery] = useState(false);
  const [automatic, setAutomatic] = useState<AutomaticPOSState>();
  const [preparing, setPreparing] = useState(false);
  const busyRef = useRef(busy);
  busyRef.current = busy;
  const cashIsOpen = Boolean(automatic?.preparation?.sessionId && !automatic.preparation.closed && Date.parse(automatic.preparation.expiresAt) !== 0);
  const errorText = (error: unknown) => (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error instanceof Error ? error.message : 'No se pudo completar la operación');

  // Estados de acordeón colapsables

  const printSale = (sale: OfflineSale) => {
    const receipt = (sale.status === 'CONFIRMED'
      ? sale.result
      : sale.receipt ?? sale.result) as PaymentConfirmationResult | undefined;
    if (!receipt?.items || !receipt.cliente) {
      setMessage('Esta operación no tiene un comprobante local disponible. Conserva su identificador para la conciliación.');
      return;
    }
    printReceipt({
      estado: receipt.estado_venta,
      codigo_factura: receipt.codigo_factura,
      fecha_venta: receipt.fecha,
      cliente: {
        nombre_completo: receipt.cliente.nombre_completo,
        ci: receipt.cliente.nit_ci,
      },
      items: receipt.items,
      subtotal: receipt.liquidacion.subtotal,
      descuento: receipt.liquidacion.descuento,
      total: receipt.liquidacion.total,
      pago: { metodo_pago: receipt.pago.metodo_pago },
    });
  };

  const refresh = useCallback(async () => {
    if (!branch) return;
    try {
      setSales(await offlinePending(branch));
    } catch {
      setSales([]);
    }
  }, [branch]);

  const sync = useCallback(async () => {
    if (!branch) return;
    setBusy(true);
    try {
      const result = await syncOfflinePOS(branch);
      setMessage(`Confirmadas: ${result.confirmed}. Revisión: ${result.review}. Pendientes de este envío: ${result.pending}.`);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo sincronizar');
    } finally {
      setBusy(false);
    }
  }, [branch, refresh]);

  useEffect(() => {
    void refresh();
    const changed = () => { void refresh(); };
    const connected = () => setOnline(true);
    const disconnected = () => setOnline(false);
    window.addEventListener('online', connected);
    window.addEventListener('offline', disconnected);
    window.addEventListener('offline-sales-changed', changed);
    return () => {
      window.removeEventListener('online', connected);
      window.removeEventListener('offline', disconnected);
      window.removeEventListener('offline-sales-changed', changed);
    };
  }, [refresh, sync]);
  useEffect(() => {
    if (!branch) return;
    let active = true;
    let running = false;
    setAutomatic(undefined);
    const prepare = async () => {
      if (!active || running || busyRef.current) return;
      running = true;
      setPreparing(true);
      try {
        if (navigator.onLine && (await offlinePending(branch)).some(sale => sale.status !== 'CONFIRMED')) await syncOfflinePOS(branch);
        const result = await ensureOfflinePOS(branch);
        if (active) {
          setAutomatic(result);
          if (result.preparation?.sessionId && !result.preparation.closed) setInitial(String((result.preparation.initialMinor ?? 0) / 100));
          await refresh();
        }
      } catch (error) { if (active) setMessage(errorText(error)); }
      finally { running = false; if (active) setPreparing(false); }
    };
    const resume = () => { void prepare(); };
    const visible = () => { if (document.visibilityState === 'visible') resume(); };
    void prepare();
    const timer = setInterval(() => { if (navigator.onLine && document.visibilityState === 'visible') resume(); }, 30000);
    window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', visible);
    navigator.serviceWorker?.addEventListener('controllerchange', resume);
    return () => {
      active = false; clearInterval(timer);
      window.removeEventListener('online', resume);
      document.removeEventListener('visibilitychange', visible);
      navigator.serviceWorker?.removeEventListener('controllerchange', resume);
    };
  }, [branch, refresh]);
  return <section aria-label="Operación offline" style={{ padding: 12, background: online ? '#eef5ff' : '#fff3cd', color: '#172337' }}>
    <strong>{online ? 'Con conexión' : 'Sin conexión — solo efectivo'}</strong>
    <span> · Pendientes: {sales.filter(s => s.status === 'PENDING').length} · Revisión: {sales.filter(s => s.status === 'REVIEW').length}</span>
    <p role="status">{preparing ? 'Actualizando datos para trabajar sin conexión…' : automatic?.status === 'ready' ? 'Modo offline disponible automáticamente. Caja abierta.' : automatic?.status === 'catalog' ? 'Catálogo guardado automáticamente. Abre la caja para cobrar.' : automatic?.status === 'blocked' ? 'Sincroniza o concilia las ventas pendientes para renovar los datos.' : automatic?.status === 'waiting' ? 'Preparando la aplicación para trabajar sin conexión…' : 'La preparación sin conexión se realiza automáticamente cuando el servidor está disponible.'}</p>
    {!cashIsOpen && <label>Fondo inicial de caja (Bs) <input type="number" min="0" step="0.01" value={initial} onChange={event => setInitial(event.target.value)} /></label>}
    {!cashIsOpen && <button disabled={!online || busy || preparing || automatic?.status === 'waiting' || !branch} onClick={async () => {
      if (!branch) return;
      setBusy(true);
      try { await prepareOfflinePOS(branch, Math.round(Number(initial) * 100)); setAutomatic(await ensureOfflinePOS(branch)); setMessage('Turno de caja abierto. El modo offline está disponible automáticamente.'); }
      catch (error) { setMessage(errorText(error)); }
      finally { setBusy(false); }
    }}>Abrir turno de caja</button>}
    <button disabled={!online || busy || preparing || !branch} onClick={() => void sync()}>Sincronizar pendientes</button>
    <button disabled={busy || !branch} onClick={async () => {
      if (!branch) return;
      try {
        const pending = canResolve && online ? await administrativeTerminalBackup(branch) : await offlinePending(branch);
        const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, sales: pending.filter(sale => sale.status !== 'CONFIRMED') }, null, 2)], { type: 'application/json' }));
        const link = document.createElement('a'); link.href = url; link.download = 'ventas-offline-pendientes.json'; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (error) { setMessage(errorText(error)); }
    }}>Descargar respaldo de pendientes</button>
    <p role="status">{message}</p>
    <details><summary>Arqueo provisional de ventas offline</summary>
      <p>Este arqueo incluye las ventas offline guardadas en esta terminal. Para el cierre definitivo deben conciliarse también las ventas online y los movimientos del turno.</p>
      <p>Fondo inicial: {Number(initial).toFixed(2)} Bs</p>
      <label>Efectivo contado (Bs) <input type="number" min="0" step="0.01" value={counted} onChange={e => setCounted(e.target.value)} /></label>
      <button disabled={!branch || busy || !cashIsOpen} onClick={async () => {
        if (!branch) return;
        setBusy(true);
        try { await saveOfflineCashCount(offlineContext(branch), Math.round(Number(initial) * 100), Math.round(Number(counted) * 100)); setMessage('Arqueo provisional guardado en esta terminal; falta conciliación para cerrar el turno.'); }
        catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo guardar el arqueo'); }
        finally { setBusy(false); }
      }}>Guardar arqueo provisional</button>
      <button disabled={!online || !branch || busy || !cashIsOpen} onClick={async () => {
        if (!branch) return;
        setBusy(true);
        try {
          await syncOfflinePOS(branch);
          const result = await closeOfflineCash(branch, Math.round(Number(counted) * 100));
          setAutomatic({ status: 'catalog' });
          setMessage(`Turno conciliado. Esperado: ${(result.expectedMinor / 100).toFixed(2)} Bs. Diferencia: ${(result.differenceMinor / 100).toFixed(2)} Bs.`);
          await refresh();
        } catch (error) { setMessage(errorText(error)); }
        finally { setBusy(false); }
      }}>Cerrar turno de efectivo conciliado</button>
    </details>
    {canResolve && <details><summary>Conciliación administrativa</summary>
      <label>Justificación de recuperación <input value={recoveryNote} onChange={event => setRecoveryNote(event.target.value)} /></label>
      <label>Recuperar respaldo de un cajero sin sesión <input type="file" accept="application/json" disabled={!online || busy || recoveryNote.trim().length < 10} onChange={async event => {
        const file = event.target.files?.[0];
        if (!file) return;
        setBusy(true);
        try {
          if (file.size > 1_000_000) throw new Error('El respaldo supera el tamaño admitido');
          const backup = JSON.parse(await file.text());
          if (backup.version !== 1 || !Array.isArray(backup.sales) || backup.sales.length > 100) throw new Error('Formato de respaldo inválido o más de 100 operaciones');
          for (const sale of backup.sales) await recoverOfflineOperation(sale, recoveryNote);
          setRecoverySession(backup.sales.find((sale: OfflineSale) => sale.sessionId)?.sessionId || '');
          setIncidents(await offlineIncidents());
          setMessage('Evidencia recuperada para revisión administrativa. Aún debe conciliarse cada venta.');
        } catch (error) { setMessage(errorText(error)); }
        finally { setBusy(false); event.target.value = ''; }
      }} /></label>
      <label>Turno recuperado (UUID) <input value={recoverySession} onChange={event => { setRecoverySession(event.target.value); setVerifiedRecovery(false); }} /></label>
      <label>Efectivo contado del turno recuperado (Bs) <input type="number" min="0" step="0.01" value={counted} onChange={event => setCounted(event.target.value)} /></label>
      <label><input type="checkbox" checked={verifiedRecovery} onChange={event => setVerifiedRecovery(event.target.checked)} />Verifiqué con el respaldo y los tickets que se recuperaron todas las operaciones del turno y conté el efectivo.</label>
      <button disabled={!online || busy || !verifiedRecovery || recoveryNote.trim().length < 10 || !recoverySession} onClick={async () => {
        setBusy(true);
        try {
          const result = await closeRecoveredOfflineCash(recoverySession, Math.round(Number(counted) * 100), recoveryNote);
          setMessage(`Turno recuperado cerrado. Esperado: ${(result.expectedMinor / 100).toFixed(2)} Bs. Diferencia: ${(result.differenceMinor / 100).toFixed(2)} Bs.`);
          setVerifiedRecovery(false);
        } catch (error) { setMessage(errorText(error)); }
        finally { setBusy(false); }
      }}>Cerrar turno recuperado con el efectivo contado</button>
      <button disabled={!online || busy} onClick={async () => {
        try { setIncidents(await offlineIncidents()); } catch (error) { setMessage(errorText(error)); }
      }}>Consultar incidencias</button>
      <p>Verifica el cobro y regulariza existencias mediante los movimientos de inventario existentes antes de aprobar. La aprobación respeta el precio preparado y queda auditada.</p>
      {incidents.map(incident => <div key={incident.id}>
        <p>{incident.id} · Sucursal {incident.branch_id} · {incident.response.result?.message || 'Requiere revisión'}</p>
        <label>Justificación <input value={notes[incident.id] || ''} onChange={event => setNotes(previous => ({ ...previous, [incident.id]: event.target.value }))} /></label>
        <button disabled={!online || busy || (notes[incident.id] || '').trim().length < 10} onClick={async () => {
          setBusy(true);
          try {
            await resolveOfflineIncident(incident.id, notes[incident.id]);
            setIncidents(await offlineIncidents());
            if (branch) await syncOfflinePOS(branch);
            await refresh();
            setMessage('Incidencia conciliada y resolución auditada.');
          } catch (error) { setMessage(errorText(error)); }
          finally { setBusy(false); }
        }}>Aprobar venta al precio preparado</button>
      </div>)}
    </details>}
    {sales.filter(s => s.status !== 'CONFIRMED').length > 0 && <details><summary>Ventas pendientes y con incidencias</summary>
      <ul>{sales.filter(s => s.status !== 'CONFIRMED').map(s => <li key={s.id}>{s.id} · {s.status === 'REVIEW' ? 'Requiere conciliación administrativa' : 'Pendiente'} · {(s.items.reduce((sum, i) => sum + i.quantity * i.priceMinor, 0) / 100).toFixed(2)} Bs <button onClick={() => printSale(s)}>Reimprimir provisional</button></li>)}</ul>
    </details>}
    {sales.some(sale => sale.status === 'CONFIRMED') && <details><summary>Comprobantes conciliados de esta terminal</summary><ul>{sales.filter(sale => sale.status === 'CONFIRMED').map(sale => <li key={sale.id}>{sale.id} <button onClick={() => printSale(sale)}>Imprimir comprobante conciliado</button></li>)}</ul></details>}
  </section>;
}
