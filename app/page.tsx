'use client'
import React, { useState, useMemo, useEffect } from 'react';
import { FoodItem, Order } from '@/types';
import { useAppContext } from '@/context/AppContext';
import FoodItemCard from '@/components/FoodItemCard';
import { SearchIcon, CartIcon } from '@/components/IconComponents';
import Cart from '@/components/Cart';
import ClientOnly from '@/components/ClientOnly';

const CustomerMenu: React.FC = () => {
  // 1. ALL HOOKS ARE CALLED UNCONDITIONALLY AT THE TOP
  const { menuItems, categories, orders, backgroundImage, cart, isDataLoaded } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const filteredItems = useMemo(() => {
    // Return early from inside the hook if data isn't ready
    if (!isDataLoaded) return []; 
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory ? item.category === selectedCategory : true;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, searchTerm, selectedCategory, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded) {
      const customerOrderId = localStorage.getItem('customerOrderId');
      if (customerOrderId) {
        const orderIsStillActive = orders.some(order => order.id === customerOrderId);
        if (!orderIsStillActive) {
          setShowThankYou(true);
          localStorage.removeItem('customerOrderId');
          setTimeout(() => setShowThankYou(false), 5000);
        }
      }
    }
  }, [orders, isDataLoaded]);

  useEffect(() => {
    if (backgroundImage) {
        document.body.style.backgroundImage = `url(${backgroundImage})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
    } else {
        document.body.style.backgroundImage = '';
        document.body.style.backgroundColor = '';
    }
    return () => {
        document.body.style.backgroundImage = '';
        document.body.style.backgroundColor = '';
    }
  }, [backgroundImage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // 2. NOW, YOU CAN HAVE CONDITIONAL RENDERING
  if (!isDataLoaded) {
    return (
      <div className="container mx-auto p-8 text-center" aria-live="polite">
        <p className="text-lg font-semibold text-gray-600">Loading Menu...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {showThankYou && (
        <div role="status" className="fixed top-0 left-0 right-0 z-50 p-4 bg-green-500 text-white text-center animate-fade-in">
            Thank you for your order! It has been completed.
        </div>
      )}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-4 mb-6">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search for a dish..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-brand-primary"
            aria-label="Search for a dish"
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${selectedCategory === null ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            All
          </button>
          {categories.map((category: string) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${selectedCategory === category ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item: FoodItem) =>  (
            <FoodItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-700">No Dishes Found</h2>
          <p className="text-gray-500 mt-2">Try adjusting your search or category filter.</p>
        </div>
      )}
      
      <ClientOnly>
        {cart.length > 0 && (
            <button
                onClick={() => setIsCartOpen(true)}
                className="fixed bottom-6 right-6 bg-brand-primary text-white font-bold py-4 px-6 rounded-full shadow-lg hover:bg-indigo-700 transition-all transform hover:scale-110 flex items-center animate-fade-in"
                aria-label={`Open cart with ${cart.reduce((total, item) => total + item.quantity, 0)} items`}
            >
                <CartIcon className="h-6 w-6 mr-2" />
                Check Cart
            </button>
        )}
        <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </ClientOnly>
    </div>
  );
};

export default CustomerMenu;