/**
 * @caso-de-uso CU14 — Consultar sucursales
 * @subsistema Sucursales e Inventario
 * @capa Boundary — Frontend web
 * @responsabilidad Representa la pantalla principal de Frontend web; compone la interfaz e inicia las acciones del caso de uso.
 * @secuencia Cliente -> listado de sucursales -> controlador de consulta -> servicio de sucursales -> Ciudad/Sucursal/Disponibilidad.
 */
import React from 'react';
import { Store, AlertCircle } from 'lucide-react';
import { Navbar } from '../../../../../components/layout/Navbar';
import { CartDrawer } from '../../../../../components/shop/CartDrawer';
import { WishlistDrawer } from '../../../../../components/shop/WishlistDrawer';
import { useShop } from '../../../../../context/ShopContext';
import { useBranches } from '../hooks/useBranches';
import { BranchesHero } from '../components/BranchesHero';
import { BranchesControls } from '../components/BranchesControls';
import { BranchCard } from '../components/BranchCard';
import { BranchModal } from '../components/BranchModal';
import { BranchesFeatures } from '../components/BranchesFeatures';
import './BranchesPage.css';

export const BranchesPage: React.FC = () => {
  const { toastMessage, setIsCartOpen } = useShop();
  const {
    branches,
    cities,
    filteredBranches,
    loading,
    error,
    selectedCityId,
    setSelectedCityId,
    searchQuery,
    setSearchQuery,
    selectedBranchForModal,
    setSelectedBranchForModal,
    copiedPhoneId,
    handleCopyPhone,
    handleResetFilters,
    refetch,
  } = useBranches();

  return (
    <div className="branches-page-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="toast-notification">
          <span className="toast-icon">✨</span>
          <span className="toast-text">{toastMessage}</span>
          <button className="toast-view-cart" onClick={() => setIsCartOpen(true)}>
            Ver bolsa
          </button>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar />

      {/* Cart & Wishlist Drawers */}
      <CartDrawer />
      <WishlistDrawer />

      {/* HERO SECTION */}
      <BranchesHero
        totalCities={cities.length}
        totalBranches={branches.length}
      />

      {/* FILTROS Y CONTENIDO */}
      <div className="branches-main-wrapper">
        <BranchesControls
          cities={cities}
          branches={branches}
          selectedCityId={selectedCityId}
          onSelectCity={setSelectedCityId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* FEEDBACK DE ESTADO */}
        {loading && (
          <div className="branches-loading-state">
            <div className="branches-spinner"></div>
            <p>Localizando nuestras boutiques...</p>
          </div>
        )}

        {error && (
          <div className="branches-error-banner">
            <AlertCircle size={24} />
            <div className="error-text">
              <h4>Error de conexión</h4>
              <p>{error}</p>
            </div>
            <button className="retry-btn" onClick={refetch}>
              Reintentar
            </button>
          </div>
        )}

        {/* LISTADO DE SUCURSALES */}
        {!loading && !error && (
          <>
            {filteredBranches.length === 0 ? (
              <div className="branches-empty-state">
                <Store size={48} className="empty-icon" />
                <h3>No se encontraron sucursales</h3>
                <p>
                  No hay establecimientos que coincidan con tus criterios de búsqueda en este momento.
                </p>
                <button
                  className="reset-filters-btn"
                  onClick={handleResetFilters}
                >
                  Ver todas las sucursales
                </button>
              </div>
            ) : (
              <div className="branches-grid">
                {filteredBranches.map((branch) => (
                  <BranchCard
                    key={branch.id_sucursal}
                    branch={branch}
                    onOpenModal={setSelectedBranchForModal}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* BENEFICIOS EN TIENDA FÍSICA */}
        <BranchesFeatures />
      </div>

      {/* MODAL DETALLE DE SUCURSAL */}
      <BranchModal
        branch={selectedBranchForModal}
        onClose={() => setSelectedBranchForModal(null)}
        copiedPhoneId={copiedPhoneId}
        onCopyPhone={handleCopyPhone}
      />
    </div>
  );
};

export default BranchesPage;
