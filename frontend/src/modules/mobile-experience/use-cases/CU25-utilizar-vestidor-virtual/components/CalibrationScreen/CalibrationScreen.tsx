import React from 'react';
import { Camera, User, Sun, Check, AlertCircle, RefreshCw } from 'lucide-react';
import './CalibrationScreen.css';

interface CalibrationScreenProps {
  poseLoading: boolean;
  poseReady: boolean;
  poseDetected: boolean;
  onStart: () => void;
  onBack: () => void;
}

export const CalibrationScreen: React.FC<CalibrationScreenProps> = ({
  poseLoading,
  poseReady,
  poseDetected,
  onStart,
  onBack,
}) => {
  return (
    <div className="calibration-screen">
      <div className="calibration-card">
        <div className="calibration-header">
          <div className="calibration-icon-wrap">
            <Camera size={28} />
          </div>
          <h2>Prepara tu Vestidor Virtual</h2>
          <p className="calibration-subtitle">
            Visualiza prendas sobre tu cuerpo en tiempo real con realidad aumentada
          </p>
        </div>

        {/* Silueta indicadora */}
        <div className="calibration-silhouette">
          <div className="silhouette-frame">
            <svg viewBox="0 0 200 280" className="silhouette-svg">
              {/* Cabeza */}
              <circle cx="100" cy="50" r="28" className="silhouette-path" />
              {/* Cuello */}
              <line x1="100" y1="78" x2="100" y2="95" className="silhouette-path" />
              {/* Hombros */}
              <line x1="45" y1="105" x2="155" y2="105" className="silhouette-path" />
              {/* Torso izquierdo */}
              <line x1="45" y1="105" x2="55" y2="195" className="silhouette-path" />
              {/* Torso derecho */}
              <line x1="155" y1="105" x2="145" y2="195" className="silhouette-path" />
              {/* Cadera */}
              <line x1="55" y1="195" x2="145" y2="195" className="silhouette-path" />
              {/* Brazo izquierdo */}
              <line x1="45" y1="105" x2="20" y2="175" className="silhouette-path" />
              {/* Brazo derecho */}
              <line x1="155" y1="105" x2="180" y2="175" className="silhouette-path" />
              {/* Pierna izquierda */}
              <line x1="75" y1="195" x2="65" y2="270" className="silhouette-path" />
              {/* Pierna derecha */}
              <line x1="125" y1="195" x2="135" y2="270" className="silhouette-path" />

              {/* Puntos de referencia con pulse */}
              <circle cx="45" cy="105" r="6" className="silhouette-point" />
              <circle cx="155" cy="105" r="6" className="silhouette-point" />
              <circle cx="55" cy="195" r="6" className="silhouette-point" />
              <circle cx="145" cy="195" r="6" className="silhouette-point" />

              {/* Labels */}
              <text x="28" y="95" className="silhouette-label">Hombro</text>
              <text x="142" y="95" className="silhouette-label">Hombro</text>
              <text x="28" y="212" className="silhouette-label">Cadera</text>
              <text x="142" y="212" className="silhouette-label">Cadera</text>
            </svg>
          </div>

          {poseDetected && (
            <div className="calibration-detected">
              <Check size={18} />
              <span>Cuerpo detectado</span>
            </div>
          )}
        </div>

        {/* Checklist */}
        <div className="calibration-checklist">
          <div className="checklist-item">
            <User size={16} />
            <span>Colócate frente a la cámara</span>
          </div>
          <div className="checklist-item">
            <Camera size={16} />
            <span>Procura que se vean ambos hombros y torso</span>
          </div>
          <div className="checklist-item">
            <Sun size={16} />
            <span>Asegúrate de tener buena iluminación</span>
          </div>
        </div>

        {/* Estado de carga de MediaPipe */}
        {poseLoading && (
          <div className="calibration-loading">
            <RefreshCw size={18} className="spin" />
            <span>Cargando motor de detección corporal…</span>
          </div>
        )}

        {!poseReady && !poseLoading && (
          <div className="calibration-error-msg">
            <AlertCircle size={18} />
            <span>No se pudo inicializar la detección corporal. Intenta recargar la página.</span>
          </div>
        )}

        {/* Disclaimer RA (RN-M6-12) */}
        <p className="calibration-disclaimer">
          El vestidor virtual ofrece una representación visual aproximada.
          No garantiza el ajuste exacto de la prenda.
        </p>

        {/* Acciones */}
        <div className="calibration-actions">
          <button
            type="button"
            className="btn-calibration-start"
            onClick={onStart}
          >
            <Camera size={18} />
            <span>Comenzar experiencia</span>
          </button>
          <button
            type="button"
            className="btn-calibration-back"
            onClick={onBack}
          >
            Volver al producto
          </button>
        </div>
      </div>
    </div>
  );
};
