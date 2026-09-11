import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../../../../../components/layout/Navbar';
import { CartDrawer } from '../../../../../components/shop/CartDrawer';
import { WishlistDrawer } from '../../../../../components/shop/WishlistDrawer';
import { useShop } from '../../../../../context/ShopContext';
import { CATEGORIES, PRODUCTS } from '../../../../../data/mockProducts';
import type { Product } from '../../../../../types/shop.types';
import './CatalogPage.css';

// Opciones de filtros extendidos (UI Mock)
const FILTER_OPTIONS = {
  styles: ['Casual', 'Elegante', 'Bohemio', 'Sexy', 'Sencillo', 'Dulce'],
  patterns: ['Liso', 'Color combinado', 'Floral', 'Gráfico', 'Lunares', 'Galaxia'],
  colors: [
    { name: 'Azul', hex: '#4A90E2' },
    { name: 'Verde', hex: '#50E3C2' },
    { name: 'Marrón', hex: '#8B5A2B' },
    { name: 'Morado', hex: '#9013FE' },
    { name: 'Blanco', hex: '#FFFFFF' },
    { name: 'Negro', hex: '#000000' },
    { name: 'Multicolor', hex: 'linear-gradient(to right, red, yellow, green, blue)' },
    { name: 'Rosa', hex: '#FF69B4' },
    { name: 'Rojo', hex: '#D0021B' },
  ],
  sizes: ['Unitalla', 'XXS', 'XS', 'S', 'M', 'L', 'XL'],
  types: ['Normal', 'Pierna recta', 'Tirantes', 'Ajustado', 'Smock', 'Camiseta'],
  lengths: ['Recortado', 'Largo', 'Maxi', 'Normal', 'Crop', 'Corto'],
  sleeveLengths: ['Manga larga', 'Manga corta', 'Sin mangas', 'Manga francesa', 'Manga media', 'Manga capa'],
  materials: ['Lino', 'Poliéster', 'Satén', 'Mezclilla', 'Lentejuelas', 'Poliuretano'],
  compositions: ['Poliéster', 'Elastano', 'Algodón', 'Viscosa', 'Poliamida', 'Acrílico'],
  priceRanges: [
    { label: 'Menos de 60 Bs', min: 0, max: 62 }, 
    { label: '60 Bs - 100 Bs', min: 62, max: 104 },
    { label: '100 Bs - 140 Bs', min: 104, max: 138 },
    { label: 'Más de 140 Bs', min: 138, max: 99999 },
  ]
};

