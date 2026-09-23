/**
 * @caso-de-uso CU10 — Gestionar catálogo de productos
 * @subsistema Catálogo y Proveedores
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Administrador -> administración de catálogo -> controlador de productos -> servicio de catálogo -> Producto/Variante/Categoría/Colección/Promoción.
 */
import React from 'react';
import type { CatalogTabKey } from '../../types/catalog-admin.types';

interface CatalogAdminTabsProps {
  activeTab: CatalogTabKey;
  onTabChange: (tab: CatalogTabKey) => void;
}

interface TabDef {
  key: CatalogTabKey;
  label: string;
  icon: string;
}

const TABS: TabDef[] = [
  { key: 'products', label: 'Prendas y Productos', icon: '🛍️' },
  { key: 'categories', label: 'Categorías', icon: '📁' },
  { key: 'sizes-colors', label: 'Tallas y Colores', icon: '🎨' },
  { key: 'seasons-collections', label: 'Temporadas y Colecciones', icon: '🍂' },
  { key: 'size-guides', label: 'Guías de Tallas', icon: '📐' },
  { key: 'promotions', label: 'Promociones Comerciales', icon: '🏷️' },
];

export const CatalogAdminTabs: React.FC<CatalogAdminTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="catalog-admin-tabs">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            className={`catalog-tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(tab.key)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
