import { useEffect } from 'react';

export function SaasPaymentReturnPage() {
  const cancelled = new URLSearchParams(window.location.search).get('status') === 'cancelled';
  useEffect(() => {
    try {
      if (window.opener && !window.opener.closed) window.opener.focus();
    } finally {
      window.close();
    }
  }, []);
  return <main style={{maxWidth: 560, margin: '80px auto', padding: 24, textAlign: 'center'}}>
    <h1>{cancelled ? 'Pago cancelado' : 'Regresa al registro de tu empresa'}</h1>
    <p>{cancelled ? 'Puedes volver a intentarlo desde la ventana de registro.' : 'Cierra esta ventana y pulsa «Ya pagué: verificar y crear empresa» en la ventana original. El servidor comprobará el pago.'}</p>
    <button onClick={() => window.close()}>Cerrar ventana</button>
  </main>;
}
