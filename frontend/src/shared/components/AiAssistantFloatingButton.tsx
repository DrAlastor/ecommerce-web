import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { ReportsAiChatDrawer } from '../../modules/reports-dashboard/use-cases/CU29-consultar-dashboard-reportes/components/ReportsAiChatDrawer';

export const AiAssistantFloatingButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('dressly:open-ai-chat', handleOpen);
    return () => {
      window.removeEventListener('dressly:open-ai-chat', handleOpen);
    };
  }, []);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9990,
        }}
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            backgroundColor: '#1C1510',
            color: '#FFFFFF',
            padding: '0.75rem 1.25rem',
            borderRadius: '9999px',
            border: '1px solid #C4956A',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.86rem',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.32)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)';
          }}
          title="Abrir Asistente IA para reportes y consultas del sistema (CU33)"
        >
          <Sparkles size={17} color="#C4956A" />
          <span>Asistente IA</span>
        </button>
      </div>

      <ReportsAiChatDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

