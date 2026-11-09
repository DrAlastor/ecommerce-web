import React from 'react';
import { AppearanceSettingsTab } from '../components/AppearanceSettingsTab';
import '../../CU07-gestionar-empresas/pages/SettingsPages.css';

export const ManageAppearancePage: React.FC = () => {
  return (
    <div className="settings-page-container">
      <AppearanceSettingsTab />
    </div>
  );
};

export default ManageAppearancePage;

