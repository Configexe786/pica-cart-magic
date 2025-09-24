import React, { useState } from 'react';
import { Search, User, ShoppingCart, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { AuthModal } from './auth/AuthModal';
import { Link, useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';

export const Header: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, signOut, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleAccountClick = () => {
    if (user) {
      navigate('/my-orders');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleCartClick = () => {
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      navigate('/cart');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img src={logo} alt="PicaMart" className="h-8 w-auto" />
              <span className="text-xl font-bold text-primary">PicaMart</span>
            </Link>

            {/* Search Bar (Desktop/Tablet) */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </form>

            {/* Action Buttons (Desktop) */}
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={handleAccountClick}>
                <User className="h-5 w-5" />
                <span className="ml-2">{user ? 'My Account' : 'Sign In'}</span>
              </Button>

              <Button variant="ghost" size="sm" onClick={handleCartClick} className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="ml-2">Cart</span>
                {totalItems > 0 && (
                  <Badge className="cart-badge">
                    {totalItems}
                  </Badge>
                )}
              </Button>

              {isAdmin && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin">Admin</Link>
                </Button>
              )}

              {user && (
                <Button variant="ghost" size="sm" onClick={signOut}>
                  Sign Out
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </form>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t bg-background py-4 space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAccountClick}
                className="w-full justify-start"
              >
                <User className="h-5 w-5 mr-2" />
                {user ? 'My Account' : 'Sign In'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCartClick}
                className="w-full justify-start relative"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Cart
                {totalItems > 0 && (
                  <Badge className="cart-badge ml-auto">
                    {totalItems}
                  </Badge>
                )}
              </Button>

              {isAdmin && (
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to="/admin">Admin Panel</Link>
                </Button>
              )}

              {user && (
                <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start">
                  Sign Out
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
};