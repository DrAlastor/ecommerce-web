import React, { useEffect, useRef } from 'react';
import './WebcamCanvas.css';

interface WebcamCanvasProps {
  setVideoElement: (el: HTMLVideoElement | null) => void;
  setDebugCanvas: (el: HTMLCanvasElement | null) => void;
  onVideoReady?: (video: HTMLVideoElement) => void;
  onDimensionsChange?: (width: number, height: number) => void;
  showDebugLandmarks?: boolean;
}

/**
 * Componente que muestra el video de la webcam reflejado horizontalmente
 * (efecto espejo) y un canvas de debug superpuesto para landmarks.
 */
export const WebcamCanvas: React.FC<WebcamCanvasProps> = ({
  setVideoElement,
  setDebugCanvas,
  onVideoReady,
  onDimensionsChange,
  showDebugLandmarks = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const onVideoReadyRef = useRef(onVideoReady);
  onVideoReadyRef.current = onVideoReady;
  const onDimensionsChangeRef = useRef(onDimensionsChange);
  onDimensionsChangeRef.current = onDimensionsChange;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setVideoElement(video);

    const handleLoadedData = () => {
      onVideoReadyRef.current?.(video);
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        onDimensionsChangeRef.current?.(video.videoWidth, video.videoHeight);
      }
    };

    video.addEventListener('loadeddata', handleLoadedData);

    // Si el video ya está listo al momento de montar el componente
    if (video.readyState >= 2) {
      handleLoadedData();
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [setVideoElement]);

  useEffect(() => {
    if (debugCanvasRef.current) {
      setDebugCanvas(showDebugLandmarks ? debugCanvasRef.current : null);
    }
  }, [setDebugCanvas, showDebugLandmarks]);

  return (
    <div className="webcam-canvas-container" ref={containerRef}>
      <video
        ref={videoRef}
        className="webcam-video"
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={debugCanvasRef}
        className={`webcam-debug-canvas ${showDebugLandmarks ? 'visible' : ''}`}
      />
      <div className="webcam-mirror-badge">
        <span>ESPEJO</span>
      </div>
    </div>
  );
};