export const CatalogPage: React.FC = () => {
  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    setIsCartOpen,
    toastMessage,
  } = useShop();

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get('category') || 'all';
  const initialSearch = queryParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState('Recomendados');

  // Estados de filtros (principalmente UI)
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLengths, setSelectedLengths] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  
  // Rango de precios manual
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedPriceRangeIndex, setSelectedPriceRangeIndex] = useState<number | null>(null);

  // Toggle checkbox generic function
  const handleCheckboxToggle = (value: string, current: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (current.includes(value)) {
      setter(current.filter(item => item !== value));
    } else {
      setter([...current, value]);
    }
  };

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  // Filtrado actual (Combinando lo funcional con la UI visual)
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      // Filtrar por Categoría
      const matchesCategory =
        selectedCategory === 'all' ||
        (selectedCategory === 'sale' ? product.isSale : product.categorySlug === selectedCategory);

      // Filtrar por Búsqueda (que viene de la Navbar)
      const matchesSearch =
        searchQuery.trim() === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Filtrar por Precio
      let matchesPrice = true;
      if (minPrice || maxPrice) {
        const min = minPrice ? parseFloat(minPrice) : 0;
        const max = maxPrice ? parseFloat(maxPrice) : Infinity;
        matchesPrice = product.price >= min && product.price <= max;
      } else if (selectedPriceRangeIndex !== null) {
        const range = FILTER_OPTIONS.priceRanges[selectedPriceRangeIndex];
        matchesPrice = product.price >= range.min && product.price <= range.max;
      }

      // Filtrar por Talla (si el producto tiene el array sizes)
      let matchesSize = true;
      if (selectedSizes.length > 0) {
        if (product.sizes && product.sizes.length > 0) {
          matchesSize = product.sizes.some(s => selectedSizes.includes(s));
        } else {
          // Si no tiene tallas definidas pero hay filtro, lo ocultamos para ser estrictos
          matchesSize = false; 
        }
      }

      // Filtrar por Color (si el producto tiene el array colors)
      let matchesColor = true;
      if (selectedColors.length > 0) {
        if (product.colors && product.colors.length > 0) {
          // Comparación simple buscando la palabra clave
          matchesColor = product.colors.some(c => 
            selectedColors.some(sc => c.toLowerCase().includes(sc.toLowerCase()))
          );
        } else {
          matchesColor = false;
        }
      }

      return matchesCategory && matchesSearch && matchesPrice && matchesSize && matchesColor;
    });
  }, [selectedCategory, searchQuery, minPrice, maxPrice, selectedPriceRangeIndex, selectedSizes, selectedColors]);


  return (
    <div className="catalog-container">
      {toastMessage && (
        <div className="toast-notification">
          <span className="toast-icon">✨</span>
          <span className="toast-text">{toastMessage}</span>
          <button className="toast-view-cart" onClick={() => setIsCartOpen(true)}>
            Ver bolsa
          </button>
        </div>
      )}

      {/* Reutilizar Navbar (pero en App pasaremos la lógica de búsqueda hacia el contexto o URL) */}
      <Navbar />
      <CartDrawer />
      <WishlistDrawer />

      <main className="catalog-main">
        {/* Breadcrumbs */}
        <div className="catalog-breadcrumbs">
          <span>Página principal</span> / <span>Ropa de Mujer</span> / <span className="active">Catálogo Completo</span>
        </div>

        <div className="catalog-layout">
          {/* BOTÓN FILTROS MÓVIL */}
          <button 
            className="mobile-filters-btn"
            onClick={() => setShowMobileFilters(true)}
          >
            Filtros
          </button>

          {/* SIDEBAR DE FILTROS */}
          <aside className={`catalog-sidebar ${showMobileFilters ? 'show-mobile' : ''}`}>
            <div className="sidebar-header">
              <h3>Filtros</h3>
              <button className="close-sidebar-btn" onClick={() => setShowMobileFilters(false)}>✕</button>
            </div>

            <div className="sidebar-scrollable">
              {/* Categorías */}
              <div className="filter-group">
                <h4 className="filter-title">Categoría</h4>
                <ul className="filter-list">
                  {CATEGORIES.map(cat => (
                    <li key={cat.id}>
                      <label className="radio-label">
                        <input 
                          type="radio" 
                          name="category" 
                          checked={selectedCategory === cat.slug}
                          onChange={() => setSelectedCategory(cat.slug)}
                        />
                        <span className="radio-text">{cat.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Estilo */}
              <div className="filter-group">
                <h4 className="filter-title">Estilo</h4>
                <ul className="filter-list">
                  {FILTER_OPTIONS.styles.map(style => (
                    <li key={style}>
                      <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={selectedStyles.includes(style)}
                          onChange={() => handleCheckboxToggle(style, selectedStyles, setSelectedStyles)}
                        />
                        <span className="checkbox-text">{style}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tipo de Estampado */}
              <div className="filter-group">
                <h4 className="filter-title">Tipo De Estampado</h4>
                <ul className="filter-list">
                  {FILTER_OPTIONS.patterns.map(pattern => (
                    <li key={pattern}>
                      <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={selectedPatterns.includes(pattern)}
                          onChange={() => handleCheckboxToggle(pattern, selectedPatterns, setSelectedPatterns)}
                        />
                        <span className="checkbox-text">{pattern}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Color */}
              <div className="filter-group">
                <h4 className="filter-title">Color</h4>
                <div className="color-grid">
                  {FILTER_OPTIONS.colors.map(color => (
                    <button
                      key={color.name}
                      className={`color-bubble ${selectedColors.includes(color.name) ? 'selected' : ''}`}
                      style={{ background: color.hex }}
                      title={color.name}
                      onClick={() => handleCheckboxToggle(color.name, selectedColors, setSelectedColors)}
                    >
                      {color.name === 'Blanco' && selectedColors.includes(color.name) && (
                         <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      )}
                      {color.name !== 'Blanco' && selectedColors.includes(color.name) && (
                         <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Talla */}
              <div className="filter-group">
                <h4 className="filter-title">Talla</h4>
                <div className="size-grid">
                  {FILTER_OPTIONS.sizes.map(size => (
                    <label key={size} className="checkbox-label size-label">
                      <input 
                        type="checkbox" 
                        checked={selectedSizes.includes(size)}
                        onChange={() => handleCheckboxToggle(size, selectedSizes, setSelectedSizes)}
                      />
                      <span className="checkbox-text">{size}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tipo */}
              <div className="filter-group">
                <h4 className="filter-title">Tipo</h4>
                <ul className="filter-list">
                  {FILTER_OPTIONS.types.map(type => (
                    <li key={type}>
                      <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={selectedTypes.includes(type)}
                          onChange={() => handleCheckboxToggle(type, selectedTypes, setSelectedTypes)}
                        />
                        <span className="checkbox-text">{type}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Material */}
              <div className="filter-group">
                <h4 className="filter-title">Material</h4>
                <ul className="filter-list">
                  {FILTER_OPTIONS.materials.map(mat => (
                    <li key={mat}>
                      <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={selectedMaterials.includes(mat)}
                          onChange={() => handleCheckboxToggle(mat, selectedMaterials, setSelectedMaterials)}
                        />
                        <span className="checkbox-text">{mat}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Escala de Precios */}
              <div className="filter-group border-none">
                <h4 className="filter-title">Escala De Precios (Bs)</h4>
                <ul className="filter-list">
                  {FILTER_OPTIONS.priceRanges.map((range, index) => (
                    <li key={index}>
                      <label className="radio-label">
                        <input 
                          type="radio" 
                          name="priceRange" 
                          checked={selectedPriceRangeIndex === index}
                          onChange={() => {
                            setSelectedPriceRangeIndex(index);
                            setMinPrice('');
                            setMaxPrice('');
                          }}
                        />
                        <span className="radio-text">{range.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="price-inputs">
                  <input 
                    type="number" 
                    placeholder="Mín." 
                    value={minPrice}
                    onChange={(e) => {
                      setMinPrice(e.target.value);
                      setSelectedPriceRangeIndex(null);
                    }}
                  />
                  <span>-</span>
                  <input 
                    type="number" 
                    placeholder="Máx." 
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(e.target.value);
                      setSelectedPriceRangeIndex(null);
                    }}
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* CONTENIDO PRINCIPAL: PRODUCTOS */}
          <div className="catalog-content">
            <div className="catalog-toolbar">
              <div className="sort-by">
                <span className="sort-label">Ordenar por</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                  <option>Recomendados</option>
                  <option>Novedades</option>
                  <option>Precio: de menor a mayor</option>
                  <option>Precio: de mayor a menor</option>
                </select>
              </div>
              <div className="toolbar-tags">
                <span className="toolbar-tag"><span className="truck-icon">🚚</span> Envío Rápido</span>
                <span className="toolbar-tag trends">Tendencias</span>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="no-products-found">
                <p>No se encontraron productos que coincidan con los filtros seleccionados.</p>
                <button
                  className="reset-filters-btn"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedSizes([]);
                    setSelectedColors([]);
                    setMinPrice('');
                    setMaxPrice('');
                    setSelectedPriceRangeIndex(null);
                  }}
                >
                  Limpiar filtros principales
                </button>
              </div>
            ) : (
              <div className="products-grid-catalog">
                {filteredProducts.map((product) => {
                  const isFavorited = isInWishlist(product.id);
                  return (
                    <div key={product.id} className="product-card">
                      <div className="product-card-media">
                        <img src={product.image} alt={product.name} loading="lazy" className="product-card-img" />

                        <div className="product-badges-corner">
                          {product.isNew && <span className="badge-pill badge-new">NUEVO</span>}
                          {product.isSale && <span className="badge-pill badge-sale">OFERTA</span>}
                        </div>

                        <button
                          className={`product-wishlist-toggle ${isFavorited ? 'favorited' : ''}`}
                          onClick={() => toggleWishlist(product.id)}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorited ? '#DC2626' : 'none'} stroke={isFavorited ? '#DC2626' : '#1A1A1A'} strokeWidth="1.8">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                          </svg>
                        </button>

                        <button className="quick-add-btn" onClick={(e) => handleQuickAdd(product, e)}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                          </svg>
                          <span>Añadir</span>
                        </button>
                      </div>

                      <div className="product-card-info">
                        <h4 className="product-title">{product.name}</h4>
                        <div className="product-price-row">
                          <span className="product-price">{product.price.toFixed(2)} Bs</span>
                          {product.originalPrice && (
                            <span className="product-old-price">{product.originalPrice.toFixed(2)} Bs</span>
                          )}
                        </div>
                        <div className="product-rating-row">
                          <div className="star-icons">{'★'.repeat(Math.floor(product.rating))}</div>
                          <span className="reviews-count">({product.reviewsCount})</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
