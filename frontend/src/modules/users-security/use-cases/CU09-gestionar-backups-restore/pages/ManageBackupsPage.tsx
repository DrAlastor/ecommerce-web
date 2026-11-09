import React from 'react';
import { BackupsSettingsTab } from '../components/BackupsSettingsTab';
import '../../CU07-gestionar-empresas/pages/SettingsPages.css';

export const ManageBackupsPage: React.FC = () => {
  return (
    <div className="settings-page-container">
      <BackupsSettingsTab />
    </div>
  );
};

export default ManageBackupsPage;

