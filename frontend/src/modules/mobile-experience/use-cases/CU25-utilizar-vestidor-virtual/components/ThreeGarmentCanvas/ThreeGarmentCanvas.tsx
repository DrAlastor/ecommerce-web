import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type {
  Garment3DTransform,
  ArVariant,
  PoseResult,
} from '../../types/virtual-fitting.types';
import { AlertCircle, Rotate3d } from 'lucide-react';
import './ThreeGarmentCanvas.css';

interface ThreeGarmentCanvasProps {
  transform3D: Garment3DTransform | null;
  variant: ArVariant | null;
  trackingLost: boolean;
  poseResult?: PoseResult | null;
  videoWidth?: number;
  videoHeight?: number;
}

const NORMALIZED_GARMENT_HEIGHT = 1;
const GARMENT_TOP_INSET = 0.04;

/**
 * Normaliza cualquier GLB a una altura conocida y deja su parte superior en el
 * origen del grupo. La traslación vive dentro del grupo escalado para que también
 * se convierta desde las unidades originales del archivo a unidades de Three.js.
 */
function normalizeGarmentModel(model: THREE.Group): THREE.Group {
  model.updateMatrixWorld(true);

  const bbox = new THREE.Box3().setFromObject(model);
  const normalizedWrapper = new THREE.Group();

  if (bbox.isEmpty()) {
    normalizedWrapper.add(model);
    return normalizedWrapper;
  }

  const center = bbox.getCenter(new THREE.Vector3());
  const size = bbox.getSize(new THREE.Vector3());
  const sourceHeight = Math.max(size.y, Number.EPSILON);
  const scaleFactor = NORMALIZED_GARMENT_HEIGHT / sourceHeight;

  const centeredModel = new THREE.Group();
  centeredModel.position.set(
    -center.x,
    -bbox.max.y + sourceHeight * GARMENT_TOP_INSET,
    -center.z,
  );
  centeredModel.add(model);

  normalizedWrapper.scale.setScalar(scaleFactor);
  normalizedWrapper.add(centeredModel);

  return normalizedWrapper;
}

/**
 * Crea una malla paramétrica tridimensional de alta costura femenina (Top / Blusa)
 * con curvas anatómicas, escote frontal, costados y espalda para rotación 360°.
 */
function createParametricGarment(colorHex: string, isDress = false): THREE.Group {
  const group = new THREE.Group();

  const slices = isDress
    ? [
      [0.55, 0.22, 0.08, 0.07, 0.45], // Hombros
      [0.45, 0.23, 0.10, 0.08, 0.20], // Clavícula / Escote
      [0.30, 0.24, 0.16, 0.09, 0.00], // Busto femenino
      [0.15, 0.20, 0.13, 0.08, 0.00], // Bajo busto
      [0.00, 0.18, 0.11, 0.08, 0.00], // Cintura entallada
      [-0.20, 0.24, 0.14, 0.10, 0.00], // Cadera alta
      [-0.45, 0.29, 0.17, 0.12, 0.00], // Cadera media
      [-0.75, 0.35, 0.20, 0.14, 0.00], // Vuelo de vestido
      [-1.05, 0.42, 0.23, 0.16, 0.00], // Ruedo vestido
    ]
    : [
      [0.55, 0.22, 0.08, 0.07, 0.45], // Hombros
      [0.45, 0.23, 0.10, 0.08, 0.20], // Clavícula / Escote
      [0.30, 0.24, 0.16, 0.09, 0.00], // Busto femenino
      [0.15, 0.20, 0.13, 0.08, 0.00], // Bajo busto
      [0.00, 0.18, 0.11, 0.08, 0.00], // Cintura entallada
      [-0.18, 0.22, 0.13, 0.09, 0.00], // Cadera alta
      [-0.35, 0.26, 0.15, 0.11, 0.00], // Dobladillo inferior
    ];

  const radialSegments = 32;
  const numSlices = slices.length;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < numSlices; i++) {
    const [y, halfW, frontD, backD, neckCut] = slices[i];
    const v = i / (numSlices - 1);

    for (let j = 0; j <= radialSegments; j++) {
      const u = j / radialSegments;
      const angle = u * Math.PI * 2;

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const depth = sinA >= 0 ? frontD : backD;

      const x = cosA * halfW;
      const z = sinA * depth;
      let finalY = y;

      if (neckCut > 0 && sinA > 0) {
        const centerDist = Math.abs(cosA);
        if (centerDist < 0.6) {
          finalY -= (1 - centerDist / 0.6) * neckCut * 0.25;
        }
      }

      positions.push(x, finalY, z);
      uvs.push(u, v);
    }
  }

  for (let i = 0; i < numSlices - 1; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const row1 = i * (radialSegments + 1);
      const row2 = (i + 1) * (radialSegments + 1);

      const a = row1 + j;
      const b = row2 + j;
      const c = row2 + j + 1;
      const d = row1 + j + 1;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.72,
    metalness: 0.12,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'GarmentMainMesh';
  group.add(mesh);

  // Tirantes en los hombros
  const strapGeo = new THREE.BoxGeometry(0.045, 0.08, 0.16);
  const leftStrap = new THREE.Mesh(strapGeo, material);
  leftStrap.position.set(-0.14, 0.58, 0.01);
  leftStrap.rotation.x = 0.08;
  group.add(leftStrap);

  const rightStrap = new THREE.Mesh(strapGeo, material);
  rightStrap.position.set(0.14, 0.58, 0.01);
  rightStrap.rotation.x = 0.08;
  group.add(rightStrap);

  return group;
}

