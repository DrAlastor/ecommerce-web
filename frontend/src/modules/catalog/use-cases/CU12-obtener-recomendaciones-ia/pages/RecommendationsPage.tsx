/**
 * @caso-de-uso CU12 — Obtener recomendaciones de prendas mediante IA
 * @subsistema Experiencia Inteligente
 * @capa Boundary — Frontend web
 * @responsabilidad Representa la pantalla principal de Frontend web; compone la interfaz e inicia las acciones del caso de uso.
 * @secuencia Cliente -> asistente de recomendaciones -> controlador de IA -> servicio de recomendaciones -> Catálogo/Preferencias/Proveedor de IA.
 */
import React from 'react';
import { Navbar } from '../../../../../components/layout/Navbar';
import { RecommendationCard } from '../components/RecommendationCard/RecommendationCard';
import { RecommendationPrompt } from '../components/RecommendationPrompt/RecommendationPrompt';
import { useRecommendations } from '../hooks/useRecommendations';
import './RecommendationsPage.css';

export const RecommendationsPage: React.FC = () => {
  const recommendations = useRecommendations();

  return (
    <div className="recommendations-page">
      <Navbar />
      <main className="recommendations-main">
        <section className="recommendations-header">
          <span>Recomendaciones IA</span>
          <h1>Recomendado para ti</h1>
          <p>
            Sugerencias personalizadas con productos reales del catalogo y disponibilidad confirmada.
          </p>
        </section>

        <RecommendationPrompt
          prompt={recommendations.prompt}
          loading={recommendations.loading}
          onPromptChange={recommendations.setPrompt}
          onSubmit={recommendations.handleSubmit}
        />

        {!recommendations.isAuthenticated ? (
          <section className="recommendations-empty">
            <h2>Inicia sesion para activar tus recomendaciones</h2>
            <p>Usaremos tus preferencias e interacciones previas sin exponer datos personales innecesarios.</p>
            <button type="button" onClick={recommendations.goToLogin}>Iniciar sesion</button>
          </section>
        ) : recommendations.errorMessage ? (
          <section className="recommendations-empty">
            <h2>No pudimos generar recomendaciones</h2>
            <p>{recommendations.errorMessage}</p>
            <button type="button" onClick={() => recommendations.fetchRecommendations()}>Reintentar</button>
          </section>
        ) : recommendations.loading && recommendations.products.length === 0 ? (
          <section className="recommendations-grid">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="recommendation-skeleton" />)}
          </section>
        ) : (
          <>
            <div className="recommendations-source">
              Motor activo: {recommendations.source === 'ai' ? 'servicio de IA' : 'recomendacion local del MVP'}
            </div>
            <section className="recommendations-grid">
              {recommendations.products.map((product) => (
                <RecommendationCard
                  key={product.id_producto}
                  product={product}
                  onOpenProduct={recommendations.openProduct}
                />
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default RecommendationsPage;
