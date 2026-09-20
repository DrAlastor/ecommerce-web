import React from 'react';
import { useProductAdmin } from '../../hooks/useProductAdmin';
import { ProductModal } from './ProductModal';
import { VariantManagerModal } from './VariantManagerModal';
import type { CatalogMetadata } from '../../types/catalog-admin.types';

interface ProductTabProps {
  metadata: CatalogMetadata | null;
  onFeedback: (type: 'success' | 'error', message: string) => void;
}

export const ProductTab: React.FC<ProductTabProps> = ({ metadata, onFeedback }) => {
  const {
    products,
    meta,
    loading,
    search,
    setSearch,
    idCategoria,
    setIdCategoria,
    estadoFilter,
    setEstadoFilter,
    page,
    setPage,
    productModalOpen,
    setProductModalOpen,
    selectedProduct,
    variantModalOpen,
    setVariantModalOpen,
    activeProductForVariants,
    fetchProducts,
    handleCreateOrUpdate,
    handleToggleStatus,
    openCreateModal,
    openEditModal,
    openVariantsModal,
  } = useProductAdmin(onFeedback);

  return (
    <div className="catalog-tab-content">
      {/* Barra de Filtros y Acciones */}
      <div className="tab-toolbar">
        <div className="toolbar-filters">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="admin-input search-box"
              placeholder="Buscar por nombre o descripción..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
              >
                ✕
              </button>
            )}
          </div>

          <select
            className="admin-select filter-select"
            value={idCategoria || ''}
            onChange={(e) => {
              setIdCategoria(e.target.value ? Number(e.target.value) : undefined);
              setPage(1);
            }}
          >
            <option value="">Todas las Categorías</option>
            {metadata?.categories.map((c) => (
              <option key={c.id_categoria} value={c.id_categoria}>
                {c.nombre}
              </option>
            ))}
          </select>

          <select
            className="admin-select filter-select"
            value={estadoFilter || ''}
            onChange={(e) => {
              setEstadoFilter((e.target.value as any) || undefined);
              setPage(1);
            }}
          >
            <option value="">Todos los Estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>

        <button type="button" className="admin-btn primary" onClick={openCreateModal}>
          + Nueva Prenda
        </button>
      </div>

      {/* Tabla de Productos */}
      <div className="admin-table-container">
        {loading ? (
          <div className="table-loading-state">
            <div className="spinner-dots" />
            <p>Cargando prendas del catálogo...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="table-empty-state">
            <span className="empty-emoji">📦</span>
            <h4>No se encontraron prendas</h4>
            <p>Prueba ajustando los criterios de búsqueda o agrega una nueva prenda al catálogo.</p>
            <button type="button" className="admin-btn secondary" onClick={openCreateModal}>
              Crear Prenda Ahora
            </button>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Prenda</th>
                <th>Categoría</th>
                <th>Colección</th>
                <th>Precio Base</th>
                <th>Variantes</th>
                <th>Promoción</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => {
                const isActivo = prod.estado === 'activo';
                return (
                  <tr key={prod.id_producto}>
                    <td>
                      <div className="product-table-cell">
                        <img
                          src={
                            prod.imagen_principal ||
                            'https://fashionstorestorage.blob.core.windows.net/productos/chaleco_sastre.png'
                          }
                          alt={prod.nombre}
                          className="product-thumbnail"
                        />
                        <div className="product-title-group">
                          <strong className="product-name">{prod.nombre}</strong>
                          <span className="product-gender-tag">{prod.genero || 'Unisex'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge-neutral">{prod.categoria.nombre}</span>
                    </td>
                    <td>
                      {prod.coleccion ? (
                        <span className="badge-collection">{prod.coleccion.nombre}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <strong>Bs {prod.precio_base.toFixed(2)}</strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="variant-count-badge"
                        onClick={() => openVariantsModal(prod)}
                        title="Administrar tallas, colores y SKUs"
                      >
                        🏷️ {prod.total_variantes} variantes
                      </button>
                    </td>
                    <td>
                      {prod.promocion_activa ? (
                        <span className="promo-badge-mini" title={prod.promocion_activa.nombre}>
                          -{prod.promocion_activa.valor_descuento}
                          {prod.promocion_activa.tipo_descuento === 'porcentaje' ? '%' : ' Bs'}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`status-pill-btn ${prod.estado}`}
                        onClick={() => handleToggleStatus(prod.id_producto, prod.estado)}
                        title={`Click para ${isActivo ? 'desactivar' : 'activar'}`}
                      >
                        {prod.estado}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-buttons-group">
                        <button
                          type="button"
                          className="admin-btn sm secondary"
                          onClick={() => openEditModal(prod)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="admin-btn sm primary"
                          onClick={() => openVariantsModal(prod)}
                        >
                          Variantes
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {meta.totalPages > 1 && (
        <div className="admin-pagination">
          <span className="pagination-info">
            Mostrando {products.length} de {meta.total} prendas registradas
          </span>
          <div className="pagination-controls">
            <button
              type="button"
              className="page-btn"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </button>
            <span className="current-page">
              Página {page} de {meta.totalPages}
            </span>
            <button
              type="button"
              className="page-btn"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal de Prenda */}
      <ProductModal
        isOpen={productModalOpen}
        product={selectedProduct}
        metadata={metadata}
        onClose={() => setProductModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
      />

      {/* Modal de Variantes */}
      <VariantManagerModal
        isOpen={variantModalOpen}
        product={activeProductForVariants}
        metadata={metadata}
        onClose={() => {
          setVariantModalOpen(false);
          fetchProducts();
        }}
        onFeedback={onFeedback}
      />
    </div>
  );
};
