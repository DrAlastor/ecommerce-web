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
