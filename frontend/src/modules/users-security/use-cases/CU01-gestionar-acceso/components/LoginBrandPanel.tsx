/**
 * @caso-de-uso CU01 — Gestionar acceso al sistema
 * @subsistema Usuarios y Seguridad
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Usuario -> interfaz de acceso -> controlador de autenticación -> servicio de acceso -> Usuario/Rol/Sesión/Bitácora.
 */
import React from 'react';

function TruckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

export const LoginBrandPanel: React.FC = () => {
  return (
    <div className="login-brand-panel">
      <div className="brand-content">
        <div className="brand-logo">Dressly</div>
        <div className="brand-tagline">Fashion Store</div>

        <div className="brand-decorative-line" />

        <h1 className="brand-headline">
          Eleva tu estilo <br />
          de cada día
        </h1>

        <p className="brand-description">
          Descubre piezas atemporales diseñadas con confort,
          pensadas con elegancia, creadas para ti.
        </p>

        <div className="brand-features">
          <div className="brand-feature">
            <div className="brand-feature-icon">
              <TruckIcon />
            </div>
            <span>Envío gratis</span>
          </div>
          <div className="brand-feature">
            <div className="brand-feature-icon">
              <ShieldIcon />
            </div>
            <span>Pago seguro</span>
          </div>
          <div className="brand-feature">
            <div className="brand-feature-icon">
              <HeartIcon />
            </div>
            <span>Estilo premium</span>
          </div>
        </div>
      </div>
    </div>
  );
};
