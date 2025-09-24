import React from 'react';
import { Header } from '@/components/Header';
import { BannerCarousel } from '@/components/BannerCarousel';
import { ProductGrid } from '@/components/ProductGrid';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section with Banners */}
        <section className="mb-12">
          <BannerCarousel />
        </section>

        {/* Featured Products */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-center mb-2">Featured Products</h2>
            <p className="text-muted-foreground text-center">
              Discover our curated collection of premium products
            </p>
          </div>
          <ProductGrid />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted/50 border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h3 className="text-xl font-bold text-primary mb-2">PicaMart</h3>
            <p className="text-muted-foreground mb-4">Sparkle with Every Click ✨</p>
            <p className="text-sm text-muted-foreground">
              © 2024 PicaMart. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
