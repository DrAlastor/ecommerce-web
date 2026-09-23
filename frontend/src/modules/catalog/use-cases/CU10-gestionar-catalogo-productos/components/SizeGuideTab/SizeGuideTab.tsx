import React, { useState, useEffect, useCallback } from 'react';
import { catalogAdminService } from '../../services/catalog-admin.service';
import { SizeGuideModal } from './SizeGuideModal';
import type { AdminSizeGuide, CatalogMetadata } from '../../types/catalog-admin.types';
import { useConfirm } from '../../../../../../shared/components/ConfirmModal';

interface SizeGuideTabProps {
  metadata: CatalogMetadata | null;
  onFeedback: (type: 'success' | 'error', message: string) => void;
}

export const SizeGuideTab: React.FC<SizeGuideTabProps> = ({ metadata, onFeedback }) => {
  const { confirm } = useConfirm();
  const [guides, setGuides] = useState<AdminSizeGuide[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<AdminSizeGuide | null>(null);

  const fetchGuides = useCallback(async () => {
    setLoading(true);
    try {
      const data = await catalogAdminService.getSizeGuides(selectedCategory);
      setGuides(data);
    } catch (err: any) {
      onFeedback('error', 'Error al cargar guías de talla.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, onFeedback]);

  useEffect(() => {
    fetchGuides();
  }, [fetchGuides]);

  const handleCreateOrUpdate = async (data: any) => {
    if (selectedGuide) {
      await catalogAdminService.updateSizeGuide(selectedGuide.id_guia_talla, data);
      onFeedback('success', 'Guía de talla actualizada exitosamente.');
    } else {
      await catalogAdminService.createSizeGuide(data);
      onFeedback('success', 'Guía de talla creada exitosamente.');
    }
    fetchGuides();
  };

  const handleDelete = async (guide: AdminSizeGuide) => {
    const ok = await confirm({
      title: 'Eliminar Guía de Talla',
      message: `¿Estás seguro de eliminar la medida para "${guide.categoria?.nombre || 'Categoría'}" - ${guide.parte_cuerpo} (${guide.talla_etiqueta})?`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await catalogAdminService.deleteSizeGuide(guide.id_guia_talla);
      onFeedback('success', 'Guía de talla eliminada exitosamente.');
      fetchGuides();
    } catch (err: any) {
      onFeedback('error', err.response?.data?.message || 'Error al eliminar guía de talla.');
    }
  };

  return (
    <div className="catalog-tab-content">
      <div className="tab-toolbar">
        <div className="toolbar-filters">
          <select
            className="admin-select filter-select"
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Todas las Categorías</option>
            {metadata?.categories.map((c) => (
              <option key={c.id_categoria} value={c.id_categoria}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="admin-btn primary"
          onClick={() => {
            setSelectedGuide(null);
            setModalOpen(true);
          }}
        >
          + Nueva Medida Anatómica
        </button>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div className="table-loading-state">
            <div className="spinner-dots" />
            <p>Cargando guías de talla...</p>
          </div>
        ) : guides.length === 0 ? (
          <div className="table-empty-state">
            <span className="empty-emoji">📐</span>
            <h4>No hay guías de tallas registradas</h4>
            <p>Configura medidas anatómicas para ayudar a los clientes a elegir su talla ideal en el CU11.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Parte del Cuerpo</th>
                <th>Talla</th>
                <th>Rango en cm</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {guides.map((g) => (
                <tr key={g.id_guia_talla}>
                  <td>
                    <strong>{g.categoria?.nombre || `Categoría ${g.id_categoria}`}</strong>
                  </td>
                  <td>
                    <span className="badge-neutral">{g.parte_cuerpo}</span>
                  </td>
                  <td>
                    <span className="size-badge-pill">{g.talla_etiqueta}</span>
                  </td>
                  <td>
                    <strong>
                      {g.min_cm} - {g.max_cm} cm
                    </strong>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-buttons-group">
                      <button
                        type="button"
                        className="admin-btn sm secondary"
                        onClick={() => {
                          setSelectedGuide(g);
                          setModalOpen(true);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="admin-btn sm danger"
                        onClick={() => handleDelete(g)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <SizeGuideModal
        isOpen={modalOpen}
        guide={selectedGuide}
        metadata={metadata}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
      />
    </div>
  );
};
