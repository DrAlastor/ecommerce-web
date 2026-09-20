import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../../../../components/layout/Navbar';
import { CartDrawer } from '../../../../../components/shop/CartDrawer';
import { WishlistDrawer } from '../../../../../components/shop/WishlistDrawer';
import { useShop } from '../../../../../context/ShopContext';
import { useCatalog } from '../hooks/useCatalog';
import { CatalogFilters } from '../components/CatalogFilters/CatalogFilters';
import { CatalogToolbar } from '../components/CatalogToolbar/CatalogToolbar';
import { ActiveFilterChips } from '../components/ActiveFilterChips/ActiveFilterChips';
import { ProductGrid } from '../components/ProductGrid/ProductGrid';
import { CatalogPagination } from '../components/CatalogPagination/CatalogPagination';
import './CatalogPage.css';

export const CatalogPage: React.FC = () => {
  const { toastMessage, setIsCartOpen } = useShop();
  const navigate = useNavigate();

  const {
    products,
    filterMeta,
    isLoading,
    errorMessage,
    currentPage,
    totalPages,
    totalProducts,
    selectedCategory,
    setSelectedCategory,
    selectedGender,
    setSelectedGender,
    searchQuery,
    setSearchQuery,
    selectedColors,
    selectedSizes,
    onlySale,
    setOnlySale,
    only3D,
    setOnly3D,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    sortBy,
    setSortBy,
    showMobileFilters,
    setShowMobileFilters,
    handleToggleColor,
    handleToggleSize,
    handleResetFilters,
    fetchProducts,
    setCurrentPage,
    toShopProduct,
  } = useCatalog();

  return (
    <div className="catalog-container">
      {/* Notificación Toast */}
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

      <main className="catalog-main">
        {/* Breadcrumbs */}
        <div className="catalog-breadcrumbs">
          <span onClick={() => navigate('/')}>Inicio</span> /{' '}
          <span onClick={handleResetFilters}>Catálogo</span>
          {selectedCategory !== 'all' && (
            <>
              {' '}
              / <span className="active">{selectedCategory}</span>
            </>
          )}
        </div>

        <div className="catalog-layout">
          {/* Botón flotante para filtros en móvil */}
          <button
            className="mobile-filters-btn"
            onClick={() => setShowMobileFilters(true)}
          >
            Filtros ({totalProducts} prendas)
          </button>

          {/* Sidebar de filtros modulares */}
          <CatalogFilters
            filterMeta={filterMeta}
            selectedCategory={selectedCategory}
            selectedGender={selectedGender}
            selectedColors={selectedColors}
            selectedSizes={selectedSizes}
            onlySale={onlySale}
            only3D={only3D}
            minPrice={minPrice}
            maxPrice={maxPrice}
            showMobileFilters={showMobileFilters}
            onCloseMobile={() => setShowMobileFilters(false)}
            onSelectCategory={(cat: string) => {
              setSelectedCategory(cat);
              setCurrentPage(1);
            }}
            onSelectGender={(gen: string) => {
              setSelectedGender(gen);
              setCurrentPage(1);
            }}
            onToggleSale={(sale: boolean) => {
              setOnlySale(sale);
              setCurrentPage(1);
            }}
            onToggle3D={(val: boolean) => {
              setOnly3D(val);
              setCurrentPage(1);
            }}
            onToggleColor={handleToggleColor}
            onToggleSize={handleToggleSize}
            onChangeMinPrice={setMinPrice}
            onChangeMaxPrice={setMaxPrice}
            onApplyPrice={() => setCurrentPage(1)}
            onResetFilters={handleResetFilters}
          />

          {/* Contenido Principal: Toolbar, Chips activos, Grilla y Paginación */}
          <div className="catalog-content">
            <CatalogToolbar
              sortBy={sortBy}
              onSortChange={(sort: string) => {
                setSortBy(sort);
                setCurrentPage(1);
              }}
              totalProducts={totalProducts}
            />

            <ActiveFilterChips
              selectedCategory={selectedCategory}
              selectedGender={selectedGender}
              selectedColors={selectedColors}
              selectedSizes={selectedSizes}
              onlySale={onlySale}
              only3D={only3D}
              searchQuery={searchQuery}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onRemoveCategory={() => {
                setSelectedCategory('all');
                setCurrentPage(1);
              }}
              onRemoveGender={() => {
                setSelectedGender('all');
                setCurrentPage(1);
              }}
              onRemoveColor={handleToggleColor}
              onRemoveSize={handleToggleSize}
              onRemoveSale={() => {
                setOnlySale(false);
                setCurrentPage(1);
              }}
              onRemove3D={() => {
                setOnly3D(false);
                setCurrentPage(1);
              }}
              onRemoveSearch={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              onRemovePrice={() => {
                setMinPrice('');
                setMaxPrice('');
                setCurrentPage(1);
              }}
              onResetAll={handleResetFilters}
            />

            <ProductGrid
              products={products}
              isLoading={isLoading}
              errorMessage={errorMessage}
              onRetry={fetchProducts}
              onResetFilters={handleResetFilters}
              toShopProduct={toShopProduct}
            />

            <CatalogPagination
              currentPage={currentPage}
              totalPages={totalPages}
              isLoading={isLoading}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
