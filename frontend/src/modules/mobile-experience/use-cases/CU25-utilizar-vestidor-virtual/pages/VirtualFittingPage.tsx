import React, { useState } from 'react';
import { Navbar } from '../../../../../components/layout/Navbar';
import { useVirtualFitting } from '../hooks/useVirtualFitting';
import { CalibrationScreen } from '../components/CalibrationScreen/CalibrationScreen';
import { FittingRoom } from '../components/FittingRoom/FittingRoom';
import { VariantPanel } from '../components/VariantPanel/VariantPanel';
import { FittingActions } from '../components/FittingActions/FittingActions';
import { ReservationModal } from '../../../../reservations/use-cases/CU17-realizar-reserva-prendas/components/ReservationModal';
import { ReservationReceiptModal } from '../../../../reservations/use-cases/CU17-realizar-reserva-prendas/components/ReservationReceiptModal';
import type { ReservationReceipt } from '../../../../reservations/use-cases/CU17-realizar-reserva-prendas/types/reservation.types';
import { useShop } from '../../../../../context/ShopContext';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import './VirtualFittingPage.css';

/**
 * CU25 — Página principal del Vestidor Virtual en Realidad Aumentada.
 * Integra detección de pose, visualización de prendas, selección de variantes
 * compatibles con RA, agregar al carrito y reserva en sucursal.
 */
export const VirtualFittingPage: React.FC = () => {
  const {
    arData,
    currentVariant,
    isLoadingProduct,
    productError,
    productId,
    selectedTallaId,
    selectedColorId,
    setSelectedTallaId,
    setSelectedColorId,
    availableTallasForColor,
    availableColoresForTalla,
    phase,
    webcamStatus,
    webcamError,
    setVideoElement,
    setDebugCanvas,
    poseLoading,
    poseReady,
    poseResult,
    trackingLost,
    startDetection,
    garmentTransform,
    garmentTransform3D,
    setGarmentDimensions,
    startFitting,
    recalibrate,
    exitFitting,
    navigate,
  } = useVirtualFitting();

  const { addToCart, showToast } = useShop();

  const [showDebugLandmarks, setShowDebugLandmarks] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<ReservationReceipt | null>(null);

  /** Agregar variante al carrito de compras (CU20, RN-M6-15) */
  const handleAddToCart = async () => {
    if (!arData || !currentVariant) return;

    setIsAddingToCart(true);
    try {
      await addToCart(
        {
          id: arData.producto.id_producto,
          name: arData.producto.nombre,
          price: currentVariant.precio_final,
          image: currentVariant.imagen_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
          category: arData.producto.categoria,
          categorySlug: arData.producto.categoria.toLowerCase().replace(/\s+/g, '-'),
          rating: 4.8,
          reviewsCount: 10,
        },
        1,
        currentVariant.talla.codigo,
        currentVariant.color.nombre,
        currentVariant.id_producto_variante,
      );
      showToast?.(`¡"${arData.producto.nombre}" agregado a la bolsa desde el vestidor!`);
    } catch (err) {
      console.error('Error al agregar al carrito:', err);
    } finally {
      setIsAddingToCart(false);
    }
  };

  /** Abrir modal de reserva (CU17, RN-M6-16) */
  const handleOpenReservation = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setIsReservationOpen(true);
  };

  return (
    <div className="virtual-fitting-page-layout">
      <Navbar />

      <main className="virtual-fitting-main">
        {/* 1. Estado de carga */}
        {isLoadingProduct && (
          <div className="fitting-state-center">
            <RefreshCw size={40} className="spin" style={{ color: '#C4956A' }} />
            <h2>Cargando Vestidor Virtual…</h2>
            <p>Obteniendo modelos 3D y especificaciones de la prenda.</p>
          </div>
        )}

        {/* 2. Estado de error */}
        {!isLoadingProduct && (productError || phase === 'error') && (
          <div className="fitting-state-center error">
            <AlertCircle size={48} className="text-rose-500" />
            <h2>No se pudo iniciar el vestidor virtual</h2>
            <p>{productError || 'La prenda no cuenta con modelos compatibles con RA o no se encuentra activa.'}</p>
            <button
              type="button"
              className="btn-fitting-back"
              onClick={() => navigate(productId ? `/product/${productId}` : '/catalog')}
            >
              <ArrowLeft size={16} />
              <span>Volver a la tienda</span>
            </button>
          </div>
        )}

        {/* 3. Pantalla de calibración previa */}
        {!isLoadingProduct && phase === 'calibration' && (
          <CalibrationScreen
            poseLoading={poseLoading}
            poseReady={poseReady}
            poseDetected={Boolean(poseResult?.isDetected)}
            onStart={startFitting}
            onBack={() => navigate(`/product/${productId}`)}
          />
        )}

        {/* 4. Escenario activo de prueba virtual */}
        {!isLoadingProduct && phase === 'fitting' && arData && (
          <div className="fitting-workspace-container">
            {/* Columna Izquierda: Stream de video + RA */}
            <div className="fitting-viewport-column">
              <FittingRoom
                webcamStatus={webcamStatus}
                webcamError={webcamError}
                setVideoElement={setVideoElement}
                setDebugCanvas={setDebugCanvas}
                startDetection={startDetection}
                setGarmentDimensions={setGarmentDimensions}
                garmentTransform={garmentTransform}
                garmentTransform3D={garmentTransform3D}
                poseResult={poseResult}
                currentVariant={currentVariant}
                trackingLost={trackingLost}
                showDebugLandmarks={showDebugLandmarks}
                onRequestPermissionAgain={startFitting}
              />
            </div>

            {/* Columna Derecha: Variantes y Acciones */}
            <div className="fitting-controls-column">
              <VariantPanel
                product={arData.producto}
                selectedVariant={currentVariant}
                tallas={availableTallasForColor}
                colores={availableColoresForTalla}
                selectedTallaId={selectedTallaId}
                selectedColorId={selectedColorId}
                onSelectTalla={setSelectedTallaId}
                onSelectColor={setSelectedColorId}
              />

              <FittingActions
                onAddToCart={handleAddToCart}
                onReserve={handleOpenReservation}
                onRecalibrate={recalibrate}
                onExit={exitFitting}
                showDebug={showDebugLandmarks}
                onToggleDebug={() => setShowDebugLandmarks((prev) => !prev)}
                isAddingToCart={isAddingToCart}
                disabled={!currentVariant || currentVariant.total_stock <= 0}
                canReserve={Boolean(currentVariant)}
              />
            </div>
          </div>
        )}
      </main>

      {/* Modal de Reserva CU17 */}
      {isReservationOpen && arData && currentVariant && (
        <ReservationModal
          isOpen={isReservationOpen}
          onClose={() => setIsReservationOpen(false)}
          product={{
            id_producto: arData.producto.id_producto,
            nombre: arData.producto.nombre,
            precio_base: arData.producto.precio_base,
            imagenes: currentVariant.imagen_url ? [{ url: currentVariant.imagen_url, es_principal: true }] : [],
          }}
          selectedVariant={currentVariant}
          initialQuantity={1}
          onReservationSuccess={(receipt: ReservationReceipt) => {
            setIsReservationOpen(false);
            setCurrentReceipt(receipt);
          }}
          onRequireAuth={() => {
            setIsReservationOpen(false);
            navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
          }}
        />
      )}

      {/* Comprobante de Reserva CU17 */}
      {currentReceipt && (
        <ReservationReceiptModal
          receipt={currentReceipt}
          onClose={() => setCurrentReceipt(null)}
        />
      )}
    </div>
  );
};
export default VirtualFittingPage;
