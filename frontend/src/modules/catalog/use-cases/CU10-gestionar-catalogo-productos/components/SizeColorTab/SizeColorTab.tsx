import React, { useState, useEffect, useCallback } from 'react';
import { catalogAdminService } from '../../services/catalog-admin.service';
import { SizeModal } from './SizeModal';
import { ColorModal } from './ColorModal';
import type { AdminSize, AdminColor } from '../../types/catalog-admin.types';
import { useConfirm } from '../../../../../../shared/components/ConfirmModal';

interface SizeColorTabProps {
  onFeedback: (type: 'success' | 'error', message: string) => void;
  onRefreshMetadata: () => void;
}

export const SizeColorTab: React.FC<SizeColorTabProps> = ({ onFeedback, onRefreshMetadata }) => {
  const { confirm } = useConfirm();
  const [sizes, setSizes] = useState<AdminSize[]>([]);
  const [colors, setColors] = useState<AdminColor[]>([]);
  const [loading, setLoading] = useState(false);

  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<AdminColor | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sData, cData] = await Promise.all([
        catalogAdminService.getSizes(),
        catalogAdminService.getColors(),
      ]);
      setSizes(sData);
      setColors(cData);
    } catch (err: any) {
      onFeedback('error', 'Error al cargar tallas y colores.');
    } finally {
      setLoading(false);
    }
  }, [onFeedback]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sizes handlers
  const handleCreateSize = async (codigo: string) => {
    await catalogAdminService.createSize({ codigo });
    onFeedback('success', `Talla "${codigo}" creada exitosamente.`);
    fetchData();
    onRefreshMetadata();
  };

  const handleDeleteSize = async (s: AdminSize) => {
    const ok = await confirm({
      title: 'Eliminar Talla',
      message: `¿Estás seguro de eliminar la talla "${s.codigo}"?`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await catalogAdminService.deleteSize(s.id_talla);
      onFeedback('success', 'Talla eliminada exitosamente.');
      fetchData();
      onRefreshMetadata();
    } catch (err: any) {
      onFeedback('error', err.response?.data?.message || 'Error al eliminar talla.');
    }
  };

  // Colors handlers
  const handleCreateOrUpdateColor = async (data: { nombre: string; codigo_hex?: string }) => {
    if (selectedColor) {
      await catalogAdminService.updateColor(selectedColor.id_color, data);
      onFeedback('success', 'Color actualizado exitosamente.');
    } else {
      await catalogAdminService.createColor(data);
      onFeedback('success', 'Color creado exitosamente.');
    }
    fetchData();
    onRefreshMetadata();
  };

  const handleDeleteColor = async (c: AdminColor) => {
    const ok = await confirm({
      title: 'Eliminar Color',
      message: `¿Estás seguro de eliminar el color "${c.nombre}"?`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await catalogAdminService.deleteColor(c.id_color);
      onFeedback('success', 'Color eliminado exitosamente.');
      fetchData();
      onRefreshMetadata();
    } catch (err: any) {
      onFeedback('error', err.response?.data?.message || 'Error al eliminar color.');
    }
  };

  return (
    <div className="catalog-tab-content">
      <div className="tab-two-columns">
        {/* Panel Izquierdo: TALLAS */}
        <div className="catalog-subpanel">
          <div className="subpanel-header">
            <div>
              <h3>Tallas ({sizes.length})</h3>
              <p className="subpanel-desc">Códigos de medida comercial sin asociar rígidamente al producto.</p>
            </div>
            <button type="button" className="admin-btn primary sm" onClick={() => setSizeModalOpen(true)}>
              + Nueva Talla
            </button>
          </div>

          <div className="chips-grid">
            {loading ? (
              <p>Cargando tallas...</p>
            ) : sizes.length === 0 ? (
              <p className="text-muted">No hay tallas registradas.</p>
            ) : (
              sizes.map((s) => (
                <div key={s.id_talla} className="size-admin-card">
                  <span className="size-code-large">{s.codigo}</span>
                  <span className="size-usage-text">{s._count?.producto_variante || 0} prendas</span>
                  <button
                    type="button"
                    className="delete-chip-btn"
                    onClick={() => handleDeleteSize(s)}
                    disabled={(s._count?.producto_variante || 0) > 0}
                    title={
                      (s._count?.producto_variante || 0) > 0
                        ? 'En uso en prendas activas'
                        : 'Eliminar talla'
                    }
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel Derecho: COLORES */}
        <div className="catalog-subpanel">
          <div className="subpanel-header">
            <div>
              <h3>Colores ({colors.length})</h3>
              <p className="subpanel-desc">Paleta de colores con representación visual hexadecimal.</p>
            </div>
            <button
              type="button"
              className="admin-btn primary sm"
              onClick={() => {
                setSelectedColor(null);
                setColorModalOpen(true);
              }}
            >
              + Nuevo Color
            </button>
          </div>

          <div className="colors-grid">
            {loading ? (
              <p>Cargando colores...</p>
            ) : colors.length === 0 ? (
              <p className="text-muted">No hay colores registrados.</p>
            ) : (
              colors.map((c) => (
                <div key={c.id_color} className="color-admin-card">
                  <div
                    className="color-swatch-box"
                    style={{ backgroundColor: c.codigo_hex || '#000000' }}
                  />
                  <div className="color-card-info">
                    <strong className="color-name">{c.nombre}</strong>
                    <span className="color-hex-tag">{c.codigo_hex || '#000000'}</span>
                    <span className="color-usage">{c._count?.producto_variante || 0} variantes</span>
                  </div>
                  <div className="color-card-actions">
                    <button
                      type="button"
                      className="admin-btn sm text"
                      onClick={() => {
                        setSelectedColor(c);
                        setColorModalOpen(true);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="admin-btn sm text danger"
                      onClick={() => handleDeleteColor(c)}
                      disabled={(c._count?.producto_variante || 0) > 0}
                      title={
                        (c._count?.producto_variante || 0) > 0
                          ? 'En uso en prendas activas'
                          : 'Eliminar color'
                      }
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <SizeModal
        isOpen={sizeModalOpen}
        onClose={() => setSizeModalOpen(false)}
        onSubmit={handleCreateSize}
      />

      <ColorModal
        isOpen={colorModalOpen}
        color={selectedColor}
        onClose={() => setColorModalOpen(false)}
        onSubmit={handleCreateOrUpdateColor}
      />
    </div>
  );
};
