'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { OrderItem } from '@/types';

interface CartContextType {
  cart: OrderItem[];
  addToCart: (item: OrderItem) => void;
  removeFromCart: (productName: string) => void;
  updateQuantity: (productName: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
}

const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  cartTotal: 0,
});

export const useCart = () => useContext(CartContext);

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<OrderItem[]>([]);

  useEffect(() => {
    const storedCart = localStorage.getItem('maivzev_cart_v3');
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        } else {
          // If it's an old format (object), just clear it or ignore
          localStorage.removeItem('maivzev_cart_v3');
        }
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  const saveCart = (newCart: OrderItem[]) => {
    setCart(newCart);
    localStorage.setItem('maivzev_cart_v3', JSON.stringify(newCart));
  };

  const addToCart = (item: OrderItem) => {
    const existing = cart.find(i => i.productName === item.productName);
    if (existing) {
      saveCart(cart.map(i => 
        i.productName === item.productName 
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
      ));
    } else {
      saveCart([...cart, item]);
    }
  };

  const removeFromCart = (productName: string) => {
    saveCart(cart.filter(i => i.productName !== productName));
  };

  const updateQuantity = (productName: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productName);
      return;
    }
    saveCart(cart.map(i => 
      i.productName === productName 
        ? { ...i, quantity }
        : i
    ));
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}
