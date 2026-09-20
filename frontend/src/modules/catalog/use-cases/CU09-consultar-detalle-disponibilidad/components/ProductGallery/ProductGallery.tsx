import React from 'react';
import { Heart, Box } from 'lucide-react';

interface ProductGalleryProps {
  images: Array<{
    id_imagen_producto: number;
    url: string;
    texto_alternativo: string | null;
  }>;
  activeImageIndex: number;
  onSelectImage: (index: number) => void;
  hasDiscount: boolean;
  discountPercent: number;
  collectionName?: string;
  has3DModel: boolean;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  activeImageIndex,
  onSelectImage,
  hasDiscount,
  discountPercent,
  collectionName,
  has3DModel,
  isFavorited,
  onToggleFavorite,
}) => {
  const activeImage = images[activeImageIndex] || images[0] || {
    url: 'https://fashionstorestorage.blob.core.windows.net/productos/chaleco_sastre.png',
    texto_alternativo: 'Prenda FashionStore',
  };

  return (
    <div className="product-gallery-container">
      {/* Miniaturas laterales (desktop) o inferiores (móvil) */}
      {images.length > 1 && (
        <div className="product-thumbnails-strip">
          {images.map((img, idx) => (
            <button
              key={img.id_imagen_producto || idx}
              type="button"
              className={`thumbnail-btn ${idx === activeImageIndex ? 'active' : ''}`}
              onClick={() => onSelectImage(idx)}
            >
              <img
                src={img.url}
                alt={img.texto_alternativo || `Miniatura ${idx + 1}`}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Imagen Principal */}
      <div className="product-main-image-wrapper">
        <img
          src={activeImage.url}
          alt={activeImage.texto_alternativo || 'Foto de prenda'}
          className="product-main-img"
        />

        {/* Badges superiores */}
        <div className="gallery-badges-top">
          {hasDiscount && (
            <span className="badge-discount-tag">-{discountPercent}%</span>
          )}
          {collectionName && (
            <span className="badge-collection-tag">{collectionName}</span>
          )}
          {has3DModel && (
            <span className="badge-3d-tag" title="Compatible con Vestidor Virtual 3D">
              <Box size={14} /> 3D Ready
            </span>
          )}
        </div>

        {/* Botón de Favorito */}
        <button
          type="button"
          className={`gallery-favorite-btn ${isFavorited ? 'favorited' : ''}`}
          onClick={onToggleFavorite}
          aria-label={isFavorited ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Heart size={20} fill={isFavorited ? '#E02424' : 'none'} color={isFavorited ? '#E02424' : '#111827'} />
        </button>
      </div>
    </div>
  );
};
