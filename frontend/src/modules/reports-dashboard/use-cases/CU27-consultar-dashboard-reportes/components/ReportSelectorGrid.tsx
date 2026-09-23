/**
 * @caso-de-uso CU27 — Consultar dashboard y reportes
 * @subsistema Reportes y Dashboard
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Administrador o Encargado -> dashboard -> controlador de reportes -> servicio de agregación/exportación -> Ventas/Pagos/Inventario/Reservas/Compras.
 */
import React from 'react';
import {
  FileText,
  DollarSign,
  Award,
  Store,
  CreditCard,
  Truck,
  RotateCcw,
  Boxes,
  AlertTriangle,
  Layers,
  Calendar,
  ShoppingBag,
  Users,
} from 'lucide-react';
import type { ReportMeta } from '../types/reports.types';

export const ALL_REPORTS: ReportMeta[] = [
  // Comercial
  {
    id: 'ventas',
    name: 'Ventas y Facturación',
    code: 'REP-VNT-01',
    category: 'comercial',
    description: 'Auditoría detallada de comprobantes, clientes, canales y estados.',
    icon: <FileText size={22} />,
  },
  {
    id: 'productos_top',
    name: 'Productos Más Vendidos',
    code: 'REP-VNT-02',
    category: 'comercial',
    description: 'Ranking de prendas por unidades y facturación con rotación de catálogo.',
    icon: <Award size={22} />,
  },
  {
    id: 'ventas_sucursal',
    name: 'Ventas por Sucursal',
    code: 'REP-VNT-03',
    category: 'comercial',
    description: 'Comparativa de facturación e ingresos entre sucursales físicas.',
    icon: <Store size={22} />,
  },
  // Financiero
  {
    id: 'economico',
    name: 'Económico y Financiero',
    code: 'REP-FIN-01',
    category: 'financiero',
    description: 'Ingresos brutos, descuentos, ingresos netos y ticket promedio general.',
    icon: <DollarSign size={22} />,
  },
  {
    id: 'metodos_pago',
    name: 'Métodos de Pago',
    code: 'REP-FIN-02',
    category: 'financiero',
    description: 'Distribución de recaudación en efectivo, tarjeta, transferencia y QR.',
    icon: <CreditCard size={22} />,
  },
  {
    id: 'compras',
    name: 'Compras y Proveedores',
    code: 'REP-FIN-03',
    category: 'financiero',
    description: 'Órdenes de compra, recepciones de mercadería y costos de abastecimiento.',
    icon: <Truck size={22} />,
  },
  {
    id: 'devoluciones',
    name: 'Devoluciones y Garantías',
    code: 'REP-FIN-04',
    category: 'financiero',
    description: 'Incidentes de devolución, prendas afectadas, motivos y estados.',
    icon: <RotateCcw size={22} />,
  },
  // Inventario
  {
    id: 'inventario',
    name: 'Inventario General',
    code: 'REP-INV-01',
    category: 'inventario',
    description: 'Existencias actuales, stock disponible, reservado y valor estimado del catálogo.',
    icon: <Boxes size={22} />,
  },
  {
    id: 'inventario_critico',
    name: 'Inventario Crítico',
    code: 'REP-INV-02',
    category: 'inventario',
    description: 'Alertas de stock bajo mínimo y variantes agotadas que requieren reposición.',
    icon: <AlertTriangle size={22} />,
  },
  {
    id: 'movimientos',
    name: 'Movimientos de Inventario',
    code: 'REP-INV-03',
    category: 'inventario',
    description: 'Kardex de entradas, salidas por venta, reservas y ajustes de almacén.',
    icon: <Layers size={22} />,
  },
  // Clientes
  {
    id: 'reservas',
    name: 'Reservas de Sucursal',
    code: 'REP-CLI-01',
    category: 'clientes',
    description: 'Seguimiento de reservas en probadores, estados y efectividad de conversión.',
    icon: <Calendar size={22} />,
  },
];

interface ReportSelectorGridProps {
  selectedReportId: string;
  onSelectReport: (reportId: string) => void;
  reportCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const ReportSelectorGrid: React.FC<ReportSelectorGridProps> = ({
  selectedReportId,
  onSelectReport,
  reportCategory,
  onSelectCategory,
}) => {
  const filteredReports = ALL_REPORTS.filter((r) => r.category === reportCategory);

  const categories = [
    { id: 'comercial', label: 'Comercial y Facturación', icon: <ShoppingBag size={17} /> },
    { id: 'financiero', label: 'Financiero y Operativo', icon: <DollarSign size={17} /> },
    { id: 'inventario', label: 'Inventario y Almacén', icon: <Boxes size={17} /> },
    { id: 'clientes', label: 'Clientes y Reservas', icon: <Users size={17} /> },
  ];

  return (
    <div style={{ marginBottom: '2rem' }}>
      {/* Selector de Categorías de Reporte con Logos/Íconos */}
      <div
        style={{
          display: 'flex',
          gap: '0.6rem',
          marginBottom: '1.5rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
        }}
      >
        {categories.map((cat) => {
          const isActive = reportCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: isActive ? '#8C5E35' : '#EFEBE4',
                color: isActive ? '#FFFFFF' : '#4B433B',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 2px 6px rgba(140,94,53,0.25)' : 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#E5E0D7';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#EFEBE4';
                }
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', color: isActive ? '#FFFFFF' : '#8C5E35' }}>
                {cat.icon}
              </span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grid de Reportes Disponibles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {filteredReports.map((rep) => {
          const isSelected = selectedReportId === rep.id;
          return (
            <div
              key={rep.id}
              onClick={() => onSelectReport(rep.id)}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                border: isSelected ? '2px solid #8C5E35' : '1px solid #EAE6DF',
                padding: '1.35rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected
                  ? '0 6px 16px rgba(140,94,53,0.12)'
                  : '0 2px 6px rgba(0,0,0,0.03)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#C4956A';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#EAE6DF';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)';
                }
              }}
            >
              {/* Encabezado de la Tarjeta: Ícono/Logo + Badge de Código */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '10px',
                    backgroundColor: isSelected ? '#8C5E35' : '#F4ECE1',
                    color: isSelected ? '#FFFFFF' : '#8C5E35',
                    border: isSelected ? '1px solid #8C5E35' : '1px solid #E6DDD0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {rep.icon}
                </div>

                {rep.code && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? '#F4ECE1' : '#FAF8F5',
                      color: isSelected ? '#8C5E35' : '#8C827A',
                      border: isSelected ? '1px solid #C4956A' : '1px solid #EAE4DC',
                    }}
                  >
                    {rep.code}
                  </span>
                )}
              </div>

              {/* Título y Descripción */}
              <div>
                <h4
                  style={{
                    fontSize: '1.02rem',
                    fontWeight: 700,
                    margin: '0 0 0.4rem 0',
                    color: isSelected ? '#8C5E35' : '#1C1510',
                  }}
                >
                  {rep.name}
                </h4>
                <p
                  style={{
                    fontSize: '0.82rem',
                    color: '#736B63',
                    margin: 0,
                    lineHeight: 1.45,
                  }}
                >
                  {rep.description}
                </p>
              </div>

              {/* Indicador de Selección Activa */}
              <div
                style={{
                  marginTop: '1.1rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #F4ECE1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    color: isSelected ? '#8C5E35' : '#9E948A',
                  }}
                >
                  {isSelected ? '● Reporte Seleccionado' : 'Haga clic para seleccionar'}
                </span>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#8C5E35',
                  }}
                >
                  Configurar →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
