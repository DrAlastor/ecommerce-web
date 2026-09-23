/**
 * @caso-de-uso CU25 — Utilizar vestidor virtual
 * @subsistema Experiencia Móvil
 * @capa Fachada del módulo — Frontend web
 * @responsabilidad Expone la API pública del caso de uso y centraliza sus exportaciones para el resto de la aplicación.
 * @secuencia Cliente -> vestidor virtual -> controlador de experiencia -> servicios de cámara y renderizado -> Producto/Variante/Recursos 3D.
 */
export * from './pages/VirtualFittingPage';
export * from './types/virtual-fitting.types';
export * from './services/virtual-fitting.service';
export * from './hooks/useVirtualFitting';
export * from './hooks/useWebcam';
export * from './hooks/usePoseDetection';
export * from './hooks/useGarmentTransform';
