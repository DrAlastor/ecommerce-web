/**
 * @caso-de-uso CU10 — Gestionar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Administrador -> administración de catálogo -> controlador de productos -> servicio de catálogo -> Producto/Variante/Categoría/Colección/Promoción.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { catalogAdminService } from '../../services/catalog-admin.service';
import { PromotionModal } from './PromotionModal';
import type { AdminPromotion, AdminProduct } from '../../types/catalog-admin.types';

interface PromotionTabProps {
  onFeedback: (type: 'success' | 'error', message: string) => void;
}

export const PromotionTab: React.FC<PromotionTabProps> = ({ onFeedback }) => {
  const [promotions, setPromotions] = useState<AdminPromotion[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<AdminPromotion | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [promoData, prodData] = await Promise.all([
        catalogAdminService.getPromotions(),
        catalogAdminService.getProducts({ limit: 100 }),
      ]);
      setPromotions(promoData);
      setProducts(prodData.data);
    } catch (err: any) {
      onFeedback('error', 'Error al cargar promociones.');
    } finally {
      setLoading(false);
    }
  }, [onFeedback]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateOrUpdate = async (data: any) => {
    if (selectedPromotion) {
      await catalogAdminService.updatePromotion(selectedPromotion.id_promocion, data);
      if (data.product_ids) {
        await catalogAdminService.assignProductsToPromotion(
          selectedPromotion.id_promocion,
          data.product_ids,
        );
      }
      onFeedback('success', 'Promoción actualizada exitosamente.');
    } else {
      await catalogAdminService.createPromotion(data);
      onFeedback('success', 'Promoción creada exitosamente.');
    }
    fetchData();
  };

  const handleToggleStatus = async (promo: AdminPromotion) => {
    const nextStatus = promo.estado === 'activo' ? 'inactivo' : 'activo';
    try {
      await catalogAdminService.togglePromotionStatus(promo.id_promocion, nextStatus);
      onFeedback('success', `Promoción cambiada a ${nextStatus}.`);
      fetchData();
    } catch (err: any) {
      onFeedback('error', err.response?.data?.message || 'Error al cambiar estado.');
    }
  };

  return (
    <div className="catalog-tab-content">
      <div className="tab-toolbar">
        <div>
          <h3>Promociones Comerciales</h3>
          <p className="tab-description">
            Configura descuentos en porcentaje o monto fijo y asígnalos a prendas específicas del catálogo.
          </p>
        </div>
        <button
          type="button"
          className="admin-btn primary"
          onClick={() => {
            setSelectedPromotion(null);
            setModalOpen(true);
          }}
        >
          + Nueva Promoción
        </button>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div className="table-loading-state">
            <div className="spinner-dots" />
            <p>Cargando promociones...</p>
          </div>
        ) : promotions.length === 0 ? (
          <div className="table-empty-state">
            <span className="empty-emoji">🏷️</span>
            <h4>No hay promociones configuradas</h4>
            <p>Crea tu primera promoción para incentivar las ventas en la tienda.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Promoción</th>
                <th>Descuento</th>
                <th>Vigencia</th>
                <th>Usos / Límite</th>
                <th>Prendas Asociadas</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((pr) => {
                const isPorcentaje = pr.tipo_descuento === 'porcentaje';
                const isActiva = pr.estado === 'activo';

                return (
                  <tr key={pr.id_promocion}>
                    <td>
                      <strong>{pr.nombre}</strong>
                    </td>
                    <td>
                      <span className="discount-tag-badge">
                        -{pr.valor_descuento}
                        {isPorcentaje ? '%' : ' Bs'}
                      </span>
                    </td>
                    <td>
                      <div className="dates-compact">
                        <span>{new Date(pr.fecha_inicio).toLocaleDateString()}</span>
                        <span>al {new Date(pr.fecha_fin).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td>
                      <span>
                        {pr.usos_actuales} {pr.limite_usos ? `/ ${pr.limite_usos}` : 'usos (sin límite)'}
                      </span>
                    </td>
                    <td>
                      <span className="count-pill">
                        {pr.productos_asociados?.length || 0} prendas
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`status-pill-btn ${pr.estado}`}
                        onClick={() => handleToggleStatus(pr)}
                        title={`Click para ${isActiva ? 'desactivar' : 'activar'}`}
                      >
                        {pr.estado}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-buttons-group">
                        <button
                          type="button"
                          className="admin-btn sm secondary"
                          onClick={() => {
                            setSelectedPromotion(pr);
                            setModalOpen(true);
                          }}
                        >
                          Editar / Asignar
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

      <PromotionModal
        isOpen={modalOpen}
        promotion={selectedPromotion}
        products={products}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
      />
    </div>
  );
};
