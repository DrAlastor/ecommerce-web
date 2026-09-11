export interface Product {
  id: number;
  name: string;
  category: string;
  categorySlug: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  isNew?: boolean;
  isSale?: boolean;
  description?: string;
  sizes?: string[];
  colors?: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  itemCount?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}
