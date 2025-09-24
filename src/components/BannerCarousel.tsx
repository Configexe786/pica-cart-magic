import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import bannerDurgaPuja from '@/assets/banner-durga-puja.jpg';

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url?: string;
  display_order: number;
}

export const BannerCarousel: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanners();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('banner-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'banners'
        },
        () => {
          loadBanners();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const loadBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('active', true)
        .order('display_order');

      if (error) throw error;

      // If no banners exist, create default ones
      if (!data || data.length === 0) {
        await createDefaultBanners();
        return;
      }

      setBanners(data);
    } catch (error) {
      console.error('Error loading banners:', error);
      // Fallback to default banner
      setBanners([{
        id: '1',
        title: 'Durga Puja Special - 60% Off',
        image_url: bannerDurgaPuja,
        link_url: '#',
        display_order: 1
      }]);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultBanners = async () => {
    const defaultBanners = [
      {
        title: 'Durga Puja Special - 60% Off',
        image_url: bannerDurgaPuja,
        link_url: '#',
        display_order: 1,
        active: true
      }
    ];

    try {
      const { data, error } = await supabase
        .from('banners')
        .insert(defaultBanners)
        .select();

      if (error) throw error;
      setBanners(data);
    } catch (error) {
      console.error('Error creating default banners:', error);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handleBannerClick = (banner: Banner) => {
    if (banner.link_url && banner.link_url !== '#') {
      window.open(banner.link_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="w-full h-64 bg-muted animate-pulse rounded-lg" />
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full">
      <Card className="relative overflow-hidden">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="w-full flex-shrink-0 relative cursor-pointer"
              onClick={() => handleBannerClick(banner)}
            >
              <img
                src={banner.image_url}
                alt={banner.title}
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-end">
                <div className="p-6 text-white">
                  <h3 className="text-2xl font-bold">{banner.title}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {banners.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Dots indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};