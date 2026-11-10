import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { ReportsAiChatDrawer } from '../../modules/reports-dashboard/use-cases/CU29-consultar-dashboard-reportes/components/ReportsAiChatDrawer';

export const AiAssistantFloatingButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('dressly:open-ai-chat', handleOpen);
    return () => {
      window.removeEventListener('dressly:open-ai-chat', handleOpen);
    };
  }, []);

  return (
    <>
      {/* Botón Flotante Optimizado para Guía y Consultas Rápidas */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '24px',
          zIndex: 9990,
          pointerEvents: 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'linear-gradient(135deg, #1C1510 0%, #2D2118 100%)',
            color: '#FFFFFF',
            padding: '0.48rem 0.95rem',
            borderRadius: '9999px',
            border: `1px solid ${hovered ? '#C4956A' : 'rgba(196, 149, 106, 0.45)'}`,
            boxShadow: hovered
              ? '0 6px 20px rgba(0, 0, 0, 0.32), 0 0 14px rgba(196, 149, 106, 0.35)'
              : '0 4px 14px rgba(0, 0, 0, 0.22), 0 0 1px rgba(196, 149, 106, 0.3)',
            cursor: 'pointer',
            fontSize: '0.81rem',
            fontWeight: 600,
            transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            userSelect: 'none',
          }}
          title="Guía rápida y consultas analíticas del sistema con IA (CU33)"
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: 'rgba(196, 149, 106, 0.2)',
              color: '#DFB58E',
            }}
          >
            <Sparkles size={13} />
          </span>
          <span>Asistente IA</span>
          <span
            style={{
              fontSize: '0.67rem',
              backgroundColor: 'rgba(196, 149, 106, 0.25)',
              color: '#E8D2BD',
              padding: '1px 6px',
              borderRadius: '9999px',
              fontWeight: 500,
              letterSpacing: '0.02em',
            }}
          >
            Guía
          </span>
        </button>
      </div>

      <ReportsAiChatDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

