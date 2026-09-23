/**
 * @caso-de-uso CU25 — Utilizar vestidor virtual
 * @subsistema Experiencia Móvil
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> vestidor virtual -> controlador de experiencia -> servicios de cámara y renderizado -> Producto/Variante/Recursos 3D.
 */
import React from 'react';
import { ShoppingBag, Bookmark, RotateCcw, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import './FittingActions.css';

interface FittingActionsProps {
  onAddToCart: () => void;
  onReserve: () => void;
  onRecalibrate: () => void;
  onExit: () => void;
  showDebug: boolean;
  onToggleDebug: () => void;
  isAddingToCart?: boolean;
  disabled?: boolean;
  canReserve?: boolean;
}

/**
 * Barra de acciones del vestidor virtual:
 * Agregar al carrito (CU20), Reservar (CU17), Recalibrar (RN-M6-18), Debug y Salir.
 */
export const FittingActions: React.FC<FittingActionsProps> = ({
  onAddToCart,
  onReserve,
  onRecalibrate,
  onExit,
  showDebug,
  onToggleDebug,
  isAddingToCart = false,
  disabled = false,
  canReserve = true,
}) => {
  return (
    <div className="fitting-actions-container">
      {/* Botones principales de comercio */}
      <div className="fitting-primary-actions">
        <button
          type="button"
          className="btn-action-cart"
          onClick={onAddToCart}
          disabled={disabled || isAddingToCart}
        >
          <ShoppingBag size={18} />
          <span>{isAddingToCart ? 'Agregando…' : 'Agregar a la Bolsa'}</span>
        </button>

        {canReserve && (
          <button
            type="button"
            className="btn-action-reserve"
            onClick={onReserve}
            disabled={disabled}
          >
            <Bookmark size={18} />
            <span>Reservar en Sucursal</span>
          </button>
        )}
      </div>

      {/* Botones secundarios de control de RA */}
      <div className="fitting-secondary-actions">
        <button
          type="button"
          className="btn-control-secondary"
          onClick={onRecalibrate}
          title="Recalibrar detección corporal"
        >
          <RotateCcw size={16} />
          <span>Recalibrar</span>
        </button>

        <button
          type="button"
          className={`btn-control-secondary ${showDebug ? 'active' : ''}`}
          onClick={onToggleDebug}
          title={showDebug ? 'Ocultar esqueleto' : 'Ver esqueleto detectado'}
        >
          {showDebug ? <EyeOff size={16} /> : <Eye size={16} />}
          <span>{showDebug ? 'Ocultar Puntos' : 'Ver Puntos'}</span>
        </button>

        <button
          type="button"
          className="btn-control-exit"
          onClick={onExit}
          title="Volver a la ficha del producto"
        >
          <ArrowLeft size={16} />
          <span>Volver al Producto</span>
        </button>
      </div>
    </div>
  );
};
