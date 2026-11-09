/**
 * @caso-de-uso CU14 — Consultar sucursales
 * @subsistema Sucursales e Inventario
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> listado de sucursales -> controlador de consulta -> servicio de sucursales -> Ciudad/Sucursal/Disponibilidad.
 */
import React from 'react';
import { Sparkles } from 'lucide-react';

interface BranchesHeroProps {
  totalCities: number;
  totalBranches: number;
}

export const BranchesHero: React.FC<BranchesHeroProps> = React.memo(({ totalCities, totalBranches }) => {
  return (
    <section className="branches-hero">
      <div className="branches-hero-overlay"></div>
      <div className="branches-hero-content">
        <div className="branches-hero-pill">
          <Sparkles size={14} className="hero-sparkle" />
          <span>Red de Boutiques Exclusivas</span>
        </div>
        <h1 className="branches-hero-title">Nuestras Sucursales</h1>
        <p className="branches-hero-subtitle">
          Descubre nuestras tiendas físicas en toda Bolivia. Espacios pensados para brindarte
          una experiencia de moda personalizada, probadores de lujo y recojo inmediato de pedidos.
        </p>

        {/* Estadísticas de presencia */}
        <div className="branches-stats-strip">
          <div className="stat-item">
            <span className="stat-number">{totalCities || 4}</span>
            <span className="stat-label">Ciudades Principales</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">{totalBranches || 4}</span>
            <span className="stat-label">Boutiques Activas</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">100%</span>
            <span className="stat-label">Atención & Asesoría VIP</span>
          </div>
        </div>
      </div>
    </section>
  );
});

BranchesHero.displayName = 'BranchesHero';
