import React from 'react';
import { CompanySettingsTab } from '../components/CompanySettingsTab';
import './SettingsPages.css';

export const ManageCompanyPage: React.FC = () => {
  return (
    <div className="settings-page-container">
      <CompanySettingsTab />
    </div>
  );
};

export default ManageCompanyPage;

