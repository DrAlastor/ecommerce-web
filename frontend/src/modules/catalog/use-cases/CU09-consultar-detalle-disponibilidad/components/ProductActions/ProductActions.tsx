import React from 'react';
import { ShoppingBag, CalendarClock, AlertCircle, Minus, Plus } from 'lucide-react';

interface ProductActionsProps {
  quantity: number;
  isAvailable: boolean;
  hasSelectedVariant: boolean;
  onQuantityChange: (qty: number) => void;
  onAddToCart: () => void;
  onReserve: () => void;
}

export const ProductActions: React.FC<ProductActionsProps> = ({
  quantity,
  isAvailable,
  hasSelectedVariant,
  onQuantityChange,
  onAddToCart,
  onReserve,
}) => {
  return (
    <div className="product-actions-block">
      {/* Alerta de no disponibilidad */}
      {!hasSelectedVariant ? (
        <div className="product-stock-alert warning">
          <AlertCircle size={16} />
          <span>Por favor selecciona un color y una talla para verificar stock.</span>
        </div>
      ) : !isAvailable ? (
        <div className="product-stock-alert danger">
          <AlertCircle size={16} />
          <span>Esta combinación de talla y color está agotada en todas las sucursales.</span>
        </div>
      ) : null}

      <div className="actions-buttons-row">
        {/* Selector de Cantidad */}
        <div className="quantity-control-wrap">
          <button
            type="button"
            className="btn-qty"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1 || !isAvailable}
          >
            <Minus size={14} />
          </button>
          <span className="qty-value">{quantity}</span>
          <button
            type="button"
            className="btn-qty"
            onClick={() => onQuantityChange(quantity + 1)}
            disabled={!isAvailable}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Botón Agregar al Carrito */}
        <button
          type="button"
          className="btn-add-to-cart"
          onClick={onAddToCart}
          disabled={!isAvailable}
        >
          <ShoppingBag size={18} />
          <span>{isAvailable ? 'Agregar a la Bolsa' : 'Agotado'}</span>
        </button>

        {/* Botón Reservar en Tienda */}
        <button
          type="button"
          className="btn-reserve-store"
          onClick={onReserve}
          disabled={!isAvailable}
          title="Reserva esta prenda para probártela en sucursal"
        >
          <CalendarClock size={18} />
          <span>Reservar</span>
        </button>
      </div>
    </div>
  );
};
