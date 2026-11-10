import React, { useState, useEffect } from 'react';
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
    <ReportsAiChatDrawer
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
    />
  );
};

