import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../modules/users-security/shared/components/AuthContext';
import { cartService } from '../modules/sales-billing/services/cart.service';
import type { BackendCart } from '../modules/sales-billing/types/cart.types';
import type { ReactNode } from 'react';
import type { Product, CartItem } from '../types/shop.types';

interface ShopContextType {
  cart: CartItem[];
  wishlist: number[];
  backendCart: BackendCart | null;
  isCartLoading: boolean;
  addToCart: (
    product: Product,
    quantity?: number,
    size?: string,
    color?: string,
    variantId?: number,
  ) => Promise<void>;
  removeFromCart: (productId: number, variantId?: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number, variantId?: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
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
  const { user, isAuthenticated, isLoading } = useAuth();
  const storageSuffix = user ? `_user_${user.id_usuario}` : '_guest';
  const cartKey = `dressly_cart${storageSuffix}`;
  const wishlistKey = `dressly_wishlist${storageSuffix}`;

  const [backendCart, setBackendCart] = useState<BackendCart | null>(null);
  const [isCartLoading, setIsCartLoading] = useState(false);

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

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  const mapBackendCartToCartItems = (bCart: BackendCart): CartItem[] => {
    return bCart.items.map((it) => ({
      product: {
        id: it.id_producto,
        name: it.nombre_producto,
        category: '',
        categorySlug: '',
        price: it.precio_vigente,
        originalPrice: it.precio_original,
        image: it.imagen || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800',
        rating: 5,
        reviewsCount: 0,
      },
      quantity: it.cantidad,
      selectedSize: it.talla,
      selectedColor: it.color.nombre,
      variantId: it.id_producto_variante,
      id_item_carrito: it.id_item_carrito,
      sku: it.sku,
      stock_disponible: it.stock_disponible,
    }));
  };

  /**
   * Carga el carrito desde el backend para usuarios autenticados
   */
  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsCartLoading(true);
      const data = await cartService.getCart();
      setBackendCart(data);
      setCart(mapBackendCartToCartItems(data));
    } catch (e) {
      console.error('Error fetching backend cart:', e);
    } finally {
      setIsCartLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * Sincroniza el carrito local con el backend al iniciar sesión
   */
  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      const syncAndLoad = async () => {
        try {
          setIsCartLoading(true);
          // Leer posible carrito de invitado guardado
          const guestSaved = localStorage.getItem('dressly_cart_guest');
          const guestItems: CartItem[] = guestSaved ? JSON.parse(guestSaved) : [];

          if (guestItems.length > 0) {
            const syncPayload = {
              items: guestItems
                .filter((item) => item.variantId)
                .map((item) => ({
                  id_producto_variante: item.variantId!,
                  cantidad: item.quantity,
                })),
            };

            if (syncPayload.items.length > 0) {
              await cartService.syncGuestCart(syncPayload);
              localStorage.removeItem('dressly_cart_guest');
            }
          }

          const cartData = await cartService.getCart();
          setBackendCart(cartData);
          setCart(mapBackendCartToCartItems(cartData));
        } catch (err) {
          console.error('Error syncing cart on login:', err);
        } finally {
          setIsCartLoading(false);
        }
      };

      syncAndLoad();
    } else {
      // Usuario visitante
      setBackendCart(null);
      try {
        const saved = localStorage.getItem(cartKey);
        setCart(saved ? JSON.parse(saved) : []);
      } catch {
        setCart([]);
      }
    }
  }, [isAuthenticated, isLoading, cartKey]);

  // Persistir carrito en localStorage para invitados o respaldo
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

  /**
   * Agregar al Carrito (CU20)
   */
  const addToCart = async (
    product: Product,
    quantity = 1,
    size?: string,
    color?: string,
    variantId?: number,
  ) => {
    const selectedSize = size || (product.sizes ? product.sizes[0] : undefined);
    const selectedColor = color || (product.colors ? product.colors[0] : undefined);

    if (isAuthenticated && (variantId || product.id)) {
      try {
        setIsCartLoading(true);
        const updated = await cartService.addToCart({
          id_producto_variante: variantId,
          id_producto: variantId ? undefined : product.id,
          cantidad: quantity,
        });
        setBackendCart(updated);
        setCart(mapBackendCartToCartItems(updated));
        showToast(`"${product.name}" se agregó a tu bolsa de compras`);
        return;
      } catch (err: any) {
        console.warn('Error al agregar al carrito remoto, respaldo en local:', err);
      } finally {
        setIsCartLoading(false);
      }
    }

    // Modo invitado (local)
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.product.id === product.id &&
          (!variantId || item.variantId === variantId) &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor,
      );

      if (existing) {
        return prev.map((item) =>
          item === existing ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }

      return [
        ...prev,
        {
          product,
          quantity,
          selectedSize,
          selectedColor,
          variantId,
        },
      ];
    });

    showToast(`"${product.name}" se agregó a tu bolsa`);
  };

  /**
   * Eliminar producto del carrito (CU20)
   */
  const removeFromCart = async (productId: number, variantId?: number) => {
    const item = cart.find(
      (it) => it.product.id === productId && (!variantId || it.variantId === variantId),
    );

    // Actualización optimista inmediata
    const prevCart = cart;
    const prevBackendCart = backendCart;

    setCart((prev) =>
      prev.filter(
        (it) => !(it.product.id === productId && (!variantId || it.variantId === variantId)),
      ),
    );

    if (backendCart) {
      setBackendCart((prev) => {
        if (!prev) return prev;
        const filtered = prev.items.filter(
          (it) =>
            !(it.id_producto === productId && (!variantId || it.id_producto_variante === variantId)),
        );
        const newTotal = filtered.reduce((s, it) => s + it.subtotal, 0);
        const newCount = filtered.reduce((s, it) => s + it.cantidad, 0);
        return {
          ...prev,
          items: filtered,
          subtotal: newTotal,
          total: newTotal,
          cantidad_articulos: newCount,
        };
      });
    }

    showToast('Producto eliminado de la bolsa');

    if (isAuthenticated && item?.id_item_carrito) {
      try {
        const updated = await cartService.removeItem(item.id_item_carrito);
        setBackendCart(updated);
        setCart(mapBackendCartToCartItems(updated));
      } catch (err: any) {
        console.error('Error removing item from backend cart:', err);
        setCart(prevCart);
        setBackendCart(prevBackendCart);
      }
    }
  };

  // Referencia para temporizadores de debounce de actualización de cantidad
  const updateTimeoutsRef = React.useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});

  /**
   * Modificar cantidad de un ítem (CU20) de forma instantánea y optimista (0ms lag)
   */
  const updateQuantity = async (productId: number, quantity: number, variantId?: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId, variantId);
      return;
    }

    const itemKey = `${productId}_${variantId || 0}`;

    // 1. Actualización local instantánea en memoria para reflejar cambios en la UI de inmediato
    setCart((prev) =>
      prev.map((it) => {
        if (it.product.id === productId && (!variantId || it.variantId === variantId)) {
          return { ...it, quantity };
        }
        return it;
      }),
    );

    // 2. Actualizar totales del backendCart de forma instantánea
    setBackendCart((prev) => {
      if (!prev) return prev;
      const updatedItems = prev.items.map((it) => {
        if (
          it.id_producto === productId &&
          (!variantId || it.id_producto_variante === variantId)
        ) {
          const newSubtotal = Math.round(it.precio_vigente * quantity * 100) / 100;
          return { ...it, cantidad: quantity, subtotal: newSubtotal };
        }
        return it;
      });
      const newTotal = Math.round(updatedItems.reduce((s, it) => s + it.subtotal, 0) * 100) / 100;
      const newCount = updatedItems.reduce((s, it) => s + it.cantidad, 0);
      return {
        ...prev,
        items: updatedItems,
        subtotal: newTotal,
        total: newTotal,
        cantidad_articulos: newCount,
      };
    });

    // 3. Debounce para persistir con el backend en segundo plano sin saturar ni retrasar la UI
    if (isAuthenticated) {
      if (updateTimeoutsRef.current[itemKey]) {
        clearTimeout(updateTimeoutsRef.current[itemKey]);
      }

      updateTimeoutsRef.current[itemKey] = setTimeout(async () => {
        const currentItem = cart.find(
          (it) => it.product.id === productId && (!variantId || it.variantId === variantId),
        );
        if (currentItem?.id_item_carrito) {
          try {
            const updated = await cartService.updateQuantity(currentItem.id_item_carrito, {
              cantidad: quantity,
            });
            setBackendCart(updated);
            setCart(mapBackendCartToCartItems(updated));
          } catch (err: any) {
            const message =
              err.response?.data?.message || 'No se pudo actualizar la cantidad por límite de existencias.';
            showToast(`⚠️ ${message}`);
            // Re-sincronizar con el carrito real del backend
            refreshCart();
          }
        }
        delete updateTimeoutsRef.current[itemKey];
      }, 300);
    }
  };

  /**
   * Vaciar carrito (CU20)
   */
  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        setIsCartLoading(true);
        const updated = await cartService.clearCart();
        setBackendCart(updated);
        setCart([]);
      } catch (err) {
        console.error('Error clearing cart:', err);
      } finally {
        setIsCartLoading(false);
      }
      return;
    }

    setCart([]);
  };

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

  const calculatedTotal = cart.reduce(
    (sum, item) => sum + (Number(item.product.price) || 0) * (Number(item.quantity) || 1),
    0,
  );
  const calculatedCount = cart.reduce(
    (sum, item) => sum + (Number(item.quantity) || 1),
    0,
  );

  const cartTotal =
    backendCart && backendCart.items.length === cart.length && backendCart.total > 0
      ? backendCart.total
      : calculatedTotal;

  const cartItemCount =
    backendCart && backendCart.items.length === cart.length && backendCart.cantidad_articulos > 0
      ? backendCart.cantidad_articulos
      : calculatedCount;

  return (
    <ShopContext.Provider
      value={{
        cart,
        wishlist,
        backendCart,
        isCartLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
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
