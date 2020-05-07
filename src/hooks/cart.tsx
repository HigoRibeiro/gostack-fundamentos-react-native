import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

function incrementState(productsPrevState: Product[], id: string): Product[] {
  return productsPrevState.map(productItem => {
    if (productItem.id === id) {
      return { ...productItem, quantity: productItem.quantity + 1 };
    }

    return productItem;
  });
}

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const items = await AsyncStorage.getItem('@GoMarketplace:cart');

      if (items) {
        setProducts(JSON.parse(items) as Product[]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(product => {
    setProducts(productsPrevState => {
      const existentProductIndex = productsPrevState.findIndex(
        productItem => productItem.id === product.id,
      );

      if (existentProductIndex !== -1) {
        return incrementState(productsPrevState, product.id);
      }
      return [...productsPrevState, { ...product, quantity: 1 }];
    });
  }, []);

  const increment = useCallback(async id => {
    setProducts(productsPrevState => incrementState(productsPrevState, id));
  }, []);

  const decrement = useCallback(async id => {
    setProducts(productsPrevState => {
      return productsPrevState.map(productItem => {
        if (productItem.id === id && productItem.quantity > 1) {
          return { ...productItem, quantity: productItem.quantity - 1 };
        }

        return productItem;
      });
    });
  }, []);

  useEffect(() => {
    async function storeProductData(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    }

    storeProductData();
  }, [products]);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
