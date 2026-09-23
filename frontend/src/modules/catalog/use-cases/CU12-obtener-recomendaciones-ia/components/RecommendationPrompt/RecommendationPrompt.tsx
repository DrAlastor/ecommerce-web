/**
 * @caso-de-uso CU12 — Obtener recomendaciones de prendas mediante IA
 * @subsistema Experiencia Inteligente
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> asistente de recomendaciones -> controlador de IA -> servicio de recomendaciones -> Catálogo/Preferencias/Proveedor de IA.
 */
import React from 'react';
import { Sparkles } from 'lucide-react';

interface RecommendationPromptProps {
  prompt: string;
  loading: boolean;
  onPromptChange: (prompt: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}

export const RecommendationPrompt: React.FC<RecommendationPromptProps> = ({
  prompt,
  loading,
  onPromptChange,
  onSubmit,
}) => (
  <form className="recommendation-prompt" onSubmit={onSubmit}>
    <div className="prompt-input-wrap">
      <Sparkles size={18} />
      <input
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        placeholder="Busco algo casual para primavera..."
      />
    </div>
    <button type="submit" disabled={loading}>
      {loading ? 'Generando...' : 'Recomendar'}
    </button>
  </form>
);
