import React from 'react';
import { useCatalogAdmin } from '../hooks/useCatalogAdmin';
import { CatalogAdminTabs } from '../components/CatalogAdminTabs/CatalogAdminTabs';
import { ProductTab } from '../components/ProductTab/ProductTab';
import { CategoryTab } from '../components/CategoryTab/CategoryTab';
import { SizeColorTab } from '../components/SizeColorTab/SizeColorTab';
import { SeasonCollectionTab } from '../components/SeasonCollectionTab/SeasonCollectionTab';
import { SizeGuideTab } from '../components/SizeGuideTab/SizeGuideTab';
import { PromotionTab } from '../components/PromotionTab/PromotionTab';
import './ManageCatalogPage.css';

export const ManageCatalogPage: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    metadata,
    feedback,
    showFeedback,
    fetchMetadata,
  } = useCatalogAdmin();

  return (
    <div className="manage-catalog-page">
      {/* Header del Caso de Uso CU12 */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Gestión de Catálogo Comercial</h1>
          <p className="admin-page-subtitle">
            Administra prendas, variantes, combinaciones de talla y color, colecciones, guías de medida y promociones.
          </p>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div className={`catalog-feedback-toast ${feedback.type}`}>
          <span>{feedback.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Barra de Pestañas de Navegación */}
      <CatalogAdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Renderizado de Sección Activa */}
      <div className="tab-pane-container">
        {activeTab === 'products' && (
          <ProductTab metadata={metadata} onFeedback={showFeedback} />
        )}
        {activeTab === 'categories' && (
          <CategoryTab onFeedback={showFeedback} onRefreshMetadata={fetchMetadata} />
        )}
        {activeTab === 'sizes-colors' && (
          <SizeColorTab onFeedback={showFeedback} onRefreshMetadata={fetchMetadata} />
        )}
        {activeTab === 'seasons-collections' && (
          <SeasonCollectionTab onFeedback={showFeedback} onRefreshMetadata={fetchMetadata} />
        )}
        {activeTab === 'size-guides' && (
          <SizeGuideTab metadata={metadata} onFeedback={showFeedback} />
        )}
        {activeTab === 'promotions' && (
          <PromotionTab onFeedback={showFeedback} />
        )}
      </div>
    </div>
  );
};

export default ManageCatalogPage;
