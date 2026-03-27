'use client';
import React, { createContext, useState, useCallback, ReactNode, useEffect, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FoodItem, Category, CartItem, Order, SavableState } from '@/types';
import { FastAverageColor } from 'fast-average-color';
import { useRouter } from 'next/navigation';

type UserRole = 'admin' | 'waiter' | null;

interface AuthStatus {
  isAuthenticated: boolean | null;
  role: UserRole;
}

interface AppContextType {
  isDataLoaded: boolean;
  restaurantName: string;
  setRestaurantName: (name: string) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  adminPassword: string;
  setAdminPassword: (password: string) => void;
  waiterPassword: string;
  setWaiterPassword: (password: string) => void;
  backgroundImage: string;
  updateBackgroundImage: (image: string) => Promise<void>;
  headerBgColor: string;
  headerTextColor: string;
  categories: Category[];
  addCategory: (category: Category) => void;
  updateCategory: (oldName: Category, newName: Category) => void;
  deleteCategory: (category: Category) => void;
  menuItems: FoodItem[];
  cart: CartItem[];
  addToCart: (item: FoodItem) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  orders: Order[];
  placeOrder: () => void;
  completeOrder: (orderId: string) => Promise<boolean>;
  addMenuItem: (item: Omit<FoodItem, 'id' | 'isAvailable'>) => void;
  updateMenuItem: (item: FoodItem) => void;
  deleteMenuItem: (itemId: string) => void;
  toggleItemAvailability: (itemId: string) => void;
  saveAllSettings: () => Promise<void>;
  authStatus: AuthStatus;
  login: (role: 'admin' | 'waiter', passwordAttempt: string) => Promise<boolean>;
  logout: () => void;
  logoUrl: string;
  logoType: 'text' | 'logo';
  setLogoType: (type: 'text' | 'logo') => void;
  updateLogo: (url: string) => Promise<void>;
  textColor: string;
  setTextColor: (color: string) => void;
  aboutDescription: string;
  setAboutDescription: (val: string) => void;
  aboutLocation: string;
  setAboutLocation: (val: string) => void;
  aboutPhone: string;
  setAboutPhone: (val: string) => void;
  aboutEmail: string;
  setAboutEmail: (val: string) => void;
  aboutOwnerName: string;
  setAboutOwnerName: (val: string) => void;
  aboutOwnerTitle: string;
  setAboutOwnerTitle: (val: string) => void;
  aboutOwnerQuote: string;
  setAboutOwnerQuote: (val: string) => void;
  aboutOwnerStory: string;
  setAboutOwnerStory: (val: string) => void;
  aboutOwnerImage: string;
  setAboutOwnerImage: (val: string) => void;
  aboutMotivationQuotes: string[];
  setAboutMotivationQuotes: (val: string[]) => void;
  aboutMapEmbed: string;
  setAboutMapEmbed: (val: string) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
  initialData: SavableState;
}

