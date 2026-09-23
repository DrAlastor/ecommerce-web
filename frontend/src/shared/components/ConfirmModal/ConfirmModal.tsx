import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, Trash2, Info, X } from 'lucide-react';
import './ConfirmModal.css';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    const normalizedOptions: ConfirmOptions =
      typeof options === 'string'
        ? {
            title: 'Confirmación',
            message: options,
            confirmText: 'Aceptar',
            cancelText: 'Cancelar',
            type: 'warning',
          }
        : {
            title: options.title || '¿Estás seguro?',
            message: options.message,
            confirmText: options.confirmText || 'Aceptar',
            cancelText: options.cancelText || 'Cancelar',
            type: options.type || 'warning',
          };

    return new Promise<boolean>((resolve) => {
      setModalState({
        isOpen: true,
        options: normalizedOptions,
        resolve,
      });
    });
  }, []);

  const handleConfirm = () => {
    if (modalState) {
      modalState.resolve(true);
      setModalState(null);
    }
  };

  const handleCancel = () => {
    if (modalState) {
      modalState.resolve(false);
      setModalState(null);
    }
  };

  const getIcon = () => {
    if (!modalState) return null;
    switch (modalState.options.type) {
      case 'danger':
        return <Trash2 size={26} color="#DC2626" />;
      case 'info':
        return <Info size={26} color="#8C5E35" />;
      case 'warning':
      default:
        return <AlertTriangle size={26} color="#D97706" />;
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {modalState?.isOpen && (
        <div className="custom-confirm-backdrop" onClick={handleCancel}>
          <div className="custom-confirm-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="custom-confirm-close-btn"
              onClick={handleCancel}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>

            <div className={`custom-confirm-icon-wrapper ${modalState.options.type || 'warning'}`}>
              {getIcon()}
            </div>

            <h3 className="custom-confirm-title">{modalState.options.title}</h3>
            <p className="custom-confirm-message">{modalState.options.message}</p>

            <div className="custom-confirm-actions">
              <button
                type="button"
                className="custom-confirm-btn-cancel"
                onClick={handleCancel}
              >
                {modalState.options.cancelText}
              </button>
              <button
                type="button"
                className={`custom-confirm-btn-confirm ${modalState.options.type || 'warning'}`}
                onClick={handleConfirm}
                autoFocus
              >
                {modalState.options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmContextType => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm debe ser utilizado dentro de un ConfirmProvider');
  }
  return context;
};
