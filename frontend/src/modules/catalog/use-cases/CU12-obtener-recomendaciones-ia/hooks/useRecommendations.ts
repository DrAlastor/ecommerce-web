/**
 * @caso-de-uso CU12 — Obtener recomendaciones de prendas mediante IA
 * @subsistema Experiencia Inteligente
 * @capa Control (presentación) — Frontend web
 * @responsabilidad Coordina estado, validaciones y acciones de la interfaz antes de delegar la operación al servicio o API.
 * @secuencia Cliente -> asistente de recomendaciones -> controlador de IA -> servicio de recomendaciones -> Catálogo/Preferencias/Proveedor de IA.
 */
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../users-security/shared/components/AuthContext';
import { recommendationsService } from '../services/recommendations.service';
import type { RecommendedProduct } from '../types/recommendations.types';

export function useRecommendations() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [prompt, setPrompt] = useState('');
  const [source, setSource] = useState<'ai' | 'local'>('local');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async (customPrompt?: string) => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setErrorMessage('Inicia sesion para recibir recomendaciones personalizadas.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await recommendationsService.getRecommendations({
        prompt: customPrompt ?? prompt,
        limit: 6,
      });
      setProducts(response.data);
      setSource(response.meta.source);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'No se pudieron generar recomendaciones.');
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, prompt]);

  useEffect(() => {
    fetchRecommendations('');
  }, [fetchRecommendations]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    fetchRecommendations(prompt);
  };

  const openProduct = (productId: number) => {
    navigate(`/product/${productId}`);
  };

  const goToLogin = () => {
    navigate('/login');
  };

  return {
    products,
    prompt,
    setPrompt,
    source,
    loading,
    errorMessage,
    isAuthenticated,
    authLoading,
    handleSubmit,
    fetchRecommendations,
    openProduct,
    goToLogin,
  };
}
