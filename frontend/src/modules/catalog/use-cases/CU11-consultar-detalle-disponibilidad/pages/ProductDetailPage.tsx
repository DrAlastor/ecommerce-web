import React from 'react';
import { useProductDetail } from '../hooks/useProductDetail';
import { ProductGallery } from '../components/ProductGallery/ProductGallery';
import { ProductInfo } from '../components/ProductInfo/ProductInfo';
import { VariantSelector } from '../components/VariantSelector/VariantSelector';
import { ProductActions } from '../components/ProductActions/ProductActions';
import { BranchAvailability } from '../components/BranchAvailability/BranchAvailability';
import { VirtualFittingBadge } from '../components/VirtualFittingBadge/VirtualFittingBadge';
import { SizeGuideModal } from '../components/SizeGuideModal/SizeGuideModal';
import { Navbar } from '../../../../../components/layout/Navbar';
import { CartDrawer } from '../../../../../components/shop/CartDrawer';
import { WishlistDrawer } from '../../../../../components/shop/WishlistDrawer';
import { useShop } from '../../../../../context/ShopContext';
import { RefreshCw, AlertCircle } from 'lucide-react';
import './ProductDetailPage.css';

export const ProductDetailPage: React.FC = () => {
  const { toastMessage, setIsCartOpen } = useShop();

  const {
    product,
    isLoading,
    errorMessage,
    selectedColorId,
    setSelectedColorId,
    selectedTallaId,
    setSelectedTallaId,
    selectedVariant,
    quantity,
    setQuantity,
    activeImageIndex,
    setActiveImageIndex,
    isSizeGuideOpen,
    setIsSizeGuideOpen,
    activeTab,
    setActiveTab,
    currentPrice,
    originalPrice,
    hasDiscount,
    discountPercent,
    isAvailable,
    isFavorited,
    fetchProduct,
    handleAddToCart,
    handleToggleWishlist,
    navigate,
  } = useProductDetail();

  if (isLoading) {
    return (
      <div className="product-detail-page">
        <Navbar />
        <div className="product-detail-loading">
          <RefreshCw size={36} className="spin" />
          <p>Cargando información completa del producto...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !product) {
    return (
      <div className="product-detail-page">
        <Navbar />
        <div className="product-detail-error">
          <AlertCircle size={44} color="#DC2626" />
          <h2>Producto no disponible</h2>
          <p>{errorMessage || 'No se encontró la información del producto solicitado.'}</p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn-detail-retry" onClick={fetchProduct}>
              Reintentar
            </button>
            <button type="button" className="btn-detail-back" onClick={() => navigate('/catalog')}>
              Volver al Catálogo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <span className="toast-icon">✨</span>
          <span className="toast-text">{toastMessage}</span>
          <button className="toast-view-cart" onClick={() => setIsCartOpen(true)}>
            Ver bolsa
          </button>
        </div>
      )}

      {/* Navegación y Drawers */}
      <Navbar />
      <CartDrawer />
      <WishlistDrawer />

      <main className="product-detail-main">
        <div className="product-detail-grid">
          {/* Columna Izquierda: Galería */}
          <ProductGallery
            images={product.imagenes}
            activeImageIndex={activeImageIndex}
            onSelectImage={setActiveImageIndex}
            hasDiscount={hasDiscount}
            discountPercent={discountPercent}
            collectionName={product.coleccion?.nombre}
            has3DModel={Boolean(selectedVariant?.modelo_3d_url || product.tiene_modelo_3d)}
            isFavorited={isFavorited}
            onToggleFavorite={handleToggleWishlist}
          />

          {/* Columna Derecha: Información y Selectores */}
          <div className="product-details-content">
            <ProductInfo
              product={product}
              currentPrice={currentPrice}
              originalPrice={originalPrice}
              hasDiscount={hasDiscount}
              discountPercent={discountPercent}
              selectedSku={selectedVariant?.sku}
              onNavigateHome={() => navigate('/')}
              onNavigateCatalog={() => navigate('/catalog')}
            />

            {/* Selector de Talla y Color */}
            <VariantSelector
              colores={product.colores_disponibles}
              tallas={product.tallas_disponibles}
              variantes={product.variantes}
              selectedColorId={selectedColorId}
              selectedTallaId={selectedTallaId}
              hasSizeGuide={product.guia_tallas.length > 0}
              onSelectColor={setSelectedColorId}
              onSelectTalla={setSelectedTallaId}
              onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
            />

            {/* Acceso directo a Vestidor Virtual 3D */}
            <VirtualFittingBadge
              model3dUrl={selectedVariant?.modelo_3d_url}
            />

            {/* Acciones de Compra y Reserva */}
            <ProductActions
              quantity={quantity}
              isAvailable={isAvailable}
              hasSelectedVariant={Boolean(selectedVariant)}
              onQuantityChange={setQuantity}
              onAddToCart={handleAddToCart}
              onReserve={() => {
                alert(`Reserva iniciada para "${product.nombre}" (${selectedVariant?.color.nombre} - ${selectedVariant?.talla.codigo}). Se vinculará con el Módulo de Reservas.`);
              }}
            />

            {/* Pestañas de Detalle Adicional */}
            <div className="product-tabs-container">
              <div className="tabs-nav-bar">
                <button
                  type="button"
                  className={`tab-nav-btn ${activeTab === 'descripcion' ? 'active' : ''}`}
                  onClick={() => setActiveTab('descripcion')}
                >
                  Descripción & Cuidados
                </button>
                <button
                  type="button"
                  className={`tab-nav-btn ${activeTab === 'sucursales' ? 'active' : ''}`}
                  onClick={() => setActiveTab('sucursales')}
                >
                  Disponibilidad en Tiendas ({selectedVariant?.disponibilidad_sucursales.length || 0})
                </button>
                {product.guia_tallas.length > 0 && (
                  <button
                    type="button"
                    className={`tab-nav-btn ${activeTab === 'guia' ? 'active' : ''}`}
                    onClick={() => setActiveTab('guia')}
                  >
                    Guía de Tallas
                  </button>
                )}
              </div>

              {/* Contenido de la pestaña activa */}
              {activeTab === 'descripcion' && (
                <div className="tab-pane-description" style={{ fontSize: '0.9rem', color: '#4B5563', lineHeight: 1.6 }}>
                  <p>{product.descripcion || 'Sin descripción detallada proporcionada para este producto.'}</p>
                  <ul style={{ marginTop: '0.75rem', paddingLeft: '1.25rem' }}>
                    <li>Prenda confeccionada con estándares de alta costura contemporánea.</li>
                    <li>Lavar a mano con agua fría o en ciclo delicado.</li>
                    <li>No usar blanqueadores abrasivos. Plancha suave si es necesario.</li>
                  </ul>
                </div>
              )}

              {activeTab === 'sucursales' && (
                <BranchAvailability
                  sucursales={selectedVariant?.disponibilidad_sucursales || []}
                  selectedTalla={selectedVariant?.talla.codigo}
                  selectedColor={selectedVariant?.color.nombre}
                />
              )}

              {activeTab === 'guia' && product.guia_tallas.length > 0 && (
                <div>
                  <button
                    type="button"
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      backgroundColor: '#FFFFFF',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginBottom: '1rem',
                    }}
                    onClick={() => setIsSizeGuideOpen(true)}
                  >
                    Abrir tabla comparativa de tallas
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Guía de Tallas */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        categoryName={product.categoria.nombre}
        guideItems={product.guia_tallas}
        onClose={() => setIsSizeGuideOpen(false)}
      />
    </div>
  );
};

export default ProductDetailPage;
