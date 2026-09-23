import React, { useState, useEffect, useCallback } from 'react';
import { catalogAdminService } from '../../services/catalog-admin.service';
import { CategoryModal } from './CategoryModal';
import type { AdminCategory } from '../../types/catalog-admin.types';

import { useConfirm } from '../../../../../../shared/components/ConfirmModal';

interface CategoryTabProps {
  onFeedback: (type: 'success' | 'error', message: string) => void;
  onRefreshMetadata: () => void;
}

export const CategoryTab: React.FC<CategoryTabProps> = ({ onFeedback, onRefreshMetadata }) => {
  const { confirm } = useConfirm();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await catalogAdminService.getCategories();
      setCategories(data);
    } catch {
      onFeedback('error', 'Error al cargar categorías.');
    } finally {
      setLoading(false);
    }
  }, [onFeedback]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreateOrUpdate = async (data: any) => {
    if (selectedCategory) {
      await catalogAdminService.updateCategory(selectedCategory.id_categoria, data);
      onFeedback('success', 'Categoría actualizada exitosamente.');
    } else {
      await catalogAdminService.createCategory(data);
      onFeedback('success', 'Categoría creada exitosamente.');
    }
    fetchCategories();
    onRefreshMetadata();
  };

  const handleDelete = async (cat: AdminCategory) => {
    const ok = await confirm({
      title: 'Eliminar Categoría',
      message: `¿Estás seguro de eliminar la categoría "${cat.nombre}"?`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await catalogAdminService.deleteCategory(cat.id_categoria);
      onFeedback('success', 'Categoría eliminada exitosamente.');
      fetchCategories();
      onRefreshMetadata();
    } catch (err: any) {
      onFeedback('error', err.response?.data?.message || 'Error al eliminar la categoría.');
    }
  };

  return (
    <div className="catalog-tab-content">
      <div className="tab-toolbar">
        <div>
          <h3>Categorías del Catálogo</h3>
          <p className="tab-description">
            Organiza las prendas en categorías principales y subcategorías para la navegación comercial.
          </p>
        </div>
        <button
          type="button"
          className="admin-btn primary"
          onClick={() => {
            setSelectedCategory(null);
            setModalOpen(true);
          }}
        >
          + Nueva Categoría
        </button>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div className="table-loading-state">
            <div className="spinner-dots" />
            <p>Cargando categorías...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="table-empty-state">
            <span className="empty-emoji">📁</span>
            <h4>No hay categorías registradas</h4>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Jerarquía / Padre</th>
                <th>Descripción</th>
                <th>Productos</th>
                <th>Subcategorías</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id_categoria}>
                  <td>
                    <strong>{c.nombre}</strong>
                  </td>
                  <td>
                    {c.categoria_padre_nombre ? (
                      <span className="badge-hierarchy">↳ {c.categoria_padre_nombre}</span>
                    ) : (
                      <span className="badge-root">Categoría Principal</span>
                    )}
                  </td>
                  <td>{c.descripcion || <span className="text-muted">—</span>}</td>
                  <td>
                    <span className="count-pill">{c.total_productos} prendas</span>
                  </td>
                  <td>
                    <span className="count-pill sub">{c.total_subcategorias} subcategorías</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-buttons-group">
                      <button
                        type="button"
                        className="admin-btn sm secondary"
                        onClick={() => {
                          setSelectedCategory(c);
                          setModalOpen(true);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="admin-btn sm danger"
                        onClick={() => handleDelete(c)}
                        disabled={c.total_productos > 0 || c.total_subcategorias > 0}
                        title={
                          c.total_productos > 0 || c.total_subcategorias > 0
                            ? 'No se puede eliminar porque tiene elementos asociados'
                            : 'Eliminar categoría'
                        }
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

      <CategoryModal
        isOpen={modalOpen}
        category={selectedCategory}
        allCategories={categories}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
      />
    </div>
  );
};
