import React, { useState } from 'react';
import { Building2, Palette, Database } from 'lucide-react';
import { CompanySettingsTab } from '../components/CompanySettingsTab';
import { AppearanceSettingsTab } from '../../CU08-personalizar-apariencia/components/AppearanceSettingsTab';
import { BackupsSettingsTab } from '../../CU09-gestionar-backups-restore/components/BackupsSettingsTab';
import './SettingsPages.css';

interface ManageSettingsPageProps {
  defaultTab?: 'empresa' | 'apariencia' | 'backups';
}

export const ManageSettingsPage: React.FC<ManageSettingsPageProps> = ({ defaultTab = 'empresa' }) => {
  const [activeTab, setActiveTab] = useState<'empresa' | 'apariencia' | 'backups'>(defaultTab);

  return (
    <div className="settings-page-container">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
        {/* Selector de Pestañas sin códigos CU */}
        <div className="tenant-selector-pill">
          <button
            onClick={() => setActiveTab('empresa')}
            className={`tenant-btn ${activeTab === 'empresa' ? 'active' : ''}`}
          >
            <Building2 size={15} style={{ verticalAlign: 'text-bottom', marginRight: '6px' }} />
            Empresa
          </button>
          <button
            onClick={() => setActiveTab('apariencia')}
            className={`tenant-btn ${activeTab === 'apariencia' ? 'active' : ''}`}
          >
            <Palette size={15} style={{ verticalAlign: 'text-bottom', marginRight: '6px' }} />
            Apariencia
          </button>
          <button
            onClick={() => setActiveTab('backups')}
            className={`tenant-btn ${activeTab === 'backups' ? 'active' : ''}`}
          >
            <Database size={15} style={{ verticalAlign: 'text-bottom', marginRight: '6px' }} />
            Backups
          </button>
        </div>
      </div>

      {/* Vistas */}
      {activeTab === 'empresa' && <CompanySettingsTab />}
      {activeTab === 'apariencia' && <AppearanceSettingsTab />}
      {activeTab === 'backups' && <BackupsSettingsTab />}
    </div>
  );
};

export default ManageSettingsPage;
