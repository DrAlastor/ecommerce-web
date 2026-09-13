import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../modules/users-security/shared/components/AuthContext';
import type { ReactNode } from 'react';
import type { Product, CartItem } from '../types/shop.types';

interface ShopContextType {
  cart: CartItem[];
  wishlist: number[];
  addToCart: (product: Product, quantity?: number, size?: string, color?: string) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  cartTotal: number;
  cartItemCount: number;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const storageSuffix = user ? `_user_${user.id_usuario}` : '_guest';
  const cartKey = `dressly_cart${storageSuffix}`;
  const wishlistKey = `dressly_wishlist${storageSuffix}`;

  const [currentKey, setCurrentKey] = useState(cartKey);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(cartKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(wishlistKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Si cambia el usuario (login/logout), cambiamos sincronamente el estado
  // para evitar sobreescribir datos en localStorage por el useEffect.
  if (!isLoading && cartKey !== currentKey) {
    setCurrentKey(cartKey);
    try {
      const savedCart = localStorage.getItem(cartKey);
      setCart(savedCart ? JSON.parse(savedCart) : []);
      const savedWishlist = localStorage.getItem(wishlistKey);
      setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);
    } catch {
      setCart([]);
      setWishlist([]);
    }
  }

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    try {
      localStorage.setItem(cartKey, JSON.stringify(cart));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }, [cart, cartKey, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    try {
      localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
    } catch (e) {
      console.error('Error saving wishlist:', e);
    }
  }, [wishlist, wishlistKey, isLoading]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const addToCart = (product: Product, quantity = 1, size?: string, color?: string) => {
    const selectedSize = size || (product.sizes ? product.sizes[0] : undefined);
    const selectedColor = color || (product.colors ? product.colors[0] : undefined);

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, selectedSize, selectedColor }];
    });

    showToast(`"${product.name}" se agregó a tu carrito`);
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (productId: number) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast('Producto eliminado de favoritos');
        return prev.filter((id) => id !== productId);
      } else {
        showToast('¡Guardado en tu lista de deseos!');
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: number) => wishlist.includes(productId);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <ShopContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        isCartOpen,
        setIsCartOpen,
        isWishlistOpen,
        setIsWishlistOpen,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        cartTotal,
        cartItemCount,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
