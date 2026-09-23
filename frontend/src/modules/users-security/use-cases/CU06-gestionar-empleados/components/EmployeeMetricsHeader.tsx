/**
 * @caso-de-uso CU06 — Gestionar empleados
 * @subsistema Usuarios y Seguridad
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Administrador -> formulario de empleados -> controlador de empleados -> servicio de empleados -> Usuario/Empleado/Rol/Sucursal.
 */
import React from 'react';
import { Radio, Shield, Briefcase, Store } from 'lucide-react';

interface EmployeeMetricsHeaderProps {
  total: number;
  metrics: {
    conectados: number;
    administradores: number;
    encargados: number;
    cajeros: number;
  };
}

export const EmployeeMetricsHeader: React.FC<EmployeeMetricsHeaderProps> = ({
  total,
  metrics,
}) => {
  return (
    <div className="employees-metrics-bar">
      <div className="emp-metric-card">
        <span className="metric-label">Total Empleados</span>
        <span className="metric-value">{total}</span>
      </div>
      <div className="emp-metric-card online">
        <span className="metric-label">
          <Radio size={14} /> En Línea (Conectados)
        </span>
        <span className="metric-value">{metrics.conectados}</span>
      </div>
      <div className="emp-metric-card admin">
        <span className="metric-label">
          <Shield size={14} /> Administradores
        </span>
        <span className="metric-value">{metrics.administradores}</span>
      </div>
      <div className="emp-metric-card manager">
        <span className="metric-label">
          <Briefcase size={14} /> Encargados de Sucursal
        </span>
        <span className="metric-value">{metrics.encargados}</span>
      </div>
      <div className="emp-metric-card cashier">
        <span className="metric-label">
          <Store size={14} /> Cajeros
        </span>
        <span className="metric-value">{metrics.cajeros}</span>
      </div>
    </div>
  );
};
