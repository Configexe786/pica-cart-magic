import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  product_id: string;
  title: string;
  price: number;
  qty: number;
  images: string[];
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  loading: boolean;
  addToCart: (productId: string, qty?: number) => Promise<void>;
  updateQuantity: (productId: string, qty: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  syncLocalCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // Load cart data when user changes
  useEffect(() => {
    if (user) {
      loadCart();
      syncLocalCart();
    } else {
      loadLocalCart();
    }
  }, [user]);

  // Set up realtime subscription for cart
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('cart-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadCart();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadCart = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          qty,
          products (
            title,
            price,
            images
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const cartItems: CartItem[] = data?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        title: item.products?.title || '',
        price: parseFloat(item.products?.price?.toString() || '0'),
        qty: item.qty,
        images: item.products?.images || []
      })) || [];

      setItems(cartItems);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLocalCart = () => {
    const localCart = localStorage.getItem('picamart-cart');
    if (localCart) {
      setItems(JSON.parse(localCart));
    }
  };

  const syncLocalCart = async () => {
    if (!user) return;

    const localCart = localStorage.getItem('picamart-cart');
    if (localCart) {
      const localItems: CartItem[] = JSON.parse(localCart);
      
      for (const item of localItems) {
        await addToCart(item.product_id, item.qty);
      }
      
      localStorage.removeItem('picamart-cart');
    }
  };

  const addToCart = async (productId: string, qty: number = 1) => {
    if (!user) {
      // Store in localStorage for non-authenticated users
      const localCart = localStorage.getItem('picamart-cart');
      const currentItems: CartItem[] = localCart ? JSON.parse(localCart) : [];
      
      // Get product details
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (!product) return;

      const existingIndex = currentItems.findIndex(item => item.product_id === productId);
      
      if (existingIndex >= 0) {
        currentItems[existingIndex].qty += qty;
      } else {
        currentItems.push({
          id: Math.random().toString(36),
          product_id: productId,
          title: product.title,
          price: parseFloat(product.price.toString()),
          qty,
          images: product.images
        });
      }
      
      localStorage.setItem('picamart-cart', JSON.stringify(currentItems));
      setItems(currentItems);
      
      toast({
        title: "Added to cart",
        description: `${product.title} has been added to your cart.`,
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: user.id,
          product_id: productId,
          qty
        }, {
          onConflict: 'user_id,product_id'
        });

      if (error) throw error;

      // Get product name for toast
      const { data: product } = await supabase
        .from('products')
        .select('title')
        .eq('id', productId)
        .single();

      toast({
        title: "Added to cart",
        description: `${product?.title || 'Item'} has been added to your cart.`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive"
      });
    }
  };

  const updateQuantity = async (productId: string, qty: number) => {
    if (qty <= 0) {
      await removeFromCart(productId);
      return;
    }

    if (!user) {
      const localCart = localStorage.getItem('picamart-cart');
      const currentItems: CartItem[] = localCart ? JSON.parse(localCart) : [];
      const updatedItems = currentItems.map(item =>
        item.product_id === productId ? { ...item, qty } : item
      );
      localStorage.setItem('picamart-cart', JSON.stringify(updatedItems));
      setItems(updatedItems);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ qty })
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity.",
        variant: "destructive"
      });
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) {
      const localCart = localStorage.getItem('picamart-cart');
      const currentItems: CartItem[] = localCart ? JSON.parse(localCart) : [];
      const updatedItems = currentItems.filter(item => item.product_id !== productId);
      localStorage.setItem('picamart-cart', JSON.stringify(updatedItems));
      setItems(updatedItems);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart.",
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive"
      });
    }
  };

  const clearCart = async () => {
    if (!user) {
      localStorage.removeItem('picamart-cart');
      setItems([]);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const value = {
    items,
    totalItems,
    totalAmount,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    syncLocalCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};