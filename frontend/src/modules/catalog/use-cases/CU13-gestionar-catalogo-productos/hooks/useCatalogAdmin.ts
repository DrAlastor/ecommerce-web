/**
 * @caso-de-uso CU10 — Gestionar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Control (presentación) — Frontend web
 * @responsabilidad Coordina estado, validaciones y acciones de la interfaz antes de delegar la operación al servicio o API.
 * @secuencia Administrador -> administración de catálogo -> controlador de productos -> servicio de catálogo -> Producto/Variante/Categoría/Colección/Promoción.
 */
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { catalogAdminService } from '../services/catalog-admin.service';
import type { CatalogTabKey, CatalogMetadata } from '../types/catalog-admin.types';

export function useCatalogAdmin() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab activo sincronizado con query params
  const initialTab = (searchParams.get('tab') as CatalogTabKey) || 'products';
  const [activeTab, setActiveTabState] = useState<CatalogTabKey>(initialTab);

  const [metadata, setMetadata] = useState<CatalogMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const setActiveTab = (tab: CatalogTabKey) => {
    setActiveTabState(tab);
    setSearchParams({ tab });
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const fetchMetadata = useCallback(async () => {
    setLoadingMetadata(true);
    try {
      const data = await catalogAdminService.getMetadata();
      setMetadata(data);
    } catch (err: any) {
      console.error('Error al cargar metadatos del catálogo:', err);
    } finally {
      setLoadingMetadata(false);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Si cambia el query param directamente
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as CatalogTabKey;
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTabState(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  return {
    activeTab,
    setActiveTab,
    metadata,
    loadingMetadata,
    feedback,
    showFeedback,
    fetchMetadata,
  };
}
