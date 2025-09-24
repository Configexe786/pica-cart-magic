import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import productPhone from '@/assets/product-phone.jpg';
import productLaptop from '@/assets/product-laptop.jpg';

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  images: string[];
  in_stock: boolean;
  stock_qty: number;
}

export const ProductGrid: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    loadProducts();

    // Set up realtime subscription
    const channel = supabase
      .channel('product-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        () => {
          loadProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // If no products exist, create default ones
      if (!data || data.length === 0) {
        await createDefaultProducts();
        return;
      }

      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      // Fallback to default products
      setProducts([
        {
          id: '1',
          title: 'Premium Smartphone',
          description: 'Latest flagship smartphone with advanced features',
          price: 29999,
          currency: 'INR',
          images: [productPhone],
          in_stock: true,
          stock_qty: 10
        },
        {
          id: '2',
          title: 'Gaming Laptop',
          description: 'High-performance laptop for gaming and productivity',
          price: 79999,
          currency: 'INR',
          images: [productLaptop],
          in_stock: true,
          stock_qty: 5
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultProducts = async () => {
    const defaultProducts = [
      {
        title: 'Premium Smartphone',
        description: 'Latest flagship smartphone with advanced features and excellent camera quality.',
        price: 29999,
        currency: 'INR',
        images: [productPhone],
        in_stock: true,
        stock_qty: 10
      },
      {
        title: 'Gaming Laptop',
        description: 'High-performance laptop perfect for gaming and productivity tasks.',
        price: 79999,
        currency: 'INR',
        images: [productLaptop],
        in_stock: true,
        stock_qty: 5
      }
    ];

    try {
      const { data, error } = await supabase
        .from('products')
        .insert(defaultProducts)
        .select();

      if (error) throw error;
      setProducts(data);
    } catch (error) {
      console.error('Error creating default products:', error);
    }
  };

  const handleAddToCart = async (product: Product) => {
    await addToCart(product.id, 1);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="aspect-square bg-muted rounded-t-lg" />
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <div className="h-10 bg-muted rounded w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="product-card group">
          <div className="relative aspect-square overflow-hidden rounded-t-lg">
            <img
              src={product.images[0] || '/placeholder.svg'}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {product.stock_qty <= 5 && product.stock_qty > 0 && (
              <Badge className="absolute top-2 right-2 bg-warning text-warning-foreground">
                Only {product.stock_qty} left
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white"
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
          
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.title}</h3>
            {product.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {product.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">
                {formatPrice(product.price, product.currency)}
              </span>
            </div>
          </CardContent>
          
          <CardFooter className="p-4 pt-0">
            <Button
              onClick={() => handleAddToCart(product)}
              className="w-full btn-cart"
              disabled={product.stock_qty === 0}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {product.stock_qty === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};