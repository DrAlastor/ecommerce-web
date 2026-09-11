import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../modules/users-security/components/AuthContext';
import { useShop } from '../../context/ShopContext';
import './Navbar.css';

export const Navbar: React.FC = () => {
  const { user, rol, isAuthenticated, logout } = useAuth();
  const roleName = rol?.nombre;
  const {
    cartItemCount,
    wishlist,
    setIsCartOpen,
    setIsWishlistOpen,
    searchQuery,
    setSearchQuery,
    setSelectedCategory,
  } = useShop();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const navigate = useNavigate();

  const isStaff = roleName && ['Administrador', 'Encargado de Sucursal', 'Cajero'].includes(roleName);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const element = document.getElementById('products-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToSection = (id: string, category?: string) => {
    if (category) {
      setSelectedCategory(category);
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setShowMobileNav(false);
  };

  return (
    <header className="site-header">
      {/* Top Notification Bar */}
      <div className="announcement-bar">
        <div className="announcement-content">
          <span>✨ ENVÍO GRATIS A TODA BOLIVIA EN COMPRAS SUPERIORES A 350 Bs | DEVOLUCIONES SIN COSTO ✨</span>
        </div>
      </div>

      {/* Staff Banner if logged in as Admin/Manager/Cashier */}
      {isStaff && (
        <div className="staff-admin-bar">
          <div className="staff-admin-content">
            <div className="staff-badge">
              <span className="staff-dot"></span>
              Sesión activa: <strong>{roleName}</strong> ({user?.email})
            </div>
            <Link
              to={roleName === 'Cajero' ? '/pos' : '/admin'}
              className="staff-admin-link"
            >
              Ir al {roleName === 'Cajero' ? 'Punto de Venta' : 'Panel de Administración'} →
            </Link>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="main-navbar">
        <div className="nav-container">
          {/* Mobile hamburger button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setShowMobileNav(!showMobileNav)}
            aria-label="Abrir menú"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          {/* Logo */}
          <Link to="/" className="brand-logo">
            <span className="brand-name">DRESSLY</span>
            <span className="brand-tagline">FASHION STORE</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav">
            <button onClick={() => scrollToSection('hero-section')} className="nav-link">
              Inicio
            </button>
            <button onClick={() => scrollToSection('category-showcase')} className="nav-link">
              Colecciones
            </button>
            <button onClick={() => scrollToSection('products-section')} className="nav-link">
              Catálogo
            </button>
            <button onClick={() => scrollToSection('products-section', 'sale')} className="nav-link nav-link-sale">
              Rebajas
            </button>
          </nav>

          {/* Search Bar */}
          <form className="nav-search-form" onSubmit={handleSearchSubmit}>
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Buscar prendas, bolsos, zapatos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="nav-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </form>

          {/* Action Icons */}
          <div className="nav-actions">
            {/* Wishlist Button */}
            <button
              className="action-icon-btn"
              onClick={() => setIsWishlistOpen(true)}
              aria-label="Lista de deseos"
              title="Lista de deseos"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              {wishlist.length > 0 && (
                <span className="action-badge">{wishlist.length}</span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              className="action-icon-btn"
              onClick={() => setIsCartOpen(true)}
              aria-label="Carrito de compras"
              title="Carrito de compras"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              {cartItemCount > 0 && (
                <span className="action-badge cart-badge">{cartItemCount}</span>
              )}
            </button>

            {/* Auth section */}
            {isAuthenticated && user ? (
              <div className="user-profile-menu">
                <button
                  className="user-profile-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="avatar-circle">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="user-name-short">
                    {user.email.split('@')[0]}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="user-dropdown-card">
                    <div className="user-dropdown-header">
                      <p className="user-dropdown-email">{user.email}</p>
                      <div className="user-role-tag">
                        <span className="user-role-dot"></span>
                        {roleName || 'Cliente'}
                      </div>
                      {roleName === 'Cliente' && (
                        <div className="user-points-badge">
                          ⭐ 150 Puntos Dressly Club
                        </div>
                      )}
                    </div>
                    <div className="user-dropdown-divider"></div>
                    {isStaff && (
                      <Link
                        to={roleName === 'Cajero' ? '/pos' : '/admin'}
                        className="user-dropdown-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Panel de Control
                      </Link>
                    )}
                    <button
                      className="user-dropdown-item user-dropdown-logout"
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="nav-login-btn"
                onClick={() => navigate('/login')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Iniciar Sesión</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {showMobileNav && (
          <div className="mobile-nav-panel">
            <button onClick={() => scrollToSection('hero-section')} className="mobile-nav-item">
              Inicio
            </button>
            <button onClick={() => scrollToSection('category-showcase')} className="mobile-nav-item">
              Colecciones
            </button>
            <button onClick={() => scrollToSection('products-section')} className="mobile-nav-item">
              Catálogo de Productos
            </button>
            <button onClick={() => scrollToSection('products-section', 'sale')} className="mobile-nav-item mobile-sale">
              Rebajas de Temporada
            </button>
            {!isAuthenticated && (
              <button
                onClick={() => {
                  setShowMobileNav(false);
                  navigate('/login');
                }}
                className="mobile-nav-item mobile-login"
              >
                Iniciar Sesión / Registrarse
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
