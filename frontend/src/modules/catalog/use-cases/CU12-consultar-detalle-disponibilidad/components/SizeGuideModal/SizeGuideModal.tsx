/**
 * @caso-de-uso CU09 — Consultar detalle y disponibilidad de producto
 * @subsistema Catálogo e Inventario
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> detalle del producto -> controlador de detalle -> servicios de catálogo e inventario -> Producto/Variante/Inventario/Sucursal.
 */
import React from 'react';
import type { SizeGuideItem } from '../../types/product-detail.types';
import { Ruler, X, Info } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  categoryName: string;
  guideItems: SizeGuideItem[];
  onClose: () => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  categoryName,
  guideItems,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="size-guide-backdrop" onClick={onClose}>
      <div className="size-guide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Ruler size={20} />
            <h2>Guía de Tallas — {categoryName}</h2>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="guide-notice-card">
            <Info size={16} />
            <p>
              Las medidas están expresadas en centímetros (cm) y corresponden al rango anatómico recomendado para cada talla.
            </p>
          </div>

          {guideItems.length === 0 ? (
            <p className="no-guide-text">
              No hay guía de tallas específica configurada para esta categoría.
            </p>
          ) : (
            <div className="size-guide-table-wrap">
              <table className="size-guide-table">
                <thead>
                  <tr>
                    <th>Zona / Parte del Cuerpo</th>
                    <th style={{ textAlign: 'center' }}>Talla</th>
                    <th style={{ textAlign: 'right' }}>Mínimo (cm)</th>
                    <th style={{ textAlign: 'right' }}>Máximo (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {guideItems.map((item) => (
                    <tr key={item.id_guia_talla}>
                      <td>
                        <strong>{item.parte_cuerpo}</strong>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="table-size-badge">{item.talla_etiqueta}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>{item.min_cm} cm</td>
                      <td style={{ textAlign: 'right' }}>{item.max_cm} cm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="modal-footer-tip">
            <strong>¿Cómo medirte correctamente?</strong>
            <p>
              Usa una cinta métrica flexible ajustada al cuerpo, sin apretar. Si estás entre dos tallas, te sugerimos elegir la mayor para mayor comodidad.
            </p>
          </div>
        </div>

        <div className="modal-actions-bar">
          <button type="button" className="btn-modal-close" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