/**
 * Renderizador Three.js superpuesto a la webcam.
 * Permite rotación espacial 360° (Yaw, Pitch, Roll) al girar el cuerpo.
 */
export const ThreeGarmentCanvas: React.FC<ThreeGarmentCanvasProps> = ({
  transform3D,
  variant,
  trackingLost,
  poseResult,
  videoWidth = 640,
  videoHeight = 480,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const garmentGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // 1. Inicialización de la Escena Three.js
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initialWidth = Math.max(1, canvas.width);
    const initialHeight = Math.max(1, canvas.height);

    // Escena
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Cámara Perspectiva (FOV 45°)
    const aspect = initialWidth / initialHeight;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    camera.position.set(0, 0, 3.0);
    cameraRef.current = camera;

    // Renderizador WebGL con transparencia
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    // Mantener el buffer con la misma relación de aspecto que la webcam, pero
    // no escribir estilos inline de 640x480. El CSS debe poder estirar y recortar
    // este canvas exactamente igual que el video con object-fit: cover.
    renderer.setSize(initialWidth, initialHeight, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // Iluminación de estudio
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(1.5, 2.5, 3.0);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.8);
    fillLight.position.set(-2.0, 0.5, 2.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.9);
    rimLight.position.set(0, 2.5, -2.5);
    scene.add(rimLight);

    // Contenedor de la prenda
    const rootGarmentGroup = new THREE.Group();
    scene.add(rootGarmentGroup);
    garmentGroupRef.current = rootGarmentGroup;

    // Bucle de animación
    const renderLoop = () => {
      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      garmentGroupRef.current = null;
    };
  }, []);

  // La resolución intrínseca del stream puede llegar después de montar el
  // componente (por ejemplo 1280x720). Redimensionar la escena existente evita
  // perder el modelo cargado o dejar una carga asíncrona conectada al grupo viejo.
  useEffect(() => {
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!camera || !renderer || videoWidth <= 0 || videoHeight <= 0) return;

    camera.aspect = videoWidth / videoHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(videoWidth, videoHeight, false);
  }, [videoWidth, videoHeight]);

  // Caché de plantillas de modelos 3D cargados para evitar re-descargas pesadas
  const modelTemplatesRef = useRef<Map<string, THREE.Group>>(new Map());
  const activeModelSceneRef = useRef<THREE.Group | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState(false);

  // Obtener el color óptimo según la variante (restringido a paleta de lujo: Blanco, Beige, Marrón, Negro)
  const resolveGarmentColor = (v: ArVariant | null): string => {
    if (!v) return '#D6C6A5';
    const colorName = v.color.nombre.toLowerCase();
    if (colorName.includes('marfil') || colorName.includes('blanco') || colorName.includes('crema')) return '#F6F3EB';
    if (colorName.includes('mocha') || colorName.includes('moca') || colorName.includes('marron') || colorName.includes('marrón')) return '#6E4F42';
    if (colorName.includes('beige')) return '#D6C6A5';
    if (colorName.includes('negro')) return '#1E1E22';
    // Fallback: color neutro beige
    return '#D6C6A5';
  };

  const currentColorHex = resolveGarmentColor(variant);

  // 2. Carga / Clonación del Modelo 3D (solo cuando cambia el modelo_3d_url o tipo de prenda)
  useEffect(() => {
    const rootGroup = garmentGroupRef.current;
    if (!rootGroup) return;

    let isMounted = true;
    let rawModelUrl = variant?.modelo_3d_url || '/models/blusa_satinada.glb';

    // Usar proxy local de Vite si es Azure Blob Storage para evitar bloqueos CORS
    if (rawModelUrl.includes('fashionstorestorage.blob.core.windows.net')) {
      rawModelUrl = rawModelUrl.replace('https://fashionstorestorage.blob.core.windows.net', '/azure-storage');
    }

    const modelUrl = rawModelUrl;
    const isGLB = modelUrl.endsWith('.glb') || modelUrl.endsWith('.gltf') || modelUrl.includes('/modelo3d/');

    // Función para montar una escena normalizada y coloreada
    const mountGarmentScene = (template: THREE.Group) => {
      // Limpiar contenedor anterior
      while (rootGroup.children.length > 0) {
        rootGroup.remove(rootGroup.children[0]);
      }

      // Clonar para esta instancia
      const instance = template.clone(true);
      activeModelSceneRef.current = instance;

      // Aplicar material satinado con el color actual
      instance.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          const baseMat = (mesh.material as THREE.MeshStandardMaterial) || new THREE.MeshStandardMaterial();
          const satinMat = baseMat.clone();
          satinMat.color.set(currentColorHex);
          satinMat.roughness = 0.28; // Brillo satinado
          satinMat.metalness = 0.15; // Reflejo sedoso
          satinMat.side = THREE.DoubleSide; // Visible en giros de 360°
          mesh.material = satinMat;
        }
      });

      rootGroup.add(instance);
    };

    if (isGLB) {
      // Verificar si ya está en caché
      if (modelTemplatesRef.current.has(modelUrl)) {
        mountGarmentScene(modelTemplatesRef.current.get(modelUrl)!);
        return;
      }

      setIsLoadingModel(true);
      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          if (!isMounted) return;

          const normalizedWrapper = normalizeGarmentModel(gltf.scene);

          // Guardar en caché
          modelTemplatesRef.current.set(modelUrl, normalizedWrapper);

          // Montar
          mountGarmentScene(normalizedWrapper);
          setIsLoadingModel(false);
        },
        undefined,
        (err) => {
          if (!isMounted) return;
          console.warn('Aviso: Carga remota GLB bloqueada o no disponible. Usando modelo local de respaldo...', err);
          loader.load(
            '/models/blusa_satinada.glb',
            (localGltf) => {
              if (!isMounted) return;
              const normalizedWrapper = normalizeGarmentModel(localGltf.scene);
              mountGarmentScene(normalizedWrapper);
              setIsLoadingModel(false);
            },
            undefined,
            () => {
              const fallback = normalizeGarmentModel(
                createParametricGarment(currentColorHex, false),
              );
              mountGarmentScene(fallback);
              setIsLoadingModel(false);
            }
          );
        }
      );
    } else {
      const procedural = normalizeGarmentModel(
        createParametricGarment(currentColorHex, false),
      );
      mountGarmentScene(procedural);
    }

    return () => {
      isMounted = false;
    };
  }, [variant?.modelo_3d_url, currentColorHex]);

  // 2b. Actualización INMEDIATA de Color Satinado (0 ms sin recargar el modelo)
  useEffect(() => {
    const activeModel = activeModelSceneRef.current;
    if (!activeModel) return;

    activeModel.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material && 'color' in mesh.material) {
          (mesh.material as THREE.MeshStandardMaterial).color.set(currentColorHex);
        }
      }
    });
  }, [currentColorHex]);

  // 3. Actualización de posición, rotación y escala desde MediaPipe
  useEffect(() => {
    const group = garmentGroupRef.current;
    if (!group) return;

    group.visible = true;

    if (transform3D && !trackingLost) {
      // Posición en espacio 3D sincronizada con el torso
      group.position.set(transform3D.posX, transform3D.posY, transform3D.posZ);

      // Rotación espacial completa (Roll, Yaw, Pitch)
      group.rotation.set(transform3D.rotX, transform3D.rotY, transform3D.rotZ);

      // Escala tridimensional proporcional al torso del usuario
      const modelName = (variant?.modelo_3d_url || '').toLowerCase();
      const isDress = modelName.includes('vestido_noche') || modelName.includes('vestido_slip');

      if (isDress) {
        const shouldersY = poseResult
          ? (poseResult.leftShoulder.y + poseResult.rightShoulder.y) / 2
          : 0;
        const hipsY = poseResult
          ? (poseResult.leftHip.y + poseResult.rightHip.y) / 2
          : 0;
        const leftAnkle = poseResult?.allLandmarks?.[27];
        const rightAnkle = poseResult?.allLandmarks?.[28];
        const anklesVisible = leftAnkle && rightAnkle
          && (leftAnkle.visibility ?? 0) >= 0.2
          && (rightAnkle.visibility ?? 0) >= 0.2;
        const torsoLength = Math.max(0.1, hipsY - shouldersY);
        const ankleY = anklesVisible ? (leftAnkle.y + rightAnkle.y) / 2 : 0;
        const measuredRatio = anklesVisible
          ? (ankleY - shouldersY) / torsoLength
          : 2.35;
        const dressLengthRatio = Math.max(1.9, Math.min(2.9, measuredRatio));
        const dressScale = transform3D.scaleY * dressLengthRatio;

        // Los vestidos se normalizan por altura completa. Una escala uniforme
        // conserva las proporciones originales de busto, cintura y falda.
        group.scale.set(dressScale, dressScale, dressScale);
      } else {
        group.scale.set(
          transform3D.scale,
          transform3D.scaleY,
          transform3D.scale,
        );
      }
    } else {
      // Posición predeterminada elegante centrada en pantalla mientras se detecta el cuerpo
      group.position.set(0, -0.05, 0);
      group.rotation.set(0, 0, 0);
      group.scale.set(1.5, 1.5, 1.5);
    }
  }, [transform3D, trackingLost, poseResult, variant?.modelo_3d_url]);

  // Indicador de orientación para feedback visual al usuario
  const yawAngle = transform3D?.yawDegrees ?? 0;
  let orientationLabel = 'Frente';
  if (yawAngle > 15) orientationLabel = `Perfil Izquierdo (${yawAngle}°)`;
  else if (yawAngle < -15) orientationLabel = `Perfil Derecho (${Math.abs(yawAngle)}°)`;

  return (
    <div className="three-garment-container">
      {/* Alerta de carga de modelo 3D */}
      {isLoadingModel && (
        <div className="three-model-loading-badge">
          <div className="three-model-loading-spinner" />
          <span>Cargando modelo 3D de blusa...</span>
        </div>
      )}

      {/* Alerta de tracking perdido */}
      {trackingLost && (
        <div className="tracking-lost-alert">
          <AlertCircle size={20} />
          <span>Posición corporal perdida. Procura mantener visible tu torso.</span>
        </div>
      )}

      {/* Canvas 3D transparente superpuesto al video */}
      <canvas
        ref={canvasRef}
        className="three-garment-canvas-element"
        width={videoWidth}
        height={videoHeight}
      />

      {/* Indicador de seguimiento 3D en tiempo real */}
      {transform3D && !trackingLost && (
        <div className="three-orientation-hud">
          <Rotate3d size={15} className="rotate-icon-pulse" />
          <span className="hud-title">3D Tracking:</span>
          <span className="hud-value">{orientationLabel}</span>
          <span className="hud-talla">{variant?.talla.codigo}</span>
        </div>
      )}
    </div>
  );
};
