import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: string;
  order_id: string;
  amount_total: number;
  currency: string;
  status: string;
  payment_status: string;
  created_at: string;
  order_items: {
    title: string;
    qty: number;
    unit_price: number;
  }[];
}

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    loadOrders();

    // Set up realtime subscription
    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            title,
            qty,
            unit_price
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'placed':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'packaging':
        return <Package className="h-4 w-4" />;
      case 'out_for_delivery':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'placed':
        return 25;
      case 'confirmed':
        return 25;
      case 'packaging':
        return 50;
      case 'out_for_delivery':
        return 75;
      case 'delivered':
        return 100;
      case 'cancelled':
        return 0;
      default:
        return 0;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'placed':
        return 'Order Placed';
      case 'confirmed':
        return 'Confirmed';
      case 'packaging':
        return 'Packaging';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'placed':
        return 'status-placed';
      case 'confirmed':
        return 'status-confirmed';
      case 'packaging':
        return 'status-packaging';
      case 'out_for_delivery':
        return 'status-out-for-delivery';
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-placed';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">My Orders</h1>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded mb-4" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <Package className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-3xl font-bold mb-4">No orders yet</h1>
            <p className="text-muted-foreground mb-8">
              Start shopping to see your orders here!
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">My Orders</h1>
          
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      {getStatusIcon(order.status)}
                      <span>Order #{order.order_id}</span>
                    </CardTitle>
                    <Badge className={getStatusVariant(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Placed on {new Date(order.created_at).toLocaleDateString('en-IN')}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-2">
                    {order.order_items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.title} × {item.qty}</span>
                        <span>{formatPrice(item.unit_price * item.qty)}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Total */}
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-primary">
                        {formatPrice(order.amount_total, order.currency)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  {order.status !== 'cancelled' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Order Placed</span>
                        <span>Packaging</span>
                        <span>Out for Delivery</span>
                        <span>Delivered</span>
                      </div>
                      <Progress value={getStatusProgress(order.status)} className="h-2" />
                    </div>
                  )}
                  
                  {/* Payment Status */}
                  <div className="flex items-center justify-between text-sm">
                    <span>Payment Status:</span>
                    <Badge variant={order.payment_status === 'verified' ? 'default' : 'secondary'}>
                      {order.payment_status === 'verified' ? 'Paid' : 'Pending'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyOrders;