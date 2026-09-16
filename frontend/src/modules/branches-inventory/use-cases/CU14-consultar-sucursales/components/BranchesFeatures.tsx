import React from 'react';
import { Sparkles, Calendar, CheckCircle2 } from 'lucide-react';

export const BranchesFeatures: React.FC = React.memo(() => {
  return (
    <section className="branches-features-section">
      <h2 className="features-title">Experiencia Dressly en Tienda Física</h2>
      <div className="features-grid">
        <div className="feature-item">
          <div className="feature-icon-wrapper">
            <Sparkles size={22} />
          </div>
          <h4>Asesoría de Estilo Personal</h4>
          <p>Nuestros expertos en imagen te guiarán para encontrar las piezas ideales según tu silueta y ocasión.</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon-wrapper">
            <Calendar size={22} />
          </div>
          <h4>Reserva & Prueba en Tienda</h4>
          <p>Selecciona tus prendas favoritas online y resérvalas en tu sucursal más cercana para probártelas con calma.</p>
        </div>
        <div className="feature-item">
          <div className="feature-icon-wrapper">
            <CheckCircle2 size={22} />
          </div>
          <h4>Retiro de Compras Inmediato</h4>
          <p>Compra a través de nuestra web o app móvil y recoge en tienda sin filas y sin costo de envío.</p>
        </div>
      </div>
    </section>
  );
});

BranchesFeatures.displayName = 'BranchesFeatures';