const fac = new FastAverageColor();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const AppProvider: React.FC<AppProviderProps> = ({ children, initialData }) => {
  const router = useRouter();

  const [isDataLoaded, setIsDataLoaded] = useState(true);
  const [restaurantName, setRestaurantName] = useState(initialData.restaurantName);
  const [currency, setCurrency] = useState(initialData.currency);
  const [adminPassword, setAdminPassword] = useState(initialData.adminPassword);
  const [waiterPassword, setWaiterPassword] = useState(initialData.waiterPassword);
  const [backgroundImage, setBackgroundImage] = useState(initialData.backgroundImage);
  const [headerBgColor, setHeaderBgColor] = useState(initialData.headerBgColor);
  const [headerTextColor, setHeaderTextColor] = useState(initialData.headerTextColor);
  const [categories, setCategories] = useState(initialData.categories);
  const [menuItems, setMenuItems] = useState(initialData.menuItems);
  const [logoUrl, setLogoUrl] = useState(initialData.logoUrl);
  const [logoType, setLogoType] = useState(initialData.logoType);
  const [textColor, setTextColor] = useState(initialData.textColor);

  // About page state
  const [aboutDescription, setAboutDescription] = useState(initialData.aboutDescription || '');
  const [aboutLocation, setAboutLocation] = useState(initialData.aboutLocation || '');
  const [aboutPhone, setAboutPhone] = useState(initialData.aboutPhone || '');
  const [aboutEmail, setAboutEmail] = useState(initialData.aboutEmail || '');
  const [aboutOwnerName, setAboutOwnerName] = useState(initialData.aboutOwnerName || '');
  const [aboutOwnerTitle, setAboutOwnerTitle] = useState(initialData.aboutOwnerTitle || '');
  const [aboutOwnerQuote, setAboutOwnerQuote] = useState(initialData.aboutOwnerQuote || '');
  const [aboutOwnerStory, setAboutOwnerStory] = useState(initialData.aboutOwnerStory || '');
  const [aboutOwnerImage, setAboutOwnerImage] = useState(initialData.aboutOwnerImage || '');
  const [aboutMotivationQuotes, setAboutMotivationQuotes] = useState<string[]>(initialData.aboutMotivationQuotes || []);
  const [aboutMapEmbed, setAboutMapEmbed] = useState(initialData.aboutMapEmbed || '');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ isAuthenticated: null, role: null });

  // Load cart from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('smartQrCart');
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (error) {
      console.error("Failed to parse cart from localStorage", error);
    }
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem('smartQrCart', JSON.stringify(cart));
  }, [cart]);

  // Authentication initialization
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setAuthStatus({
            isAuthenticated: data.authenticated,
            role: data.authenticated ? data.role : null,
          });
        } else {
          setAuthStatus({ isAuthenticated: false, role: null });
        }
      } catch (error) {
        console.error("Failed to initialize auth status:", error);
        setAuthStatus({ isAuthenticated: false, role: null });
      }
    };
    initializeAuth();
  }, []);

  // Fetch initial orders and subscribe to realtime updates (no branch filter)
  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('is_complete', false);
      if (!error && data) setOrders(data);
    };
    fetchOrders();

    const subscription = supabase
      .channel('orders-all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [...prev, payload.new as Order]);
          } else if (payload.eventType === 'UPDATE' && payload.new.is_complete) {
            setOrders((prev) => prev.filter((o) => o.id !== payload.new.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const saveAllSettings = useCallback(async () => {
    const stateToSave: SavableState = {
      restaurantName, currency, adminPassword, waiterPassword,
      categories, menuItems, backgroundImage, headerBgColor, headerTextColor,
      logoUrl, logoType, textColor,
      aboutDescription, aboutLocation, aboutPhone, aboutEmail,
      aboutOwnerName, aboutOwnerTitle, aboutOwnerQuote, aboutOwnerStory,
      aboutOwnerImage, aboutMotivationQuotes, aboutMapEmbed,
    };
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stateToSave),
      });
      if (!res.ok) throw new Error('Failed to save settings.');
    } catch (error) {
      console.error("Error saving settings:", error);
      alert('Failed to save settings. You may be logged out.');
    }
  }, [
    restaurantName, currency, adminPassword, waiterPassword,
    categories, menuItems, backgroundImage, headerBgColor, headerTextColor,
    logoUrl, logoType, textColor,
    aboutDescription, aboutLocation, aboutPhone, aboutEmail,
    aboutOwnerName, aboutOwnerTitle, aboutOwnerQuote, aboutOwnerStory,
    aboutOwnerImage, aboutMotivationQuotes, aboutMapEmbed,
  ]);

  const login = async (role: 'admin' | 'waiter', passwordAttempt: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, password: passwordAttempt }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthStatus({ isAuthenticated: true, role: data.role });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      setAuthStatus({ isAuthenticated: false, role: null });
      router.push('/login');
    }
  }, [router]);

  const updateBackgroundImage = useCallback(async (image: string) => {
    setBackgroundImage(image);
    if (logoType === 'logo' && logoUrl) return;
    if (!image) {
      setHeaderBgColor('rgba(255, 255, 255, 0.8)');
      setHeaderTextColor('#1e293b');
      return;
    }
    try {
      const color = await fac.getColorAsync(image);
      if (color.error) return;
      const rgbaColor = `rgba(${color.value[0]}, ${color.value[1]}, ${color.value[2]}, 0.75)`;
      setHeaderBgColor(rgbaColor);
      setHeaderTextColor(color.isDark ? '#FFFFFF' : '#1e293b');
    } catch (e) {
      console.error('Error getting average color for background:', e);
    }
  }, [logoType, logoUrl]);

  const updateLogo = useCallback(async (url: string) => {
    setLogoUrl(url);
    if (!url) {
      setHeaderBgColor('rgba(255, 255, 255, 0.8)');
      setHeaderTextColor('#1e293b');
      return;
    }
    try {
      const color = await fac.getColorAsync(url);
      if (color.error) return;
      const rgbaColor = `rgba(${color.value[0]}, ${color.value[1]}, ${color.value[2]}, 0.85)`;
      setHeaderBgColor(rgbaColor);
      setHeaderTextColor(color.isDark ? '#FFFFFF' : '#1e293b');
    } catch (e) {
      console.error('Error getting average color for logo:', e);
    }
  }, []);

  const addToCart = useCallback((item: FoodItem) => {
    if (!item.isAvailable) {
      alert("This item is currently unavailable.");
      return;
    }
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  }, []);

  const updateCartQuantity = useCallback((itemId: string, quantity: number) => {
    setCart((prevCart) => {
      if (quantity <= 0) return prevCart.filter((item) => item.id !== itemId);
      return prevCart.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      );
    });
  }, []);

  const clearCart = useCallback(() => setCart([]), []);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const placeOrder = useCallback(async () => {
    if (cart.length === 0) return;
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      items: [...cart],
      totalPrice: cartTotal,
      timestamp: new Date(),
      table: `Table ${Math.floor(Math.random() * 20) + 1}`,
      isComplete: false,
    };
    console.log('Placing order:', newOrder);  // 👈
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder }),
      });
      const result = await res.json();
      console.log('Order API response:', result);  // 👈
      if (res.ok) {
        localStorage.setItem('customerOrderId', newOrder.id);
        clearCart();
      } else {
        alert(`Order failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Failed to place order. Please try again.');
    }
  }, [cart, cartTotal, clearCart]);

  const completeOrder = useCallback(async (orderId: string) => {
    try {
      console.log('Attempting to complete order with ID:', orderId);
      const { data, error } = await supabase
        .from('orders')
        .update({ is_complete: true })
        .eq('id', orderId)   // already a string
        .select();
  
      console.log('Update result data:', data);
      console.log('Update error:', error);
  
      if (error) {
        console.error('Supabase update error:', error);
        return false;
      }
  
      if (!data || data.length === 0) {
        console.warn('No rows updated — order may not exist or already completed');
        return false;
      }
  
      return true;
    } catch (err) {
      console.error('Complete order failed:', err);
      return false;
    }
  }, []);

  const addMenuItem = useCallback((itemData: Omit<FoodItem, 'id' | 'isAvailable'>) => {
    const newItem: FoodItem = { id: `item-${Date.now()}`, ...itemData, isAvailable: true };
    setMenuItems(prev => [...prev, newItem]);
    if (!categories.includes(itemData.category)) setCategories(prev => [...prev, itemData.category]);
  }, [categories]);

  const updateMenuItem = useCallback((updatedItem: FoodItem) => {
    setMenuItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    if (!categories.includes(updatedItem.category)) setCategories(prev => [...prev, updatedItem.category]);
  }, [categories]);

  const deleteMenuItem = useCallback((itemId: string) => setMenuItems(prev => prev.filter(item => item.id !== itemId)), []);
  const toggleItemAvailability = useCallback((itemId: string) => setMenuItems(prevItems => prevItems.map(item => item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item)), []);
  const addCategory = useCallback((category: Category) => { if (category && !categories.includes(category)) setCategories(prev => [...prev, category]); }, [categories]);
  const updateCategory = useCallback((oldName: Category, newName: Category) => {
    setCategories(prev => prev.map(c => c === oldName ? newName : c));
    setMenuItems(prev => prev.map(item => item.category === oldName ? { ...item, category: newName } : item));
  }, []);
  const deleteCategory = useCallback((categoryToDelete: Category) => {
    if (menuItems.some(item => item.category === categoryToDelete)) {
      alert(`Cannot delete category "${categoryToDelete}" as it is currently assigned to one or more menu items.`);
      return;
    }
    setCategories(prev => prev.filter(c => c !== categoryToDelete));
  }, [menuItems]);

  const contextValue: AppContextType = {
    isDataLoaded, restaurantName, setRestaurantName, currency, setCurrency,
    adminPassword, setAdminPassword, waiterPassword, setWaiterPassword,
    backgroundImage, updateBackgroundImage, headerBgColor, headerTextColor,
    categories, addCategory, updateCategory, deleteCategory, menuItems,
    cart, addToCart, updateCartQuantity, clearCart, cartTotal,
    orders, placeOrder, completeOrder,
    addMenuItem, updateMenuItem, deleteMenuItem, toggleItemAvailability,
    saveAllSettings, authStatus, login, logout,
    logoUrl, logoType, setLogoType, updateLogo,
    textColor, setTextColor,
    aboutDescription, setAboutDescription,
    aboutLocation, setAboutLocation,
    aboutPhone, setAboutPhone,
    aboutEmail, setAboutEmail,
    aboutOwnerName, setAboutOwnerName,
    aboutOwnerTitle, setAboutOwnerTitle,
    aboutOwnerQuote, setAboutOwnerQuote,
    aboutOwnerStory, setAboutOwnerStory,
    aboutOwnerImage, setAboutOwnerImage,
    aboutMotivationQuotes, setAboutMotivationQuotes,
    aboutMapEmbed, setAboutMapEmbed,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};